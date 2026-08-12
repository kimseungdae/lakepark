import type { RateSource } from '../rates';

/**
 * 개발계획 상태판 데이터 모델.
 *
 * 원칙 (docs/00-meta/knowledge_base_rules.md에서 가져옴):
 * - `계획 발표`와 `실제 이용 가능`을 구분한다. 입찰공고만으로 착공이라 쓰지 않고,
 *   준공만으로 개관이라 쓰지 않는다.
 * - 모든 항목은 마지막 확인일과 출처를 함께 노출해 사용자가 최신 여부를 판단하게 한다.
 * - docs/의 KB 문서를 그대로 복제하지 않는다 — 요약과 출처 링크로 재작성한 값만 담는다.
 */

/** KB 검증 상태 표기 그대로. UI 배지가 이 문자열을 직접 렌더한다. */
export type StatusStage = '확정' | '추진' | '계획' | '홍보' | '의견' | '확인필요';

/**
 * 사업 생애주기: 0 언급 → 1 계획 → 2 예산 → 3 공고 → 4 계약 → 5 착공 → 6 준공 → 7 운영.
 * 단계를 특정하기 어려운 항목(행정·복수 하위사업)은 생략한다.
 */
export type LifecycleStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const LIFECYCLE_LABELS = [
  '언급',
  '계획',
  '예산',
  '공고',
  '계약',
  '착공',
  '준공',
  '운영',
] as const;

/**
 * 근거 등급: A 법령·고시·공고 / B 기관 자료·보도자료·공공데이터 /
 * C 사업자 공식 안내 / F 정해진 방법으로 기록한 편집자 현장관찰.
 */
export type EvidenceGrade = 'A' | 'B' | 'C' | 'F';

export type InfoSource = RateSource & { grade?: EvidenceGrade };

export type StatusChange = {
  /** 변경(사건) 발생일 또는 확인일 (YYYY-MM-DD) */
  date: string;
  summary: string;
  /** 이 변경으로 단계가 바뀐 경우에만 기록 */
  stage?: StatusStage;
};

export type StatusCategory =
  | 'transport'
  | 'education'
  | 'park'
  | 'culture'
  | 'development'
  | 'admin';

export type StatusItem = {
  /** 앵커·이력 추적용 안정 키 (예: 'seoul-line5-extension') */
  id: string;
  title: string;
  category: StatusCategory;
  stage: StatusStage;
  lifecycle?: LifecycleStage;
  /** 접힌 카드에서 보이는 전부 — 한 줄로 현재 상태를 요약한다 */
  summary: string;
  /** "예타 통과 ≠ 개통" 류의 오해 방지 문구 */
  caution?: string;
  /** 마지막으로 원문을 확인한 날짜 */
  lastChecked: string;
  sources: InfoSource[];
  /** 최신순 정렬 */
  history: StatusChange[];
};
