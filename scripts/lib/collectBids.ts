import { fetchJson } from './http.ts';
import { API_KEYWORDS, mergeNotices, type RawNotice } from './matchBids.ts';
import type { BidNotice, BidRadarSnapshot } from '../../src/data/generated/types.ts';

/**
 * 나라장터 입찰공고 수집 코어 — 실행 환경 공용 (국내 호출 전제).
 */

const BASE_URL = 'http://apis.data.go.kr/1230000/ad/BidPublicInfoService';
const OPERATIONS = [
  { op: 'getBidPblancListInfoCnstwkPPSSrch', kind: '공사' as const },
  { op: 'getBidPblancListInfoServcPPSSrch', kind: '용역' as const },
];
const LOOKBACK_DAYS = 90;

function extractItems(payload: unknown): Array<Record<string, unknown>> {
  const body = (payload as { response?: { body?: { items?: unknown } } })?.response?.body;
  const items = body?.items;
  if (Array.isArray(items)) return items as Array<Record<string, unknown>>;
  if (items && typeof items === 'object') {
    const inner = (items as { item?: unknown }).item;
    if (Array.isArray(inner)) return inner as Array<Record<string, unknown>>;
    if (inner && typeof inner === 'object') return [inner as Record<string, unknown>];
  }
  return [];
}

function normalizeDate(value: unknown): string {
  const text = String(value ?? '').trim();
  const dashed = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dashed) return `${dashed[1]}-${dashed[2]}-${dashed[3]}`;
  const compact = text.match(/^(\d{4})(\d{2})(\d{2})/);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;
  return '';
}

export async function collectBids(
  serviceKey: string,
  previous: ReadonlyArray<Pick<BidNotice, 'bidNtceNo' | 'firstSeenAt'>>,
  today: string,
): Promise<BidRadarSnapshot> {
  const beginDate = new Date(Date.parse(`${today}T00:00:00Z`) - LOOKBACK_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const compact = (iso: string): string => iso.replaceAll('-', '');

  const calls = API_KEYWORDS.flatMap((keyword) =>
    OPERATIONS.map(async ({ op, kind }) => {
      const url =
        `${BASE_URL}/${op}?serviceKey=${serviceKey}&pageNo=1&numOfRows=100&type=json` +
        `&inqryDiv=1&inqryBgnDt=${compact(beginDate)}0000&inqryEndDt=${compact(today)}2359` +
        `&bidNtceNm=${encodeURIComponent(keyword)}`;

      const raws: RawNotice[] = [];
      for (const item of extractItems(await fetchJson(url))) {
        const noticedAt = normalizeDate(item.bidNtceDt ?? item.bidNtceDate ?? item.rgstDt);
        if (!noticedAt) continue;
        const raw: RawNotice = {
          bidNtceNo: String(item.bidNtceNo ?? '').trim(),
          bidNtceNm: String(item.bidNtceNm ?? '').trim(),
          kind,
          dminsttNm: String(item.dminsttNm ?? item.ntceInsttNm ?? '').trim(),
          noticedAt,
          matchedKeyword: keyword,
        };
        const closesAt = normalizeDate(item.bidClseDt);
        if (closesAt) raw.closesAt = closesAt;
        raws.push(raw);
      }
      return raws;
    }),
  );

  const raws = (await Promise.all(calls)).flat();

  return {
    schemaVersion: 1,
    fetchedAt: new Date().toISOString(),
    source: {
      label: '조달청 나라장터 입찰공고 (기계 수집)',
      url: 'https://www.data.go.kr/data/15129394/openapi.do',
      asOf: today,
      confidence: 'confirmed',
      grade: 'B',
    },
    keywords: [...API_KEYWORDS],
    bids: mergeNotices(raws, previous, today, LOOKBACK_DAYS),
  };
}
