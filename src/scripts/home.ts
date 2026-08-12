import { GEOMDAN_LAKEPARK, PAYMENT_STRUCTURE } from '../data/presets/geomdan-lakepark';
import { formatDate, formatKRW } from '../lib/format';
import { clearProfile, loadProfile, saveProfile, type BlockId, type UserProfile } from '../lib/profile';
import { dDayLabel, nextPayment } from '../lib/timeline';
import { todayISO } from '../lib/today';

/**
 * 홈 개인화. 프로필이 없으면 선택 폼(#p-setup)이, 있으면 요약(#p-summary)이 보인다.
 * JS가 없으면 선택 폼과 정적 콘텐츠(최근 변경·모듈 링크)만 보이는 완전한 페이지다.
 */

const $ = <T extends HTMLElement>(id: string): T | null =>
  document.getElementById(id) as T | null;

const setup = $<HTMLElement>('p-setup');
const summary = $<HTMLElement>('p-summary');
const blockSelect = $<HTMLSelectElement>('p-block');
const typeSelect = $<HTMLSelectElement>('p-type');

if (setup && summary && blockSelect && typeSelect) {
  const renderTypeOptions = (block: BlockId): void => {
    typeSelect.innerHTML = GEOMDAN_LAKEPARK.blocks[block].types
      .map((t) => `<option value="${t.code}">${t.code} · 전용 ${t.exclusiveAreaSqm}㎡</option>`)
      .join('');
  };

  const showSummary = (profile: UserProfile): void => {
    const unitLabel = $<HTMLElement>('p-unit-label');
    if (unitLabel) {
      unitLabel.textContent = `${GEOMDAN_LAKEPARK.blocks[profile.block].name} · ${profile.type}`;
    }

    const today = todayISO();
    const next = nextPayment(PAYMENT_STRUCTURE.interim.dates, today);
    const nextEl = $<HTMLElement>('p-next-payment');
    const amountEl = $<HTMLElement>('p-next-amount');
    if (nextEl) {
      if (next) {
        nextEl.innerHTML =
          `<strong>중도금 ${next.index + 1}회차</strong> · ${formatDate(next.date)} · ` +
          `<span class="dday-big">${dDayLabel(next.remainingDays)}</span>`;
      } else {
        nextEl.textContent =
          '공고에 명시된 중도금 회차는 모두 지났습니다. 잔금 일정은 입주안내문을 확인하세요.';
      }
    }
    if (amountEl) {
      const ratioPercent = Math.round(PAYMENT_STRUCTURE.interim.ratioEach * 100);
      if (!next) {
        amountEl.textContent = '';
      } else if (profile.supplyPrice) {
        const interimEach = Math.round(profile.supplyPrice * PAYMENT_STRUCTURE.interim.ratioEach);
        amountEl.textContent = `회차당 약 ${formatKRW(interimEach)} (분양가의 ${ratioPercent}%). 대출·자납 구분은 계산기에서 확인하세요.`;
      } else {
        amountEl.textContent = `회차당 분양가의 ${ratioPercent}%. 정확한 금액은 계산기에서 분양가를 넣어 확인하세요.`;
      }
    }

    const guideLink = $<HTMLAnchorElement>('p-guide-link');
    if (guideLink) guideLink.href = `/guide#type-${profile.type}`;

    setup.hidden = true;
    summary.hidden = false;
  };

  const showSetup = (profile: UserProfile | null): void => {
    if (profile) {
      blockSelect.value = profile.block;
      renderTypeOptions(profile.block);
      typeSelect.value = profile.type;
    }
    summary.hidden = true;
    setup.hidden = false;
  };

  blockSelect.addEventListener('change', () => {
    renderTypeOptions(blockSelect.value as BlockId);
  });

  $<HTMLButtonElement>('p-save')?.addEventListener('click', () => {
    const block = blockSelect.value as BlockId;
    const code = GEOMDAN_LAKEPARK.blocks[block].types.find((t) => t.code === typeSelect.value)?.code;
    if (!code) return;

    // 홈에서 저장하면 세대 정보만 남긴다. 분양가·계약일은 계산기의 "내 프로필로 저장"이 채운다.
    const existing = loadProfile();
    saveProfile({
      block,
      type: code,
      ...(existing && existing.block === block && existing.type === code
        ? { supplyPrice: existing.supplyPrice, contractDate: existing.contractDate }
        : {}),
    });
    const profile = loadProfile();
    if (profile) showSummary(profile);
  });

  $<HTMLButtonElement>('p-change')?.addEventListener('click', () => showSetup(loadProfile()));

  $<HTMLButtonElement>('p-clear')?.addEventListener('click', () => {
    clearProfile();
    showSetup(null);
  });

  const stored = loadProfile();
  if (stored) {
    showSummary(stored);
  } else {
    renderTypeOptions(blockSelect.value as BlockId);
  }
}
