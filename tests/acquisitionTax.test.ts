import { describe, expect, test } from 'vitest';
import { calculateAcquisitionTax } from '../src/lib/calc/acquisitionTax';

// 기대값은 지방세법 제11조 주택 유상거래 표준세율로 손계산했다.
//   6억 이하        : 1%
//   6억 초과 9억 이하: (취득가액 × 2 / 3억 − 3) %  ← 소수점 넷째 자리까지
//   9억 초과        : 3%
//   지방교육세      : 취득세율 × 1/10
//   농어촌특별세    : 전용 85㎡ 초과일 때만 0.2%

describe('calculateAcquisitionTax', () => {
  test('6억 이하 주택은 취득세 1%에 지방교육세 0.1%를 더한다', () => {
    const result = calculateAcquisitionTax({
      taxableAmount: 500_000_000,
      exclusiveAreaSqm: 59.97,
    });

    expect(result.rate).toBe(0.01);
    expect(result.acquisitionTax).toBe(5_000_000);
    expect(result.localEducationTax).toBe(500_000);
    expect(result.total).toBe(5_500_000);
  });

  test('6억 초과 9억 이하 주택은 누진식으로 세율을 산출한다', () => {
    // 6.37억 → (637,000,000 × 2 / 3억) − 3 = 1.246666…% → 1.2467%
    const result = calculateAcquisitionTax({
      taxableAmount: 637_000_000,
      exclusiveAreaSqm: 84.98,
    });

    expect(result.rate).toBe(0.012467);
    expect(result.acquisitionTax).toBe(7_941_479);
    expect(result.localEducationTax).toBe(794_148);
    expect(result.total).toBe(8_735_627);
  });

  test('9억 초과 주택은 취득세 3%를 적용한다', () => {
    const result = calculateAcquisitionTax({
      taxableAmount: 1_000_000_000,
      exclusiveAreaSqm: 84.98,
    });

    expect(result.rate).toBe(0.03);
    expect(result.acquisitionTax).toBe(30_000_000);
    expect(result.localEducationTax).toBe(3_000_000);
    expect(result.total).toBe(33_000_000);
  });

  test('전용 85㎡ 이하는 농어촌특별세가 비과세된다', () => {
    // 더샵 검단레이크파크는 59㎡·84㎡ 두 타입뿐이라 항상 이 경로를 탄다.
    const result = calculateAcquisitionTax({
      taxableAmount: 637_000_000,
      exclusiveAreaSqm: 84.98,
    });

    expect(result.ruralSpecialTax).toBe(0);
  });

  test('전용 85㎡ 초과는 농어촌특별세 0.2%가 붙는다', () => {
    const result = calculateAcquisitionTax({
      taxableAmount: 1_000_000_000,
      exclusiveAreaSqm: 101.5,
    });

    expect(result.ruralSpecialTax).toBe(2_000_000);
    expect(result.total).toBe(35_000_000);
  });

  test('구간 경계인 6억과 9억에서 세율이 끊기지 않는다', () => {
    expect(calculateAcquisitionTax({ taxableAmount: 600_000_000, exclusiveAreaSqm: 84 }).rate).toBe(
      0.01,
    );
    expect(calculateAcquisitionTax({ taxableAmount: 900_000_000, exclusiveAreaSqm: 84 }).rate).toBe(
      0.03,
    );
  });
});
