import { describe, expect, test } from 'vitest';
import { calculateTotalCost, type TotalCostInput } from '../src/lib/calc/total';
import { GEOMDAN_LAKEPARK } from '../src/data/presets/geomdan-lakepark';

/**
 * 합산 레이어의 핵심 계약은 "확정과 추정을 절대 한 덩어리로 합치지 않는다"이다.
 * 공고문에 적힌 분양대금·옵션은 confirmed,
 * 개인 조건에 따라 달라지는 취득세·등기·이자·인테리어는 estimated로 분리한다.
 */
function baseInput(overrides: Partial<TotalCostInput> = {}): TotalCostInput {
  return {
    supplyPrice: 662_700_000,
    exclusiveAreaSqm: 84.5181,
    contractDate: '2026-07-20',
    moveInDate: GEOMDAN_LAKEPARK.expectedMoveInDate,
    optionsTotal: 14_458_000,
    loanRatioOfContract: 0.6,
    loanAnnualRate: 0.045,
    loanInterestMode: '이자후불제',
    interiorLevel: 'standard',
    includeAppliances: true,
    includeOptionsInTaxBase: true,
    registrationFee: 2_000_000,
    ...overrides,
  };
}

describe('calculateTotalCost', () => {
  test('확정 금액은 분양대금과 옵션의 합이다', () => {
    const r = calculateTotalCost(baseInput());

    expect(r.confirmed.supplyPrice).toBe(662_700_000);
    expect(r.confirmed.options).toBe(14_458_000);
    expect(r.confirmed.total).toBe(677_158_000);
  });

  test('추정 금액은 확정 금액과 섞이지 않고 별도 구간으로 남는다', () => {
    const r = calculateTotalCost(baseInput());

    // 추정 합계는 구간이어야 한다 (단일 확정액이면 안 된다)
    expect(r.estimated.total.max).toBeGreaterThan(r.estimated.total.min);
    // 확정 총액에 추정치가 섞여 있지 않다
    expect(r.confirmed.total).toBe(r.confirmed.supplyPrice + r.confirmed.options);
  });

  test('옵션을 과세표준에 포함하면 취득세가 올라간다', () => {
    const included = calculateTotalCost(baseInput({ includeOptionsInTaxBase: true }));
    const excluded = calculateTotalCost(baseInput({ includeOptionsInTaxBase: false }));

    expect(included.acquisitionTax.total).toBeGreaterThan(excluded.acquisitionTax.total);
    expect(excluded.acquisitionTax.total).toBe(10_336_795); // 옵션 제외 = 662,700,000 기준
  });

  test('중도금 대출 잔액을 잔금 시점 부담으로 따로 알려준다', () => {
    const r = calculateTotalCost(baseInput());

    // 분양가의 60%
    expect(r.carriedLoan).toBe(397_620_000);
  });

  test('이자후불제는 이자가 입주 시 부담에 잡힌다', () => {
    const deferred = calculateTotalCost(baseInput({ loanInterestMode: '이자후불제' }));
    const asAccrued = calculateTotalCost(baseInput({ loanInterestMode: '이자자납' }));

    expect(deferred.cashByPhase.atMoveIn).toBeGreaterThan(asAccrued.cashByPhase.atMoveIn);
    expect(asAccrued.cashByPhase.beforeMoveIn).toBeGreaterThan(deferred.cashByPhase.beforeMoveIn);
  });

  test('무이자 조건이면 이자가 어느 시점에도 잡히지 않는다', () => {
    const r = calculateTotalCost(baseInput({ loanInterestMode: '무이자' }));

    expect(r.loanInterest.total).toBe(0);
    expect(r.estimated.loanInterest).toBe(0);
  });

  test('입주 전 현금은 계약금과 옵션 계약금을 포함한다', () => {
    const r = calculateTotalCost(baseInput({ loanInterestMode: '무이자' }));

    // 계약금 66,270,000 + 중도금 자납 0(대출 60% 전액 충당) + 옵션 계약금 1,445,800
    expect(r.cashByPhase.beforeMoveIn).toBe(67_715_800);
  });

  test('입주 시 현금은 잔금·옵션잔금·취득세·등기비를 합한 값이다', () => {
    const r = calculateTotalCost(baseInput({ loanInterestMode: '무이자' }));

    // 잔금 198,810,000 + 옵션잔금 13,012,200 + 취득세 11,280,369 + 등기 2,000,000
    expect(r.cashByPhase.atMoveIn).toBe(225_102_569);
  });

  test('입주 후 비용은 확정할 수 없으므로 구간으로만 제시한다', () => {
    const r = calculateTotalCost(baseInput());

    expect(r.cashByPhase.afterMoveIn.max).toBeGreaterThan(r.cashByPhase.afterMoveIn.min);
  });

  test('가전을 옵션으로 계약했으면 입주 후 비용에서 제외된다', () => {
    const withAppliances = calculateTotalCost(baseInput({ includeAppliances: true }));
    const without = calculateTotalCost(baseInput({ includeAppliances: false }));

    expect(without.cashByPhase.afterMoveIn.min).toBeLessThan(
      withAppliances.cashByPhase.afterMoveIn.min,
    );
  });
});
