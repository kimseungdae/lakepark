import { describe, expect, test } from 'vitest';
import { BUILDING_IMPACTS } from '../src/data/complex/buildingImpacts';
import { UNIT_GUIDE } from '../src/data/complex/unitGuide';
import { GEOMDAN_LAKEPARK, type UnitTypeCode } from '../src/data/presets/geomdan-lakepark';

const ALL_CODES: UnitTypeCode[] = ['59A', '59B', '84A', '84B', '84C'];

describe('UNIT_GUIDE 데이터 무결성', () => {
  test('다섯 타입 전부를 다룬다', () => {
    for (const code of ALL_CODES) {
      expect(UNIT_GUIDE[code], `${code} 항목 누락`).toBeDefined();
      expect(UNIT_GUIDE[code].code).toBe(code);
    }
  });

  test('확인된 특징과 해석이 비어 있지 않고 출처가 있다', () => {
    for (const code of ALL_CODES) {
      const entry = UNIT_GUIDE[code];
      expect(entry.confirmed.length, `${code} confirmed`).toBeGreaterThan(0);
      expect(entry.interpretation.length, `${code} interpretation`).toBeGreaterThan(0);
      expect(entry.source.label.length, `${code} source`).toBeGreaterThan(0);
    }
  });

  test('가이드의 모든 타입이 두 블록 프리셋에 존재한다', () => {
    for (const code of ALL_CODES) {
      expect(
        GEOMDAN_LAKEPARK.blocks.AB22.types.some((t) => t.code === code),
        `AB22에 ${code} 없음`,
      ).toBe(true);
      expect(
        GEOMDAN_LAKEPARK.blocks.AB23.types.some((t) => t.code === code),
        `AB23에 ${code} 없음`,
      ).toBe(true);
    }
  });
});

describe('BUILDING_IMPACTS 데이터 무결성', () => {
  test('동 번호가 블록 접두와 일치한다 (AB22=62xx, AB23=63xx)', () => {
    for (const impact of BUILDING_IMPACTS) {
      const prefix = impact.block === 'AB22' ? '62' : '63';
      for (const building of impact.buildings) {
        expect(building, `${impact.block} ${building}`).toMatch(new RegExp(`^${prefix}\\d{2}$`));
      }
    }
  });

  test('두 블록 모두 항목이 있고 설명이 비어 있지 않다', () => {
    const blocks = new Set(BUILDING_IMPACTS.map((i) => i.block));
    expect(blocks.has('AB22')).toBe(true);
    expect(blocks.has('AB23')).toBe(true);

    for (const impact of BUILDING_IMPACTS) {
      expect(impact.description.length).toBeGreaterThan(0);
    }
  });

  test('동 번호가 없으면 위치 설명이라도 있어야 한다', () => {
    for (const impact of BUILDING_IMPACTS) {
      if (impact.buildings.length === 0) {
        expect(impact.location, `${impact.block} ${impact.kind}`).toBeTruthy();
      }
    }
  });
});
