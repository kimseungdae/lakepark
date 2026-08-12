/**
 * 세율·요율 단일 격리 파일.
 *
 * 설계 원칙: 정책 변동으로 낡을 수 있는 모든 숫자는 이 파일에만 존재한다.
 * 계산 로직(src/lib/calc/*)에 숫자를 하드코딩하지 않는다.
 * 모든 값에는 기준일(asOf)과 출처(sourceUrl), 신뢰도(confidence)를 함께 붙이고,
 * 화면에도 그대로 노출해 사용자가 최신 여부를 직접 판단할 수 있게 한다.
 */

/** 값의 출처와 신뢰 수준. UI의 출처 배지가 이 값을 그대로 읽는다. */
export type RateSource = {
  /** 이 값을 확인한 기준일 (YYYY-MM-DD) */
  asOf: string;
  /** 화면에 표시할 출처 이름 */
  label: string;
  /** 근거 문서 URL */
  url: string;
  /**
   * confirmed — 법령·공고문에 명시된 확정값
   * estimated — 시장 조사에 근거한 추정값 (오차 있음을 UI가 명시해야 함)
   */
  confidence: 'confirmed' | 'estimated';
};

/**
 * 주택 유상거래 취득세 (지방세법 제11조 제1항 제8호).
 *
 * 주의: 아래는 1세대 1주택 기준 표준세율이다.
 * 다주택자·법인 중과세율(8%·12%)은 이 계산기의 범위 밖이며, UI가 이를 경고해야 한다.
 */
export const ACQUISITION_TAX = {
  /** 이 금액 이하는 단일세율 1% */
  lowerBracketLimit: 600_000_000,
  lowerBracketRate: 0.01,

  /** 이 금액 초과는 단일세율 3% */
  upperBracketLimit: 900_000_000,
  upperBracketRate: 0.03,

  /**
   * 6억 초과 9억 이하 구간 누진식: 세율(%) = (취득가액 × multiplier / divisor) − offset
   * 법령상 소수점 다섯째 자리에서 반올림하여 넷째 자리까지 계산한다.
   */
  middleBracket: {
    multiplier: 2,
    divisor: 300_000_000,
    offset: 3,
    /** 백분율 기준 반올림 자릿수 */
    percentDecimals: 4,
  },

  /** 지방교육세 = 취득세율 × 이 배수 (지방세법 제151조) */
  localEducationTaxRatio: 0.1,

  /** 농어촌특별세율 (전용면적 기준 초과분에만 과세) */
  ruralSpecialTaxRate: 0.002,
  /** 전용면적이 이 값 이하이면 농어촌특별세 비과세 (국민주택 규모) */
  ruralSpecialTaxExemptAreaSqm: 85,

  source: {
    asOf: '2026-08-10',
    label: '지방세법 제11조·제151조',
    url: 'https://www.law.go.kr/법령/지방세법',
    confidence: 'confirmed',
  } satisfies RateSource,
} as const;

/** 인테리어 시공 수준. UI 라디오 선택지와 1:1로 대응한다. */
export type MoveInLevel = 'minimal' | 'standard' | 'premium';

/**
 * 입주 부대비용 추정 단가.
 *
 * ⚠️ 전부 estimated다. 모집공고에 없는 시장 추정값이며 업체·시기·자재에 따라 크게 흔들린다.
 * 화면에서 반드시 '추정' 배지를 달고, 분양대금(확정)과 시각적으로 분리해 표시해야 한다.
 * 단가는 전용면적(㎡) 기준이다.
 */
export const MOVE_IN_COSTS = {
  /** 인테리어 — 도배·조명·중문·줄눈·탄성코트 등 입주 전 시공 */
  interiorPerSqm: {
    /** 도배·조명 등 최소 시공 */
    minimal: { min: 40_000, max: 80_000 },
    /** 중문·줄눈·탄성코트까지 포함한 일반적인 입주 시공 */
    standard: { min: 100_000, max: 215_000 },
    /** 주방·욕실 등 부분 리모델링 포함 */
    premium: { min: 240_000, max: 480_000 },
  },

  /** 입주청소 (새집증후군 시공 별도) */
  cleaningPerSqm: { min: 5_000, max: 8_000 },

  /** 포장이사 */
  movingPerSqm: { min: 12_000, max: 22_000 },

  /**
   * 가전. 면적이 아니라 구매 수준에 따라 결정되므로 정액 구간으로 둔다.
   * 빌트인 가전을 유상옵션으로 계약했다면 중복 계상하지 않도록 UI가 제외 선택지를 제공해야 한다.
   */
  appliances: {
    minimal: { min: 3_000_000, max: 6_000_000 },
    standard: { min: 7_000_000, max: 15_000_000 },
    premium: { min: 18_000_000, max: 35_000_000 },
  },

  source: {
    asOf: '2026-08-11',
    label: '운영자 시장 조사 (업체 견적 공개자료 기반 추정)',
    url: '',
    confidence: 'estimated',
  } satisfies RateSource,
} as const;

/**
 * 소유권이전등기 부대비용 추정.
 * 법무사 수수료·채권 매입할인·인지세를 합한 대략치이며 개인·법무사에 따라 달라진다.
 */
export const ANCILLARY_COSTS = {
  registrationFeeDefault: 2_000_000,

  source: {
    asOf: '2026-08-11',
    label: '운영자 시장 조사 (법무사 수수료 공개자료 기반 추정)',
    url: '',
    confidence: 'estimated',
  } satisfies RateSource,
} as const;

/** 중도금 대출 이자 계산 관례. */
export const INTERIM_LOAN = {
  /** 일할 계산 분모. 국내 시중은행 여신 관행은 365일 기준이다. */
  daysPerYear: 365,

  source: {
    asOf: '2026-08-10',
    label: '시중은행 여신거래기본약관 일할계산 관행',
    url: 'https://www.kfb.or.kr',
    confidence: 'estimated',
  } satisfies RateSource,
} as const;
