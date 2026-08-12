import { addDays } from '../../lib/calc/dates';
import { EXPECTED_MOVE_IN_DATE } from '../presets/geomdan-lakepark';
import type { RateSource } from '../rates';

/**
 * 입주까지의 큐레이션 마일스톤.
 *
 * 중도금 회차와 입주지정일은 여기 넣지 않는다 — PAYMENT_STRUCTURE.interim.dates와
 * EXPECTED_MOVE_IN_DATE가 단일 출처이며, buildMoveInTimeline이 거기서 파생한다.
 * 이 파일에는 공고·체크리스트에서 큐레이션한 부가 일정만 둔다.
 */

export type MilestoneKind = 'payment' | 'inspection' | 'admin' | 'moveIn';

/**
 * 대표 날짜의 정밀도. 'month'는 "2029-10-01"이 실은 "2029년 10월경"이라는 뜻이며,
 * UI는 이 값에 따라 일 단위 표기를 감춰야 한다.
 */
export type DatePrecision = 'day' | 'month' | 'quarter';

export type Milestone = {
  id: string;
  /** 대표 날짜 (YYYY-MM-DD). datePrecision과 함께 해석한다. */
  date: string;
  datePrecision: DatePrecision;
  title: string;
  kind: MilestoneKind;
  confidence: 'confirmed' | 'estimated';
  note?: string;
  source?: RateSource;
};

/** 모집공고: 입주지정기간 시작 45일 전까지 2일 이상 사전방문 실시 예정 */
const PRE_INSPECTION_LEAD_DAYS = 45;

/** 잔금대출 상담·이사 견적 등 입주 준비를 시작할 권장 시점 (입주 약 3개월 전) */
const PREP_LEAD_DAYS = 90;

export const CURATED_MILESTONES: readonly Milestone[] = [
  {
    id: 'move-in-prep-start',
    date: addDays(EXPECTED_MOVE_IN_DATE, -PREP_LEAD_DAYS),
    datePrecision: 'quarter',
    title: '입주 준비 본격 시작 시점',
    kind: 'admin',
    confidence: 'estimated',
    note: '잔금대출 사전상담, 이사·입주청소 견적 비교, 가전·가구 실측 예약을 시작할 권장 시점입니다.',
  },
  {
    id: 'pre-inspection',
    date: addDays(EXPECTED_MOVE_IN_DATE, -PRE_INSPECTION_LEAD_DAYS),
    datePrecision: 'month',
    title: '입주자 사전방문 (사전점검)',
    kind: 'inspection',
    confidence: 'estimated',
    note: '모집공고 기준 입주지정기간 시작 45일 전까지 2일 이상 실시 예정. 정확한 일정은 별도 통보되며, 입주예정일 자체가 추정이므로 이 날짜도 추정입니다.',
    source: {
      asOf: '2026-08-11',
      label: '입주자모집공고 2026000194·2026000195',
      url: '',
      confidence: 'confirmed',
    },
  },
] as const;
