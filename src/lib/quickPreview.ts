import type { UnitTypeCode } from '../data/presets/geomdan-lakepark';
import { formatKRW, formatRange } from './format';

type AmountRange = { min: number; max: number };

export type QuickPreviewInput = {
  building: number;
  floor: number;
  unitType: UnitTypeCode;
  officialPrice: AmountRange;
  planTotal: AmountRange;
  includedOptionAmount?: number;
};

export type QuickPreview = {
  selectionLabel: string;
  officialPriceLabel: string;
  planTotalLabel: string;
  includedCostLabel: string;
};

export const buildQuickPreview = (input: QuickPreviewInput): QuickPreview => ({
  selectionLabel: `${input.building}동 · ${input.floor}층 · ${input.unitType}`,
  officialPriceLabel: formatRange(input.officialPrice),
  planTotalLabel: formatRange(input.planTotal),
  includedCostLabel: input.includedOptionAmount === undefined
    ? '발코니 확장비 미반영 · 계약서에서 확인'
    : `발코니 확장비 ${formatKRW(input.includedOptionAmount)} 포함`,
});
