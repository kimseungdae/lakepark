# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트

분양 아파트 총비용 계산기 — 계약금·중도금·잔금에 취득세·등기비·유상옵션·입주 부대비용을 더해
**시점별로 필요한 현금**을 계산하는 정적 웹 도구. Astro 7, `output: 'static'`.
서버 런타임이 없는 것은 의도적 결정이다(개인정보를 서버에 보관할 여지 제거). 주석·문서는 한국어가 관례다.

## 명령

```bash
npm run dev                          # 개발 서버
npm test                             # vitest run — 전체 테스트
npx vitest run tests/golden.test.ts  # 단일 테스트 파일
npx vitest run -t "테스트 이름"       # 이름으로 단일 테스트
npm run test:watch                   # watch 모드
npm run typecheck                    # tsc -p tsconfig.check.json — .ts만 검사
npm run build                        # 정적 산출물. .astro 파일 오류는 여기서 잡힌다
```

`@astrojs/check`가 TypeScript 7을 지원하지 않아 typecheck는 `.ts`만 본다.
`.astro` 파일을 수정했다면 `npm run build`로 검증할 것.

## 계산 파이프라인 (핵심 데이터 흐름)

```
src/data/presets/geomdan-lakepark.ts  공고 확정 납부 구조(PAYMENT_STRUCTURE) + 타입별 가격
→ src/lib/calc/presetAdapter.ts       공고 구조에 개인 변수(계약일·분양가·옵션·대출비율)만 얹음
→ src/lib/calc/schedule.ts            계약금/중도금/잔금 + 옵션 별도 트랙 → PaymentEvent[]
→ src/lib/calc/total.ts               schedule + loanInterest + acquisitionTax + moveInCosts 합성
```

UI는 `src/pages/*.astro` + `src/layouts/Base.astro`, 클라이언트 로직은 `src/scripts/calculator.ts`
하나가 DOM을 직접 다룬다.

## 설계 계약 (위반 금지)

1. **`src/lib/calc/`에 프레임워크 import 금지** — 순수 TS 함수만. 스택을 갈아타도 calc와
   테스트가 그대로 이식되도록 유지한다.
2. **정책 숫자는 `src/data/rates.ts`에만** 둔다. calc 로직에 세율·요율 하드코딩 금지.
   모든 값에 `asOf`·`label`·`url`·`confidence('confirmed'|'estimated')`를 붙인다.
3. **confirmed(공고 확정)와 estimated(추정) 금액을 합산한 단일 총액을 만들지 않는다.**
   `calculateTotalCost`가 둘을 분리해 반환하는 것은 의도된 설계다.
4. **원 단위 정확성**: 잔금·마지막 회차가 반올림 잔차를 흡수해 회차 합계가 공급금액과
   원 단위로 일치해야 한다. `tests/golden.test.ts`가 입주자모집공고 기준표와 대조한다 —
   이 테스트가 프로젝트의 존재 이유다.
5. **프리셋에는 공개된 공고 값만.** 개인 계약 세대의 동·호·금액을 저장소에 남기지 않는다.
6. **사이트명·도메인에 시공사 브랜드·단지명 금지**("더샵", "검단레이크파크" 등).
   단지명은 계산기 프리셋의 데이터 값으로만 등장한다(`src/data/site.ts`).
7. 다주택 중과세율(8%·12%)은 **의도적으로 미지원**. 도면·조감도 이미지 디렉터리도 만들지 않는다.

## 기타

- TypeScript strict + `noUncheckedIndexedAccess` + `verbatimModuleSyntax` (TS 7).
- `src/data/site.ts`의 `stibeeFormAction`·`cloudflareAnalyticsToken`이 비어 있으면
  해당 구독 섹션·계측 스크립트는 렌더링되지 않는다(배포 전 채움).
- 미확정 값(중도금 무이자 여부, 입주지정일, 옵션 취득세 과세표준 포함 범위 등)은
  README "아직 확정되지 않은 값" 표를 참조.
