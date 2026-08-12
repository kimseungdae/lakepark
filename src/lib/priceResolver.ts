import type { UnitTypeCode } from '../data/presets/geomdan-lakepark';
import {
  BASE_PRICE_ROWS,
  LINE_ASSIGNMENTS,
  PRICE_OVERRIDES,
  type FloorBand,
  type PriceBlockId,
} from '../data/prices/officialSupplyPrices';

export type PriceInput = {
  block: PriceBlockId;
  building: number;
  floor: number;
  unitType: UnitTypeCode;
  line?: number;
};

export type PriceUnavailableReason =
  | 'invalid-building'
  | 'type-not-in-building'
  | 'floor-out-of-range'
  | 'invalid-line'
  | 'no-price-row';

export type PriceResolution =
  | {
      kind: 'exact';
      amountWon: number;
      floorBand: FloorBand;
      occupancy: 'confirmed' | 'needs-contract-check';
      candidateLines: readonly number[];
    }
  | {
      kind: 'range';
      minWon: number;
      maxWon: number;
      floorBand: FloorBand;
      candidateLines: readonly number[];
      reason: 'line-dependent';
    }
  | { kind: 'unavailable'; reason: PriceUnavailableReason };

export type BuildingOption = { block: PriceBlockId; building: number; label: string };

const toFloorBand = (floor: number): FloorBand | null => {
  if (!Number.isInteger(floor) || floor < 1 || floor > 29) return null;
  if (floor === 1) return '1';
  if (floor === 2) return '2';
  if (floor <= 4) return '3-4';
  if (floor <= 6) return '5-6';
  if (floor <= 9) return '7-9';
  if (floor <= 15) return '10-15';
  if (floor <= 20) return '16-20';
  return '21-29';
};

export const getBuildingOptions = (): readonly BuildingOption[] => {
  const keys = new Set(LINE_ASSIGNMENTS.map(({ block, building }) => `${block}:${building}`));
  return [...keys]
    .map((key) => {
      const [block, building] = key.split(':');
      return { block: block as PriceBlockId, building: Number(building), label: `${building}동` };
    })
    .sort((a, b) => a.building - b.building);
};

export const getUnitTypesForBuilding = (building: number): readonly UnitTypeCode[] =>
  LINE_ASSIGNMENTS.filter((item) => item.building === building).map((item) => item.unitType);

export const resolveOfficialPrice = (input: PriceInput): PriceResolution => {
  const expectedPrefix = input.block === 'AB22' ? 62 : 63;
  if (Math.floor(input.building / 100) !== expectedPrefix) {
    return { kind: 'unavailable', reason: 'invalid-building' };
  }

  const floorBand = toFloorBand(input.floor);
  if (!floorBand) return { kind: 'unavailable', reason: 'floor-out-of-range' };

  const assignment = LINE_ASSIGNMENTS.find(
    (item) =>
      item.block === input.block &&
      item.building === input.building &&
      item.unitType === input.unitType,
  );
  if (!assignment) return { kind: 'unavailable', reason: 'type-not-in-building' };

  if (input.line !== undefined && !assignment.lines.includes(input.line)) {
    return { kind: 'unavailable', reason: 'invalid-line' };
  }

  const base = BASE_PRICE_ROWS.find(
    (row) =>
      row.block === input.block &&
      row.unitType === input.unitType &&
      row.floorBand === floorBand,
  );
  if (!base) return { kind: 'unavailable', reason: 'no-price-row' };

  const candidateLines = input.line === undefined ? assignment.lines : [input.line];
  const amounts = candidateLines.map((line) => {
    const override = PRICE_OVERRIDES.find(
      (row) =>
        row.block === input.block &&
        row.building === input.building &&
        row.unitType === input.unitType &&
        row.line === line &&
        row.floor === input.floor,
    );
    return override?.amountWon ?? base.amountWon;
  });
  const uniqueAmounts = [...new Set(amounts)].sort((a, b) => a - b);

  if (uniqueAmounts.length > 1) {
    return {
      kind: 'range',
      minWon: uniqueAmounts[0]!,
      maxWon: uniqueAmounts.at(-1)!,
      floorBand,
      candidateLines,
      reason: 'line-dependent',
    };
  }

  return {
    kind: 'exact',
    amountWon: uniqueAmounts[0]!,
    floorBand,
    occupancy: input.floor <= 2 || input.floor >= 21 ? 'needs-contract-check' : 'confirmed',
    candidateLines,
  };
};
