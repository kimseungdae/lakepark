import { PAYMENT_STRUCTURE } from '../data/presets/geomdan-lakepark';
import { formatDate } from '../lib/format';
import { dDay, dDayLabel, nextPayment } from '../lib/timeline';
import { todayISO } from '../lib/today';

/**
 * D-day는 방문 시점 기준이어야 하므로 전부 클라이언트에서 계산한다.
 * 정적 마크업(data-date/data-precision)에 주석만 얹는 방식이라 JS가 없어도 표는 완전하다.
 */

const today = todayISO();

// 다음 납부 요약 카드
const next = nextPayment(PAYMENT_STRUCTURE.interim.dates, today);
const summary = document.getElementById('t-next');
if (summary) {
  if (next) {
    summary.innerHTML =
      `<strong>중도금 ${next.index + 1}회차</strong> · ${formatDate(next.date)} · ` +
      `<span class="dday-big">${dDayLabel(next.remainingDays)}</span>`;
  } else {
    summary.textContent =
      '공고에 명시된 중도금 회차는 모두 지났습니다. 잔금 일정은 입주안내문을 확인하세요.';
  }
}

// 각 항목에 D-day 주석 + 지난 일정 흐리기
document.querySelectorAll<HTMLElement>('.tl-item[data-date]').forEach((item) => {
  const date = item.dataset.date;
  if (!date) return;

  const remaining = dDay(today, date);
  const slot = item.querySelector<HTMLElement>('.dday');
  if (slot) {
    // 추정 날짜(월·분기 정밀도)의 D-day는 근사치임을 표기한다.
    const approx = item.dataset.precision !== 'day' ? '약 ' : '';
    slot.textContent = `${approx}${dDayLabel(remaining)}`;
    slot.hidden = false;
  }
  if (remaining < 0) item.classList.add('past');
});

// 다음 납부 회차 하이라이트
if (next) {
  document
    .querySelector(`.tl-item[data-kind='payment'][data-date='${next.date}']`)
    ?.classList.add('next');
}
