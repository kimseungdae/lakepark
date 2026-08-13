import { fetchJson } from './http.ts';

/**
 * 시군구(LAWD_CD 5자리)와 대상 법정동.
 *
 * 검단 지역은 2026-07-01 검단구 신설(舊 인천 서구에서 분리, 잔여 서구는 서해구로 개명)로
 * 코드 전환기에 있다. 실거래 API가 과거 계약월을 어느 코드로 서빙하는지 단정할 수 없으므로
 * 舊 서구 코드는 상수로 두고, 신설 구 코드는 매 실행 시 법정동코드 API에서 동적으로 찾아
 * 둘 다 조회한 뒤 중복 제거한다.
 */

/** 분구 전 인천 서구 (검단 지역 포함) — 과거 계약월 조회용 */
export const LEGACY_SEOGU = { lawdCd: '28260', name: '인천 서구(분구 전)' } as const;

/** 검단신도시 생활권 법정동 — 실거래 필터 기준 (umdNm 일치) */
export const TARGET_DONGS: readonly string[] = [
  '마전동',
  '불로동',
  '원당동',
  '당하동',
  '금곡동',
  '오류동',
  '왕길동',
  '대곡동',
] as const;

const STAN_REGIN_URL = 'http://apis.data.go.kr/1741000/StanReginCd/getStanReginCdList';

type StanReginRow = { region_cd?: string; locatadd_nm?: string; sgg_cd?: string; umd_cd?: string };

function extractRows(payload: unknown): StanReginRow[] {
  // 표준코드 API 응답: { StanReginCd: [ { head: [...] }, { row: [...] } ] }
  if (typeof payload !== 'object' || payload === null) return [];
  const root = (payload as Record<string, unknown>).StanReginCd;
  if (!Array.isArray(root)) return [];
  for (const part of root) {
    const row = (part as Record<string, unknown>).row;
    if (Array.isArray(row)) return row as StanReginRow[];
  }
  return [];
}

/**
 * 신설 검단구의 시군구 코드를 동적으로 찾는다. 못 찾으면 빈 배열 (舊 코드만으로 진행).
 * region_cd는 10자리(시군구 5 + 읍면동 5)이며, 읍면동 000…인 행이 구 자체다.
 */
export async function discoverDistrictCodes(
  serviceKey: string,
): Promise<Array<{ lawdCd: string; name: string }>> {
  const found = new Map<string, string>();

  for (const name of ['인천광역시 검단구']) {
    try {
      const url =
        `${STAN_REGIN_URL}?ServiceKey=${serviceKey}&type=json&pageNo=1&numOfRows=50` +
        `&locatadd_nm=${encodeURIComponent(name)}`;
      const rows = extractRows(await fetchJson(url));
      for (const row of rows) {
        const regionCd = row.region_cd ?? '';
        if (regionCd.length === 10) {
          const lawdCd = regionCd.slice(0, 5);
          if (!found.has(lawdCd)) found.set(lawdCd, row.locatadd_nm ?? name);
        }
      }
    } catch (error) {
      console.warn(`[lawdCodes] ${name} 코드 조회 실패 — 舊 코드로만 진행:`, error);
    }
  }

  return [...found].map(([lawdCd, name]) => ({ lawdCd, name }));
}
