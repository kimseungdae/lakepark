import { aggregateTrades, toTrade } from './aggregateTrades.ts';
import { fetchText } from './http.ts';
import { discoverDistrictCodes, GEOMDAN_GU, TARGET_DONGS } from './lawdCodes.ts';
import { parseXmlItems, xmlResultCode, xmlTotalCount } from './xmlItems.ts';
import type { MarketSnapshot, MarketTrade } from '../../src/data/generated/types.ts';

/**
 * 검단 생활권 실거래 수집 코어 — 실행 환경(로컬 스크립트/Vercel 서울 리전 함수) 공용.
 * 국토부 API는 해외 IP를 차단하므로 반드시 국내에서 호출해야 한다 (2026-08-13 실측).
 * 월별 호출은 병렬로 돌려 서버리스 실행시간(60초) 안에 끝낸다.
 */

const RTMS_URL = 'http://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';
const MONTHS = 13;
const ROWS_PER_PAGE = 1000;

async function fetchMonth(serviceKey: string, lawdCd: string, dealYmd: string): Promise<MarketTrade[]> {
  const trades: MarketTrade[] = [];

  for (let pageNo = 1; pageNo <= 5; pageNo += 1) {
    const url =
      `${RTMS_URL}?serviceKey=${serviceKey}&LAWD_CD=${lawdCd}&DEAL_YMD=${dealYmd}` +
      `&pageNo=${pageNo}&numOfRows=${ROWS_PER_PAGE}`;
    const xml = await fetchText(url);

    const { code, message } = xmlResultCode(xml);
    if (code !== '00' && code !== '000') {
      throw new Error(`RTMS 응답 오류 (${lawdCd}/${dealYmd}): ${code} ${message}`);
    }

    for (const item of parseXmlItems(xml)) {
      const trade = toTrade(item);
      if (trade && TARGET_DONGS.includes(trade.umdNm)) trades.push(trade);
    }

    if (pageNo * ROWS_PER_PAGE >= xmlTotalCount(xml)) break;
  }
  return trades;
}

export async function collectMarket(serviceKey: string, today: string): Promise<MarketSnapshot> {
  const districts = [GEOMDAN_GU, ...(await discoverDistrictCodes(serviceKey))].filter(
    (district, index, all) => all.findIndex((d) => d.lawdCd === district.lawdCd) === index,
  );

  const months: string[] = [];
  {
    const [y, m] = today.split('-').map(Number);
    for (let i = MONTHS - 1; i >= 0; i -= 1) {
      const index = y! * 12 + (m! - 1) - i;
      months.push(`${Math.floor(index / 12)}${String((index % 12) + 1).padStart(2, '0')}`);
    }
  }

  const results = await Promise.all(
    districts.flatMap((district) => months.map((month) => fetchMonth(serviceKey, district.lawdCd, month))),
  );
  const { monthly, recentTrades } = aggregateTrades(results.flat(), today, MONTHS);

  return {
    schemaVersion: 1,
    fetchedAt: new Date().toISOString(),
    source: {
      label: '국토교통부 아파트 매매 실거래가 (기계 수집)',
      url: 'https://www.data.go.kr/data/15126468/openapi.do',
      asOf: today,
      confidence: 'confirmed',
      grade: 'B',
    },
    districts,
    monthly,
    recentTrades,
  };
}
