import { describe, expect, test } from 'vitest';
import { buildPaymentSchedule, type PaymentScheduleInput } from '../src/lib/calc/schedule';

/**
 * 기준 시나리오 — 더샵 검단레이크파크 AB23BL 84A에 가까운 조건.
 *   공급금액 6.37억 / 계약금 10%(1차 1,000만 정액 + 2차 나머지)
 *   중도금 6회 × 10% / 잔금 30% / 중도금 대출 분양가의 60% 알선
 */
function baseInput(overrides: Partial<PaymentScheduleInput> = {}): PaymentScheduleInput {
  return {
    contractAmount: 637_000_000,
    downPayment: {
      totalRatio: 0.1,
      installments: [
        { label: '계약금 1차', date: '2026-07-20', amount: 10_000_000 },
        { label: '계약금 2차', date: '2026-08-19' },
      ],
    },
    interim: {
      ratioEach: 0.1,
      loanRatioOfContract: 0.6,
      dates: [
        '2027-02-20',
        '2027-08-20',
        '2028-02-20',
        '2028-08-20',
        '2029-02-20',
        '2029-08-20',
      ],
    },
    balance: { label: '잔금', date: '2029-12-20' },
    ...overrides,
  };
}

describe('buildPaymentSchedule', () => {
  test('계약금 2회·중도금 6회·잔금 1회를 납부일 순서대로 만든다', () => {
    const { events } = buildPaymentSchedule(baseInput());

    expect(events).toHaveLength(9);
    expect(events.map((e) => e.label)).toEqual([
      '계약금 1차',
      '계약금 2차',
      '중도금 1차',
      '중도금 2차',
      '중도금 3차',
      '중도금 4차',
      '중도금 5차',
      '중도금 6차',
      '잔금',
    ]);
    expect(events.map((e) => e.kind)).toEqual([
      'downPayment',
      'downPayment',
      'interim',
      'interim',
      'interim',
      'interim',
      'interim',
      'interim',
      'balance',
    ]);
  });

  test('금액을 정액으로 지정하지 않은 계약금 회차가 나머지를 흡수한다', () => {
    const { events } = buildPaymentSchedule(baseInput());

    // 계약금 총액 63,700,000 중 1차가 10,000,000이므로 2차는 53,700,000
    expect(events[0]?.amount).toBe(10_000_000);
    expect(events[1]?.amount).toBe(53_700_000);
  });

  test('잔금은 총 공급금액에서 기납부액을 뺀 나머지다', () => {
    const { events } = buildPaymentSchedule(baseInput());

    expect(events.at(-1)?.amount).toBe(191_100_000);
  });

  test('모든 회차 금액의 합은 공급금액과 원 단위까지 일치한다', () => {
    const { events } = buildPaymentSchedule(baseInput());

    const sum = events.reduce((acc, e) => acc + e.amount, 0);
    expect(sum).toBe(637_000_000);
  });

  test('중도금 대출 한도가 중도금 총액을 덮으면 중도금 자기부담이 0이 된다', () => {
    // 대출 60% = 382,200,000, 중도금 총액도 60% → 전액 대출 실행
    const { events } = buildPaymentSchedule(baseInput());
    const interim = events.filter((e) => e.kind === 'interim');

    expect(interim.every((e) => e.loanAmount === 63_700_000)).toBe(true);
    expect(interim.every((e) => e.cashAmount === 0)).toBe(true);
  });

  test('대출 한도가 중도금 총액에 못 미치면 회차마다 균등하게 자납이 생긴다', () => {
    const input = baseInput();
    input.interim.loanRatioOfContract = 0.3; // 중도금 60% 중 절반만 대출

    const { events } = buildPaymentSchedule(input);
    const interim = events.filter((e) => e.kind === 'interim');

    expect(interim.every((e) => e.loanAmount === 31_850_000)).toBe(true);
    expect(interim.every((e) => e.cashAmount === 31_850_000)).toBe(true);
  });

  test('계약금과 잔금은 대출이 잡히지 않고 전액 자기부담이다', () => {
    const { events } = buildPaymentSchedule(baseInput());
    const selfFunded = events.filter((e) => e.kind !== 'interim');

    expect(selfFunded.every((e) => e.loanAmount === 0)).toBe(true);
    expect(selfFunded.every((e) => e.cashAmount === e.amount)).toBe(true);
  });

  test('집계값으로 중도금 대출 총액과 자기부담 현금 총액을 함께 돌려준다', () => {
    const { totals } = buildPaymentSchedule(baseInput());

    expect(totals.contractAmount).toBe(637_000_000);
    expect(totals.interimLoan).toBe(382_200_000);
    // 계약금 63,700,000 + 중도금 자납 0 + 잔금 191,100,000
    expect(totals.cash).toBe(254_800_000);
  });

  test('중도금 회차 수는 납부일 개수를 따른다', () => {
    const input = baseInput();
    input.interim.dates = ['2027-02-20', '2027-08-20'];
    input.interim.ratioEach = 0.1;

    const { events } = buildPaymentSchedule(input);

    expect(events.filter((e) => e.kind === 'interim')).toHaveLength(2);
    // 중도금이 60%→20%로 줄어든 만큼 잔금이 커진다.
    // 637,000,000 − 계약금 63,700,000 − 중도금 127,400,000 = 445,900,000
    expect(events.at(-1)?.amount).toBe(445_900_000);
  });
});

/**
 * 발코니 확장·유상옵션은 분양대금과 완전히 다른 트랙으로 흐른다.
 * 모집공고 기준 옵션 계약 시 10%, 입주지정일에 90%이며 중도금 회차를 타지 않는다.
 * 분양대금 비율에 섞어 계산하면 회차 금액이 전부 틀어진다.
 */
describe('buildPaymentSchedule - 유상옵션 별도 트랙', () => {
  const withOptions = (): PaymentScheduleInput => ({
    ...baseInput(),
    options: {
      totalAmount: 14_458_000, // 발코니 확장 5,458,000 + 시스템에어컨 9,000,000
      downPaymentRatio: 0.1,
      contractDate: '2026-07-20',
      balanceDate: '2029-12-20',
    },
  });

  test('옵션 계약금 10%와 입주 시 잔금 90%를 별도 이벤트로 만든다', () => {
    const { events } = buildPaymentSchedule(withOptions());

    const optionDown = events.find((e) => e.kind === 'optionDownPayment');
    const optionBalance = events.find((e) => e.kind === 'optionBalance');

    expect(optionDown?.amount).toBe(1_445_800);
    expect(optionBalance?.amount).toBe(13_012_200);
  });

  test('옵션 잔금은 반올림 잔차를 흡수해 옵션 합계와 정확히 맞는다', () => {
    const input = withOptions();
    input.options = { ...input.options!, totalAmount: 3_333_333 };

    const { events } = buildPaymentSchedule(input);
    const optionSum = events
      .filter((e) => e.kind === 'optionDownPayment' || e.kind === 'optionBalance')
      .reduce((acc, e) => acc + e.amount, 0);

    expect(optionSum).toBe(3_333_333);
  });

  test('옵션은 중도금 대출 대상이 아니므로 전액 자기부담이다', () => {
    const { events } = buildPaymentSchedule(withOptions());
    const optionEvents = events.filter(
      (e) => e.kind === 'optionDownPayment' || e.kind === 'optionBalance',
    );

    expect(optionEvents).toHaveLength(2);
    expect(optionEvents.every((e) => e.loanAmount === 0)).toBe(true);
    expect(optionEvents.every((e) => e.cashAmount === e.amount)).toBe(true);
  });

  test('옵션 금액은 분양대금 집계를 오염시키지 않는다', () => {
    const { totals } = buildPaymentSchedule(withOptions());

    // 분양대금 관련 집계는 옵션 없는 경우와 동일해야 한다
    expect(totals.contractAmount).toBe(637_000_000);
    expect(totals.interim).toBe(382_200_000);
    expect(totals.balance).toBe(191_100_000);
    // 옵션은 자체 집계 항목으로만 잡힌다
    expect(totals.options).toBe(14_458_000);
  });

  test('옵션 자기부담 현금은 분양대금 현금과 합산해 집계된다', () => {
    const { totals } = buildPaymentSchedule(withOptions());

    // 분양대금 자기부담 254,800,000 + 옵션 14,458,000
    expect(totals.cash).toBe(269_258_000);
  });

  test('옵션을 선택하지 않으면 옵션 이벤트가 생기지 않는다', () => {
    const { events, totals } = buildPaymentSchedule(baseInput());

    expect(events.some((e) => e.kind.startsWith('option'))).toBe(false);
    expect(totals.options).toBe(0);
  });
});
