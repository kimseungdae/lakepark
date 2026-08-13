import { existsSync, readFileSync } from 'node:fs';
import { collectPopulation } from './lib/collectPopulation.ts';
import { writeIfChanged } from './lib/writeIfChanged.ts';
import type { PopulationSnapshot } from '../src/data/generated/types.ts';

/**
 * 로컬(한국 IP) 실행용 래퍼 — 수집 코어는 scripts/lib/collectPopulation.ts.
 * 운영 수집은 Vercel 서울 리전 크론(api/update-data.ts)이 담당한다.
 */
const OUTPUT_PATH = 'src/data/generated/population.json';
const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;

if (!serviceKey) {
  console.warn('[fetch-population] DATA_GO_KR_SERVICE_KEY 미설정 — 건너뜀');
} else {
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const existing: PopulationSnapshot | null = existsSync(OUTPUT_PATH)
    ? (JSON.parse(readFileSync(OUTPUT_PATH, 'utf8')) as PopulationSnapshot)
    : null;

  collectPopulation(serviceKey, existing, today)
    .then((snapshot) => {
      if (!snapshot) {
        console.log('[fetch-population] 새 월 없음 또는 응답 확인 필요 — 유지');
        return;
      }
      const changed = writeIfChanged(OUTPUT_PATH, snapshot);
      console.log(`[fetch-population] ${snapshot.months.at(-1)?.month} (${changed ? '저장' : '변경 없음'})`);
    })
    .catch((error) => console.warn('[fetch-population] 수집 실패 — 기존 JSON 유지:', error));
}
