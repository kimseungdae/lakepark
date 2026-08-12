import { describe, expect, test } from 'vitest';
import { formatKRW, formatRange } from '../src/lib/format';

describe('formatKRW', () => {
  test('억·만·원 단위를 조합해 읽기 쉽게 만든다', () => {
    expect(formatKRW(662_700_000)).toBe('6억 6,270만원');
  });

  test('억 단위가 없으면 만원부터 표기한다', () => {
    expect(formatKRW(56_270_000)).toBe('5,627만원');
  });

  test('만원 미만 잔액이 있으면 원 단위까지 붙인다', () => {
    expect(formatKRW(1_445_800)).toBe('144만 5,800원');
    expect(formatKRW(11_280_369)).toBe('1,128만 369원');
  });

  test('만원 단위가 0이어도 억과 원을 건너뛰지 않는다', () => {
    expect(formatKRW(100_000_000)).toBe('1억원');
    expect(formatKRW(100_000_500)).toBe('1억 500원');
  });

  test('0원은 0원으로 표기한다', () => {
    expect(formatKRW(0)).toBe('0원');
  });

  test('만원 미만 금액도 원 단위로 표기한다', () => {
    expect(formatKRW(8_500)).toBe('8,500원');
  });
});

describe('formatRange', () => {
  test('구간은 물결로 잇는다', () => {
    expect(formatRange({ min: 10_000_000, max: 20_000_000 })).toBe('1,000만원 ~ 2,000만원');
  });

  test('상하한이 같으면 한 번만 표기한다', () => {
    expect(formatRange({ min: 0, max: 0 })).toBe('0원');
  });
});
