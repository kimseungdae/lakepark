import { describe, expect, test } from 'vitest';
import {
  aggregateTrades,
  dedupeTrades,
  recentMonths,
  toTrade,
} from '../scripts/lib/aggregateTrades.ts';
import type { MarketTrade } from '../src/data/generated/types';

const trade = (overrides: Partial<MarketTrade>): MarketTrade => ({
  aptNm: '단지',
  umdNm: '마전동',
  excluUseAr: 84.9,
  floor: 10,
  dealDate: '2026-07-15',
  amountMan: 50_000,
  canceled: false,
  ...overrides,
});

describe('toTrade', () => {
  test('콤마 금액·해제일 표기를 정규화한다', () => {
    const parsed = toTrade({
      aptNm: '검단파크',
      umdNm: '마전동',
      dealAmount: '66,270',
      dealYear: '2026',
      dealMonth: '7',
      dealDay: '3',
      floor: '12',
      excluUseAr: '84.9',
      cdealType: 'O',
      cdealDay: '26.07.20',
    });
    expect(parsed?.amountMan).toBe(66_270);
    expect(parsed?.dealDate).toBe('2026-07-03');
    expect(parsed?.canceled).toBe(true);
    expect(parsed?.canceledDate).toBe('26-07-20');
  });

  test('필수 필드가 깨졌으면 null', () => {
    expect(toTrade({ aptNm: '', umdNm: '마전동', dealAmount: '100' })).toBeNull();
    expect(toTrade({ aptNm: 'a', umdNm: 'b', dealAmount: '0', dealYear: '2026', dealMonth: '1', dealDay: '1' })).toBeNull();
  });
});

describe('dedupeTrades', () => {
  test('舊·新 코드 병행 조회 중복을 제거하고 해제 정보를 우선한다', () => {
    const original = trade({});
    const duplicateCanceled = trade({ canceled: true, canceledDate: '2026-07-20' });
    const result = dedupeTrades([original, duplicateCanceled]);
    expect(result).toHaveLength(1);
    expect(result[0]?.canceled).toBe(true);
  });
});

describe('recentMonths', () => {
  test('연 경계를 넘는 최근 개월 목록 (오래된 순)', () => {
    expect(recentMonths('2026-02-10', 4)).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
  });
});

describe('aggregateTrades', () => {
  const trades = [
    trade({ dealDate: '2026-07-01', amountMan: 40_000 }),
    trade({ dealDate: '2026-07-10', amountMan: 50_000, floor: 5 }),
    trade({ dealDate: '2026-07-20', amountMan: 60_000, floor: 7 }),
    trade({ dealDate: '2026-07-25', amountMan: 99_000, floor: 9, canceled: true }),
    trade({ dealDate: '2026-08-05', amountMan: 45_000, floor: 3 }),
  ];
  const { monthly, recentTrades } = aggregateTrades(trades, '2026-08-13', 3);

  test('해제 거래는 건수·중위가에서 제외된다', () => {
    const july = monthly.find((m) => m.month === '2026-07');
    expect(july?.count).toBe(3);
    expect(july?.medianAmountMan).toBe(50_000);
  });

  test('당월·전월은 provisional로 표시된다', () => {
    expect(monthly.map((m) => [m.month, m.provisional])).toEqual([
      ['2026-06', false],
      ['2026-07', true],
      ['2026-08', true],
    ]);
  });

  test('최근 거래 목록은 계약일 내림차순이고 해제 건도 표시용으로 남는다', () => {
    expect(recentTrades[0]?.dealDate).toBe('2026-08-05');
    expect(recentTrades.some((t) => t.canceled)).toBe(true);
  });

  test('짝수 건이면 중위가는 가운데 두 값의 평균이다', () => {
    const twoTrades = [
      trade({ dealDate: '2026-06-01', amountMan: 40_000 }),
      trade({ dealDate: '2026-06-02', amountMan: 50_000, floor: 2 }),
    ];
    const result = aggregateTrades(twoTrades, '2026-08-13', 3);
    expect(result.monthly.find((m) => m.month === '2026-06')?.medianAmountMan).toBe(45_000);
  });
});
