import type { InfoSource } from '../status/types';

/**
 * 생활영향 분석 — 편집자 의견 콘텐츠의 데이터 모델.
 *
 * 원칙 (tests/analysis.test.ts가 기계적으로 강제):
 * 1. 시세·집값·프리미엄·가격 전망을 다루지 않는다. 생활(시간·거리·이용 가능성)만 다룬다.
 *    — KB outlook_framework: "실제 생활 개선과 시장가격에 반영되는 시점을 분리해서 본다"
 * 2. 자동 생성·자동 게시 금지. AI는 초안 도구일 뿐, 저장소에는 검수 완료본만 커밋한다.
 * 3. 시나리오는 순항·지연·축소 3종을 반드시 함께 쓴다 (한쪽 전망 단정 금지).
 * 4. UI는 반드시 '의견' 표시와 기준일(basisDate)을 노출한다.
 */

/** 생활 영역: 출퇴근 / 통학·교육 / 여가 / 생활편의 */
export type LifeArea = 'commute' | 'school' | 'leisure' | 'daily';

export const LIFE_AREA_LABELS: Record<LifeArea, string> = {
  commute: '출퇴근',
  school: '통학·교육',
  leisure: '여가',
  daily: '생활편의',
};

export type LifeImpact = {
  area: LifeArea;
  /** 지금은 어떤가 — 현재 확인 가능한 사실 기반 */
  current: string;
  /** 실현되면 무엇이 달라지나 — 행위·시간·거리의 변화로 서술 */
  after: string;
  /** 언제쯤인가 — 확정이 아님을 문구에 포함해 서술 */
  when: string;
  confidence: 'confirmed' | 'estimated';
};

export type Scenario = {
  /** 이 시나리오의 전제 */
  assumption: string;
  /** 이 시나리오에서 입주자 생활은 어떻게 되나 */
  life: string;
  /** 이 시나리오로 가고 있는지 판별할 관찰 신호 (공고·고시·발주 등) */
  signals: string[];
};

export type ActionDifficulty = 'easy' | 'medium' | 'hard';

export const ACTION_DIFFICULTY_LABELS: Record<ActionDifficulty, string> = {
  easy: '지금 바로',
  medium: '여럿이 함께',
  hard: '장기 과제',
};

/** 입주(예정)자들이 힘을 모으면 실제로 움직일 수 있는 행동 제안 */
export type ResidentAction = {
  title: string;
  /** 근거가 되는 행정 절차 — 어떤 제도의 어느 단계에 의견이 들어가는지 */
  procedure: string;
  /** 실제 접수 창구 */
  channel: { label: string; url: string };
  difficulty: ActionDifficulty;
};

export type ImpactAnalysis = {
  /** URL 경로 키 — statusItemId와 동일하게 둔다 */
  id: string;
  /** 연결되는 STATUS_BOARD 항목 id (테스트로 무결성 검증) */
  statusItemId: string;
  title: string;
  /** 두 문장 이내 핵심 요약 */
  summary: string;
  lifeImpacts: LifeImpact[];
  scenarios: { smooth: Scenario; delayed: Scenario; reduced: Scenario };
  residentActions: ResidentAction[];
  /** 분석 기준일 — 이 날짜 이후 사실이 바뀌면 갱신 대상 */
  basisDate: string;
  sources: InfoSource[];
  /** 항목별 추가 고지 (공통 고지는 페이지가 렌더) */
  disclaimer?: string;
};
