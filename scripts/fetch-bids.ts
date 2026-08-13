import { existsSync, readFileSync } from 'node:fs';
import { fetchJson } from './lib/http.ts';
import { API_KEYWORDS, mergeNotices, type RawNotice } from './lib/matchBids.ts';
import { writeIfChanged } from './lib/writeIfChanged.ts';
import type { BidNotice, BidRadarSnapshot } from '../src/data/generated/types.ts';

/**
 * 나라장터 입찰공고 키워드 감시 → src/data/generated/bids.json ("조달 레이더")
 * 공사·용역 공고에서 검단 관련 키워드를 찾아 상태판 항목과 연결한다.
 * API 실패 시 경고 후 exit 0 — 기존 JSON 유지.
 */

const OUTPUT_PATH = 'src/data/generated/bids.json';
const BASE_URL = 'http://apis.data.go.kr/1230000/ad/BidPublicInfoService';
const OPERATIONS = [
  { op: 'getBidPblancListInfoCnstwkPPSSrch', kind: '공사' as const },
  { op: 'getBidPblancListInfoServcPPSSrch', kind: '용역' as const },
];
const LOOKBACK_DAYS = 90;

function todayISO(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

function toCompactDate(iso: string): string {
  return iso.replaceAll('-', '');
}

/** 응답의 items가 배열이거나 { item: [...] }이거나 단일 객체인 변형을 흡수한다. */
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
  // 'YYYY-MM-DD HH:mm' | 'YYYYMMDDHHmm' | 'YYYY-MM-DD' 변형 흡수
  const text = String(value ?? '').trim();
  const dashed = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dashed) return `${dashed[1]}-${dashed[2]}-${dashed[3]}`;
  const compact = text.match(/^(\d{4})(\d{2})(\d{2})/);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;
  return '';
}

async function main(): Promise<void> {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!serviceKey) {
    console.warn('[fetch-bids] DATA_GO_KR_SERVICE_KEY 미설정 — 기존 JSON 유지, 건너뜀');
    return;
  }

  const today = todayISO();
  const beginDate = new Date(Date.parse(`${today}T00:00:00Z`) - LOOKBACK_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const previous: BidNotice[] = existsSync(OUTPUT_PATH)
    ? ((JSON.parse(readFileSync(OUTPUT_PATH, 'utf8')) as BidRadarSnapshot).bids ?? [])
    : [];

  const raws: RawNotice[] = [];
  for (const keyword of API_KEYWORDS) {
    for (const { op, kind } of OPERATIONS) {
      const url =
        `${BASE_URL}/${op}?serviceKey=${serviceKey}&pageNo=1&numOfRows=100&type=json` +
        `&inqryDiv=1&inqryBgnDt=${toCompactDate(beginDate)}0000&inqryEndDt=${toCompactDate(today)}2359` +
        `&bidNtceNm=${encodeURIComponent(keyword)}`;

      const items = extractItems(await fetchJson(url));
      for (const item of items) {
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
    }
  }

  const bids = mergeNotices(raws, previous, today, LOOKBACK_DAYS);

  const snapshot: BidRadarSnapshot = {
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
    bids,
  };

  const changed = writeIfChanged(OUTPUT_PATH, snapshot);
  console.log(`[fetch-bids] 공고 ${bids.length}건 (${changed ? '변경 있음 — 저장' : '변경 없음'})`);
}

main().catch((error) => {
  console.warn('[fetch-bids] 수집 실패 — 기존 JSON 유지:', error);
});
