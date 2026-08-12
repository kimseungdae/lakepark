import { describe, expect, test } from 'vitest';
import { calculateAcquisitionTax } from '../src/lib/calc/acquisitionTax';
import { buildScheduleInputFromPreset } from '../src/lib/calc/presetAdapter';
import { buildPaymentSchedule } from '../src/lib/calc/schedule';
import { GEOMDAN_LAKEPARK } from '../src/data/presets/geomdan-lakepark';

/**
 * 골든 테스트 — 이 계산기의 존재 이유.
 *
 * 검증 기준은 개인 계약서가 아니라 입주자모집공고에서 공개된 납부액 표다.
 * (개인 계약 세대의 동·호·금액은 저장소에 남기지 않는다는 원칙을 따른다.)
 * 공고 기준표와 계산 결과가 원 단위로 어긋나면 이 프로젝트는 존재 가치가 없다.
 */

const AB23 = GEOMDAN_LAKEPARK.blocks.AB23;

function scheduleFor(supplyPrice: number, optionsTotal = 0) {
  return buildPaymentSchedule(
    buildScheduleInputFromPreset({
      supplyPrice,
      contractDate: '2026-07-20',
      moveInDate: GEOMDAN_LAKEPARK.expectedMoveInDate,
      optionsTotal,
      loanRatioOfContract: 0.6,
    }),
  );
}

describe('공고 기준표 대조 — AB23BL 84A 최고가 662,700,000원', () => {
  // 모집공고 기반 "최고가 세대의 전체 흐름" 표를 그대로 옮긴 값이다.
  const { events, totals } = scheduleFor(662_700_000);

  test('계약 시 1차 계약금은 정액 1,000만원이다', () => {
    expect(events[0]?.label).toBe('계약금 1차');
    expect(events[0]?.amount).toBe(10_000_000);
  });

  test('계약 후 30일 이내 2차 계약금은 56,270,000원이다', () => {
    expect(events[1]?.label).toBe('계약금 2차');
    expect(events[1]?.amount).toBe(56_270_000);
    expect(events[1]?.date).toBe('2026-08-19');
  });

  test('중도금은 6회 모두 66,270,000원이다', () => {
    const interim = events.filter((e) => e.kind === 'interim');

    expect(interim).toHaveLength(6);
    expect(interim.every((e) => e.amount === 66_270_000)).toBe(true);
  });

  test('중도금 납부일은 공고문에 명시된 6개 회차와 일치한다', () => {
    const interim = events.filter((e) => e.kind === 'interim');

    expect(interim.map((e) => e.date)).toEqual([
      '2026-12-15',
      '2027-06-15',
      '2027-12-15',
      '2028-08-14',
      '2029-01-15',
      '2029-06-15',
    ]);
  });

  test('입주지정일 잔금은 198,810,000원이다', () => {
    expect(events.at(-1)?.kind).toBe('balance');
    expect(events.at(-1)?.amount).toBe(198_810_000);
  });

  test('전체 합계가 공급금액과 원 단위로 일치한다', () => {
    expect(events.reduce((acc, e) => acc + e.amount, 0)).toBe(662_700_000);
    expect(totals.contractAmount).toBe(662_700_000);
  });
});

describe('공고 기준표 대조 — 타입별 납부액', () => {
  // KB의 "블록·타입별 실제 납부액 기준표"를 독립적으로 재현한다.
  const rows: Array<{
    label: string;
    supplyPrice: number;
    secondDownPayment: number;
    interimEach: number;
    balance: number;
  }> = [
    { label: '59A 최고', supplyPrice: 495_200_000, secondDownPayment: 39_520_000, interimEach: 49_520_000, balance: 148_560_000 },
    { label: '59A 최저', supplyPrice: 457_700_000, secondDownPayment: 35_770_000, interimEach: 45_770_000, balance: 137_310_000 },
    { label: '59B 최고', supplyPrice: 487_400_000, secondDownPayment: 38_740_000, interimEach: 48_740_000, balance: 146_220_000 },
    { label: '84A 일반최저', supplyPrice: 612_400_000, secondDownPayment: 51_240_000, interimEach: 61_240_000, balance: 183_720_000 },
    { label: '84B 일반최저', supplyPrice: 606_100_000, secondDownPayment: 50_610_000, interimEach: 60_610_000, balance: 181_830_000 },
    { label: '84C 최고', supplyPrice: 645_900_000, secondDownPayment: 54_590_000, interimEach: 64_590_000, balance: 193_770_000 },
  ];

  test.each(rows)('$label — 공고 기준표와 일치한다', (row) => {
    const { events } = scheduleFor(row.supplyPrice);

    expect(events[1]?.amount).toBe(row.secondDownPayment);
    expect(events.filter((e) => e.kind === 'interim')[0]?.amount).toBe(row.interimEach);
    expect(events.at(-1)?.amount).toBe(row.balance);
  });

  test('AB23BL 모든 타입에서 회차 합계가 공급금액과 일치한다', () => {
    for (const type of AB23.types) {
      for (const price of [type.supplyPrice.min, type.supplyPrice.max]) {
        const { events } = scheduleFor(price);
        const sum = events.reduce((acc, e) => acc + e.amount, 0);
        expect(sum, `${type.code} ${price}`).toBe(price);
      }
    }
  });
});

describe('공고 기준표 대조 — 유상옵션 별도 흐름', () => {
  // 발코니 확장 5,458,000 + 전실 시스템에어컨 9,000,000 = 14,458,000
  const optionsTotal = 5_458_000 + 9_000_000;

  test('옵션 합계는 14,458,000원이다', () => {
    expect(optionsTotal).toBe(14_458_000);
  });

  test('옵션 계약 시 1,445,800원, 입주 시 13,012,200원으로 나뉜다', () => {
    const { events } = scheduleFor(662_700_000, optionsTotal);

    expect(events.find((e) => e.kind === 'optionDownPayment')?.amount).toBe(1_445_800);
    expect(events.find((e) => e.kind === 'optionBalance')?.amount).toBe(13_012_200);
  });

  test('옵션은 분양대금 회차 금액을 바꾸지 않는다', () => {
    const withOptions = scheduleFor(662_700_000, optionsTotal);
    const withoutOptions = scheduleFor(662_700_000);

    const interimOf = (r: typeof withOptions) =>
      r.events.filter((e) => e.kind === 'interim').map((e) => e.amount);

    expect(interimOf(withOptions)).toEqual(interimOf(withoutOptions));
    expect(withOptions.totals.balance).toBe(withoutOptions.totals.balance);
  });
});

describe('취득세 — 84A 최고가 세대', () => {
  const type84A = AB23.types.find((t) => t.code === '84A')!;

  test('전용 84.5181㎡는 85㎡ 이하라 농어촌특별세가 붙지 않는다', () => {
    const tax = calculateAcquisitionTax({
      taxableAmount: 662_700_000,
      exclusiveAreaSqm: type84A.exclusiveAreaSqm,
    });

    expect(type84A.exclusiveAreaSqm).toBeLessThan(85);
    expect(tax.ruralSpecialTax).toBe(0);
  });

  test('6억 초과 9억 이하 누진식으로 1.418%가 적용된다', () => {
    const tax = calculateAcquisitionTax({
      taxableAmount: 662_700_000,
      exclusiveAreaSqm: type84A.exclusiveAreaSqm,
    });

    expect(tax.rate).toBe(0.01418);
    expect(tax.acquisitionTax).toBe(9_397_086);
    expect(tax.localEducationTax).toBe(939_709);
    expect(tax.total).toBe(10_336_795);
  });

  test('옵션을 과세표준에 넣으면 세율 구간이 올라가 세액이 늘어난다', () => {
    const withoutOptions = calculateAcquisitionTax({
      taxableAmount: 662_700_000,
      exclusiveAreaSqm: type84A.exclusiveAreaSqm,
    });
    const withOptions = calculateAcquisitionTax({
      taxableAmount: 662_700_000 + 14_458_000,
      exclusiveAreaSqm: type84A.exclusiveAreaSqm,
    });

    expect(withOptions.rate).toBeGreaterThan(withoutOptions.rate);
    expect(withOptions.total).toBeGreaterThan(withoutOptions.total);
  });
});
