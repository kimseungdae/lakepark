# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트

"검단더샵 입주노트" — 검단레이크파크 AB22·AB23 예비입주민 대상 모바일 우선 정보 사이트.
Astro 7, `output: 'static'`. 서버 런타임이 없는 것은 의도적 결정이다(개인정보를 서버에
보관할 여지 제거). 주석·문서는 한국어가 관례다. KPI는 PV가 아니라 뉴스레터 구독자 수.

라우트: `/`(맞춤 홈) · `/status`(개발계획 상태판) · `/guide`(타입·동 가이드) ·
`/timeline`(입주 D-day 일정) · `/calculator`(총비용 계산기) · `/about` · `/privacy`.
UX 원칙: 요약 먼저, 상세는 `<details>`로 선택. 모바일(≤640px)은 하단 탭바가 내비게이션.

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

UI는 `src/pages/*.astro` + `src/layouts/Base.astro` + `src/components/*.astro`.
클라이언트 로직은 `src/scripts/`(calculator·home·timeline)가 바닐라 TS로 DOM을 직접 다룬다
(프레임워크 없음 — 추가하지 말 것).

## 정보 사이트 데이터 (KB 큐레이션)

```
src/data/status/     상태판 — StatusItem(stage 확정/추진/계획/홍보/의견/확인필요,
                     생애주기 0~7, 이력, 출처+등급 A/B/C/F). 원천: docs/30-location-outlook
src/data/complex/    타입 가이드(확인/해석 분리)·동별 생활영향. 원천: docs/10-complex
src/data/timeline/   큐레이션 마일스톤 (중도금·입주일은 넣지 않음 — 프리셋에서 파생)
src/lib/timeline.ts  D-day·다음 회차·타임라인 파생 (순수 TS)
src/lib/status.ts    최근 변경·오래된 정보 판정 (순수 TS)
src/lib/profile.ts   localStorage 프로필 (파싱은 순수 함수로 분리, 테스트 대상)
```

- **KB 분리**: `docs/`는 연구 지식베이스다. 웹에 낼 내용은 `src/data/`에 구조화 필드로
  재작성(요약+출처)하며, docs/ 마크다운을 import하거나 장문 복제하지 않는다.
  `docs/50-site-business/`(전략 문서)는 절대 웹에 노출하지 않는다.
- **D-day는 반드시 클라이언트에서 계산**한다 (`src/lib/today.ts`의 todayISO).
  .astro 프론트매터(빌드 시점)에서 `new Date()`로 D-day를 만들면 날짜가 박제된다.
- **프로필은 localStorage에만** 저장하고 어디로도 전송하지 않는다. 동·호수는 묻지 않는다.
- 데이터 파일을 갱신하면 `lastChecked`·`history`를 함께 갱신하고 `npm test`로
  무결성 테스트(status/complexData/timeline)를 통과시킬 것.

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
6. **상표(2026-08-12 갱신)**: 운영자 결정으로 사이트명("검단더샵 입주노트")에 브랜드명을
   사용한다. 완화 조치로 "비공식·시공사와 무관" 고지를 헤더 배지·푸터 면책에 상시 유지한다.
   도메인·수익화(광고·제휴) 결정 시점에 이 리스크를 재평가할 것(`src/data/site.ts` 주석 참조).
7. 다주택 중과세율(8%·12%)은 **의도적으로 미지원**. 도면·조감도 이미지 디렉터리도 만들지 않는다.

## 기타

- TypeScript strict + `noUncheckedIndexedAccess` + `verbatimModuleSyntax` (TS 7).
- `src/data/site.ts`의 `stibeeFormAction`·`cloudflareAnalyticsToken`이 비어 있으면
  해당 구독 섹션·계측 스크립트는 렌더링되지 않는다(배포 전 채움).
- 미확정 값(중도금 무이자 여부, 입주지정일, 옵션 취득세 과세표준 포함 범위 등)은
  README "아직 확정되지 않은 값" 표를 참조.
- `docs/`·`sources/`·`templates/`·`research_inbox/`는 단지 연구 지식베이스(Markdown)로,
  계산기 코드와 독립적이다. 색인은 `docs/README.md`·`docs/INDEX.md`, 운영 규칙은
  `docs/00-meta/knowledge_base_rules.md` 참조. 공고 수치를 코드에 반영할 때는
  `docs/20-contract-finance/`의 납부액 자료와 교차 확인할 것.
