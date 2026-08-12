import { GEOMDAN_LAKEPARK, type UnitTypeCode } from '../data/presets/geomdan-lakepark';
import { getBuildingOptions } from './priceResolver';
import { todayISO } from './today';

/**
 * 홈 개인화 프로필 — localStorage에만 존재하며 어디로도 전송되지 않는다 (무서버 원칙).
 * 파싱(parseProfile)은 순수 함수로 분리해 node 환경 vitest로 검증한다.
 */

export type BlockId = keyof typeof GEOMDAN_LAKEPARK.blocks;

export type UserProfile = {
  v: 1;
  block: BlockId;
  type: UnitTypeCode;
  /** 계산기에서 "내 프로필로 저장"을 눌렀을 때만 채워진다 */
  supplyPrice?: number;
  contractDate?: string;
  savedAt: string;
};

/** 키 이름에 버전을 포함한다. 스키마가 바뀌면 profile.v2로 옮기고 여기서 마이그레이션한다. */
export const PROFILE_KEY = 'profile.v1';
export const PROFILE_V2_KEY = 'profile.v2';

export type UserProfileV2 = {
  v: 2;
  block: BlockId;
  unitType: UnitTypeCode;
  building?: string;
  floor?: number;
  line?: number;
  supplyPrice?: number;
  contractDate?: string;
  loanRatio?: number;
  loanRate?: number;
  savedAt: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 저장된 문자열을 검증해 프로필로 복원한다.
 * 손상된 JSON, 미지원 버전, 프리셋에 없는 블록·타입은 전부 null — 조용히 미선택 상태로 강등한다.
 */
export function parseProfile(raw: string | null): UserProfile | null {
  if (!raw) return null;

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;

  const p = data as Record<string, unknown>;
  if (p.v !== 1) return null;
  if (typeof p.block !== 'string' || !(p.block in GEOMDAN_LAKEPARK.blocks)) return null;
  const block = p.block as BlockId;

  if (typeof p.type !== 'string') return null;
  const type = GEOMDAN_LAKEPARK.blocks[block].types.find((t) => t.code === p.type)?.code;
  if (!type) return null;

  const profile: UserProfile = {
    v: 1,
    block,
    type,
    savedAt: typeof p.savedAt === 'string' && DATE_RE.test(p.savedAt) ? p.savedAt : '',
  };
  if (typeof p.supplyPrice === 'number' && Number.isFinite(p.supplyPrice) && p.supplyPrice > 0) {
    profile.supplyPrice = p.supplyPrice;
  }
  if (typeof p.contractDate === 'string' && DATE_RE.test(p.contractDate)) {
    profile.contractDate = p.contractDate;
  }
  return profile;
}

function toV2(profile: UserProfile): UserProfileV2 {
  return {
    v: 2,
    block: profile.block,
    unitType: profile.type,
    ...(profile.supplyPrice ? { supplyPrice: profile.supplyPrice } : {}),
    ...(profile.contractDate ? { contractDate: profile.contractDate } : {}),
    savedAt: profile.savedAt,
  };
}

export function parseProfileV2(raw: string | null): UserProfileV2 | null {
  if (!raw) return null;

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;

  const p = data as Record<string, unknown>;
  if (p.v === 1) return parseProfile(raw) ? toV2(parseProfile(raw)!) : null;
  if (p.v !== 2) return null;
  if (typeof p.block !== 'string' || !(p.block in GEOMDAN_LAKEPARK.blocks)) return null;
  const block = p.block as BlockId;
  if (typeof p.unitType !== 'string') return null;
  const unitType = GEOMDAN_LAKEPARK.blocks[block].types.find(
    (type) => type.code === p.unitType,
  )?.code;
  if (!unitType) return null;

  const profile: UserProfileV2 = {
    v: 2,
    block,
    unitType,
    savedAt: typeof p.savedAt === 'string' && DATE_RE.test(p.savedAt) ? p.savedAt : '',
  };
  const buildingIds = new Set(
    getBuildingOptions()
      .filter((option) => option.block === block)
      .map((option) => String(option.building)),
  );
  if (typeof p.building === 'string' && buildingIds.has(p.building)) profile.building = p.building;
  if (typeof p.floor === 'number' && Number.isInteger(p.floor) && p.floor >= 1 && p.floor <= 99) {
    profile.floor = p.floor;
  }
  if (typeof p.line === 'number' && Number.isInteger(p.line) && p.line >= 1 && p.line <= 20) {
    profile.line = p.line;
  }
  if (typeof p.supplyPrice === 'number' && Number.isFinite(p.supplyPrice) && p.supplyPrice > 0) {
    profile.supplyPrice = p.supplyPrice;
  }
  if (typeof p.contractDate === 'string' && DATE_RE.test(p.contractDate)) {
    profile.contractDate = p.contractDate;
  }
  if (typeof p.loanRatio === 'number' && p.loanRatio >= 0 && p.loanRatio <= 0.6) {
    profile.loanRatio = p.loanRatio;
  }
  if (typeof p.loanRate === 'number' && p.loanRate >= 0 && p.loanRate <= 0.2) {
    profile.loanRate = p.loanRate;
  }
  return profile;
}

export function loadProfileV2(): UserProfileV2 | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return (
      parseProfileV2(localStorage.getItem(PROFILE_V2_KEY)) ??
      parseProfileV2(localStorage.getItem(PROFILE_KEY))
    );
  } catch {
    return null;
  }
}

export function saveProfileV2(input: Omit<UserProfileV2, 'v' | 'savedAt'>): void {
  if (typeof localStorage === 'undefined') return;
  const profile: UserProfileV2 = { ...input, v: 2, savedAt: todayISO() };
  try {
    localStorage.setItem(PROFILE_V2_KEY, JSON.stringify(profile));
  } catch {
    return;
  }
}

export function loadProfile(): UserProfile | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return parseProfile(localStorage.getItem(PROFILE_KEY));
  } catch {
    return null;
  }
}

export function saveProfile(input: Omit<UserProfile, 'v' | 'savedAt'>): void {
  if (typeof localStorage === 'undefined') return;
  const profile: UserProfile = { ...input, v: 1, savedAt: todayISO() };
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // 저장 실패(시크릿 모드 등)는 기능 저하일 뿐이므로 조용히 무시한다.
  }
}

export function clearProfile(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(PROFILE_V2_KEY);
  } catch {
    // 무시
  }
}
