import { HUG_GUARANTEES, PAYMENT_ACCOUNTS } from '../data/paymentSafety';
import { PAYMENT_STRUCTURE } from '../data/presets/geomdan-lakepark';
import { formatDate, formatKRW } from '../lib/format';
import { buildCalendar, downloadCalendar, type CalendarEvent } from '../lib/ics';
import {
  MOVE_IN_KEY,
  buildMoveInTasks,
  emptyMoveInWorkspace,
  parseMoveInWorkspace,
  type DefectRecord,
  type DefectStatus,
  type MeasurementRecord,
  type MoveInEventDates,
  type MoveInWorkspace,
  type QuoteRecord,
} from '../lib/moveIn';
import { getRightsClocks } from '../lib/rights';
import type { PriceBlockId } from '../data/prices/officialSupplyPrices';

const get = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`필수 화면 요소가 없습니다: #${id}`);
  return element as T;
};

let workspace = parseMoveInWorkspace(localStorage.getItem(MOVE_IN_KEY)) ?? emptyMoveInWorkspace();

const save = (): void => {
  localStorage.setItem(MOVE_IN_KEY, JSON.stringify(workspace));
};

const createId = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const escapeHtml = (value: string): string => value.replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]!));

const renderTasks = (): void => {
  const tasks = buildMoveInTasks(workspace.dates);
  get<HTMLDivElement>('task-list').innerHTML = tasks.map((task) => {
    const checked = workspace.completedTaskIds.includes(task.id);
    const date = task.dueDate ? `${formatDate(task.dueDate)}까지` : task.recheckAt ? `${formatDate(task.recheckAt)} 재확인` : '지금';
    return `<label class="flex cursor-pointer gap-3 py-4">
      <input class="mt-1 h-5 w-5 shrink-0 accent-action" type="checkbox" data-task-id="${task.id}" ${checked ? 'checked' : ''} />
      <span class="min-w-0 flex-1 ${checked ? 'opacity-45 line-through' : ''}"><strong class="block">${task.title}</strong><span class="mt-1 block text-sm leading-6 text-muted">${task.action}</span></span>
      <span class="shrink-0 text-xs font-bold text-action">${date}</span>
    </label>`;
  }).join('');
};

const renderAccount = (): void => {
  const block = get<HTMLSelectElement>('payment-block').value as PriceBlockId;
  const kind = get<HTMLSelectElement>('payment-kind').value;
  const card = get<HTMLElement>('account-card');
  const guarantee = HUG_GUARANTEES[block];
  if (kind === 'virtual') {
    card.innerHTML = `<span class="badge est">계약서 확인</span><h3 class="my-2">세대별 가상계좌</h3><p class="m-0 text-sm leading-6 text-muted">2차 계약금·중도금·잔금은 위 대표 계좌가 아니라 <strong>본인 공급계약서에 적힌 가상계좌</strong>로 납부합니다.</p>`;
  } else {
    const account = PAYMENT_ACCOUNTS.find((item) => item.block === block && item.kind === kind)!;
    card.innerHTML = `<span class="badge conf">공고 ${account.sourcePage}쪽</span><h3 class="my-2">${account.label}</h3>
      <dl class="m-0 grid grid-cols-[5rem_1fr] gap-y-1 text-sm"><dt class="text-muted">은행</dt><dd class="m-0 font-bold">${account.bank}</dd><dt class="text-muted">계좌</dt><dd class="num m-0 font-bold">${account.account}</dd><dt class="text-muted">예금주</dt><dd class="m-0 font-bold">${account.holder}</dd></dl>
      <p class="mb-0 mt-3 text-xs leading-5 text-danger">${account.warning}</p>`;
  }
  card.innerHTML += `<p class="mb-0 mt-4 border-t border-line pt-3 text-[.7rem] leading-5 text-muted">HUG 보증 ${guarantee.number} · 공고상 보증금액 ${formatKRW(guarantee.amount)}</p>`;
  document.querySelectorAll<HTMLInputElement>('#safety-checks input').forEach((input) => { input.checked = false; });
  renderSafetyResult();
};

const renderSafetyResult = (): void => {
  const checks = [...document.querySelectorAll<HTMLInputElement>('#safety-checks input')];
  const completed = checks.every((input) => input.checked);
  const result = get<HTMLParagraphElement>('safety-result');
  result.textContent = completed ? '5가지 대조 완료 · 송금 화면에서도 한 번 더 확인하세요.' : `${checks.filter((input) => input.checked).length}/5 확인 · 아직 송금 준비가 끝나지 않았습니다.`;
  result.className = completed
    ? 'mt-4 rounded-xl bg-confirmed-soft px-4 py-3 text-sm font-bold text-confirmed'
    : 'mt-4 rounded-xl bg-canvas px-4 py-3 text-sm font-bold text-muted';
};

const renderRights = (): void => {
  const block = get<HTMLSelectElement>('rights-block').value as PriceBlockId;
  get<HTMLDivElement>('rights-list').innerHTML = getRightsClocks(block).map((clock) => `<article class="rounded-xl border border-line p-5">
    <div class="flex items-start justify-between gap-3"><h3 class="m-0">${clock.title}</h3><span class="badge est">${clock.status}</span></div>
    ${clock.startsAt ? `<p class="num my-2 text-sm font-bold">기준일 ${formatDate(clock.startsAt)}</p>` : ''}
    <p class="my-2 text-sm leading-6 text-muted">${clock.explanation}</p><p class="m-0 text-xs font-bold text-action">최종 확인: ${clock.checkWith}</p>
  </article>`).join('');
};

const renderQuotes = (): void => {
  const container = get<HTMLDivElement>('quote-list');
  if (workspace.quotes.length === 0) {
    container.innerHTML = '<p class="rounded-xl border border-dashed border-line p-5 text-center text-sm text-muted">아직 비교할 견적이 없습니다.</p>';
    return;
  }
  container.innerHTML = `<div class="scroll-x"><table><thead><tr><th>분류</th><th>업체</th><th>총액</th><th>메모</th><th></th></tr></thead><tbody>${workspace.quotes.map((quote) => `<tr><td>${escapeHtml(quote.category)}</td><td class="font-bold">${escapeHtml(quote.company)}</td><td class="num font-bold">${formatKRW(quote.amount)}</td><td class="text-sm text-muted">${escapeHtml(quote.note)}</td><td><button class="no-print text-xs font-bold text-danger" data-delete-quote="${quote.id}" type="button">삭제</button></td></tr>`).join('')}</tbody></table></div>`;
};

const renderMeasurements = (): void => {
  const container = get<HTMLDivElement>('measurement-list');
  if (workspace.measurements.length === 0) {
    container.innerHTML = '<p class="rounded-xl border border-dashed border-line p-5 text-center text-sm text-muted">저장한 치수가 없습니다.</p>';
    return;
  }
  container.innerHTML = `<div class="scroll-x"><table><thead><tr><th>공간</th><th>위치</th><th>가로 × 높이 × 깊이</th><th>메모</th><th></th></tr></thead><tbody>${workspace.measurements.map((item) => `<tr><td>${escapeHtml(item.room)}</td><td class="font-bold">${escapeHtml(item.item)}</td><td class="num whitespace-nowrap">${item.widthMm || '-'} × ${item.heightMm || '-'} × ${item.depthMm || '-'} mm</td><td class="text-sm text-muted">${escapeHtml(item.note)}</td><td><button class="no-print text-xs font-bold text-danger" data-delete-measurement="${item.id}" type="button">삭제</button></td></tr>`).join('')}</tbody></table></div>`;
};

const renderDefects = (): void => {
  const container = get<HTMLDivElement>('defect-list');
  if (workspace.defects.length === 0) {
    container.innerHTML = '<p class="rounded-xl border border-dashed border-line p-5 text-center text-sm text-muted">기록한 하자가 없습니다.</p>';
    return;
  }
  container.innerHTML = workspace.defects.map((defect) => `<article class="rounded-xl border border-line p-5">
    <div class="flex items-start justify-between gap-4"><div><p class="m-0 text-xs font-bold text-muted">${escapeHtml(defect.room)} · 중요도 ${defect.severity}</p><h3 class="mb-2 mt-1">${escapeHtml(defect.description)}</h3></div><span class="badge ${defect.status === '완료' ? 'conf' : 'est'}">${defect.status}</span></div>
    <p class="m-0 text-sm text-muted">발견 ${formatDate(defect.foundAt)}${defect.receiptNumber ? ` · 접수 ${escapeHtml(defect.receiptNumber)}` : ''}${defect.revisitNote ? ` · ${escapeHtml(defect.revisitNote)}` : ''}</p>
    <p class="photo-status mb-0 mt-2 text-xs font-semibold text-action" data-photo-count="${defect.id}">사진 확인 중…</p>
    <div class="no-print mt-3 flex gap-2"><select class="!min-h-0 !w-auto !py-1 text-xs" data-defect-status="${defect.id}">${['발견', '접수', '방문 예정', '보수 중', '재점검', '완료'].map((status) => `<option ${status === defect.status ? 'selected' : ''}>${status}</option>`).join('')}</select><button class="text-xs font-bold text-danger" data-delete-defect="${defect.id}" type="button">기록·사진 삭제</button></div>
  </article>`).join('');
  void updatePhotoCounts();
};

const PHOTO_DB = 'lakepark-local-photos';
const PHOTO_STORE = 'photos';

const openPhotoDb = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const request = indexedDB.open(PHOTO_DB, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const storePhotos = async (defectId: string, files: readonly File[]): Promise<void> => {
  if (files.length === 0) return;
  const database = await openPhotoDb();
  const transaction = database.transaction(PHOTO_STORE, 'readwrite');
  const store = transaction.objectStore(PHOTO_STORE);
  files.forEach((file, index) => store.put({ id: `${defectId}:${Date.now()}:${index}`, defectId, name: file.name, type: file.type, file }));
};

const deletePhotos = async (defectId?: string): Promise<void> => {
  const database = await openPhotoDb();
  const transaction = database.transaction(PHOTO_STORE, 'readwrite');
  const store = transaction.objectStore(PHOTO_STORE);
  if (!defectId) {
    store.clear();
    return;
  }
  const request = store.openCursor();
  request.onsuccess = () => {
    const cursor = request.result;
    if (!cursor) return;
    if ((cursor.value as { defectId?: string }).defectId === defectId) cursor.delete();
    cursor.continue();
  };
};

const countPhotos = async (defectId: string): Promise<number> => {
  const database = await openPhotoDb();
  return new Promise((resolve) => {
    let count = 0;
    const request = database.transaction(PHOTO_STORE).objectStore(PHOTO_STORE).openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) { resolve(count); return; }
      if ((cursor.value as { defectId?: string }).defectId === defectId) count += 1;
      cursor.continue();
    };
    request.onerror = () => resolve(0);
  });
};

const updatePhotoCounts = async (): Promise<void> => {
  const labels = [...document.querySelectorAll<HTMLElement>('[data-photo-count]')];
  await Promise.all(labels.map(async (label) => {
    const count = await countPhotos(label.dataset.photoCount!);
    label.textContent = count > 0 ? `사진 ${count}장 · 이 브라우저에만 보관` : '사진 없음';
  }));
};

const renderAll = (): void => {
  document.querySelectorAll<HTMLInputElement>('[data-date-field]').forEach((input) => {
    const key = input.dataset.dateField as keyof MoveInEventDates;
    input.value = workspace.dates[key] ?? '';
  });
  renderTasks();
  renderQuotes();
  renderMeasurements();
  renderDefects();
};

document.querySelectorAll<HTMLInputElement>('[data-date-field]').forEach((input) => input.addEventListener('change', () => {
  const key = input.dataset.dateField as keyof MoveInEventDates;
  workspace.dates = { ...workspace.dates, [key]: input.value || undefined };
  save();
  renderTasks();
}));

get<HTMLDivElement>('task-list').addEventListener('change', (event) => {
  const input = (event.target as HTMLElement).closest<HTMLInputElement>('[data-task-id]');
  if (!input) return;
  workspace.completedTaskIds = input.checked
    ? [...new Set([...workspace.completedTaskIds, input.dataset.taskId!])]
    : workspace.completedTaskIds.filter((id) => id !== input.dataset.taskId);
  save();
  renderTasks();
});

get<HTMLButtonElement>('download-calendar').addEventListener('click', () => {
  const events: CalendarEvent[] = PAYMENT_STRUCTURE.interim.dates.map((date, index) => ({ id: `interim-${index + 1}`, date, title: `중도금 ${index + 1}차`, description: '별도 알림이 없어도 납부 의무가 사라지지 않습니다. 계약서와 변경 안내를 우선 확인하세요.' }));
  if (workspace.dates.selectedMoveInDate) events.push({ id: 'selected-move-in', date: workspace.dates.selectedMoveInDate, title: '선택 입주일', description: '잔금·입주증 발급 및 공과금 검침 확인' });
  downloadCalendar('검단레이크파크-납부일정.ics', buildCalendar('검단레이크파크 납부 일정', events));
});

get<HTMLSelectElement>('payment-block').addEventListener('change', renderAccount);
get<HTMLSelectElement>('payment-kind').addEventListener('change', renderAccount);
get<HTMLDivElement>('safety-checks').addEventListener('change', renderSafetyResult);
get<HTMLSelectElement>('rights-block').addEventListener('change', renderRights);

get<HTMLFormElement>('quote-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const data = new FormData(form);
  const record: QuoteRecord = { id: createId('quote'), category: String(data.get('category') ?? ''), company: String(data.get('company') ?? ''), amount: Number(data.get('amount')) || 0, note: String(data.get('note') ?? '') };
  workspace.quotes = [...workspace.quotes, record];
  save();
  form.reset();
  renderQuotes();
});

get<HTMLDivElement>('quote-list').addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-delete-quote]');
  if (!button) return;
  workspace.quotes = workspace.quotes.filter((quote) => quote.id !== button.dataset.deleteQuote);
  save();
  renderQuotes();
});

get<HTMLFormElement>('measurement-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const data = new FormData(form);
  const record: MeasurementRecord = { id: createId('measurement'), room: String(data.get('room') ?? ''), item: String(data.get('item') ?? ''), widthMm: Number(data.get('widthMm')) || 0, heightMm: Number(data.get('heightMm')) || 0, depthMm: Number(data.get('depthMm')) || 0, note: String(data.get('note') ?? '') };
  workspace.measurements = [...workspace.measurements, record];
  save();
  form.reset();
  renderMeasurements();
});

get<HTMLDivElement>('measurement-list').addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-delete-measurement]');
  if (!button) return;
  workspace.measurements = workspace.measurements.filter((item) => item.id !== button.dataset.deleteMeasurement);
  save();
  renderMeasurements();
});

get<HTMLFormElement>('defect-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const data = new FormData(form);
  const id = createId('defect');
  const record: DefectRecord = { id, room: String(data.get('room') ?? ''), description: String(data.get('description') ?? ''), severity: data.get('severity') === '높음' || data.get('severity') === '낮음' ? data.get('severity') as '높음' | '낮음' : '보통', status: String(data.get('status') ?? '발견') as DefectStatus, foundAt: new Date().toISOString().slice(0, 10), receiptNumber: String(data.get('receiptNumber') ?? ''), revisitNote: String(data.get('revisitNote') ?? '') };
  workspace.defects = [...workspace.defects, record];
  save();
  const files = [...form.querySelector<HTMLInputElement>('input[type=file]')!.files ?? []];
  await storePhotos(id, files);
  form.reset();
  renderDefects();
});

get<HTMLDivElement>('defect-list').addEventListener('change', (event) => {
  const select = (event.target as HTMLElement).closest<HTMLSelectElement>('[data-defect-status]');
  if (!select) return;
  workspace.defects = workspace.defects.map((defect) => defect.id === select.dataset.defectStatus ? { ...defect, status: select.value as DefectStatus } : defect);
  save();
  renderDefects();
});

get<HTMLDivElement>('defect-list').addEventListener('click', async (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-delete-defect]');
  if (!button) return;
  const id = button.dataset.deleteDefect!;
  workspace.defects = workspace.defects.filter((defect) => defect.id !== id);
  save();
  await deletePhotos(id);
  renderDefects();
});

get<HTMLButtonElement>('export-data').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '검단레이크파크-입주준비-백업.json';
  link.click();
  URL.revokeObjectURL(url);
});

get<HTMLInputElement>('import-data').addEventListener('change', async (event) => {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const parsed = parseMoveInWorkspace(await file.text());
  if (!parsed) { window.alert('읽을 수 없는 백업 파일입니다.'); return; }
  workspace = parsed;
  save();
  renderAll();
});

get<HTMLButtonElement>('delete-data').addEventListener('click', async () => {
  if (!window.confirm('입주 일정, 견적, 치수, 하자 기록과 사진을 모두 삭제할까요?')) return;
  workspace = emptyMoveInWorkspace();
  localStorage.removeItem(MOVE_IN_KEY);
  await deletePhotos();
  renderAll();
});

renderAccount();
renderRights();
renderAll();
