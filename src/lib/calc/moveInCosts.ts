import { MOVE_IN_COSTS, type MoveInLevel } from '../../data/rates';

export type CostRange = { min: number; max: number };

export type MoveInCostsInput = {
  exclusiveAreaSqm: number;
  level: MoveInLevel;
  /** 빌트인 가전을 유상옵션으로 이미 계약했다면 false. 기본값은 true. */
  includeAppliances?: boolean;
};

export type MoveInCostsResult = {
  interior: CostRange;
  cleaning: CostRange;
  moving: CostRange;
  appliances: CostRange;
  total: CostRange;
};

function perArea(rate: { min: number; max: number }, areaSqm: number): CostRange {
  return { min: Math.round(rate.min * areaSqm), max: Math.round(rate.max * areaSqm) };
}

/**
 * 입주 부대비용(인테리어·청소·이사·가전) 추정 구간.
 *
 * 공고문에 없는 시장 추정값이므로 절대 단일 금액으로 제시하지 않는다.
 * UI는 이 결과를 반드시 '추정' 배지와 함께, 분양대금과 분리해 표시해야 한다.
 */
export function estimateMoveInCosts(input: MoveInCostsInput): MoveInCostsResult {
  const { exclusiveAreaSqm, level } = input;

  const interior = perArea(MOVE_IN_COSTS.interiorPerSqm[level], exclusiveAreaSqm);
  const cleaning = perArea(MOVE_IN_COSTS.cleaningPerSqm, exclusiveAreaSqm);
  const moving = perArea(MOVE_IN_COSTS.movingPerSqm, exclusiveAreaSqm);
  const appliances =
    input.includeAppliances === false ? { min: 0, max: 0 } : { ...MOVE_IN_COSTS.appliances[level] };

  return {
    interior,
    cleaning,
    moving,
    appliances,
    total: {
      min: interior.min + cleaning.min + moving.min + appliances.min,
      max: interior.max + cleaning.max + moving.max + appliances.max,
    },
  };
}
