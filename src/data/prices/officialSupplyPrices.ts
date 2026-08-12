import type { UnitTypeCode } from '../presets/geomdan-lakepark';

export type PriceBlockId = 'AB22' | 'AB23';
export type FloorBand = '1' | '2' | '3-4' | '5-6' | '7-9' | '10-15' | '16-20' | '21-29';

export type BasePriceRow = {
  block: PriceBlockId;
  unitType: UnitTypeCode;
  floorBand: FloorBand;
  amountWon: number;
  sourcePage: 7 | 8;
};

export type PriceOverride = {
  block: PriceBlockId;
  building: number;
  unitType: UnitTypeCode;
  line: number;
  floor: number;
  amountWon: number;
  sourcePage: 8;
};

export type LineAssignment = {
  block: PriceBlockId;
  building: number;
  unitType: UnitTypeCode;
  lines: readonly number[];
};

export const FLOOR_BANDS: readonly FloorBand[] = [
  '1',
  '2',
  '3-4',
  '5-6',
  '7-9',
  '10-15',
  '16-20',
  '21-29',
];

const makeRows = (
  block: PriceBlockId,
  unitType: UnitTypeCode,
  amounts: readonly (number | null)[],
): BasePriceRow[] =>
  FLOOR_BANDS.flatMap((floorBand, index) => {
    const amountWon = amounts[index];
    return amountWon === null || amountWon === undefined
      ? []
      : [{ block, unitType, floorBand, amountWon, sourcePage: floorBand === '21-29' ? 8 : 7 }];
  });

export const BASE_PRICE_ROWS: readonly BasePriceRow[] = [
  ...makeRows('AB22', '59A', [456_600_000, 461_600_000, 464_000_000, 466_400_000, 471_100_000, 475_900_000, 483_000_000, 490_100_000]),
  ...makeRows('AB22', '59B', [449_300_000, 454_300_000, 456_600_000, 459_000_000, 463_600_000, 468_300_000, 475_300_000, 482_400_000]),
  ...makeRows('AB22', '84A', [608_500_000, 615_200_000, 618_400_000, 621_600_000, 627_900_000, 634_300_000, 643_800_000, 653_300_000]),
  ...makeRows('AB22', '84B', [602_300_000, 608_900_000, 612_000_000, 615_200_000, 621_500_000, 627_700_000, 637_200_000, 646_600_000]),
  ...makeRows('AB22', '84C', [null, 599_700_000, 602_800_000, 605_800_000, 612_000_000, 618_200_000, 627_500_000, 636_800_000]),
  ...makeRows('AB23', '59A', [457_700_000, 464_100_000, 466_500_000, 468_900_000, 473_700_000, 478_500_000, 486_600_000, 495_200_000]),
  ...makeRows('AB23', '59B', [null, 456_800_000, 459_100_000, 461_500_000, 466_200_000, 470_900_000, 478_900_000, 487_400_000]),
  ...makeRows('AB23', '84A', [612_400_000, 621_000_000, 624_200_000, 627_400_000, 633_800_000, 640_200_000, 651_100_000, 662_700_000]),
  ...makeRows('AB23', '84B', [606_100_000, 614_700_000, 617_800_000, 621_000_000, 627_300_000, 633_700_000, 644_400_000, 655_800_000]),
  ...makeRows('AB23', '84C', [596_900_000, 605_300_000, 608_400_000, 611_600_000, 617_800_000, 624_000_000, 634_600_000, 645_900_000]),
];

export const PRICE_OVERRIDES: readonly PriceOverride[] = [
  { block: 'AB23', building: 6304, unitType: '84A', line: 1, floor: 1, amountWon: 581_000_000, sourcePage: 8 },
  { block: 'AB23', building: 6304, unitType: '84A', line: 1, floor: 2, amountWon: 591_600_000, sourcePage: 8 },
  { block: 'AB23', building: 6304, unitType: '84B', line: 2, floor: 2, amountWon: 585_500_000, sourcePage: 8 },
];

const assignment = (
  block: PriceBlockId,
  building: number,
  unitType: UnitTypeCode,
  lines: readonly number[],
): LineAssignment => ({ block, building, unitType, lines });

export const LINE_ASSIGNMENTS: readonly LineAssignment[] = [
  assignment('AB22', 6201, '59A', [1, 3, 4]), assignment('AB22', 6208, '59A', [2]), assignment('AB22', 6209, '59A', [2, 4]), assignment('AB22', 6210, '59A', [2, 4]), assignment('AB22', 6211, '59A', [1, 3]), assignment('AB22', 6212, '59A', [2, 4]), assignment('AB22', 6213, '59A', [2, 4]),
  assignment('AB22', 6201, '59B', [2, 5]), assignment('AB22', 6208, '59B', [1]), assignment('AB22', 6209, '59B', [1, 3]), assignment('AB22', 6210, '59B', [1, 3]), assignment('AB22', 6211, '59B', [2, 4]), assignment('AB22', 6212, '59B', [1, 3]), assignment('AB22', 6213, '59B', [1, 3]),
  assignment('AB22', 6202, '84A', [2, 4]), assignment('AB22', 6203, '84A', [2, 4]), assignment('AB22', 6204, '84A', [2, 3, 5]), assignment('AB22', 6205, '84A', [2, 3, 5]), assignment('AB22', 6206, '84A', [2, 3, 5]), assignment('AB22', 6207, '84A', [2, 4]), assignment('AB22', 6208, '84A', [3, 5]),
  assignment('AB22', 6202, '84B', [3]), assignment('AB22', 6203, '84B', [3]), assignment('AB22', 6204, '84B', [4]), assignment('AB22', 6205, '84B', [4]), assignment('AB22', 6206, '84B', [4]), assignment('AB22', 6207, '84B', [3]), assignment('AB22', 6208, '84B', [4]),
  assignment('AB22', 6202, '84C', [1]), assignment('AB22', 6203, '84C', [1]), assignment('AB22', 6204, '84C', [1]), assignment('AB22', 6205, '84C', [1]), assignment('AB22', 6206, '84C', [1]), assignment('AB22', 6207, '84C', [1]),
  assignment('AB23', 6301, '59A', [1, 3, 4]), assignment('AB23', 6309, '59A', [2, 3, 5]), assignment('AB23', 6310, '59A', [2, 4]), assignment('AB23', 6311, '59A', [1, 3]), assignment('AB23', 6312, '59A', [1, 3]), assignment('AB23', 6313, '59A', [1, 3]),
  assignment('AB23', 6301, '59B', [2, 5]), assignment('AB23', 6309, '59B', [1, 4]), assignment('AB23', 6310, '59B', [1, 3]), assignment('AB23', 6311, '59B', [2, 4]), assignment('AB23', 6312, '59B', [2, 4]), assignment('AB23', 6313, '59B', [2, 4]),
  assignment('AB23', 6302, '84A', [1, 3, 4]), assignment('AB23', 6303, '84A', [1, 3]), assignment('AB23', 6304, '84A', [1, 3]), assignment('AB23', 6305, '84A', [2, 3, 5]), assignment('AB23', 6306, '84A', [2, 3, 5]), assignment('AB23', 6307, '84A', [2, 3, 5]), assignment('AB23', 6308, '84A', [2, 4]),
  assignment('AB23', 6302, '84B', [2]), assignment('AB23', 6303, '84B', [2]), assignment('AB23', 6304, '84B', [2]), assignment('AB23', 6305, '84B', [4]), assignment('AB23', 6306, '84B', [4]), assignment('AB23', 6307, '84B', [4]), assignment('AB23', 6308, '84B', [3]),
  assignment('AB23', 6302, '84C', [5]), assignment('AB23', 6303, '84C', [4]), assignment('AB23', 6304, '84C', [4]), assignment('AB23', 6305, '84C', [1]), assignment('AB23', 6306, '84C', [1]), assignment('AB23', 6307, '84C', [1]), assignment('AB23', 6308, '84C', [1]),
];

export const PRICE_SOURCE = {
  label: '입주자모집공고 공급금액 표',
  asOf: '2026-06-12',
  noticeNumbers: ['2026000194', '2026000195'],
  pages: [7, 8],
} as const;
