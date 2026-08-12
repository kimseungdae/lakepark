const MS_PER_DAY = 86_400_000;

/**
 * 두 날짜(YYYY-MM-DD) 사이의 일수.
 *
 * 반드시 UTC 자정으로 파싱한다. 로컬 타임존으로 파싱하면 서머타임 경계에서
 * 하루가 23시간이 되어 일할 이자 계산이 어긋난다.
 */
export function daysBetween(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  return Math.round((end - start) / MS_PER_DAY);
}

/**
 * 날짜에 일수를 더한다 (YYYY-MM-DD → YYYY-MM-DD).
 * 계약금 2차 납부기한처럼 "계약 후 N일 이내" 조건을 계산하는 데 쓴다.
 */
export function addDays(date: string, days: number): string {
  const shifted = Date.parse(`${date}T00:00:00Z`) + days * MS_PER_DAY;
  return new Date(shifted).toISOString().slice(0, 10);
}
