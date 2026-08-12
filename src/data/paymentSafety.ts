import type { PriceBlockId } from './prices/officialSupplyPrices';

export type PaymentAccount = {
  block: PriceBlockId;
  kind: 'firstPayment' | 'balcony' | 'option';
  label: string;
  bank: string;
  account: string;
  holder: string;
  sourcePage: number;
  warning: string;
};

export const PAYMENT_ACCOUNTS: readonly PaymentAccount[] = [
  { block: 'AB22', kind: 'firstPayment', label: '1차 계약금', bank: '우리은행', account: '1005-180-206004', holder: '한국자산신탁(주)', sourcePage: 35, warning: '2차 계약금·중도금·잔금은 계약서의 세대별 가상계좌를 사용합니다.' },
  { block: 'AB22', kind: 'balcony', label: '발코니 확장', bank: '우리은행', account: '1005-880-206003', holder: '한국자산신탁(주)', sourcePage: 42, warning: '분양대금 계좌와 다릅니다.' },
  { block: 'AB22', kind: 'option', label: '추가선택품목', bank: '우리은행', account: '1005-004-902207', holder: '(주)포스코이앤씨', sourcePage: 51, warning: '분양대금·발코니 계좌 및 예금주와 다릅니다.' },
  { block: 'AB23', kind: 'firstPayment', label: '1차 계약금', bank: '광주은행', account: '1107-021-888604', holder: '한국자산신탁(주)', sourcePage: 35, warning: '2차 계약금·중도금·잔금은 계약서의 세대별 가상계좌를 사용합니다.' },
  { block: 'AB23', kind: 'balcony', label: '발코니 확장', bank: '광주은행', account: '1107-021-888591', holder: '한국자산신탁(주)', sourcePage: 42, warning: '분양대금 계좌와 다릅니다.' },
  { block: 'AB23', kind: 'option', label: '추가선택품목', bank: '우리은행', account: '1005-004-902207', holder: '(주)포스코이앤씨', sourcePage: 51, warning: '분양대금·발코니 계좌 및 예금주와 다릅니다.' },
];

export const HUG_GUARANTEES = {
  AB22: { number: '제01282026-101-0005000', amount: 567_973_000_000 },
  AB23: { number: '제01282026-101-0005100', amount: 552_208_860_000 },
} as const;
