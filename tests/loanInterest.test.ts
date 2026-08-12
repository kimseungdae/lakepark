import { describe, expect, test } from 'vitest';
import { addDays, daysBetween } from '../src/lib/calc/dates';
import {
  calculateInterimLoanInterest,
  type InterimLoanInterestInput,
} from '../src/lib/calc/loanInterest';

describe('daysBetween', () => {
  test('윤년 2월 29일을 지나는 구간은 366일로 센다', () => {
    expect(daysBetween('2028-01-01', '2029-01-01')).toBe(366);
  });

  test('평년 구간은 365일이다', () => {
    expect(daysBetween('2029-01-01', '2030-01-01')).toBe(365);
  });

  test('같은 날짜면 0일이다', () => {
    expect(daysBetween('2028-03-15', '2028-03-15')).toBe(0);
  });
});

describe('addDays', () => {
  test('월 경계를 넘어 일수를 더한다', () => {
    // 계약금 2차 기한: 계약 후 30일 이내
    expect(addDays('2026-07-20', 30)).toBe('2026-08-19');
  });

  test('연 경계를 넘어도 정확하다', () => {
    expect(addDays('2026-12-20', 30)).toBe('2027-01-19');
  });

  test('윤년 2월을 정확히 통과한다', () => {
    expect(addDays('2028-02-20', 10)).toBe('2028-03-01');
  });
});

function baseInput(overrides: Partial<InterimLoanInterestInput> = {}): InterimLoanInterestInput {
  return {
    mode: '이자후불제',
    annualRate: 0.05,
    balanceDate: '2029-01-01',
    installments: [
      { label: '중도금 1차', date: '2028-01-01', loanAmount: 100_000_000 },
      { label: '중도금 2차', date: '2028-07-01', loanAmount: 100_000_000 },
    ],
    ...overrides,
  };
}

describe('calculateInterimLoanInterest', () => {
  test('무이자 조건이면 이자가 한 푼도 발생하지 않는다', () => {
    const result = calculateInterimLoanInterest(baseInput({ mode: '무이자' }));

    expect(result.total).toBe(0);
    expect(result.breakdown.every((b) => b.interest === 0)).toBe(true);
  });

  test('회차별로 실행일부터 잔금일까지 일할 계산한다', () => {
    const result = calculateInterimLoanInterest(baseInput());

    // 1차: 2028-01-01 → 2029-01-01 = 366일 (윤년)
    //      1억 × 5% × 366/365 = 5,013,698.63 → 5,013,699
    expect(result.breakdown[0]?.days).toBe(366);
    expect(result.breakdown[0]?.interest).toBe(5_013_699);

    // 2차: 2028-07-01 → 2029-01-01 = 184일
    //      1억 × 5% × 184/365 = 2,520,547.95 → 2,520,548
    expect(result.breakdown[1]?.days).toBe(184);
    expect(result.breakdown[1]?.interest).toBe(2_520_548);
  });

  test('총 이자는 회차별 이자의 합이다', () => {
    const result = calculateInterimLoanInterest(baseInput());

    expect(result.total).toBe(7_534_247);
    expect(result.total).toBe(result.breakdown.reduce((acc, b) => acc + b.interest, 0));
  });

  test('대출이 실행되지 않은 회차는 이자가 붙지 않는다', () => {
    const result = calculateInterimLoanInterest(
      baseInput({
        installments: [{ label: '중도금 1차', date: '2028-01-01', loanAmount: 0 }],
      }),
    );

    expect(result.total).toBe(0);
  });

  test('이자후불제는 잔금 시점에 한꺼번에 부담한다', () => {
    const result = calculateInterimLoanInterest(baseInput({ mode: '이자후불제' }));

    expect(result.paidDuringConstruction).toBe(false);
  });

  test('이자자납은 공사 기간에 나눠 내므로 총액은 같아도 부담 시점이 다르다', () => {
    const deferred = calculateInterimLoanInterest(baseInput({ mode: '이자후불제' }));
    const asAccrued = calculateInterimLoanInterest(baseInput({ mode: '이자자납' }));

    expect(asAccrued.total).toBe(deferred.total);
    expect(asAccrued.paidDuringConstruction).toBe(true);
  });
});
