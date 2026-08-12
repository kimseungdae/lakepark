import type { InfoSource, StatusCategory, StatusItem } from '../data/status/types';

export type EditorialStatus = 'operating' | 'inProgress' | 'planned' | 'recheck';

export type EditorialUpdate = {
  id: string;
  category: StatusCategory;
  headline: string;
  dek: string;
  status: EditorialStatus;
  changedAt?: string;
  checkedAt: string;
  whatChanged: string;
  currentMeaning: string;
  nextCheck: string;
  sources: readonly InfoSource[];
};

const toStatus = (item: StatusItem): EditorialStatus => {
  if (item.stage === '확인필요' || item.stage === '의견' || item.stage === '홍보') return 'recheck';
  if (item.stage === '확정' || item.lifecycle === 7) return 'operating';
  if (item.stage === '추진') return 'inProgress';
  if (item.stage === '계획') return 'planned';
  return item.lifecycle !== undefined && item.lifecycle >= 4 ? 'inProgress' : 'planned';
};

export const toEditorialUpdate = (item: StatusItem): EditorialUpdate => {
  const latest = item.history[0];
  return {
    id: item.id,
    category: item.category,
    headline: item.title,
    dek: item.summary,
    status: toStatus(item),
    ...(latest?.date ? { changedAt: latest.date } : {}),
    checkedAt: item.lastChecked,
    whatChanged: latest?.summary ?? item.summary,
    currentMeaning: item.summary,
    nextCheck: item.caution ?? '다음 공식 발표와 운영 상태를 다시 확인합니다.',
    sources: item.sources,
  };
};
