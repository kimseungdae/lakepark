import { collectMarket } from './lib/collectMarket.ts';
import { writeIfChanged } from './lib/writeIfChanged.ts';

/**
 * 로컬(한국 IP) 실행용 래퍼 — 수집 코어는 scripts/lib/collectMarket.ts.
 * 운영 수집은 Vercel 서울 리전 크론(api/update-data.ts)이 담당한다
 * (GitHub Actions 러너는 해외 IP라 국토부 API가 차단됨).
 */
const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
if (!serviceKey) {
  console.warn('[fetch-market] DATA_GO_KR_SERVICE_KEY 미설정 — 건너뜀');
} else {
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  collectMarket(serviceKey, today)
    .then((snapshot) => {
      const changed = writeIfChanged('src/data/generated/market.json', snapshot);
      console.log(`[fetch-market] 거래 ${snapshot.recentTrades.length}건 (${changed ? '저장' : '변경 없음'})`);
    })
    .catch((error) => console.warn('[fetch-market] 수집 실패 — 기존 JSON 유지:', error));
}
