import { describe, expect, test } from 'vitest';
import { estimateMoveInCosts } from '../src/lib/calc/moveInCosts';

/**
 * 입주 부대비용은 공고문에 없는 시장 추정값이다.
 * 그래서 단일 금액이 아니라 반드시 구간(min~max)으로만 다룬다.
 * 여기서 검증하는 것은 "얼마인가"가 아니라 "추정이 구간으로, 면적·수준에 맞게 커지는가"다.
 */
describe('estimateMoveInCosts', () => {
  test('모든 항목을 단일 금액이 아닌 구간으로 돌려준다', () => {
    const result = estimateMoveInCosts({ exclusiveAreaSqm: 84.98, level: 'standard' });

    for (const item of [result.interior, result.cleaning, result.moving, result.appliances]) {
      expect(item.max).toBeGreaterThan(item.min);
    }
  });

  test('전용면적이 넓을수록 면적 비례 항목이 커진다', () => {
    const small = estimateMoveInCosts({ exclusiveAreaSqm: 59.97, level: 'standard' });
    const large = estimateMoveInCosts({ exclusiveAreaSqm: 84.98, level: 'standard' });

    expect(large.interior.min).toBeGreaterThan(small.interior.min);
    expect(large.cleaning.min).toBeGreaterThan(small.cleaning.min);
    expect(large.moving.min).toBeGreaterThan(small.moving.min);
  });

  test('시공 수준을 올리면 인테리어 추정이 커진다', () => {
    const area = 84.98;
    const minimal = estimateMoveInCosts({ exclusiveAreaSqm: area, level: 'minimal' });
    const standard = estimateMoveInCosts({ exclusiveAreaSqm: area, level: 'standard' });
    const premium = estimateMoveInCosts({ exclusiveAreaSqm: area, level: 'premium' });

    expect(standard.interior.min).toBeGreaterThan(minimal.interior.min);
    expect(premium.interior.min).toBeGreaterThan(standard.interior.min);
  });

  test('가전은 면적이 아니라 시공 수준에만 반응한다', () => {
    const small = estimateMoveInCosts({ exclusiveAreaSqm: 59.97, level: 'standard' });
    const large = estimateMoveInCosts({ exclusiveAreaSqm: 84.98, level: 'standard' });

    expect(large.appliances).toEqual(small.appliances);
  });

  test('가전을 유상옵션으로 이미 계약했으면 중복 계상하지 않는다', () => {
    const result = estimateMoveInCosts({
      exclusiveAreaSqm: 84.98,
      level: 'standard',
      includeAppliances: false,
    });

    expect(result.appliances).toEqual({ min: 0, max: 0 });
  });

  test('합계 구간은 항목별 구간의 합이다', () => {
    const r = estimateMoveInCosts({ exclusiveAreaSqm: 84.98, level: 'standard' });

    expect(r.total.min).toBe(
      r.interior.min + r.cleaning.min + r.moving.min + r.appliances.min,
    );
    expect(r.total.max).toBe(
      r.interior.max + r.cleaning.max + r.moving.max + r.appliances.max,
    );
  });
});
