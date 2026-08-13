/**
 * 자동 수집 데이터(src/data/generated/*.json)의 스키마 단일 진실.
 *
 * scripts/fetch-*.ts가 이 형태로 산출하고, src/lib/generated.ts의 가드가
 * 빌드 시 검증한다 — 깨진 데이터는 빌드를 실패시켜 이전 배포가 유지된다.
 * fetchedAt은 변경 감지 비교에서 제외된다 (scripts/lib/writeIfChanged.ts).
 */

export type GeneratedMeta = {
  schemaVersion: 1;
  /** 수집 시각 (ISO). "데이터 기준일" 표기에 쓰며, 빌드 시점 렌더가 의도된 동작이다. */
  fetchedAt: string;
  source: { label: string; url: string; asOf: string; confidence: 'confirmed'; grade: 'B' };
};

export type MarketMonthly = {
  /** 'YYYY-MM' */
  month: string;
  /** 해제 제외 거래 건수 */
  count: number;
  /** 해제 제외 중위 거래가(만원). 0건이면 null. */
  medianAmountMan: number | null;
  /** 신고기한(계약 후 30일) 미경과로 수치가 앞으로 늘어날 월 */
  provisional: boolean;
};

export type MarketTrade = {
  aptNm: string;
  umdNm: string;
  excluUseAr: number;
  floor: number;
  /** 계약일 'YYYY-MM-DD' */
  dealDate: string;
  amountMan: number;
  canceled: boolean;
  canceledDate?: string;
  /** 중개거래/직거래 */
  dealingGbn?: string;
};

export type MarketSnapshot = GeneratedMeta & {
  /** 조회한 시군구 코드 (검단구 신설 전환기 — 舊·新 코드 병행 조회) */
  districts: Array<{ lawdCd: string; name: string }>;
  /** 오래된 달부터 최근 13개월 */
  monthly: MarketMonthly[];
  /** 계약일 내림차순 최근 30건 (해제 건 포함, canceled 표시) */
  recentTrades: MarketTrade[];
};

export type BidNotice = {
  bidNtceNo: string;
  bidNtceNm: string;
  kind: '공사' | '용역' | '물품';
  dminsttNm: string;
  /** 공고 게시일 'YYYY-MM-DD' */
  noticedAt: string;
  closesAt?: string;
  matchedKeywords: string[];
  /** 연결된 상태판 항목 (STATUS_BOARD id) */
  statusItemIds: string[];
  /** 이 수집기가 처음 본 날 — '신규' 배지 근거. 기존 JSON에서 승계된다. */
  firstSeenAt: string;
};

export type BidRadarSnapshot = GeneratedMeta & {
  keywords: string[];
  /** 공고일 내림차순, 최근 90일 보존 */
  bids: BidNotice[];
};

export type PopulationSnapshot = GeneratedMeta & {
  scope: string;
  /** 오래된 달부터 최근 24개월 */
  months: Array<{ month: string; population: number; households: number }>;
  /** 검단구 신설(2026-07)로 인한 시계열 단절 고지 */
  seriesNote: string;
};
