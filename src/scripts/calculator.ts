import { GEOMDAN_LAKEPARK, type UnitType } from '../data/presets/geomdan-lakepark';
import { ACQUISITION_TAX, MOVE_IN_COSTS, type MoveInLevel } from '../data/rates';
import { trackOnce } from '../lib/analytics';
import { formatDate, formatKRW, formatPercent, formatRange } from '../lib/format';
import { saveProfile } from '../lib/profile';
import { calculateTotalCost, type TotalCostResult } from '../lib/calc/total';
import type { InterimLoanInterestMode } from '../lib/calc/loanInterest';

type BlockKey = keyof typeof GEOMDAN_LAKEPARK.blocks;

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`계산기 요소를 찾을 수 없습니다: #${id}`);
  return el as T;
};

const els = {
  block: $<HTMLSelectElement>('f-block'),
  unitType: $<HTMLSelectElement>('f-type'),
  price: $<HTMLInputElement>('f-price'),
  priceHint: $<HTMLParagraphElement>('f-price-hint'),
  priceQuick: $<HTMLDivElement>('f-price-quick'),
  contractDate: $<HTMLInputElement>('f-contract-date'),
  balcony: $<HTMLInputElement>('f-balcony'),
  balconyLabel: $<HTMLSpanElement>('f-balcony-amount'),
  optionList: $<HTMLDivElement>('f-options'),
  optionTotal: $<HTMLSpanElement>('f-options-total'),
  loanRatio: $<HTMLInputElement>('f-loan-ratio'),
  loanRate: $<HTMLInputElement>('f-loan-rate'),
  loanMode: $<HTMLSelectElement>('f-loan-mode'),
  loanRateRow: $<HTMLDivElement>('f-loan-rate-row'),
  interiorLevel: $<HTMLSelectElement>('f-interior'),
  appliances: $<HTMLInputElement>('f-appliances'),
  optionsInTax: $<HTMLInputElement>('f-options-tax'),

  phaseBefore: $<HTMLElement>('r-phase-before'),
  phaseAt: $<HTMLElement>('r-phase-at'),
  phaseAfter: $<HTMLElement>('r-phase-after'),
  carriedLoan: $<HTMLElement>('r-carried-loan'),
  confirmedTotal: $<HTMLElement>('r-confirmed-total'),
  confirmedDetail: $<HTMLElement>('r-confirmed-detail'),
  estimatedTotal: $<HTMLElement>('r-estimated-total'),
  estimatedRows: $<HTMLElement>('r-estimated-rows'),
  timeline: $<HTMLTableSectionElement>('r-timeline'),
  basis: $<HTMLElement>('r-basis'),
};

function currentBlock(): BlockKey {
  return els.block.value as BlockKey;
}

function currentTypes(): readonly UnitType[] {
  return GEOMDAN_LAKEPARK.blocks[currentBlock()].types;
}

function currentType(): UnitType {
  const found = currentTypes().find((t) => t.code === els.unitType.value);
  return found ?? currentTypes()[0]!;
}

/** 선택된 유상옵션 금액 합계 (발코니 확장 포함) */
function selectedOptionsTotal(): number {
  const type = currentType();
  const balcony = els.balcony.checked ? (type.balconyExpansion ?? 0) : 0;
  const checked = Array.from(
    els.optionList.querySelectorAll<HTMLInputElement>('input[type=checkbox]:checked'),
  ).reduce((acc, input) => acc + Number(input.dataset.amount ?? 0), 0);
  return balcony + checked;
}

function renderTypeOptions(): void {
  els.unitType.innerHTML = currentTypes()
    .map((t) => `<option value="${t.code}">${t.code} · 전용 ${t.exclusiveAreaSqm}㎡</option>`)
    .join('');
}

function renderOptionCatalog(): void {
  const block = GEOMDAN_LAKEPARK.blocks[currentBlock()];
  const type = currentType();

  // 발코니 확장은 타입별 금액이라 별도 체크박스로 둔다.
  const balconyAmount = type.balconyExpansion;
  els.balcony.disabled = balconyAmount === undefined;
  els.balconyLabel.textContent =
    balconyAmount === undefined ? '공고 확인 필요' : formatKRW(balconyAmount);
  if (balconyAmount === undefined) els.balcony.checked = false;

  const applicable = block.options.filter(
    (o) => !o.appliesTo || o.appliesTo.includes(type.code),
  );

  if (applicable.length === 0) {
    els.optionList.innerHTML =
      '<p class="muted small">이 블록의 유상옵션 가격표는 아직 정리되지 않았습니다. 옵션 금액은 직접 더해 확인하세요.</p>';
    return;
  }

  els.optionList.innerHTML = applicable
    .map(
      (o, i) => `
      <label class="check">
        <input type="checkbox" data-amount="${o.amount}" id="opt-${i}" />
        <span>${o.label}</span>
        <span class="num muted">${formatKRW(o.amount)}</span>
      </label>`,
    )
    .join('');
}

function renderPriceHelpers(): void {
  const type = currentType();
  const { min, max } = type.supplyPrice;
  const typical = type.typicalMinPrice;

  const quick: Array<{ label: string; value: number; note?: string }> = [
    { label: '공고 최저', value: min },
    ...(typical ? [{ label: '일반 최저', value: typical }] : []),
    { label: '공고 최고', value: max },
  ];

  els.priceQuick.innerHTML = quick
    .map((q) => `<button type="button" class="chip" data-price="${q.value}">${q.label}<br /><span class="num">${formatKRW(q.value)}</span></button>`)
    .join('');

  els.priceHint.textContent = typical
    ? `공고상 최저 ${formatKRW(min)}는 특정 동·라인 소수 세대 가격입니다. 다수 라인의 일반 최저는 ${formatKRW(typical)}입니다.`
    : `공고상 층·라인별 범위는 ${formatKRW(min)} ~ ${formatKRW(max)}입니다.`;

  // 현재 입력값이 새 타입 범위를 벗어나면 대표값으로 되돌린다.
  const current = Number(els.price.value);
  if (!current || current < min || current > max) {
    els.price.value = String(typical ?? max);
  }
}

function readInputs() {
  const type = currentType();
  return {
    supplyPrice: Number(els.price.value) || 0,
    exclusiveAreaSqm: type.exclusiveAreaSqm,
    contractDate: els.contractDate.value || '2026-07-20',
    moveInDate: GEOMDAN_LAKEPARK.expectedMoveInDate,
    optionsTotal: selectedOptionsTotal(),
    loanRatioOfContract: (Number(els.loanRatio.value) || 0) / 100,
    loanAnnualRate: (Number(els.loanRate.value) || 0) / 100,
    loanInterestMode: els.loanMode.value as InterimLoanInterestMode,
    interiorLevel: els.interiorLevel.value as MoveInLevel,
    includeAppliances: els.appliances.checked,
    includeOptionsInTaxBase: els.optionsInTax.checked,
  };
}

function renderTimeline(result: TotalCostResult): void {
  const kindLabel: Record<string, string> = {
    downPayment: '계약금',
    interim: '중도금',
    balance: '잔금',
    optionDownPayment: '옵션',
    optionBalance: '옵션',
  };

  els.timeline.innerHTML = result.schedule.events
    .map(
      (e) => `
      <tr class="${e.kind.startsWith('option') ? 'is-option' : ''}">
        <td>${formatDate(e.date)}</td>
        <td>${e.label}<span class="tag">${kindLabel[e.kind] ?? ''}</span></td>
        <td class="num">${formatKRW(e.amount)}</td>
        <td class="num">${e.loanAmount > 0 ? formatKRW(e.loanAmount) : '—'}</td>
        <td class="num strong">${formatKRW(e.cashAmount)}</td>
      </tr>`,
    )
    .join('');
}

function renderBasis(result: TotalCostResult, inputs: ReturnType<typeof readInputs>): void {
  const tax = result.acquisitionTax;
  const taxBase = inputs.includeOptionsInTaxBase
    ? inputs.supplyPrice + inputs.optionsTotal
    : inputs.supplyPrice;

  els.basis.innerHTML = `
    <h4>취득세</h4>
    <ul>
      <li>과세표준 ${formatKRW(taxBase)} ${inputs.includeOptionsInTaxBase ? '(분양가 + 옵션)' : '(분양가만)'}</li>
      <li>적용세율 ${formatPercent(tax.rate)} — 6억 초과 9억 이하 구간은 <code>(취득가액 × 2 ÷ 3억) − 3</code> 누진식</li>
      <li>취득세 ${formatKRW(tax.acquisitionTax)} + 지방교육세 ${formatKRW(tax.localEducationTax)} + 농어촌특별세 ${formatKRW(tax.ruralSpecialTax)}</li>
      <li>전용 ${inputs.exclusiveAreaSqm}㎡ → 국민주택 규모(${ACQUISITION_TAX.ruralSpecialTaxExemptAreaSqm}㎡) ${inputs.exclusiveAreaSqm > ACQUISITION_TAX.ruralSpecialTaxExemptAreaSqm ? '초과, 농특세 과세' : '이하, 농특세 비과세'}</li>
      <li class="muted">기준: ${ACQUISITION_TAX.source.label} (${ACQUISITION_TAX.source.asOf} 확인). 1세대 1주택 표준세율이며 다주택 중과는 반영하지 않습니다.</li>
    </ul>

    <h4>중도금 대출 이자</h4>
    <ul>
      <li>방식: ${result.loanInterest.mode}${result.loanInterest.mode === '무이자' ? ' — 시행사 부담이라 계약자 이자는 0입니다.' : ''}</li>
      ${
        result.loanInterest.mode === '무이자'
          ? ''
          : `<li>회차별 실행일부터 잔금일까지 <code>원금 × 연이율 × 일수 ÷ 365</code>로 일할 계산</li>
             <li>총 ${formatKRW(result.loanInterest.total)}</li>`
      }
      <li class="muted">사업주체는 대출 알선·승인·한도·금리를 보장하지 않습니다. 대출이 실행되지 않아도 납부기일에 분양대금을 조달해야 합니다.</li>
    </ul>

    <h4>입주 부대비용 (추정)</h4>
    <ul>
      <li>인테리어 ${formatRange(result.moveInCosts.interior)}</li>
      <li>입주청소 ${formatRange(result.moveInCosts.cleaning)}</li>
      <li>이사 ${formatRange(result.moveInCosts.moving)}</li>
      <li>가전 ${formatRange(result.moveInCosts.appliances)}</li>
      <li class="muted">기준: ${MOVE_IN_COSTS.source.label} (${MOVE_IN_COSTS.source.asOf}). 전용면적 단가 기반 <strong>추정</strong>이며 업체·자재·시기에 따라 크게 달라집니다.</li>
    </ul>
  `;
}

function render(): void {
  const inputs = readInputs();

  els.loanRateRow.hidden = inputs.loanInterestMode === '무이자';
  els.optionTotal.textContent = formatKRW(inputs.optionsTotal);

  if (inputs.supplyPrice <= 0) return;

  const result = calculateTotalCost(inputs);

  els.phaseBefore.textContent = formatKRW(result.cashByPhase.beforeMoveIn);
  els.phaseAt.textContent = formatKRW(result.cashByPhase.atMoveIn);
  els.phaseAfter.textContent = formatRange(result.cashByPhase.afterMoveIn);

  els.carriedLoan.textContent = formatKRW(result.carriedLoan);

  els.confirmedTotal.textContent = formatKRW(result.confirmed.total);
  els.confirmedDetail.textContent = `분양대금 ${formatKRW(result.confirmed.supplyPrice)}${
    result.confirmed.options > 0 ? ` + 옵션 ${formatKRW(result.confirmed.options)}` : ''
  }`;

  els.estimatedTotal.textContent = formatRange(result.estimated.total);
  els.estimatedRows.innerHTML = [
    ['취득세 등', formatKRW(result.estimated.acquisitionTax)],
    ['등기·법무비', formatKRW(result.estimated.registrationFee)],
    ['중도금 이자', formatKRW(result.estimated.loanInterest)],
    ['인테리어·이사·가전', formatRange(result.estimated.moveIn)],
  ]
    .map(([label, value]) => `<tr><th scope="row">${label}</th><td class="num">${value}</td></tr>`)
    .join('');

  renderTimeline(result);
  renderBasis(result, inputs);

  trackOnce('calc_completed');
}

function rebuildForType(): void {
  renderPriceHelpers();
  renderOptionCatalog();
  render();
}

function init(): void {
  renderTypeOptions();
  // 84A를 기본 선택 — 세대수가 가장 많은 타입이다.
  if (currentTypes().some((t) => t.code === '84A')) els.unitType.value = '84A';
  rebuildForType();

  els.block.addEventListener('change', () => {
    renderTypeOptions();
    rebuildForType();
    trackOnce('preset_selected');
  });
  els.unitType.addEventListener('change', rebuildForType);

  els.priceQuick.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-price]');
    if (!button) return;
    els.price.value = button.dataset.price!;
    render();
  });

  els.optionList.addEventListener('change', render);

  for (const el of [
    els.price,
    els.contractDate,
    els.balcony,
    els.loanRatio,
    els.loanRate,
    els.loanMode,
    els.interiorLevel,
    els.appliances,
    els.optionsInTax,
  ]) {
    el.addEventListener('change', render);
    if (el instanceof HTMLInputElement && el.type === 'number') {
      el.addEventListener('input', render);
    }
  }

  // 홈 개인화 브리지 — 현재 선택을 localStorage 프로필로 저장한다 (전송 없음).
  document.getElementById('f-save-profile')?.addEventListener('click', () => {
    const supplyPrice = Number(els.price.value);
    saveProfile({
      block: currentBlock(),
      type: currentType().code,
      ...(supplyPrice > 0 ? { supplyPrice } : {}),
      ...(els.contractDate.value ? { contractDate: els.contractDate.value } : {}),
    });
    const note = document.getElementById('f-save-profile-note');
    if (note) note.hidden = false;
  });
}

init();
