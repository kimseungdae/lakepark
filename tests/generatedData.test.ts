import { describe, expect, test } from 'vitest';
import bidsJson from '../src/data/generated/bids.json';
import marketJson from '../src/data/generated/market.json';
import populationJson from '../src/data/generated/population.json';
import { STATUS_BOARD } from '../src/data/status/board';
import {
  assertBidRadarSnapshot,
  assertMarketSnapshot,
  assertPopulationSnapshot,
} from '../src/lib/generated';

/**
 * 커밋된 자동 수집 JSON의 무결성 게이트.
 * GitHub Actions가 데이터 갱신 커밋 전에 npm test를 돌리므로,
 * 여기서 실패하면 깨진 데이터는 저장소에 들어가지 못한다.
 */
describe('generated/market.json', () => {
  test('스키마 가드를 통과한다', () => {
    expect(() => assertMarketSnapshot(marketJson)).not.toThrow();
  });

  test('월별 집계는 오래된 순으로 정렬돼 있다', () => {
    const snapshot = assertMarketSnapshot(marketJson);
    const months = snapshot.monthly.map((m) => m.month);
    expect(months).toEqual([...months].sort((a, b) => a.localeCompare(b)));
  });

  test('최근 거래는 계약일 내림차순이다', () => {
    const snapshot = assertMarketSnapshot(marketJson);
    const dates = snapshot.recentTrades.map((t) => t.dealDate);
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)));
  });
});

describe('generated/bids.json', () => {
  test('스키마 가드를 통과하고 상태판 참조가 유효하다', () => {
    const snapshot = assertBidRadarSnapshot(bidsJson);
    const statusIds = new Set(STATUS_BOARD.map((item) => item.id));
    for (const bid of snapshot.bids) {
      for (const id of bid.statusItemIds) {
        expect(statusIds.has(id), `${bid.bidNtceNo} → 미지의 상태판 id ${id}`).toBe(true);
      }
    }
  });

  test('공고는 공고일 내림차순이다', () => {
    const snapshot = assertBidRadarSnapshot(bidsJson);
    const dates = snapshot.bids.map((bid) => bid.noticedAt);
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)));
  });
});

describe('generated/population.json', () => {
  test('스키마 가드를 통과하고 월이 오름차순이다', () => {
    const snapshot = assertPopulationSnapshot(populationJson);
    const months = snapshot.months.map((row) => row.month);
    expect(months).toEqual([...months].sort((a, b) => a.localeCompare(b)));
  });
});
