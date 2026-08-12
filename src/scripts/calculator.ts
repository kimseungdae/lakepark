import { GEOMDAN_LAKEPARK, type UnitType, type UnitTypeCode } from '../data/presets/geomdan-lakepark';
import { calculateTotalCost, type TotalCostResult } from '../lib/calc/total';
import { formatDate, formatKRW, formatRange } from '../lib/format';
import { loadProfileV2, saveProfileV2 } from '../lib/profile';
import {
  getBuildingOptions,
  getUnitTypesForBuilding,
  resolveOfficialPrice,
  type PriceResolution,
} from '../lib/priceResolver';
import type { MoveInLevel } from '../data/rates';
import type { InterimLoanInterestMode } from '../lib/calc/loanInterest';

const get = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`필수 화면 요소가 없습니다: #${id}`);
  return element as T;
};

const elements = {
  building: get<HTMLSelectElement>('f-building'),
  floor: get<HTMLInputElement>('f-floor'),
  unitType: get<HTMLSelectElement>('f-type'),
  lineField: get<HTMLLabelElement>('line-field'),
  line: get<HTMLSelectElement>('f-line'),
  selectionNote: get<HTMLParagraphElement>('selection-note'),
  contractDate: get<HTMLInputElement>('f-contract-date'),
  loanRatio: get<HTMLSelectElement>('f-loan-ratio'),
  loanRate: get<HTMLInputElement>('f-loan-rate'),
  loanMode: get<HTMLSelectElement>('f-loan-mode'),
  balconyField: get<HTMLLabelElement>('balcony-field'),
  balcony: get<HTMLInputElement>('f-balcony'),
  options: get<HTMLInputElement>('f-options'),
  interior: get<HTMLSelectElement>('f-interior'),
  empty: get<HTMLDivElement>('result-empty'),
  content: get<HTMLDivElement>('result-content'),
  selection: get<HTMLElement>('r-selection'),
  planTotal: get<HTMLElement>('r-plan-total'),
  price: get<HTMLElement>('r-price'),
  priceNote: get<HTMLElement>('r-price-note'),
  extra: get<HTMLElement>('r-extra'),
  before: get<HTMLElement>('r-before'),
  at: get<HTMLElement>('r-at'),
  after: get<HTMLElement>('r-after'),
  loan: get<HTMLElement>('r-loan'),
  schedule: get<HTMLTableSectionElement>('r-schedule'),
  save: get<HTMLButtonElement>('save-profile'),
  saveNote: get<HTMLParagraphElement>('save-note'),
};

const buildingOptions = getBuildingOptions();

const selectedBuilding = () => buildingOptions.find(
  (option) => option.building === Number(elements.building.value),
)!;

const selectedType = (): UnitType => {
  const block = selectedBuilding().block;
  return GEOMDAN_LAKEPARK.blocks[block].types.find(
    (type) => type.code === elements.unitType.value,
  )!;
};

const renderTypeOptions = (preferred?: UnitTypeCode): void => {
  const types = getUnitTypesForBuilding(Number(elements.building.value));
  elements.unitType.innerHTML = types.map((type) => `<option value="${type}">${type} 타입</option>`).join('');
  if (preferred && types.includes(preferred)) elements.unitType.value = preferred;
};

const selectedOptionsTotal = (): number => {
  const balcony = elements.balcony.checked ? (selectedType().balconyExpansion ?? 0) : 0;
  return balcony + Math.max(0, Number(elements.options.value) || 0);
};

const calculate = (supplyPrice: number): TotalCostResult => calculateTotalCost({
  supplyPrice,
  exclusiveAreaSqm: selectedType().exclusiveAreaSqm,
  contractDate: elements.contractDate.value || '2026-07-20',
  moveInDate: GEOMDAN_LAKEPARK.expectedMoveInDate,
  optionsTotal: selectedOptionsTotal(),
  loanRatioOfContract: Number(elements.loanRatio.value),
  loanAnnualRate: (Number(elements.loanRate.value) || 0) / 100,
  loanInterestMode: elements.loanMode.value as InterimLoanInterestMode,
  interiorLevel: elements.interior.value as MoveInLevel,
  includeAppliances: true,
  includeOptionsInTaxBase: true,
});

const amountRange = (low: number, high: number): string => formatRange({ min: low, max: high });

const priceBounds = (resolution: PriceResolution): { min: number; max: number } | null => {
  if (resolution.kind === 'exact') return { min: resolution.amountWon, max: resolution.amountWon };
  if (resolution.kind === 'range') return { min: resolution.minWon, max: resolution.maxWon };
  return null;
};

const renderLineChoice = (resolution: PriceResolution): PriceResolution => {
  if (resolution.kind !== 'range') {
    elements.lineField.classList.add('hidden');
    elements.lineField.classList.remove('grid');
    return resolution;
  }

  elements.lineField.classList.remove('hidden');
  elements.lineField.classList.add('grid');
  const current = Number(elements.line.value);
  elements.line.innerHTML = [
    '<option value="">라인을 모르겠어요 · 범위로 보기</option>',
    ...resolution.candidateLines.map((line) => `<option value="${line}">${line}호 라인</option>`),
  ].join('');
  if (resolution.candidateLines.includes(current)) elements.line.value = String(current);
  if (!elements.line.value) return resolution;

  return resolveOfficialPrice({
    block: selectedBuilding().block,
    building: Number(elements.building.value),
    floor: Number(elements.floor.value),
    unitType: elements.unitType.value as UnitTypeCode,
    line: Number(elements.line.value),
  });
};

const renderSchedule = (result: TotalCostResult): void => {
  elements.schedule.innerHTML = result.schedule.events.map((event) => `
    <tr>
      <td class="whitespace-nowrap text-sm">${formatDate(event.date)}</td>
      <td class="text-sm font-semibold">${event.label}${event.loanAmount > 0 ? '<span class="ml-2 rounded bg-action-soft px-1.5 py-0.5 text-[.68rem] text-action">대출</span>' : ''}</td>
      <td class="num whitespace-nowrap text-right text-sm font-bold">${formatKRW(event.cashAmount)}</td>
    </tr>
  `).join('');
};

const unavailableMessage: Record<string, string> = {
  'invalid-building': '동 정보를 다시 골라 주세요.',
  'type-not-in-building': '이 동에는 선택한 타입이 없습니다.',
  'floor-out-of-range': '층은 1층부터 29층 사이로 입력해 주세요.',
  'invalid-line': '이 동에 없는 라인입니다.',
  'no-price-row': '공고 가격표에서 이 조건의 금액을 찾지 못했습니다.',
};

const render = (): void => {
  const building = selectedBuilding();
  const unitType = elements.unitType.value as UnitTypeCode;
  const floor = Number(elements.floor.value);
  const type = selectedType();
  const hasBalconyPrice = type.balconyExpansion !== undefined;
  elements.balcony.disabled = !hasBalconyPrice;
  elements.balconyField.classList.toggle('opacity-50', !hasBalconyPrice);

  let resolution = resolveOfficialPrice({
    block: building.block,
    building: building.building,
    floor,
    unitType,
  });
  resolution = renderLineChoice(resolution);

  if (resolution.kind === 'unavailable') {
    elements.empty.textContent = unavailableMessage[resolution.reason] ?? '이 조건은 공고 가격표를 다시 확인해야 합니다.';
    elements.empty.classList.remove('hidden');
    elements.content.classList.add('hidden');
    return;
  }

  const bounds = priceBounds(resolution)!;
  const low = calculate(bounds.min);
  const high = calculate(bounds.max);
  const extraMin = low.estimated.total.min + selectedOptionsTotal();
  const extraMax = high.estimated.total.max + selectedOptionsTotal();
  const planMin = bounds.min + low.estimated.total.min + selectedOptionsTotal();
  const planMax = bounds.max + high.estimated.total.max + selectedOptionsTotal();

  elements.empty.classList.add('hidden');
  elements.content.classList.remove('hidden');
  elements.selection.textContent = `${building.building}동 · ${floor}층 · ${unitType}`;
  elements.planTotal.textContent = amountRange(planMin, planMax);
  elements.price.textContent = amountRange(bounds.min, bounds.max);
  elements.extra.textContent = amountRange(extraMin, extraMax);
  elements.before.textContent = amountRange(low.cashByPhase.beforeMoveIn, high.cashByPhase.beforeMoveIn);
  elements.at.textContent = amountRange(low.cashByPhase.atMoveIn, high.cashByPhase.atMoveIn);
  elements.after.textContent = amountRange(
    Math.min(low.cashByPhase.afterMoveIn.min, high.cashByPhase.afterMoveIn.min),
    Math.max(low.cashByPhase.afterMoveIn.max, high.cashByPhase.afterMoveIn.max),
  );
  elements.loan.textContent = amountRange(low.carriedLoan, high.carriedLoan);
  elements.priceNote.textContent = resolution.kind === 'range'
    ? '같은 동·층·타입 안에서 라인에 따라 달라지는 공고 금액입니다.'
    : resolution.occupancy === 'needs-contract-check'
      ? '공고 금액입니다. 이 층의 실제 세대 존재 여부는 계약서에서 다시 확인하세요.'
      : '입주자모집공고 가격표와 동별 라인 배정을 대조한 금액입니다.';
  elements.selectionNote.textContent = hasBalconyPrice
    ? `발코니 확장비 ${formatKRW(type.balconyExpansion!)}을 포함해 계산 중입니다.`
    : 'AB22 발코니 확장비는 아직 미반영입니다. 계약서 금액을 직접 더해 주세요.';
  renderSchedule(high);
};

const init = (): void => {
  elements.building.innerHTML = buildingOptions.map((option) => (
    `<option value="${option.building}">${option.building}동 · ${option.block}</option>`
  )).join('');

  const saved = loadProfileV2();
  const savedBuilding = saved?.building && buildingOptions.some(
    (option) => String(option.building) === saved.building,
  ) ? saved.building : '6304';
  elements.building.value = savedBuilding;
  renderTypeOptions(saved?.unitType ?? '84A');
  if (saved?.floor) elements.floor.value = String(saved.floor);
  if (saved?.contractDate) elements.contractDate.value = saved.contractDate;
  if (saved?.loanRatio !== undefined) elements.loanRatio.value = String(saved.loanRatio);
  if (saved?.loanRate !== undefined) elements.loanRate.value = String(saved.loanRate * 100);

  elements.building.addEventListener('change', () => {
    renderTypeOptions();
    elements.line.value = '';
    render();
  });
  elements.unitType.addEventListener('change', () => {
    elements.line.value = '';
    render();
  });
  for (const element of [
    elements.floor,
    elements.line,
    elements.contractDate,
    elements.loanRatio,
    elements.loanRate,
    elements.loanMode,
    elements.balcony,
    elements.options,
    elements.interior,
  ]) {
    element.addEventListener('change', render);
    if (element instanceof HTMLInputElement) element.addEventListener('input', render);
  }

  elements.save.addEventListener('click', () => {
    const building = selectedBuilding();
    saveProfileV2({
      block: building.block,
      building: String(building.building),
      floor: Number(elements.floor.value),
      unitType: elements.unitType.value as UnitTypeCode,
      contractDate: elements.contractDate.value,
      loanRatio: Number(elements.loanRatio.value),
      loanRate: Number(elements.loanRate.value) / 100,
    });
    elements.saveNote.classList.remove('hidden');
  });

  render();
};

init();
