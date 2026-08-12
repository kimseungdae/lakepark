import { PAYMENT_STRUCTURE } from '../../data/presets/geomdan-lakepark';
import { addDays } from './dates';
import type { PaymentScheduleInput } from './schedule';

export type PresetScheduleArgs = {
  /** 공고상 공급금액(분양가). 옵션은 포함하지 않는다. */
  supplyPrice: number;
  /** 개인 계약일 — 계약금 1·2차 납부일이 여기서 파생된다 */
  contractDate: string;
  /** 입주지정일 — 잔금과 옵션 잔금이 걸리는 날 */
  moveInDate: string;
  /** 발코니 확장 + 유상옵션 합계 */
  optionsTotal?: number;
  /** 공고문 표기 그대로의 중도금 대출 알선 비율 (분양가 대비) */
  loanRatioOfContract: number;
};

/**
 * 공고문에 확정된 납부 구조(PAYMENT_STRUCTURE)에 개인별 변수만 얹어
 * 계산기가 먹을 수 있는 입력으로 바꾼다.
 *
 * 중도금 납부일·비율처럼 공고문이 정한 값은 여기서 오지 사용자 입력에서 오지 않는다.
 */
export function buildScheduleInputFromPreset(args: PresetScheduleArgs): PaymentScheduleInput {
  const { downPayment, interim, optionDownPaymentRatio } = PAYMENT_STRUCTURE;
  const hasOptions = typeof args.optionsTotal === 'number' && args.optionsTotal > 0;

  return {
    contractAmount: args.supplyPrice,
    downPayment: {
      totalRatio: downPayment.totalRatio,
      installments: [
        {
          label: '계약금 1차',
          date: args.contractDate,
          amount: downPayment.firstInstallmentAmount,
        },
        {
          // 금액 미지정 → 계약금 총액의 나머지를 흡수한다
          label: '계약금 2차',
          date: addDays(args.contractDate, downPayment.secondInstallmentOffsetDays),
        },
      ],
    },
    interim: {
      ratioEach: interim.ratioEach,
      loanRatioOfContract: args.loanRatioOfContract,
      dates: [...interim.dates],
    },
    balance: { label: '잔금', date: args.moveInDate },
    options: hasOptions
      ? {
          totalAmount: args.optionsTotal!,
          downPaymentRatio: optionDownPaymentRatio,
          contractDate: args.contractDate,
          balanceDate: args.moveInDate,
        }
      : undefined,
  };
}
