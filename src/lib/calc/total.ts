import { ANCILLARY_COSTS, type MoveInLevel } from '../../data/rates';
import { calculateAcquisitionTax, type AcquisitionTaxResult } from './acquisitionTax';
import {
  calculateInterimLoanInterest,
  type InterimLoanInterestMode,
  type InterimLoanInterestResult,
} from './loanInterest';
import { estimateMoveInCosts, type CostRange, type MoveInCostsResult } from './moveInCosts';
import { buildScheduleInputFromPreset } from './presetAdapter';
import { buildPaymentSchedule, type PaymentScheduleResult } from './schedule';

export type TotalCostInput = {
  supplyPrice: number;
  exclusiveAreaSqm: number;
  contractDate: string;
  moveInDate: string;
  /** 발코니 확장 + 유상옵션 합계 */
  optionsTotal: number;
  loanRatioOfContract: number;
  loanAnnualRate: number;
  loanInterestMode: InterimLoanInterestMode;
  interiorLevel: MoveInLevel;
  /** 빌트인 가전을 유상옵션으로 계약했다면 false */
  includeAppliances: boolean;
  /**
   * 발코니 확장·유상옵션을 취득세 과세표준에 포함할지.
   * 실제 포함 범위는 세무 확인 대상이므로 UI가 이 선택지를 노출하고 주의를 표시해야 한다.
   */
  includeOptionsInTaxBase: boolean;
  /** 소유권이전등기 부대비용. 생략하면 추정 기본값을 쓴다. */
  registrationFee?: number;
};

export type TotalCostResult = {
  schedule: PaymentScheduleResult;
  loanInterest: InterimLoanInterestResult;
  acquisitionTax: AcquisitionTaxResult;
  moveInCosts: MoveInCostsResult;

  /** 입주자모집공고에 적힌 확정 금액. 추정치를 절대 섞지 않는다. */
  confirmed: {
    supplyPrice: number;
    options: number;
    total: number;
  };

  /** 개인 조건·시장에 따라 달라지는 추정 금액. 확정 금액과 합산해 제시하면 안 된다. */
  estimated: {
    acquisitionTax: number;
    registrationFee: number;
    loanInterest: number;
    moveIn: CostRange;
    total: CostRange;
  };

  /** 언제 현금이 필요한지 — 총액보다 이게 더 궁금한 숫자다. */
  cashByPhase: {
    beforeMoveIn: number;
    atMoveIn: number;
    afterMoveIn: CostRange;
  };

  /** 잔금 시점에 상환하거나 주택담보대출로 전환해야 하는 중도금 대출 잔액 */
  carriedLoan: number;
};

/**
 * 계산기의 최상위 합산.
 *
 * 설계 계약: 공고문 기반 확정 금액(confirmed)과 개인·시장 조건에 좌우되는
 * 추정 금액(estimated)을 끝까지 분리해서 돌려준다. 둘을 더한 "총 입주비용" 단일 숫자는
 * 의도적으로 제공하지 않는다 — 그 숫자는 확정처럼 보이지만 확정이 아니기 때문이다.
 */
export function calculateTotalCost(input: TotalCostInput): TotalCostResult {
  const schedule = buildPaymentSchedule(
    buildScheduleInputFromPreset({
      supplyPrice: input.supplyPrice,
      contractDate: input.contractDate,
      moveInDate: input.moveInDate,
      optionsTotal: input.optionsTotal,
      loanRatioOfContract: input.loanRatioOfContract,
    }),
  );

  const loanInterest = calculateInterimLoanInterest({
    mode: input.loanInterestMode,
    annualRate: input.loanAnnualRate,
    balanceDate: input.moveInDate,
    installments: schedule.events
      .filter((e) => e.kind === 'interim')
      .map((e) => ({ label: e.label, date: e.date, loanAmount: e.loanAmount })),
  });

  const taxableAmount = input.includeOptionsInTaxBase
    ? input.supplyPrice + input.optionsTotal
    : input.supplyPrice;

  const acquisitionTax = calculateAcquisitionTax({
    taxableAmount,
    exclusiveAreaSqm: input.exclusiveAreaSqm,
  });

  const moveInCosts = estimateMoveInCosts({
    exclusiveAreaSqm: input.exclusiveAreaSqm,
    level: input.interiorLevel,
    includeAppliances: input.includeAppliances,
  });

  const registrationFee = input.registrationFee ?? ANCILLARY_COSTS.registrationFeeDefault;

  // 납부 회차를 입주지정일 기준으로 앞뒤로 가른다.
  const cashBefore = schedule.events
    .filter((e) => e.date < input.moveInDate)
    .reduce((acc, e) => acc + e.cashAmount, 0);
  const cashAt = schedule.events
    .filter((e) => e.date >= input.moveInDate)
    .reduce((acc, e) => acc + e.cashAmount, 0);

  // 이자자납은 공사 기간에, 이자후불제는 잔금 시점에 현금이 나간다.
  const interestBefore = loanInterest.paidDuringConstruction ? loanInterest.total : 0;
  const interestAtMoveIn = loanInterest.paidDuringConstruction ? 0 : loanInterest.total;

  return {
    schedule,
    loanInterest,
    acquisitionTax,
    moveInCosts,
    confirmed: {
      supplyPrice: input.supplyPrice,
      options: input.optionsTotal,
      total: input.supplyPrice + input.optionsTotal,
    },
    estimated: {
      acquisitionTax: acquisitionTax.total,
      registrationFee,
      loanInterest: loanInterest.total,
      moveIn: moveInCosts.total,
      total: {
        min: acquisitionTax.total + registrationFee + loanInterest.total + moveInCosts.total.min,
        max: acquisitionTax.total + registrationFee + loanInterest.total + moveInCosts.total.max,
      },
    },
    cashByPhase: {
      beforeMoveIn: cashBefore + interestBefore,
      atMoveIn: cashAt + interestAtMoveIn + acquisitionTax.total + registrationFee,
      afterMoveIn: moveInCosts.total,
    },
    carriedLoan: schedule.totals.interimLoan,
  };
}
