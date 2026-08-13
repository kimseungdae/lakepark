import { describe, expect, test } from 'vitest';
import { ANALYSES } from '../src/data/analysis/items';
import { STATUS_BOARD } from '../src/data/status/board';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 시세·가격 전망 금지 원칙의 기계적 강제.
 * 생활영향 분석은 생활(시간·거리·이용 가능성)만 다룬다 — 부동산 가치 서술이
 * 한 글자라도 들어가면 이 테스트가 커밋을 막는다.
 */
const FORBIDDEN = /시세|집값|프리미엄|가격\s*(상승|하락|전망)|투자\s*가치|자산\s*가치/;

describe('ANALYSES 데이터 무결성', () => {
  test('id가 유일하고 statusItemId가 실제 상태판 항목이다', () => {
    const ids = ANALYSES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);

    const statusIds = new Set(STATUS_BOARD.map((item) => item.id));
    for (const analysis of ANALYSES) {
      expect(statusIds.has(analysis.statusItemId), `${analysis.id} → 미지의 상태판 항목`).toBe(true);
    }
  });

  test('기준일·출처 형식이 올바르다', () => {
    for (const analysis of ANALYSES) {
      expect(analysis.basisDate).toMatch(DATE_RE);
      expect(analysis.sources.length, `${analysis.id} 출처 없음`).toBeGreaterThan(0);
      for (const source of analysis.sources) {
        expect(source.asOf).toMatch(DATE_RE);
      }
    }
  });

  test('생활영향·시나리오 3종·행동 어젠다가 전부 채워져 있다', () => {
    for (const analysis of ANALYSES) {
      expect(analysis.lifeImpacts.length, `${analysis.id} lifeImpacts`).toBeGreaterThan(0);
      expect(analysis.residentActions.length, `${analysis.id} residentActions`).toBeGreaterThan(0);

      for (const scenario of Object.values(analysis.scenarios)) {
        expect(scenario.assumption.length).toBeGreaterThan(0);
        expect(scenario.life.length).toBeGreaterThan(0);
        expect(scenario.signals.length, `${analysis.id} 관찰 신호 없음`).toBeGreaterThan(0);
      }

      for (const action of analysis.residentActions) {
        expect(action.procedure.length, `${analysis.id} ${action.title} 절차 없음`).toBeGreaterThan(0);
        expect(action.channel.url, `${analysis.id} ${action.title} 창구 URL 없음`).toMatch(/^https:\/\//);
      }
    }
  });
});

describe('시세·가격 전망 금지 (구조적 원칙)', () => {
  test('어떤 서술 필드에도 부동산 가치 표현이 없다', () => {
    for (const analysis of ANALYSES) {
      const text = JSON.stringify(analysis);
      const match = text.match(FORBIDDEN);
      expect(match, `${analysis.id}에 금지 표현 발견: "${match?.[0]}"`).toBeNull();
    }
  });
});
