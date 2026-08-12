import { describe, expect, test } from 'vitest';
import { STATUS_BOARD } from '../src/data/status/board';
import { isStale, recentChanges } from '../src/lib/status';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 상태판 데이터 무결성 — golden.test.ts처럼 데이터 자체를 검증한다.
 * 잘못된 날짜·중복 id·근거 없는 "확정"이 화면에 나가는 것을 빌드 전에 막는다.
 */
describe('STATUS_BOARD 데이터 무결성', () => {
  test('id는 유일하다', () => {
    const ids = STATUS_BOARD.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('모든 날짜가 YYYY-MM-DD 형식이다', () => {
    for (const item of STATUS_BOARD) {
      expect(item.lastChecked, `${item.id}.lastChecked`).toMatch(DATE_RE);
      for (const change of item.history) {
        expect(change.date, `${item.id} history`).toMatch(DATE_RE);
      }
      for (const source of item.sources) {
        expect(source.asOf, `${item.id} source.asOf`).toMatch(DATE_RE);
      }
    }
  });

  test('변경 이력은 최신순으로 정렬돼 있다', () => {
    for (const item of STATUS_BOARD) {
      const dates = item.history.map((h) => h.date);
      const sorted = [...dates].sort((a, b) => b.localeCompare(a));
      expect(dates, `${item.id} history 순서`).toEqual(sorted);
    }
  });

  test('모든 항목에 요약·출처·이력이 있다', () => {
    for (const item of STATUS_BOARD) {
      expect(item.summary.length, `${item.id} summary`).toBeGreaterThan(0);
      expect(item.sources.length, `${item.id} sources`).toBeGreaterThan(0);
      expect(item.history.length, `${item.id} history`).toBeGreaterThan(0);
    }
  });

  test('"확정" 항목은 A/B급 근거를 최소 1개 가진다', () => {
    for (const item of STATUS_BOARD.filter((i) => i.stage === '확정')) {
      const hasStrongEvidence = item.sources.some((s) => s.grade === 'A' || s.grade === 'B');
      expect(hasStrongEvidence, `${item.id}는 확정인데 A/B급 근거가 없다`).toBe(true);
    }
  });

  test('마지막 확인일은 가장 최근 이력보다 빠르지 않다', () => {
    for (const item of STATUS_BOARD) {
      const latest = item.history[0]?.date;
      if (latest) {
        expect(
          item.lastChecked >= latest,
          `${item.id}: lastChecked(${item.lastChecked}) < 최근 이력(${latest})`,
        ).toBe(true);
      }
    }
  });
});

describe('recentChanges', () => {
  test('기간 내 변경만 최신순으로 모은다', () => {
    const changes = recentChanges(STATUS_BOARD, 90, '2026-08-12');
    expect(changes.length).toBeGreaterThan(0);

    const dates = changes.map((c) => c.change.date);
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)));
    for (const c of changes) {
      expect(c.change.date >= '2026-05-14' && c.change.date <= '2026-08-12').toBe(true);
    }
  });

  test('기간 밖·미래 날짜는 제외된다', () => {
    const changes = recentChanges(STATUS_BOARD, 30, '2025-01-01');
    expect(changes).toHaveLength(0);
  });
});

describe('isStale', () => {
  const item = STATUS_BOARD[0]!;

  test('maxAgeDays 이내면 false, 넘으면 true', () => {
    expect(isStale(item, '2026-08-12', 90)).toBe(false);
    expect(isStale(item, '2027-01-01', 90)).toBe(true);
  });
});
