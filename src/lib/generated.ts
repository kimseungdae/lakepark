import type { BidRadarSnapshot, MarketSnapshot, PopulationSnapshot } from '../data/generated/types';

/**
 * 자동 수집 JSON의 런타임 가드. .astro 프론트매터(빌드 시)에서 호출한다.
 * 스크립트 버그로 깨진 JSON이 커밋되더라도 빌드가 실패해 이전 배포가 유지된다.
 * 프레임워크 import 금지 (src/lib 공통 규칙).
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

function fail(name: string, reason: string): never {
  throw new Error(`generated/${name} 스키마 위반: ${reason}`);
}

function checkMeta(name: string, value: Record<string, unknown>): void {
  if (value.schemaVersion !== 1) fail(name, `schemaVersion ${String(value.schemaVersion)}`);
  if (typeof value.fetchedAt !== 'string' || !value.fetchedAt) fail(name, 'fetchedAt 없음');
  const source = value.source as Record<string, unknown> | undefined;
  if (!source || typeof source.label !== 'string' || !DATE_RE.test(String(source.asOf))) {
    fail(name, 'source 메타 불량');
  }
}

export function assertMarketSnapshot(value: unknown): MarketSnapshot {
  const snapshot = value as MarketSnapshot;
  checkMeta('market.json', snapshot as unknown as Record<string, unknown>);

  if (!Array.isArray(snapshot.districts)) fail('market.json', 'districts 배열 아님');
  if (!Array.isArray(snapshot.monthly)) fail('market.json', 'monthly 배열 아님');
  if (!Array.isArray(snapshot.recentTrades)) fail('market.json', 'recentTrades 배열 아님');

  for (const row of snapshot.monthly) {
    if (!MONTH_RE.test(row.month)) fail('market.json', `month 형식: ${row.month}`);
    if (row.count < 0) fail('market.json', `count 음수: ${row.month}`);
    if (row.medianAmountMan !== null && row.medianAmountMan <= 0) {
      fail('market.json', `중위가 이상값: ${row.month}`);
    }
  }
  for (const trade of snapshot.recentTrades) {
    if (!DATE_RE.test(trade.dealDate)) fail('market.json', `dealDate 형식: ${trade.dealDate}`);
    if (trade.amountMan <= 0) fail('market.json', `금액 이상값: ${trade.aptNm}`);
  }
  return snapshot;
}

export function assertBidRadarSnapshot(value: unknown): BidRadarSnapshot {
  const snapshot = value as BidRadarSnapshot;
  checkMeta('bids.json', snapshot as unknown as Record<string, unknown>);

  if (!Array.isArray(snapshot.keywords)) fail('bids.json', 'keywords 배열 아님');
  if (!Array.isArray(snapshot.bids)) fail('bids.json', 'bids 배열 아님');
  for (const bid of snapshot.bids) {
    if (!bid.bidNtceNo || !bid.bidNtceNm) fail('bids.json', '공고번호·공고명 없음');
    if (!DATE_RE.test(bid.noticedAt)) fail('bids.json', `noticedAt 형식: ${bid.noticedAt}`);
    if (!DATE_RE.test(bid.firstSeenAt)) fail('bids.json', `firstSeenAt 형식: ${bid.firstSeenAt}`);
    if (!Array.isArray(bid.statusItemIds)) fail('bids.json', 'statusItemIds 배열 아님');
  }
  return snapshot;
}

export function assertPopulationSnapshot(value: unknown): PopulationSnapshot {
  const snapshot = value as PopulationSnapshot;
  checkMeta('population.json', snapshot as unknown as Record<string, unknown>);

  if (!Array.isArray(snapshot.months)) fail('population.json', 'months 배열 아님');
  for (const row of snapshot.months) {
    if (!MONTH_RE.test(row.month)) fail('population.json', `month 형식: ${row.month}`);
    if (row.population < 0 || row.households < 0) fail('population.json', `음수: ${row.month}`);
  }
  return snapshot;
}
