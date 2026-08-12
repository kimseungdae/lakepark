import type { PriceBlockId } from '../data/prices/officialSupplyPrices';

export type RightsClock = {
  id: 'reapply' | 'resale' | 'moveInGrace' | 'residency';
  title: string;
  status: string;
  startsAt?: string;
  endsAt?: string;
  explanation: string;
  checkWith: string;
};

const announcementDates: Record<PriceBlockId, string> = {
  AB22: '2026-07-02',
  AB23: '2026-07-03',
};

export const getRightsClocks = (block: PriceBlockId): readonly RightsClock[] => [
  {
    id: 'reapply',
    title: '재당첨 제한',
    status: '공고상 10년',
    startsAt: announcementDates[block],
    explanation: '당첨자 발표일부터 10년으로 안내됐습니다. 새 청약 공고일에 적용 대상과 세대 범위를 다시 확인하세요.',
    checkWith: '청약홈·최신 주택공급규칙',
  },
  {
    id: 'resale',
    title: '전매 제한',
    status: '종료일 재확인 필요',
    startsAt: announcementDates[block],
    explanation: '입주자로 선정된 날부터 소유권이전등기일까지이며 3년 상한입니다. 매매뿐 아니라 증여 등 권리변동도 포함될 수 있습니다.',
    checkWith: '사업주체·최신 주택법',
  },
  {
    id: 'moveInGrace',
    title: '입주 유예',
    status: '최초 입주가능일부터 3년 이내',
    explanation: '거주의무 면제가 아닙니다. 실제 최초 입주가능일과 인정사유를 기준으로 따로 확인해야 합니다.',
    checkWith: 'LH·사업주체·2029년 법령',
  },
  {
    id: 'residency',
    title: '거주의무',
    status: '공고상 3년',
    explanation: '입주 후 계속거주 의무입니다. 개시일·산입기간·예외는 실제 입주 시점의 법령을 확인하세요.',
    checkWith: 'LH·사업주체·2029년 법령',
  },
];
