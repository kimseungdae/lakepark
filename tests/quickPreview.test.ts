import { describe, expect, test } from 'vitest';
import { buildQuickPreview } from '../src/lib/quickPreview';

describe('buildQuickPreview', () => {
  test('세 번째 선택 직후 보여줄 핵심 금액을 만든다', () => {
    expect(buildQuickPreview({
      building: 6304,
      floor: 10,
      unitType: '84A',
      officialPrice: { min: 640_200_000, max: 640_200_000 },
      planTotal: { min: 702_714_493, max: 721_532_810 },
      includedOptionAmount: 5_458_000,
    })).toEqual({
      selectionLabel: '6304동 · 10층 · 84A',
      officialPriceLabel: '6억 4,020만원',
      planTotalLabel: '7억 271만 4,493원 ~ 7억 2,153만 2,810원',
      includedCostLabel: '발코니 확장비 545만 8,000원 포함',
    });
  });
});
