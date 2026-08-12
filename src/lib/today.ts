/**
 * 방문자 로컬 시간대 기준 오늘 날짜 (YYYY-MM-DD).
 *
 * D-day류 계산은 반드시 방문 시점 기준이어야 하므로 클라이언트 스크립트에서만 호출한다 —
 * .astro 프론트매터(빌드 시점)에서 호출하면 날짜가 박제되므로 금지.
 */
export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
