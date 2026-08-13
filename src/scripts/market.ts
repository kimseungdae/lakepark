/**
 * 시세판 법정동 필터 — 점진적 향상.
 * 전체 표는 정적으로 렌더돼 있고, JS는 행을 감추는 역할만 한다 (JS 없어도 전체 목록 표시).
 */
const buttons = document.querySelectorAll<HTMLButtonElement>('[data-filter-umd]');
const rows = document.querySelectorAll<HTMLTableRowElement>('tr[data-umd]');

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.filterUmd ?? 'all';
    buttons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
    rows.forEach((row) => {
      row.hidden = target !== 'all' && row.dataset.umd !== target;
    });
  });
});
