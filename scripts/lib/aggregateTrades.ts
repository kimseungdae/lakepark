import type { MarketMonthly, MarketTrade } from '../../src/data/generated/types.ts';

/**
 * 실거래 원시 레코드 → 스냅샷 집계 (순수 함수 — vitest 대상).
 */

/** API item 레코드 → 거래. 필수 필드가 깨져 있으면 null (조용히 제외). */
export function toTrade(item: Record<string, string>): MarketTrade | null {
  const amountMan = Number((item.dealAmount ?? '').replace(/,/g, '').trim());
  const year = Number(item.dealYear);
  const month = Number(item.dealMonth);
  const day = Number(item.dealDay);
  const aptNm = (item.aptNm ?? '').trim();
  const umdNm = (item.umdNm ?? '').trim();

  if (!aptNm || !umdNm || !Number.isFinite(amountMan) || amountMan <= 0) return null;
  if (!year || !month || !day) return null;

  const dealDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const canceled = (item.cdealType ?? '').trim() === 'O';

  const trade: MarketTrade = {
    aptNm,
    umdNm,
    excluUseAr: Number(item.excluUseAr) || 0,
    floor: Number(item.floor) || 0,
    dealDate,
    amountMan,
    canceled,
  };
  const canceledDate = (item.cdealDay ?? '').trim();
  if (canceled && canceledDate) trade.canceledDate = canceledDate.replace(/\./g, '-');
  const dealingGbn = (item.dealingGbn ?? '').trim();
  if (dealingGbn) trade.dealingGbn = dealingGbn;
  return trade;
}

/** 舊·新 시군구 코드 병행 조회로 생기는 중복 제거용 키 */
export function tradeKey(trade: MarketTrade): string {
  return [trade.aptNm, trade.umdNm, trade.dealDate, trade.amountMan, trade.floor, trade.excluUseAr].join('|');
}

export function dedupeTrades(trades: MarketTrade[]): MarketTrade[] {
  const seen = new Map<string, MarketTrade>();
  for (const trade of trades) {
    const key = tradeKey(trade);
    // 같은 거래가 한쪽에서만 해제로 갱신됐다면 해제 정보를 우선한다.
    const existing = seen.get(key);
    if (!existing || (trade.canceled && !existing.canceled)) seen.set(key, trade);
  }
  return [...seen.values()];
}

function median(sorted: number[]): number | null {
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

/** 최근 monthsCount개월의 'YYYY-MM' 목록 (오래된 순). today는 'YYYY-MM-DD'. */
export function recentMonths(today: string, monthsCount: number): string[] {
  const [year, month] = today.split('-').map(Number);
  const months: string[] = [];
  for (let i = monthsCount - 1; i >= 0; i -= 1) {
    const index = (year! * 12 + (month! - 1)) - i;
    const y = Math.floor(index / 12);
    const m = (index % 12) + 1;
    months.push(`${y}-${String(m).padStart(2, '0')}`);
  }
  return months;
}

/**
 * 월별 집계 + 최근 거래 목록.
 * 신고기한이 계약 후 30일이므로 당월·전월은 provisional로 표시한다.
 */
export function aggregateTrades(
  trades: MarketTrade[],
  today: string,
  monthsCount = 13,
  recentLimit = 30,
): { monthly: MarketMonthly[]; recentTrades: MarketTrade[] } {
  const deduped = dedupeTrades(trades);
  const months = recentMonths(today, monthsCount);
  const provisionalFrom = months.at(-2) ?? months.at(-1)!;

  const monthly: MarketMonthly[] = months.map((month) => {
    const inMonth = deduped.filter((t) => t.dealDate.startsWith(month) && !t.canceled);
    const amounts = inMonth.map((t) => t.amountMan).sort((a, b) => a - b);
    return {
      month,
      count: inMonth.length,
      medianAmountMan: median(amounts),
      provisional: month >= provisionalFrom,
    };
  });

  const recentTrades = [...deduped]
    .sort((a, b) => b.dealDate.localeCompare(a.dealDate) || b.amountMan - a.amountMan)
    .slice(0, recentLimit);

  return { monthly, recentTrades };
}
