import type { GEOMDAN_LAKEPARK } from '../presets/geomdan-lakepark';
import type { InfoSource } from '../status/types';

/**
 * 동별 생활영향 — docs/10-complex/block_specific_living_impacts.md에서 큐레이션.
 *
 * 모집공고에 직접 적힌 동별 시설 인접 정보만 담는다 (개인 계약 정보와 무관한 공개 자료).
 * 위치는 시공 중 변경될 수 있으므로 UI가 "최종 준공도서 확인 전 확정 아님"을 표시해야 한다.
 */
export type BlockId = keyof typeof GEOMDAN_LAKEPARK.blocks;

export type ImpactKind =
  | 'community' // 주민공동시설
  | 'waste' // 음식물·분리수거
  | 'traffic' // 차량 출입구
  | 'parking' // 지상주차장
  | 'machine' // 기계실
  | 'antenna' // 통신·TV 안테나
  | 'privacy' // 사생활보호필름
  | 'safety' // 어린이 승하차장
  | 'boundary'; // 대지경계

export const IMPACT_KIND_LABELS: Record<ImpactKind, string> = {
  community: '커뮤니티',
  waste: '쓰레기',
  traffic: '차량 출입',
  parking: '지상주차',
  machine: '기계실',
  antenna: '안테나',
  privacy: '사생활',
  safety: '승하차장',
  boundary: '대지경계',
};

export type BuildingImpact = {
  block: BlockId;
  /** 공고에 적힌 동 번호. 특정 동이 아닌 위치 설명이면 빈 배열. */
  buildings: string[];
  /** '하부', '인근', '옥상·옥탑' 등 공고상 위치 표현 */
  location?: string;
  kind: ImpactKind;
  description: string;
};

/** 두 공고의 동별 유의사항 섹션 (59~66쪽) */
export const IMPACTS_SOURCE: InfoSource = {
  asOf: '2026-06-12',
  label: '입주자모집공고 2026000194·2026000195 (동별 유의사항)',
  url: '',
  confidence: 'confirmed',
  grade: 'A',
};

export const BUILDING_IMPACTS: readonly BuildingImpact[] = [
  // ── AB22BL (62xx동) ──────────────────────────────────
  {
    block: 'AB22',
    buildings: ['6203', '6204', '6205', '6206'],
    location: '하부',
    kind: 'community',
    description: '주민공동시설 사용에 따른 소음·진동·간섭 가능',
  },
  {
    block: 'AB22',
    buildings: ['6206', '6207'],
    location: '사이 지상',
    kind: 'waste',
    description: '음식물쓰레기 배출패널과 수거차량으로 냄새·소음 가능',
  },
  {
    block: 'AB22',
    buildings: ['6202', '6209', '6212'],
    location: '쓰레기분리수거장',
    kind: 'waste',
    description: '추가 음식물쓰레기 투입구 계획',
  },
  {
    block: 'AB22',
    buildings: ['6201', '6213', '6209'],
    location: '인근',
    kind: 'traffic',
    description: '차량 출입구와 진입 알람벨 영향 가능',
  },
  {
    block: 'AB22',
    buildings: ['6212', '6213'],
    location: '인근',
    kind: 'parking',
    description: '지상주차장 차량통행·빛·소음 가능',
  },
  {
    block: 'AB22',
    buildings: [],
    location: '주·부출입구 인접',
    kind: 'safety',
    description: '어린이 안전 승하차장 영향 가능',
  },
  {
    block: 'AB22',
    buildings: ['6207', '6211', '6212'],
    location: '하부 인접',
    kind: 'machine',
    description: '기계실 소음·진동 가능',
  },
  {
    block: 'AB22',
    buildings: ['6202', '6205', '6208', '6211', '6213'],
    location: '옥상·옥탑',
    kind: 'antenna',
    description: '이동통신 안테나·중계기 계획',
  },
  {
    block: 'AB22',
    buildings: ['6212'],
    kind: 'antenna',
    description: 'TV 안테나 계획',
  },
  {
    block: 'AB22',
    buildings: ['6201', '6202', '6203'],
    location: '일부 라인 창호',
    kind: 'privacy',
    description: '사생활보호필름 계획 (6201동 5호, 6202동 1·4호, 6203동 1호라인)',
  },

  // ── AB23BL (63xx동) ──────────────────────────────────
  {
    block: 'AB23',
    buildings: ['6303', '6304'],
    location: '하부',
    kind: 'community',
    description: '주민공동시설 사용에 따른 소음·진동·간섭 가능',
  },
  {
    block: 'AB23',
    buildings: ['6302', '6305'],
    location: '사이 지상',
    kind: 'waste',
    description: '음식물쓰레기 배출패널과 수거차량으로 냄새·소음 가능',
  },
  {
    block: 'AB23',
    buildings: ['6304', '6309', '6313'],
    location: '쓰레기분리수거장',
    kind: 'waste',
    description: '추가 음식물쓰레기 투입구 계획',
  },
  {
    block: 'AB23',
    buildings: ['6301', '6313', '6311', '6312'],
    location: '인근',
    kind: 'traffic',
    description: '차량 출입구와 진입 알람벨 영향 가능',
  },
  {
    block: 'AB23',
    buildings: ['6312'],
    location: '인근',
    kind: 'parking',
    description: '지상주차장 차량통행·빛·소음 가능',
  },
  {
    block: 'AB23',
    buildings: ['6302'],
    location: '하부 인접',
    kind: 'machine',
    description: '기계실 사용에 따른 소음·진동 가능',
  },
  {
    block: 'AB23',
    buildings: [],
    location: '주출입구 인접',
    kind: 'safety',
    description: '어린이 안전 승하차장 영향 가능',
  },
  {
    block: 'AB23',
    buildings: ['6301', '6302', '6304', '6306', '6309', '6311', '6313'],
    location: '옥상·옥탑',
    kind: 'antenna',
    description: '이동통신 안테나·중계기 계획',
  },
  {
    block: 'AB23',
    buildings: ['6313'],
    kind: 'antenna',
    description: 'TV 안테나 계획',
  },
  {
    block: 'AB23',
    buildings: ['6308', '6309'],
    location: '일부 라인 창호',
    kind: 'privacy',
    description: '사생활보호필름 계획 (6308동 1호, 6309동 5호라인)',
  },
  {
    block: 'AB23',
    buildings: [],
    location: '남측 대지경계',
    kind: 'boundary',
    description: '공고 당시 레벨 미확정으로 옹벽·조경·시설 변경 가능',
  },
] as const;
