import { existsSync, readFileSync } from 'node:fs';
import { collectBids } from './lib/collectBids.ts';
import { writeIfChanged } from './lib/writeIfChanged.ts';
import type { BidRadarSnapshot } from '../src/data/generated/types.ts';

/**
 * 로컬(한국 IP) 실행용 래퍼 — 수집 코어는 scripts/lib/collectBids.ts.
 * 운영 수집은 Vercel 서울 리전 크론(api/update-data.ts)이 담당한다.
 */
const OUTPUT_PATH = 'src/data/generated/bids.json';
const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;

if (!serviceKey) {
  console.warn('[fetch-bids] DATA_GO_KR_SERVICE_KEY 미설정 — 건너뜀');
} else {
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const previous: BidRadarSnapshot | null = existsSync(OUTPUT_PATH)
    ? (JSON.parse(readFileSync(OUTPUT_PATH, 'utf8')) as BidRadarSnapshot)
    : null;

  collectBids(serviceKey, previous?.bids ?? [], today)
    .then((snapshot) => {
      const changed = writeIfChanged(OUTPUT_PATH, snapshot);
      console.log(`[fetch-bids] 공고 ${snapshot.bids.length}건 (${changed ? '저장' : '변경 없음'})`);
    })
    .catch((error) => console.warn('[fetch-bids] 수집 실패 — 기존 JSON 유지:', error));
}
