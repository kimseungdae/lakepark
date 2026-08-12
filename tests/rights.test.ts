import { describe, expect, test } from 'vitest';
import { getRightsClocks } from '../src/lib/rights';

describe('getRightsClocks', () => {
  test('블록별 재당첨 기준일을 구분한다', () => {
    expect(getRightsClocks('AB22').find((clock) => clock.id === 'reapply')?.startsAt).toBe('2026-07-02');
    expect(getRightsClocks('AB23').find((clock) => clock.id === 'reapply')?.startsAt).toBe('2026-07-03');
  });

  test('전매와 거주의무는 자동 확정일을 제공하지 않는다', () => {
    const clocks = getRightsClocks('AB23');
    expect(clocks.find((clock) => clock.id === 'resale')?.endsAt).toBeUndefined();
    expect(clocks.find((clock) => clock.id === 'residency')?.endsAt).toBeUndefined();
  });
});
