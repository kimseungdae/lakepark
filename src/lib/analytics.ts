import { SITE } from '../data/site';

/**
 * 이 프로젝트의 3년간 유일한 KPI는 PV가 아니라 "계산기 완료 사용"과 "구독 전환"이다.
 * (배너 광고 기준 기대 수익이 월 1~3만원 수준이라 PV를 좇는 것은 의미가 없다.)
 *
 * 개인정보를 수집하지 않기 위해 쿠키·식별자 없이 이벤트 이름만 보낸다.
 * 수집 엔드포인트가 설정되지 않았으면 아무것도 하지 않는다 — 조용히 실패하되 거짓말하지 않는다.
 */
export type TrackedEvent = 'calc_completed' | 'subscribe_converted' | 'preset_selected';

const fired = new Set<TrackedEvent>();

/**
 * 세션당 한 번만 보낸다. 입력을 고칠 때마다 재계산되므로
 * 매 계산을 세지 않아야 "완료 사용" 지표가 부풀지 않는다.
 */
export function trackOnce(event: TrackedEvent): void {
  if (fired.has(event)) return;
  fired.add(event);
  track(event);
}

export function track(event: TrackedEvent): void {
  if (typeof window === 'undefined') return;

  // Cloudflare Web Analytics는 자동 페이지뷰만 수집한다.
  // 커스텀 이벤트 수집처가 없으면 여기서 끝낸다.
  if (!SITE.cloudflareAnalyticsToken) {
    if (import.meta.env.DEV) console.debug('[analytics:noop]', event);
    return;
  }

  // 수집처가 생기면 이 자리에 sendBeacon을 연결한다.
  // 지금은 토큰만 있고 커스텀 이벤트 엔드포인트가 없으므로 no-op이다.
  if (import.meta.env.DEV) console.debug('[analytics]', event);
}
