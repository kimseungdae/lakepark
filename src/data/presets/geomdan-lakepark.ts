import type { RateSource } from '../rates';

/**
 * 더샵 검단레이크파크 AB22BL·AB23BL 프리셋.
 *
 * 모든 금액은 2026-06-12 입주자모집공고(AB22 2026000194 / AB23 2026000195) 기준이다.
 * 이 파일에는 공개 자료만 넣는다 — 개인 계약 세대의 동·호·계약금액은 절대 기록하지 않는다.
 *
 * 계산기는 이 프리셋을 "출발점"으로만 쓴다. 실제 금액은 개인 공급계약서가 우선이며
 * UI가 그 사실을 명시해야 한다.
 */

export type UnitTypeCode = '59A' | '59B' | '84A' | '84B' | '84C';

export type UnitType = {
  code: UnitTypeCode;
  /** 전용면적(㎡). 두 블록이 동일하다. */
  exclusiveAreaSqm: number;
  /** 공급면적(㎡). 블록마다 주거공용이 달라 미세하게 다르다. */
  supplyAreaSqm: number;
  /** 공고상 층·라인별 공급금액 범위 */
  supplyPrice: { min: number; max: number };
  /**
   * 다수 라인에서 실제로 선택 가능했던 일반 최저가.
   * 공고 최저가가 특정 동·라인 소수 세대에만 적용되는 경우가 있어 별도로 둔다.
   * 이 값이 없으면 supplyPrice.min이 곧 대표 최저가다.
   */
  typicalMinPrice?: number;
  units?: number;
  /** 발코니 확장비 (일괄확장, 실별 선택 불가) */
  balconyExpansion?: number;
};

export type OptionItem = {
  label: string;
  /** 적용 가능한 타입. 비우면 전 타입. */
  appliesTo?: UnitTypeCode[];
  amount: number;
  note?: string;
};

/** 공고문에 명시된 납부 구조. 두 블록이 동일하다. */
export const PAYMENT_STRUCTURE = {
  downPayment: {
    totalRatio: 0.1,
    /** 계약 시 정액으로 내는 1차 계약금 */
    firstInstallmentAmount: 10_000_000,
    /** 2차 계약금 납부 기한 (계약일로부터) */
    secondInstallmentOffsetDays: 30,
  },
  interim: {
    ratioEach: 0.1,
    /** 공고문에 명시된 중도금 6개 회차 납부일 */
    dates: [
      '2026-12-15',
      '2027-06-15',
      '2027-12-15',
      '2028-08-14',
      '2029-01-15',
      '2029-06-15',
    ],
  },
  balanceRatio: 0.3,
  /** 유상옵션은 분양대금과 별도로 계약 시 10%, 입주지정일 90% */
  optionDownPaymentRatio: 0.1,
} as const;

/**
 * 입주지정일 (예정).
 *
 * ⚠️ estimated — 언론 보도 기준 2029년 12월 입주 예정이며, 실제 입주지정일은
 * 추후 입주안내문으로 확정된다. 잔금·취득세·이사 시점이 모두 여기에 걸리므로
 * UI는 이 값이 확정이 아님을 반드시 표시해야 한다.
 */
export const EXPECTED_MOVE_IN_DATE = '2029-12-01';

const AB23_TYPES: UnitType[] = [
  {
    code: '59A',
    exclusiveAreaSqm: 59.9497,
    supplyAreaSqm: 80.7322,
    supplyPrice: { min: 457_700_000, max: 495_200_000 },
    units: 353,
    balconyExpansion: 4_346_000,
  },
  {
    code: '59B',
    exclusiveAreaSqm: 59.8301,
    supplyAreaSqm: 81.0713,
    supplyPrice: { min: 456_800_000, max: 487_400_000 },
    units: 304,
    balconyExpansion: 4_116_000,
  },
  {
    code: '84A',
    exclusiveAreaSqm: 84.5181,
    supplyAreaSqm: 111.6738,
    supplyPrice: { min: 581_000_000, max: 662_700_000 },
    // 581,000,000은 특정 동·라인 1세대 가격이라 대표 최저가로 쓰면 오해가 생긴다.
    typicalMinPrice: 612_400_000,
    units: 428,
    balconyExpansion: 5_458_000,
  },
  {
    code: '84B',
    exclusiveAreaSqm: 84.0342,
    supplyAreaSqm: 112.2083,
    supplyPrice: { min: 585_500_000, max: 655_800_000 },
    typicalMinPrice: 606_100_000,
    units: 159,
    balconyExpansion: 3_670_000,
  },
  {
    code: '84C',
    exclusiveAreaSqm: 84.1796,
    supplyAreaSqm: 111.0682,
    supplyPrice: { min: 596_900_000, max: 645_900_000 },
    units: 159,
    balconyExpansion: 4_920_000,
  },
];

const AB22_TYPES: UnitType[] = [
  {
    code: '59A',
    exclusiveAreaSqm: 59.9497,
    supplyAreaSqm: 80.756,
    supplyPrice: { min: 456_600_000, max: 490_100_000 },
  },
  {
    code: '59B',
    exclusiveAreaSqm: 59.8301,
    supplyAreaSqm: 81.095,
    supplyPrice: { min: 449_300_000, max: 482_400_000 },
  },
  {
    code: '84A',
    exclusiveAreaSqm: 84.5181,
    supplyAreaSqm: 111.7074,
    supplyPrice: { min: 608_500_000, max: 653_300_000 },
  },
  {
    code: '84B',
    exclusiveAreaSqm: 84.0342,
    supplyAreaSqm: 112.2416,
    supplyPrice: { min: 602_300_000, max: 646_600_000 },
  },
  {
    code: '84C',
    exclusiveAreaSqm: 84.1796,
    supplyAreaSqm: 111.1017,
    supplyPrice: { min: 599_700_000, max: 636_800_000 },
  },
];

/** AB23BL 주요 유상옵션. 발코니 확장은 타입별로 UnitType에 들어 있다. */
export const AB23_OPTIONS: OptionItem[] = [
  { label: '시스템에어컨 기본 2대', appliesTo: ['59A', '59B'], amount: 4_300_000 },
  { label: '시스템에어컨 전실 4대', appliesTo: ['59A', '59B'], amount: 7_400_000 },
  { label: '시스템에어컨 기본 3대', appliesTo: ['84A', '84B', '84C'], amount: 6_500_000 },
  { label: '시스템에어컨 전실 5대', appliesTo: ['84A', '84B', '84C'], amount: 9_000_000 },
  { label: '에코세이버 제습청정환기 스탠다드형', amount: 3_140_000 },
  { label: '현관중문', amount: 1_600_000 },
  { label: '스마트홈 앤 시큐리티', amount: 810_000 },
  {
    label: '더샵 루미나 2.0 조명',
    appliesTo: ['84A', '84B', '84C'],
    amount: 4_110_000,
  },
  { label: '더샵 루미나 2.0 조명', appliesTo: ['59A', '59B'], amount: 3_590_000 },
  {
    label: '안방 붙박이장',
    appliesTo: ['84A', '84B', '84C'],
    amount: 2_350_000,
  },
  {
    label: '스타일링바스',
    appliesTo: ['84A', '84B', '84C'],
    amount: 7_830_000,
  },
  { label: '프리미엄바스', appliesTo: ['59A', '59B'], amount: 6_360_000 },
];

/**
 * AB22BL 유상옵션 가격표는 아직 정리되지 않았다(공고 2026000194 확인 필요).
 * 빈 배열이어도 타입은 명시해 둔다 — as const 안에서 readonly []로 좁혀지면
 * 소비 측 filter/map 타입이 깨진다.
 */
export const AB22_OPTIONS: OptionItem[] = [];

export const GEOMDAN_LAKEPARK = {
  id: 'geomdan-lakepark',
  /**
   * 표시용 단지명. 도메인·사이트명에는 절대 쓰지 않는다(상표 리스크).
   * 데이터 값으로서의 지명적 사용만 허용한다.
   */
  displayName: '더샵 검단레이크파크',
  disclaimer:
    '본 계산기는 개인이 운영하는 비공식 도구이며 시공사·시행사와 무관합니다. 실제 금액은 공급계약서와 입주자모집공고가 우선합니다.',
  totalUnits: 2857,
  expectedMoveInDate: EXPECTED_MOVE_IN_DATE,
  blocks: {
    AB23: { name: 'AB23BL (마전동)', units: 1403, types: AB23_TYPES, options: AB23_OPTIONS },
    AB22: { name: 'AB22BL (불로동)', units: 1454, types: AB22_TYPES, options: AB22_OPTIONS },
  },
  source: {
    asOf: '2026-08-11',
    label: '입주자모집공고 2026000194(AB22)·2026000195(AB23), 2026-06-12',
    url: 'https://www.applyhome.co.kr',
    confidence: 'confirmed',
  } satisfies RateSource,
} as const;
