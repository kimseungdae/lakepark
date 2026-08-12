import { ACQUISITION_TAX } from '../../data/rates';

export type AcquisitionTaxInput = {
  /**
   * 과세표준. 분양가만이 아니라 발코니 확장비·유상옵션까지 포함한 실제 취득가액이다.
   * 옵션 때문에 상위 세율 구간으로 넘어가는 경우가 실제로 발생한다.
   */
  taxableAmount: number;
  /** 전용면적(㎡). 농어촌특별세 비과세 판정에만 쓰인다. */
  exclusiveAreaSqm: number;
};

export type AcquisitionTaxResult = {
  /** 적용된 취득세율 (소수 표기, 예: 1.2467% → 0.012467) */
  rate: number;
  acquisitionTax: number;
  localEducationTax: number;
  ruralSpecialTax: number;
  total: number;
};

/** 과세표준에 대응하는 주택 유상거래 취득세율을 구한다. */
function resolveRate(taxableAmount: number): number {
  if (taxableAmount <= ACQUISITION_TAX.lowerBracketLimit) {
    return ACQUISITION_TAX.lowerBracketRate;
  }
  if (taxableAmount > ACQUISITION_TAX.upperBracketLimit) {
    return ACQUISITION_TAX.upperBracketRate;
  }

  const { multiplier, divisor, offset, percentDecimals } = ACQUISITION_TAX.middleBracket;
  const percent = (taxableAmount * multiplier) / divisor - offset;
  const factor = 10 ** percentDecimals;
  // 백분율 → 소수 변환은 한 번의 나눗셈으로 끝낸다.
  // factor로 나눈 뒤 다시 100으로 나누면 부동소수점 오차가 누적된다(0.012467 → 0.012466999…).
  return Math.round(percent * factor) / (factor * 100);
}

/**
 * 주택 유상거래 취득세와 부가세목(지방교육세·농어촌특별세)을 산출한다.
 * 1세대 1주택 표준세율 기준이며, 다주택 중과는 다루지 않는다.
 */
export function calculateAcquisitionTax(input: AcquisitionTaxInput): AcquisitionTaxResult {
  const rate = resolveRate(input.taxableAmount);

  const acquisitionTax = Math.round(input.taxableAmount * rate);
  const localEducationTax = Math.round(
    input.taxableAmount * rate * ACQUISITION_TAX.localEducationTaxRatio,
  );
  const ruralSpecialTax =
    input.exclusiveAreaSqm > ACQUISITION_TAX.ruralSpecialTaxExemptAreaSqm
      ? Math.round(input.taxableAmount * ACQUISITION_TAX.ruralSpecialTaxRate)
      : 0;

  return {
    rate,
    acquisitionTax,
    localEducationTax,
    ruralSpecialTax,
    total: acquisitionTax + localEducationTax + ruralSpecialTax,
  };
}
