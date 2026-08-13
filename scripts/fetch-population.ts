import { existsSync, readFileSync } from 'node:fs';
import { fetchJson } from './lib/http.ts';
import { writeIfChanged } from './lib/writeIfChanged.ts';
import type { PopulationSnapshot } from '../src/data/generated/types.ts';

/**
 * 행안부 주민등록 인구·세대 (월별) → src/data/generated/population.json
 *
 * ⚠️ 엔드포인트·파라미터는 활용신청 후 첫 실측에서 확정한다 — 응답 구조가 다르면
 * 이 스크립트는 경고 후 기존 JSON을 유지하므로 사이트는 깨지지 않는다.
 * 월 1회 갱신: 저장된 최신 월이 직전 월보다 오래됐을 때만 API를 부른다.
 */

const OUTPUT_PATH = 'src/data/generated/population.json';
const ENDPOINT = 'https://apis.data.go.kr/1741000/stdgPpltnHhStus/selectStdgPpltnHhStus';
const SCOPE_NAME = '인천광역시 검단구';
const KEEP_MONTHS = 24;

function kstNow(): Date {
  return new Date(Date.now() + 9 * 3600 * 1000);
}

/** 직전 월 'YYYYMM' — 주민등록 통계는 월말 확정이라 당월은 아직 없다. */
function lastClosedMonth(): string {
  const now = kstNow();
  const index = now.getUTCFullYear() * 12 + now.getUTCMonth() - 1;
  return `${Math.floor(index / 12)}${String((index % 12) + 1).padStart(2, '0')}`;
}

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

async function main(): Promise<void> {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!serviceKey) {
    console.warn('[fetch-population] DATA_GO_KR_SERVICE_KEY 미설정 — 기존 JSON 유지, 건너뜀');
    return;
  }

  const existing: PopulationSnapshot | null = existsSync(OUTPUT_PATH)
    ? (JSON.parse(readFileSync(OUTPUT_PATH, 'utf8')) as PopulationSnapshot)
    : null;

  const targetMonth = lastClosedMonth();
  const targetKey = `${targetMonth.slice(0, 4)}-${targetMonth.slice(4)}`;
  const storedLatest = existing?.months.at(-1)?.month ?? '';
  if (storedLatest >= targetKey) {
    console.log(`[fetch-population] 최신 월(${storedLatest}) 이미 보유 — 건너뜀`);
    return;
  }

  const url =
    `${ENDPOINT}?serviceKey=${serviceKey}&type=JSON&pageNo=1&numOfRows=100` +
    `&srchFrYm=${targetMonth}&srchToYm=${targetMonth}&lv=3&regSeCd=1`;
  const rows = extractRows(await fetchJson(url));

  // 검단구 관할 행들을 찾아 합산한다 (응답 필드명 변형을 방어적으로 흡수).
  const matched = rows.filter((row) =>
    String(row.lctnRoadNmAddr ?? row.stdgNm ?? row.lctnNm ?? row.dongNm ?? '').includes('검단구'),
  );
  if (matched.length === 0) {
    console.warn('[fetch-population] 검단구 행을 찾지 못함 — 응답 구조 확인 필요, 기존 JSON 유지');
    return;
  }

  const population = matched.reduce((acc, row) => acc + toNumber(row.totNmprCnt ?? row.tongPpltn ?? row.ppltnCnt), 0);
  const households = matched.reduce((acc, row) => acc + toNumber(row.hhCnt ?? row.tongHhCnt ?? row.hshldCnt), 0);
  if (population <= 0) {
    console.warn('[fetch-population] 인구 합계가 0 — 필드명 확인 필요, 기존 JSON 유지');
    return;
  }

  const months = [...(existing?.months ?? []), { month: targetKey, population, households }]
    .filter((row, index, all) => all.findIndex((r) => r.month === row.month) === index)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-KEEP_MONTHS);

  const snapshot: PopulationSnapshot = {
    schemaVersion: 1,
    fetchedAt: new Date().toISOString(),
    source: {
      label: '행정안전부 주민등록 인구·세대현황 (기계 수집)',
      url: 'https://www.data.go.kr/data/15108071/openapi.do',
      asOf: kstNow().toISOString().slice(0, 10),
      confidence: 'confirmed',
      grade: 'B',
    },
    scope: SCOPE_NAME,
    months,
    seriesNote:
      '검단구는 2026-07-01 신설(舊 인천 서구에서 분리)되어 이전 서구 통계와 시계열이 단절됩니다. 주민등록 통계에는 외국인이 포함되지 않습니다.',
  };

  const changed = writeIfChanged(OUTPUT_PATH, snapshot);
  console.log(`[fetch-population] ${targetKey} 인구 ${population.toLocaleString()} (${changed ? '저장' : '변경 없음'})`);
}

main().catch((error) => {
  console.warn('[fetch-population] 수집 실패 — 기존 JSON 유지:', error);
});
