export type MoveInEventDates = {
  expectedMonthNotice?: string;
  preVisitStart?: string;
  preVisitEnd?: string;
  confirmedMoveInStart?: string;
  selectedMoveInDate?: string;
  designatedPeriodEnd?: string;
};

export type MoveInTask = {
  id: string;
  phase: 'now' | 'before' | 'moveInDay' | 'after';
  title: string;
  action: string;
  dueDate?: string;
  recheckAt?: string;
};

export type QuoteRecord = { id: string; category: string; company: string; amount: number; note: string };
export type MeasurementRecord = { id: string; room: string; item: string; widthMm: number; heightMm: number; depthMm: number; note: string };
export type DefectStatus = '발견' | '접수' | '방문 예정' | '보수 중' | '재점검' | '완료';
export type DefectRecord = { id: string; room: string; description: string; severity: '낮음' | '보통' | '높음'; status: DefectStatus; foundAt: string; receiptNumber: string; revisitNote: string };

export type MoveInWorkspace = {
  v: 1;
  dates: MoveInEventDates;
  completedTaskIds: string[];
  quotes: QuoteRecord[];
  measurements: MeasurementRecord[];
  defects: DefectRecord[];
};

export const MOVE_IN_KEY = 'move-in-workspace.v1';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const shiftDate = (date: string, days: number): string => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

export const buildMoveInTasks = (dates: MoveInEventDates): readonly MoveInTask[] => [
  { id: 'contract-copy', phase: 'now', title: '계약서와 영수증 한곳에 모으기', action: '공급계약서, 옵션계약서, 이체확인증을 블록별로 보관하세요.' },
  { id: 'loan-check', phase: 'now', title: '대출 조건 다시 확인하기', action: '각 중도금 실행 전 은행의 금리·한도·자납액을 확인하세요.' },
  { id: 'pre-visit', phase: 'before', title: '사전방문 준비', action: '공식 안내문이 나오면 예약일과 준비물을 등록하세요.', ...(dates.preVisitStart ? { dueDate: dates.preVisitStart } : {}) },
  { id: 'moving-quotes', phase: 'before', title: '이사 견적 3곳 비교', action: '같은 작업 범위를 적어 총액과 추가비용을 비교하세요.', ...(dates.selectedMoveInDate ? { dueDate: shiftDate(dates.selectedMoveInDate, -30) } : {}) },
  { id: 'school-recheck', phase: 'before', title: '학교·돌봄 운영 다시 확인', action: '2029년 실제 학구와 늘봄·돌봄 신청일을 교육청에서 확인하세요.', recheckAt: '2029-09-01' },
  { id: 'transport-recheck', phase: 'before', title: '출근길 직접 재보기', action: '입주 직전 실제 버스·지하철 시간표로 평일 출근 시간을 재세요.', recheckAt: '2029-10-01' },
  { id: 'final-payment', phase: 'moveInDay', title: '잔금과 입주증 발급', action: '입주안내문·계약서의 금액과 계좌를 마지막으로 대조하세요.', ...(dates.selectedMoveInDate ? { dueDate: dates.selectedMoveInDate } : {}) },
  { id: 'utilities', phase: 'moveInDay', title: '전기·가스·수도·관리 등록', action: '검침값을 사진으로 남기고 명의·자동납부를 확인하세요.', ...(dates.selectedMoveInDate ? { dueDate: dates.selectedMoveInDate } : {}) },
  { id: 'defect-recheck', phase: 'after', title: '보수 결과 재점검', action: '완료 처리 전에 같은 각도로 다시 보고 기록하세요.', ...(dates.selectedMoveInDate ? { dueDate: shiftDate(dates.selectedMoveInDate, 14) } : {}) },
];

const cleanDates = (value: unknown): MoveInEventDates => {
  if (!value || typeof value !== 'object') return {};
  const input = value as Record<string, unknown>;
  const keys: Array<keyof MoveInEventDates> = ['expectedMonthNotice', 'preVisitStart', 'preVisitEnd', 'confirmedMoveInStart', 'selectedMoveInDate', 'designatedPeriodEnd'];
  return Object.fromEntries(keys.flatMap((key) => (
    typeof input[key] === 'string' && DATE_RE.test(input[key]) ? [[key, input[key]]] : []
  )));
};

const cleanText = (value: unknown): string => typeof value === 'string' ? value.slice(0, 500) : '';
const cleanPositiveNumber = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;

export const emptyMoveInWorkspace = (): MoveInWorkspace => ({
  v: 1,
  dates: {},
  completedTaskIds: [],
  quotes: [],
  measurements: [],
  defects: [],
});

export const parseMoveInWorkspace = (raw: string | null): MoveInWorkspace | null => {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  if (input.v !== 1) return null;

  const quotes = Array.isArray(input.quotes) ? input.quotes.flatMap((item): QuoteRecord[] => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const id = cleanText(record.id);
    if (!id) return [];
    return [{ id, category: cleanText(record.category), company: cleanText(record.company), amount: cleanPositiveNumber(record.amount), note: cleanText(record.note) }];
  }) : [];
  const measurements = Array.isArray(input.measurements) ? input.measurements.flatMap((item): MeasurementRecord[] => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const id = cleanText(record.id);
    if (!id) return [];
    return [{ id, room: cleanText(record.room), item: cleanText(record.item), widthMm: cleanPositiveNumber(record.widthMm), heightMm: cleanPositiveNumber(record.heightMm), depthMm: cleanPositiveNumber(record.depthMm), note: cleanText(record.note) }];
  }) : [];
  const statuses: readonly DefectStatus[] = ['발견', '접수', '방문 예정', '보수 중', '재점검', '완료'];
  const defects = Array.isArray(input.defects) ? input.defects.flatMap((item): DefectRecord[] => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const id = cleanText(record.id);
    if (!id) return [];
    const severity = record.severity === '낮음' || record.severity === '높음' ? record.severity : '보통';
    const status = statuses.includes(record.status as DefectStatus) ? record.status as DefectStatus : '발견';
    return [{ id, room: cleanText(record.room), description: cleanText(record.description), severity, status, foundAt: cleanText(record.foundAt), receiptNumber: cleanText(record.receiptNumber), revisitNote: cleanText(record.revisitNote) }];
  }) : [];

  return {
    v: 1,
    dates: cleanDates(input.dates),
    completedTaskIds: Array.isArray(input.completedTaskIds) ? input.completedTaskIds.filter((id): id is string => typeof id === 'string').slice(0, 100) : [],
    quotes,
    measurements,
    defects,
  };
};
