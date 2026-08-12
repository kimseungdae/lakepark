import type { DatePrecision, Milestone, MilestoneKind } from '../data/timeline/milestones';
import { daysBetween } from './calc/dates';

/**
 * 입주까지의 일정 파생 로직. 프레임워크 import 금지 (src/lib/calc/와 동일 규칙).
 *
 * D-day는 반드시 "방문 시점"을 기준으로 해야 하므로 today를 항상 인자로 받는다 —
 * 정적 빌드 시점의 날짜가 박제되면 안 된다.
 */

export type TimelineEntry = {
  date: string;
  datePrecision: DatePrecision;
  title: string;
  kind: MilestoneKind;
  confidence: 'confirmed' | 'estimated';
  note?: string;
  /** 출처 표기 (있을 때만) */
  sourceLabel?: string;
};

/** 오늘부터 목표일까지 남은 일수. 양수=남음, 0=당일, 음수=지남. */
export function dDay(today: string, target: string): number {
  return daysBetween(today, target);
}

/** D-day 표기. 30 → "D-30", 0 → "D-DAY", -3 → "D+3" */
export function dDayLabel(remaining: number): string {
  if (remaining > 0) return `D-${remaining}`;
  if (remaining === 0) return 'D-DAY';
  return `D+${-remaining}`;
}

/**
 * 아직 지나지 않은 첫 납부 회차를 찾는다. dates는 오름차순이어야 한다.
 * 당일(D-0)은 아직 낼 수 있으므로 포함한다. 모든 회차가 지났으면 undefined.
 */
export function nextPayment(
  dates: readonly string[],
  today: string,
): { index: number; date: string; remainingDays: number } | undefined {
  for (const [index, date] of dates.entries()) {
    const remainingDays = dDay(today, date);
    if (remainingDays >= 0) return { index, date, remainingDays };
  }
  return undefined;
}

export type MoveInTimelineInput = {
  /** 공고 명시 중도금 납부일 (오름차순) */
  interimDates: readonly string[];
  /** 회차별 분양가 대비 비율 (예: 0.1) */
  interimRatioEach: number;
  /** 잔금 비율 (예: 0.3) */
  balanceRatio: number;
  /** 입주예정일 — 추정값이므로 잔금·입주 항목은 estimated로 표시된다 */
  moveInDate: string;
  milestones?: readonly Milestone[];
};

/**
 * 중도금(확정) + 입주지정일(추정) + 큐레이션 마일스톤을 한 타임라인으로 합친다.
 * 반환은 날짜 오름차순. 같은 날짜면 납부 항목이 먼저 온다.
 */
export function buildMoveInTimeline(input: MoveInTimelineInput): TimelineEntry[] {
  const interimPercent = Math.round(input.interimRatioEach * 100);
  const balancePercent = Math.round(input.balanceRatio * 100);

  const interimEntries: TimelineEntry[] = input.interimDates.map((date, idx) => ({
    date,
    datePrecision: 'day',
    title: `중도금 ${idx + 1}회차`,
    kind: 'payment',
    confidence: 'confirmed',
    note: `분양가의 ${interimPercent}%. 납부일은 입주자모집공고에 명시된 확정일입니다.`,
  }));

  const moveInEntry: TimelineEntry = {
    date: input.moveInDate,
    datePrecision: 'month',
    title: '입주지정일 — 잔금·옵션 잔금·취득세',
    kind: 'moveIn',
    confidence: 'estimated',
    note: `분양대금 잔금 ${balancePercent}% + 옵션 잔금 90% + 취득세·등기비. 실제 입주지정일은 입주안내문으로 확정됩니다.`,
  };

  const milestoneEntries: TimelineEntry[] = (input.milestones ?? []).map((m) => ({
    date: m.date,
    datePrecision: m.datePrecision,
    title: m.title,
    kind: m.kind,
    confidence: m.confidence,
    note: m.note,
    sourceLabel: m.source?.label,
  }));

  // 납부 항목이 앞에 오도록 먼저 넣고 안정 정렬에 기댄다 (schedule.ts와 같은 방식).
  return [...interimEntries, moveInEntry, ...milestoneEntries].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}
