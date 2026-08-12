import type { StatusChange, StatusItem } from '../data/status/types';
import { daysBetween } from './calc/dates';

/**
 * 상태판 파생 로직. 프레임워크 import 금지 (src/lib/calc/와 동일 규칙).
 * today를 항상 인자로 받는다 — 빌드 시점 날짜를 박제하지 않기 위해서다.
 */

export type RecentChange = { item: StatusItem; change: StatusChange };

/**
 * 최근 sinceDays일 안에 발생한 변경을 최신순으로 모은다.
 * 미래 날짜(잘못 입력된 데이터)는 제외한다.
 */
export function recentChanges(
  items: readonly StatusItem[],
  sinceDays: number,
  today: string,
): RecentChange[] {
  const out: RecentChange[] = [];

  for (const item of items) {
    for (const change of item.history) {
      const age = daysBetween(change.date, today);
      if (age >= 0 && age <= sinceDays) out.push({ item, change });
    }
  }

  return out.sort((a, b) => b.change.date.localeCompare(a.change.date));
}

/** 마지막 확인일이 maxAgeDays보다 오래됐으면 true — UI가 "오래된 정보" 경고를 띄운다. */
export function isStale(item: StatusItem, today: string, maxAgeDays: number): boolean {
  return daysBetween(item.lastChecked, today) > maxAgeDays;
}
