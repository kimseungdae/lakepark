import { fetchJson } from './http.ts';
import type { PopulationSnapshot } from '../../src/data/generated/types.ts';

/**
 * 행안부 주민등록 인구·세대 수집 코어 — 실행 환경 공용 (국내 호출 전제).
 *
 * 2026-08-13 실측 확정 계약:
 * - 필수 파라미터: stdgCd(10자리) + srchFrYm/srchToYm(YYYYMM) + lv + regSeCd
 * - lv=2(시군구 수준) 조회 후 stdgCd로 검단구 행을 고른다
 * - 응답: { Response: { head: { resultCode: '0' }, items: { item: [...] } | '' } }
 * - 필드: totNmprCnt(총인구), hhCnt(세대수), statsYm(기준월)
 * 새 월이 없거나 응답이 예상과 다르면 null (기존 데이터 유지).
 */

const ENDPOINT = 'https://apis.data.go.kr/1741000/stdgPpltnHhStus/selectStdgPpltnHhStus';
const GEOMDAN_STDG_CD = '2829000000';
const SCOPE_NAME = '인천광역시 검단구';
const KEEP_MONTHS = 24;

type ApiRow = Record<string, unknown>;

function extractRows(payload: unknown): ApiRow[] {
  const response = (payload as { Response?: { items?: unknown } })?.Response;
  const items = response?.items;
  if (items && typeof items === 'object') {
    const inner = (items as { item?: unknown }).item;
    if (Array.isArray(inner)) return inner as ApiRow[];
    if (inner && typeof inner === 'object') return [inner as ApiRow];
  }
  return [];
}

function toNumber(value: unknown): number {
  return Number(String(value ?? '').replace(/,/g, '')) || 0;
}

/** 직전 월 'YYYYMM' — 주민등록 통계는 월말 확정이라 당월 수치는 아직 없다. */
function lastClosedMonth(today: string): string {
  const [y, m] = today.split('-').map(Number);
  const index = y! * 12 + (m! - 1) - 1;
  return `${Math.floor(index / 12)}${String((index % 12) + 1).padStart(2, '0')}`;
}

export async function collectPopulation(
  serviceKey: string,
  existing: PopulationSnapshot | null,
  today: string,
): Promise<PopulationSnapshot | null> {
  const targetMonth = lastClosedMonth(today);
  const targetKey = `${targetMonth.slice(0, 4)}-${targetMonth.slice(4)}`;
  const storedLatest = existing?.months.at(-1)?.month ?? '';
  if (storedLatest >= targetKey) return null;

  const url =
    `${ENDPOINT}?serviceKey=${serviceKey}&type=JSON&pageNo=1&numOfRows=60` +
    `&stdgCd=${GEOMDAN_STDG_CD}&srchFrYm=${targetMonth}&srchToYm=${targetMonth}&lv=2&regSeCd=1`;
  const rows = extractRows(await fetchJson(url));

  const geomdan = rows.find((row) => String(row.stdgCd ?? '') === GEOMDAN_STDG_CD);
  if (!geomdan) {
    console.warn(`[collectPopulation] ${targetKey} 검단구 행 없음 (통계 미발행 가능) — 유지`);
    return null;
  }

  const population = toNumber(geomdan.totNmprCnt);
  const households = toNumber(geomdan.hhCnt);
  if (population <= 0) {
    console.warn('[collectPopulation] 인구 0 — 응답 확인 필요, 유지');
    return null;
  }

  const months = [...(existing?.months ?? []), { month: targetKey, population, households }]
    .filter((row, index, all) => all.findIndex((r) => r.month === row.month) === index)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-KEEP_MONTHS);

  return {
    schemaVersion: 1,
    fetchedAt: new Date().toISOString(),
    source: {
      label: '행정안전부 주민등록 인구·세대현황 (기계 수집)',
      url: 'https://www.data.go.kr/data/15108071/openapi.do',
      asOf: today,
      confidence: 'confirmed',
      grade: 'B',
    },
    scope: SCOPE_NAME,
    months,
    seriesNote:
      '검단구는 2026-07-01 신설(舊 인천 서구에서 분리)되어 이전 서구 통계와 시계열이 단절됩니다. 주민등록 통계에는 외국인이 포함되지 않습니다.',
  };
}
