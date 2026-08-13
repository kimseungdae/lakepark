import { fetchJson } from './http.ts';
import type { PopulationSnapshot } from '../../src/data/generated/types.ts';

/**
 * 행안부 주민등록 인구·세대 수집 코어 — 실행 환경 공용 (국내 호출 전제).
 * 새로 확보한 월이 없거나 응답 구조가 예상과 다르면 null을 반환한다 (기존 데이터 유지).
 */

const ENDPOINT = 'https://apis.data.go.kr/1741000/stdgPpltnHhStus/selectStdgPpltnHhStus';
const SCOPE_NAME = '인천광역시 검단구';
const KEEP_MONTHS = 24;

type ApiRow = Record<string, unknown>;

function extractRows(payload: unknown): ApiRow[] {
  const body = (payload as { response?: { body?: { items?: unknown } } })?.response?.body;
  const items = body?.items;
  if (Array.isArray(items)) return items as ApiRow[];
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
    `${ENDPOINT}?serviceKey=${serviceKey}&type=JSON&pageNo=1&numOfRows=100` +
    `&srchFrYm=${targetMonth}&srchToYm=${targetMonth}&lv=3&regSeCd=1`;
  const rows = extractRows(await fetchJson(url));

  const matched = rows.filter((row) =>
    String(row.lctnRoadNmAddr ?? row.stdgNm ?? row.lctnNm ?? row.dongNm ?? '').includes('검단구'),
  );
  if (matched.length === 0) {
    console.warn('[collectPopulation] 검단구 행을 찾지 못함 — 응답 구조 확인 필요');
    return null;
  }

  const population = matched.reduce(
    (acc, row) => acc + toNumber(row.totNmprCnt ?? row.tongPpltn ?? row.ppltnCnt),
    0,
  );
  const households = matched.reduce(
    (acc, row) => acc + toNumber(row.hhCnt ?? row.tongHhCnt ?? row.hshldCnt),
    0,
  );
  if (population <= 0) {
    console.warn('[collectPopulation] 인구 합계 0 — 필드명 확인 필요');
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
