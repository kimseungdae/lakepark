import { describe, expect, test } from 'vitest';
import { parseProfile, parseProfileV2 } from '../src/lib/profile';

describe('parseProfile', () => {
  test('정상 프로필은 그대로 복원된다', () => {
    const raw = JSON.stringify({
      v: 1,
      block: 'AB23',
      type: '84A',
      supplyPrice: 662_700_000,
      contractDate: '2026-07-20',
      savedAt: '2026-08-12',
    });

    expect(parseProfile(raw)).toEqual({
      v: 1,
      block: 'AB23',
      type: '84A',
      supplyPrice: 662_700_000,
      contractDate: '2026-07-20',
      savedAt: '2026-08-12',
    });
  });

  test('선택 필드가 없어도 필수 필드만으로 복원된다', () => {
    const profile = parseProfile(JSON.stringify({ v: 1, block: 'AB22', type: '59B' }));
    expect(profile?.block).toBe('AB22');
    expect(profile?.type).toBe('59B');
    expect(profile?.supplyPrice).toBeUndefined();
  });

  test('null·빈 문자열·손상 JSON은 null', () => {
    expect(parseProfile(null)).toBeNull();
    expect(parseProfile('')).toBeNull();
    expect(parseProfile('{not json')).toBeNull();
    expect(parseProfile('"문자열"')).toBeNull();
  });

  test('미지원 버전은 null', () => {
    expect(parseProfile(JSON.stringify({ v: 2, block: 'AB23', type: '84A' }))).toBeNull();
    expect(parseProfile(JSON.stringify({ block: 'AB23', type: '84A' }))).toBeNull();
  });

  test('프리셋에 없는 블록·타입은 null', () => {
    expect(parseProfile(JSON.stringify({ v: 1, block: 'AB99', type: '84A' }))).toBeNull();
    expect(parseProfile(JSON.stringify({ v: 1, block: 'AB23', type: '99Z' }))).toBeNull();
  });

  test('형식이 틀린 선택 필드는 버리고 필수 필드는 살린다', () => {
    const profile = parseProfile(
      JSON.stringify({
        v: 1,
        block: 'AB23',
        type: '84A',
        supplyPrice: -1,
        contractDate: '07/20/2026',
        savedAt: 12345,
      }),
    );
    expect(profile?.type).toBe('84A');
    expect(profile?.supplyPrice).toBeUndefined();
    expect(profile?.contractDate).toBeUndefined();
    expect(profile?.savedAt).toBe('');
  });
});

describe('parseProfileV2', () => {
  test('동·층·타입과 계산 가정을 복원한다', () => {
    const profile = parseProfileV2(JSON.stringify({
      v: 2,
      block: 'AB23',
      building: '6304',
      floor: 2,
      unitType: '84A',
      contractDate: '2026-07-20',
      loanRatio: 0.6,
      loanRate: 0.045,
      savedAt: '2026-08-13',
    }));

    expect(profile).toMatchObject({
      v: 2,
      block: 'AB23',
      building: '6304',
      floor: 2,
      unitType: '84A',
      loanRatio: 0.6,
      loanRate: 0.045,
    });
  });

  test('v1 프로필은 v2로 안전하게 옮긴다', () => {
    const profile = parseProfileV2(JSON.stringify({
      v: 1,
      block: 'AB22',
      type: '59B',
      contractDate: '2026-07-20',
      savedAt: '2026-08-12',
    }));

    expect(profile).toEqual({
      v: 2,
      block: 'AB22',
      unitType: '59B',
      contractDate: '2026-07-20',
      savedAt: '2026-08-12',
    });
  });

  test('유효하지 않은 동·층·비율은 저장하지 않는다', () => {
    const profile = parseProfileV2(JSON.stringify({
      v: 2,
      block: 'AB23',
      building: '9999',
      floor: 0,
      unitType: '84A',
      loanRatio: 2,
      loanRate: -1,
    }));

    expect(profile).toEqual({
      v: 2,
      block: 'AB23',
      unitType: '84A',
      savedAt: '',
    });
  });
});
