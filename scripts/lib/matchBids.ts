import type { BidNotice } from '../../src/data/generated/types.ts';

/**
 * 나라장터 공고 → 조달 레이더 항목 변환 (순수 함수 — vitest 대상).
 * 공고명 키워드로 상태판(STATUS_BOARD) 항목과 연결한다.
 * 자동 데이터는 상태판 stage를 바꾸지 않는다 — 신호만 표시하고 갱신은 사람이 한다.
 */

/** API 검색용 키워드 (bidNtceNm은 1콜 1키워드) */
export const API_KEYWORDS: readonly string[] = ['검단', '나진포천', '워라밸빌리지', '넥스트콤플렉스'] as const;

/** 공고명 부분 일치 → 상태판 항목 매핑 */
const STATUS_RULES: ReadonlyArray<{ pattern: RegExp; statusItemId: string }> = [
  { pattern: /나진포천/, statusItemId: 'najinpo-stream' },
  { pattern: /박물관|도서관/, statusItemId: 'museum-library' },
  { pattern: /5호선/, statusItemId: 'seoul-line5-extension' },
  { pattern: /넥스트콤플렉스/, statusItemId: 'next-complex' },
  { pattern: /워라밸/, statusItemId: 'worabael-village' },
  { pattern: /호수공원/, statusItemId: 'central-lake-park' },
  { pattern: /학교|유치원/, statusItemId: 'geomdan-schools' },
  { pattern: /산업단지|산단/, statusItemId: 'geomdan2-industrial' },
  { pattern: /도로|교차로|가로/, statusItemId: 'geomdan-road-network' },
];

export type RawNotice = {
  bidNtceNo: string;
  bidNtceNm: string;
  kind: BidNotice['kind'];
  dminsttNm: string;
  /** 'YYYY-MM-DD' 로 정규화된 공고게시일 */
  noticedAt: string;
  closesAt?: string;
  /** 이 공고를 찾아낸 API 검색 키워드 */
  matchedKeyword: string;
};

export function statusItemIdsFor(bidNtceNm: string): string[] {
  return STATUS_RULES.filter((rule) => rule.pattern.test(bidNtceNm)).map((rule) => rule.statusItemId);
}

/**
 * 키워드별 호출 결과를 병합한다:
 * 공고번호 기준 중복 제거(키워드 누적), firstSeenAt은 기존 스냅샷에서 승계,
 * 최근 keepDays일만 보존, 공고일 내림차순 정렬.
 */
export function mergeNotices(
  raws: RawNotice[],
  previous: ReadonlyArray<Pick<BidNotice, 'bidNtceNo' | 'firstSeenAt'>>,
  today: string,
  keepDays = 90,
): BidNotice[] {
  const firstSeen = new Map(previous.map((bid) => [bid.bidNtceNo, bid.firstSeenAt]));
  const merged = new Map<string, BidNotice>();

  for (const raw of raws) {
    if (!raw.bidNtceNo || !raw.bidNtceNm) continue;

    const existing = merged.get(raw.bidNtceNo);
    if (existing) {
      if (!existing.matchedKeywords.includes(raw.matchedKeyword)) {
        existing.matchedKeywords.push(raw.matchedKeyword);
      }
      continue;
    }

    const notice: BidNotice = {
      bidNtceNo: raw.bidNtceNo,
      bidNtceNm: raw.bidNtceNm,
      kind: raw.kind,
      dminsttNm: raw.dminsttNm,
      noticedAt: raw.noticedAt,
      matchedKeywords: [raw.matchedKeyword],
      statusItemIds: statusItemIdsFor(raw.bidNtceNm),
      firstSeenAt: firstSeen.get(raw.bidNtceNo) ?? today,
    };
    if (raw.closesAt) notice.closesAt = raw.closesAt;
    merged.set(raw.bidNtceNo, notice);
  }

  const cutoff = new Date(Date.parse(`${today}T00:00:00Z`) - keepDays * 86_400_000)
    .toISOString()
    .slice(0, 10);

  return [...merged.values()]
    .filter((bid) => bid.noticedAt >= cutoff)
    .sort((a, b) => b.noticedAt.localeCompare(a.noticedAt) || a.bidNtceNo.localeCompare(b.bidNtceNo));
}
