import { INTERIM_LOAN } from '../../data/rates';
import { daysBetween } from './dates';

/**
 * 중도금 대출 이자 부담 방식.
 * 공고문의 "중도금 무이자 / 이자후불제 / 이자자납" 표기를 그대로 옮긴 것이다.
 */
export type InterimLoanInterestMode = '무이자' | '이자후불제' | '이자자납';

export type InterimLoanInterestInput = {
  mode: InterimLoanInterestMode;
  /** 연이율 (소수 표기, 예: 4.5% → 0.045) */
  annualRate: number;
  /** 잔금 납부일 — 이 시점에 중도금 대출이 정산된다 */
  balanceDate: string;
  installments: Array<{ label: string; date: string; loanAmount: number }>;
};

export type InterimLoanInterestResult = {
  mode: InterimLoanInterestMode;
  total: number;
  /**
   * 이자를 공사 기간 중에 나눠 내는지 여부.
   * 총액이 같아도 '이자자납'은 매달 현금이 빠져나가므로 현금흐름 배치가 달라진다.
   */
  paidDuringConstruction: boolean;
  breakdown: Array<{ label: string; loanAmount: number; days: number; interest: number }>;
};

/**
 * 회차별 중도금 대출 이자를 실행일부터 잔금일까지 일할로 계산한다.
 *
 * 무이자 조건이면 시행사가 부담하므로 계약자 부담은 0이다.
 * '이자후불제'와 '이자자납'은 단리 기준 총액이 같고 부담 시점만 다르다.
 */
export function calculateInterimLoanInterest(
  input: InterimLoanInterestInput,
): InterimLoanInterestResult {
  const isFree = input.mode === '무이자';

  const breakdown = input.installments.map((installment) => {
    const days = daysBetween(installment.date, input.balanceDate);
    const interest = isFree
      ? 0
      : Math.round(
          (installment.loanAmount * input.annualRate * days) / INTERIM_LOAN.daysPerYear,
        );

    return { label: installment.label, loanAmount: installment.loanAmount, days, interest };
  });

  return {
    mode: input.mode,
    total: breakdown.reduce((acc, b) => acc + b.interest, 0),
    paidDuringConstruction: input.mode === '이자자납',
    breakdown,
  };
}
