import { describe, expect, test } from 'vitest';
import {
  BASE_PRICE_ROWS,
  LINE_ASSIGNMENTS,
  PRICE_OVERRIDES,
} from '../src/data/prices/officialSupplyPrices';
import { resolveOfficialPrice } from '../src/lib/priceResolver';

type Expected =
  | { kind: 'exact'; amountWon: number }
  | { kind: 'range'; minWon: number; maxWon: number }
  | { kind: 'unavailable' };

const cases: Array<{
  name: string;
  input: Parameters<typeof resolveOfficialPrice>[0];
  expected: Expected;
}> = [
  { name: 'AB22 6201동 1층 59A', input: { block: 'AB22', building: 6201, floor: 1, unitType: '59A' }, expected: { kind: 'exact', amountWon: 456_600_000 } },
  { name: 'AB22 6201동 21층 59A', input: { block: 'AB22', building: 6201, floor: 21, unitType: '59A' }, expected: { kind: 'exact', amountWon: 490_100_000 } },
  { name: 'AB22 6213동 15층 59A', input: { block: 'AB22', building: 6213, floor: 15, unitType: '59A' }, expected: { kind: 'exact', amountWon: 475_900_000 } },
  { name: 'AB22 6201동 7층 59B', input: { block: 'AB22', building: 6201, floor: 7, unitType: '59B' }, expected: { kind: 'exact', amountWon: 463_600_000 } },
  { name: 'AB22 6212동 20층 59B', input: { block: 'AB22', building: 6212, floor: 20, unitType: '59B' }, expected: { kind: 'exact', amountWon: 475_300_000 } },
  { name: 'AB22 6202동 1층 84A', input: { block: 'AB22', building: 6202, floor: 1, unitType: '84A' }, expected: { kind: 'exact', amountWon: 608_500_000 } },
  { name: 'AB22 6208동 29층 84A', input: { block: 'AB22', building: 6208, floor: 29, unitType: '84A' }, expected: { kind: 'exact', amountWon: 653_300_000 } },
  { name: 'AB22 6202동 5층 84B', input: { block: 'AB22', building: 6202, floor: 5, unitType: '84B' }, expected: { kind: 'exact', amountWon: 615_200_000 } },
  { name: 'AB22 6207동 16층 84B', input: { block: 'AB22', building: 6207, floor: 16, unitType: '84B' }, expected: { kind: 'exact', amountWon: 637_200_000 } },
  { name: 'AB22 6202동 2층 84C', input: { block: 'AB22', building: 6202, floor: 2, unitType: '84C' }, expected: { kind: 'exact', amountWon: 599_700_000 } },
  { name: 'AB22 6207동 21층 84C', input: { block: 'AB22', building: 6207, floor: 21, unitType: '84C' }, expected: { kind: 'exact', amountWon: 636_800_000 } },
  { name: 'AB22 동에 없는 타입', input: { block: 'AB22', building: 6202, floor: 3, unitType: '59A' }, expected: { kind: 'unavailable' } },
  { name: 'AB22 6208동에 없는 84C', input: { block: 'AB22', building: 6208, floor: 3, unitType: '84C' }, expected: { kind: 'unavailable' } },
  { name: 'AB22 84C 1층 없음', input: { block: 'AB22', building: 6202, floor: 1, unitType: '84C' }, expected: { kind: 'unavailable' } },
  { name: 'AB22 30층 없음', input: { block: 'AB22', building: 6201, floor: 30, unitType: '59A' }, expected: { kind: 'unavailable' } },
  { name: 'AB23 6301동 1층 59A', input: { block: 'AB23', building: 6301, floor: 1, unitType: '59A' }, expected: { kind: 'exact', amountWon: 457_700_000 } },
  { name: 'AB23 6313동 29층 59A', input: { block: 'AB23', building: 6313, floor: 29, unitType: '59A' }, expected: { kind: 'exact', amountWon: 495_200_000 } },
  { name: 'AB23 6309동 2층 59B', input: { block: 'AB23', building: 6309, floor: 2, unitType: '59B' }, expected: { kind: 'exact', amountWon: 456_800_000 } },
  { name: 'AB23 59B 1층 없음', input: { block: 'AB23', building: 6301, floor: 1, unitType: '59B' }, expected: { kind: 'unavailable' } },
  { name: 'AB23 6302동 1층 84A', input: { block: 'AB23', building: 6302, floor: 1, unitType: '84A' }, expected: { kind: 'exact', amountWon: 612_400_000 } },
  { name: 'AB23 6304동 1층 84A 범위', input: { block: 'AB23', building: 6304, floor: 1, unitType: '84A' }, expected: { kind: 'range', minWon: 581_000_000, maxWon: 612_400_000 } },
  { name: 'AB23 6304동 2층 84A 범위', input: { block: 'AB23', building: 6304, floor: 2, unitType: '84A' }, expected: { kind: 'range', minWon: 591_600_000, maxWon: 621_000_000 } },
  { name: 'AB23 6304동 3층 84A', input: { block: 'AB23', building: 6304, floor: 3, unitType: '84A' }, expected: { kind: 'exact', amountWon: 624_200_000 } },
  { name: 'AB23 6304동 1호 1층 84A', input: { block: 'AB23', building: 6304, line: 1, floor: 1, unitType: '84A' }, expected: { kind: 'exact', amountWon: 581_000_000 } },
  { name: 'AB23 6304동 3호 1층 84A', input: { block: 'AB23', building: 6304, line: 3, floor: 1, unitType: '84A' }, expected: { kind: 'exact', amountWon: 612_400_000 } },
  { name: 'AB23 6304동 1호 2층 84A', input: { block: 'AB23', building: 6304, line: 1, floor: 2, unitType: '84A' }, expected: { kind: 'exact', amountWon: 591_600_000 } },
  { name: 'AB23 6304동 3호 2층 84A', input: { block: 'AB23', building: 6304, line: 3, floor: 2, unitType: '84A' }, expected: { kind: 'exact', amountWon: 621_000_000 } },
  { name: 'AB23 6304동 2층 84B 특별가', input: { block: 'AB23', building: 6304, floor: 2, unitType: '84B' }, expected: { kind: 'exact', amountWon: 585_500_000 } },
  { name: 'AB23 6302동 2층 84B', input: { block: 'AB23', building: 6302, floor: 2, unitType: '84B' }, expected: { kind: 'exact', amountWon: 614_700_000 } },
  { name: 'AB23 6308동 29층 84B', input: { block: 'AB23', building: 6308, floor: 29, unitType: '84B' }, expected: { kind: 'exact', amountWon: 655_800_000 } },
  { name: 'AB23 6302동 1층 84C', input: { block: 'AB23', building: 6302, floor: 1, unitType: '84C' }, expected: { kind: 'exact', amountWon: 596_900_000 } },
  { name: 'AB23 6308동 16층 84C', input: { block: 'AB23', building: 6308, floor: 16, unitType: '84C' }, expected: { kind: 'exact', amountWon: 634_600_000 } },
  { name: 'AB23 동에 없는 84A', input: { block: 'AB23', building: 6301, floor: 10, unitType: '84A' }, expected: { kind: 'unavailable' } },
  { name: 'AB23 동에 없는 59A', input: { block: 'AB23', building: 6302, floor: 10, unitType: '59A' }, expected: { kind: 'unavailable' } },
  { name: 'AB23 0층 없음', input: { block: 'AB23', building: 6308, floor: 0, unitType: '84C' }, expected: { kind: 'unavailable' } },
];

describe('공식 공급가 데이터', () => {
  test('기본 78행과 특별 3행이 있다', () => {
    expect(BASE_PRICE_ROWS).toHaveLength(78);
    expect(PRICE_OVERRIDES).toHaveLength(3);
  });

  test('동·타입 라인 배정은 115개 라인이다', () => {
    expect(LINE_ASSIGNMENTS.reduce((sum, assignment) => sum + assignment.lines.length, 0)).toBe(115);
  });
});

describe('resolveOfficialPrice 감사 케이스', () => {
  test.each(cases)('$name', ({ input, expected }) => {
    const result = resolveOfficialPrice(input);
    expect(result).toMatchObject(expected);
  });
});
