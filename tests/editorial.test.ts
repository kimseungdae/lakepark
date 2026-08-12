import { describe, expect, test } from 'vitest';
import { STATUS_BOARD } from '../src/data/status/board';
import { toEditorialUpdate } from '../src/lib/editorial';

describe('toEditorialUpdate', () => {
  test('운영 중인 철도와 추진 중인 사업을 구분한다', () => {
    expect(toEditorialUpdate(STATUS_BOARD.find((item) => item.id === 'incheon-line1-geomdan')!).status).toBe('operating');
    expect(toEditorialUpdate(STATUS_BOARD.find((item) => item.id === 'seoul-line5-extension')!).status).toBe('inProgress');
  });

  test('다음 확인과 원문을 보존한다', () => {
    const update = toEditorialUpdate(STATUS_BOARD[0]!);
    expect(update.nextCheck.length).toBeGreaterThan(0);
    expect(update.sources.length).toBeGreaterThan(0);
  });
});
