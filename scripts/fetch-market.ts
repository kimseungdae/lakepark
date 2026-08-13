import { aggregateTrades, toTrade } from './lib/aggregateTrades.ts';
import { fetchText } from './lib/http.ts';
import { discoverDistrictCodes, LEGACY_SEOGU, TARGET_DONGS } from './lib/lawdCodes.ts';
import { parseXmlItems, xmlResultCode, xmlTotalCount } from './lib/xmlItems.ts';
import { writeIfChanged } from './lib/writeIfChanged.ts';
import type { MarketSnapshot, MarketTrade } from '../src/data/generated/types.ts';

/**
 * 검단 생활권 아파트 매매 실거래 수집 → src/data/generated/market.json
 *
 * - 우리 단지(더샵 검단레이크파크)는 전매제한(~2029)으로 거래가 없다.
 *   이 수집은 인근 법정동 기존 아파트의 매매 실거래다 (화면이 그 사실을 고지한다).
 * - API 실패 시 경고 후 exit 0 — 기존 JSON을 유지해 사이트는 계속 빌드된다.
 */

const OUTPUT_PATH = 'src/data/generated/market.json';
const RTMS_URL = 'http://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';
const MONTHS = 13;
const ROWS_PER_PAGE = 1000;

function todayISO(): string {
  // KST 기준 오늘 (Actions 러너는 UTC)
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

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

async function main(): Promise<void> {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!serviceKey) {
    console.warn('[fetch-market] DATA_GO_KR_SERVICE_KEY 미설정 — 기존 JSON 유지, 건너뜀');
    return;
  }

  const today = todayISO();
  const districts = [LEGACY_SEOGU, ...(await discoverDistrictCodes(serviceKey))].filter(
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

  const trades: MarketTrade[] = [];
  for (const district of districts) {
    for (const month of months) {
      trades.push(...(await fetchMonth(serviceKey, district.lawdCd, month)));
    }
  }

  const { monthly, recentTrades } = aggregateTrades(trades, today, MONTHS);

  const snapshot: MarketSnapshot = {
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

  const changed = writeIfChanged(OUTPUT_PATH, snapshot);
  console.log(
    `[fetch-market] ${districts.map((d) => d.lawdCd).join(',')} × ${MONTHS}개월 → ` +
      `거래 ${recentTrades.length}건 표시 (${changed ? '변경 있음 — 저장' : '변경 없음'})`,
  );
}

main().catch((error) => {
  console.warn('[fetch-market] 수집 실패 — 기존 JSON 유지:', error);
});
