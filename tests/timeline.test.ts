import { describe, expect, test } from 'vitest';
import { CURATED_MILESTONES } from '../src/data/timeline/milestones';
import { buildMoveInTimeline, dDay, dDayLabel, nextPayment } from '../src/lib/timeline';
import { GEOMDAN_LAKEPARK, PAYMENT_STRUCTURE } from '../src/data/presets/geomdan-lakepark';

const INTERIM_DATES = PAYMENT_STRUCTURE.interim.dates;

describe('dDay / dDayLabel', () => {
  test('남은 일수는 양수, 당일은 0, 지난 날은 음수', () => {
    expect(dDay('2026-08-12', '2026-09-11')).toBe(30);
    expect(dDay('2026-08-12', '2026-08-12')).toBe(0);
    expect(dDay('2026-08-12', '2026-08-09')).toBe(-3);
  });

  test('표기: D-30, D-DAY, D+3', () => {
    expect(dDayLabel(30)).toBe('D-30');
    expect(dDayLabel(0)).toBe('D-DAY');
    expect(dDayLabel(-3)).toBe('D+3');
  });
});

describe('nextPayment — 공고 중도금 6회차 기준', () => {
  test('첫 회차 전이면 1회차를 가리킨다', () => {
    const next = nextPayment(INTERIM_DATES, '2026-08-12');
    expect(next?.index).toBe(0);
    expect(next?.date).toBe('2026-12-15');
  });

  test('회차 당일은 그 회차를 D-0으로 가리킨다', () => {
    const next = nextPayment(INTERIM_DATES, '2027-06-15');
    expect(next?.index).toBe(1);
    expect(next?.remainingDays).toBe(0);
  });

  test('회차 사이면 다음 회차를 가리킨다', () => {
    const next = nextPayment(INTERIM_DATES, '2027-06-16');
    expect(next?.index).toBe(2);
    expect(next?.date).toBe('2027-12-15');
  });

  test('마지막 회차 이후에는 undefined', () => {
    expect(nextPayment(INTERIM_DATES, '2029-06-16')).toBeUndefined();
  });
});

describe('buildMoveInTimeline', () => {
  const timeline = buildMoveInTimeline({
    interimDates: INTERIM_DATES,
    interimRatioEach: PAYMENT_STRUCTURE.interim.ratioEach,
    balanceRatio: PAYMENT_STRUCTURE.balanceRatio,
    moveInDate: GEOMDAN_LAKEPARK.expectedMoveInDate,
    milestones: CURATED_MILESTONES,
  });

  test('중도금 6회 + 입주 1건 + 마일스톤 전부가 포함된다', () => {
    expect(timeline).toHaveLength(INTERIM_DATES.length + 1 + CURATED_MILESTONES.length);
  });

  test('날짜 오름차순으로 정렬된다', () => {
    const dates = timeline.map((e) => e.date);
    expect(dates).toEqual([...dates].sort((a, b) => a.localeCompare(b)));
  });

  test('중도금 회차는 확정, 입주지정일은 추정으로 표시된다', () => {
    const payments = timeline.filter((e) => e.kind === 'payment');
    expect(payments).toHaveLength(6);
    expect(payments.every((e) => e.confidence === 'confirmed')).toBe(true);

    const moveIn = timeline.find((e) => e.kind === 'moveIn');
    expect(moveIn?.confidence).toBe('estimated');
    expect(moveIn?.datePrecision).toBe('month');
  });

  test('사전점검은 입주예정일 45일 전으로 파생된다', () => {
    const inspection = timeline.find((e) => e.kind === 'inspection');
    expect(inspection?.date).toBe('2029-10-17');
    expect(inspection?.confidence).toBe('estimated');
  });
});

describe('CURATED_MILESTONES 데이터 무결성', () => {
  test('id가 유일하고 날짜 형식이 YYYY-MM-DD다', () => {
    const ids = CURATED_MILESTONES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of CURATED_MILESTONES) {
      expect(m.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
