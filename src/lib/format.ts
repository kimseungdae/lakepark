const EOK = 100_000_000;
const MAN = 10_000;

/**
 * 금액을 한국식 억/만/원 단위로 표기한다.
 * 662,700,000 → "6억 6,270만원"
 *
 * 부동산 금액은 자릿수가 커서 "662,700,000원"으로 쓰면 사람이 자릿수를 셀 수 없다.
 */
export function formatKRW(amount: number): string {
  if (amount === 0) return '0원';

  const eok = Math.floor(amount / EOK);
  const man = Math.floor((amount % EOK) / MAN);
  const won = amount % MAN;

  const parts: string[] = [];
  if (eok > 0) parts.push(`${eok.toLocaleString('ko-KR')}억`);
  if (man > 0) parts.push(`${man.toLocaleString('ko-KR')}만`);
  if (won > 0) parts.push(won.toLocaleString('ko-KR'));

  return `${parts.join(' ')}원`;
}

/** 추정 구간 표기. 상하한이 같으면 한 번만 쓴다. */
export function formatRange(range: { min: number; max: number }): string {
  if (range.min === range.max) return formatKRW(range.min);
  return `${formatKRW(range.min)} ~ ${formatKRW(range.max)}`;
}

/** 2026-08-19 → 2026.08.19 */
export function formatDate(iso: string): string {
  return iso.replaceAll('-', '.');
}

/** 0.01418 → "1.418%" */
export function formatPercent(rate: number, maxDecimals = 4): string {
  const percent = rate * 100;
  return `${Number(percent.toFixed(maxDecimals))}%`;
}
