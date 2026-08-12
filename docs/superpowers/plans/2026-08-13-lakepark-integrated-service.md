# Lakepark Integrated Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 검단레이크파크 계약자가 공식 분양가와 입주비용을 계산하고, 입주 준비를 로컬에서 관리하고, 단지 사업·생활정보를 모바일 뉴스형 UI로 읽을 수 있는 정적 웹 서비스를 완성해 Vercel에 배포한다.

**Architecture:** Astro 7 정적 페이지와 Tailwind CSS 4를 UI 기반으로 사용한다. 공식 가격·일정·상태 판정은 `src/lib`의 순수 함수로, 사용자 상호작용과 브라우저 저장은 `src/scripts`와 로컬 어댑터로 분리한다. 기존 비용 계산 엔진과 상태 데이터는 재사용하고 공식 공급가, 입주 준비, 기사형 피드 어댑터를 추가한다.

**Tech Stack:** Astro 7, TypeScript strict, Tailwind CSS 4, Vitest, localStorage, IndexedDB, Vercel static hosting

## Global Constraints

- 모든 설명·UI·커밋 메시지는 한국어, 코드·변수명은 영어를 사용한다.
- TypeScript strict, 2-space 들여쓰기, 세미콜론, single quote를 유지한다.
- 서버 런타임·로그인·데이터베이스를 추가하지 않는다.
- 호수는 묻지 않고 사용자 금융값·사진을 서버나 분석 이벤트로 전송하지 않는다.
- 공식 분양가와 세금·이자·입주 준비비 예상값을 같은 확정 금액으로 합치지 않는다.
- 시세 전망·투자 판단·가격 상승 점수를 제공하지 않는다.
- Astro 7 `output: 'static'`과 기존 계산 엔진을 유지한다.
- Tailwind CSS 4는 `@tailwindcss/vite` 플러그인으로 설치한다.
- Pretendard Variable, antialiased 렌더링, 금액·날짜 `tabular-nums`를 적용한다.
- 모든 페이지는 키보드 접근, 44px 터치 대상, 텍스트 상태 표시를 제공한다.
- 각 작업은 관련 단위 테스트, `npm run typecheck`, 필요한 빌드 검증을 통과해야 한다.

---

## File Map

### Shared UI

- `astro.config.mjs`: Tailwind Vite 플러그인 등록
- `src/styles/global.css`: Tailwind import, 테마 토큰, 접근성·인쇄 기반 스타일
- `src/layouts/Base.astro`: 뉴스형 헤더·카테고리·푸터
- `src/components/SectionHeader.astro`: 뉴스 섹션 제목
- `src/components/StatusPill.astro`: 상태 텍스트 배지
- `src/components/NewsRow.astro`: 기사형 업데이트 행

### Official price and calculator

- `src/data/prices/officialSupplyPrices.ts`: 기본 가격 78행, 특별 가격 3행, 동·타입·라인 배정
- `src/lib/priceResolver.ts`: 공식 공급가 판정
- `tests/priceResolver.test.ts`: 감사 문서 35개와 무결성 테스트
- `src/lib/profile.ts`: v2 프로필, v1 마이그레이션
- `tests/profile.test.ts`: v1·v2 파싱과 강등 테스트
- `src/pages/calculator.astro`: 3단계 빠른 입력과 결과·상세 조건
- `src/scripts/calculator.ts`: 가격 판정과 기존 비용 계산 연결

### Payment tools

- `src/data/contract/paymentSafety.ts`: 계좌 대조·권리 기준 데이터
- `src/lib/ics.ts`: ICS 직렬화
- `src/lib/rights.ts`: 권리 참고 시계
- `tests/ics.test.ts`, `tests/rights.test.ts`: 내보내기·기한 테스트
- `src/components/PaymentSafety.astro`: 송금 전 5요소와 사후 영수증 체크

### Move-in planning

- `src/data/movein/tasks.ts`: 입주 행동·사전점검·생활 카드
- `src/lib/moveInPlanner.ts`: 사건 기반 일정 파생
- `src/lib/moveInStorage.ts`: v1 로컬 상태 검증·직렬화
- `tests/moveInPlanner.test.ts`, `tests/moveInStorage.test.ts`: 일정·저장 테스트
- `src/pages/move-in.astro`: 일정·체크·견적·하자 통합 화면
- `src/scripts/move-in.ts`: 브라우저 상호작용·IndexedDB 사진 저장

### News and content

- `src/lib/editorial.ts`: 기존 상태 데이터를 기사형 업데이트로 변환
- `tests/editorial.test.ts`: 상태·카피·정렬 테스트
- `src/pages/index.astro`: 대표 기사·빠른 계산·최근 업데이트·다음 행동
- `src/pages/status.astro`: 단지 소식 피드와 필터
- `src/pages/guide.astro`: 생활 정보와 타입·동 영향
- `src/pages/timeline.astro`: `/move-in` 호환 안내 또는 동일 데이터 표시
- `src/pages/privacy.astro`, `src/pages/about.astro`: 실제 저장·면책 문구

---

### Task 1: Tailwind 뉴스형 디자인 시스템

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `astro.config.mjs`
- Create: `src/styles/global.css`
- Modify: `src/layouts/Base.astro`
- Create: `src/components/SectionHeader.astro`
- Create: `src/components/StatusPill.astro`
- Create: `src/components/NewsRow.astro`

**Interfaces:**
- Produces: 모든 페이지가 사용하는 Tailwind 토큰과 뉴스형 레이아웃
- Produces: `StatusPill` props `{ label: string; tone: 'green' | 'blue' | 'orange' | 'red' | 'gray' }`
- Produces: `NewsRow` props `{ href: string; category: string; title: string; date?: string; status?: string }`

- [ ] **Step 1: Tailwind CSS 4 의존성을 설치한다**

Run: `npm install tailwindcss @tailwindcss/vite`

Expected: `package.json`과 lockfile에 두 패키지가 추가된다.

- [ ] **Step 2: Astro Vite 플러그인과 전역 CSS를 연결한다**

```js
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  vite: { plugins: [tailwindcss()] },
});
```

```css
@import 'tailwindcss';

@theme {
  --font-sans: 'Pretendard Variable', 'Pretendard', sans-serif;
  --color-ink: #191f28;
  --color-muted: #6b7684;
  --color-line: #e5e8eb;
  --color-action: #3182f6;
}
```

- [ ] **Step 3: Base 레이아웃을 뉴스형 헤더로 교체한다**

상단 메뉴를 `홈 / 비용 계산 / 입주 준비 / 단지 소식 / 생활 정보`로 고정하고 기존 모바일 하단 탭을 제거한다. 모바일은 가로 스크롤 카테고리, 데스크톱은 로고와 보조 링크가 있는 2단 헤더다.

- [ ] **Step 4: 공통 컴포넌트를 작성한다**

`SectionHeader`, `StatusPill`, `NewsRow`는 Astro props만 받고 데이터 판정을 하지 않는다.

- [ ] **Step 5: 정적 빌드로 Tailwind 클래스 생성을 확인한다**

Run: `npm run build`

Expected: 모든 기존 경로가 정적으로 생성되고 CSS import 오류가 없다.

- [ ] **Step 6: 커밋한다**

```bash
git add package.json package-lock.json astro.config.mjs src/styles/global.css src/layouts/Base.astro src/components
git commit -m "feat(ui): 뉴스형 테일윈드 디자인 시스템 적용"
```

### Task 2: 공식 공급가 데이터와 판정기

**Files:**
- Create: `src/data/prices/officialSupplyPrices.ts`
- Create: `src/lib/priceResolver.ts`
- Create: `tests/priceResolver.test.ts`

**Interfaces:**
- Produces: `resolveOfficialPrice(input: PriceInput): PriceResolution`
- Produces: `getBuildingOptions(): readonly BuildingOption[]`
- Produces: `getUnitTypesForBuilding(building: number): readonly UnitTypeCode[]`

- [ ] **Step 1: 감사 문서의 대표 35개 판정 테스트를 작성한다**

```ts
expect(resolveOfficialPrice({ block: 'AB22', building: 6201, floor: 1, unitType: '59A' }))
  .toMatchObject({ kind: 'exact', amountWon: 456_600_000 });
expect(resolveOfficialPrice({ block: 'AB23', building: 6304, floor: 2, unitType: '84A' }))
  .toMatchObject({ kind: 'range', minWon: 591_600_000, maxWon: 621_000_000 });
expect(resolveOfficialPrice({ block: 'AB23', building: 6304, floor: 2, unitType: '84B' }))
  .toMatchObject({ kind: 'exact', amountWon: 585_500_000 });
```

- [ ] **Step 2: 테스트가 모듈 부재로 실패하는 것을 확인한다**

Run: `npm test -- tests/priceResolver.test.ts`

Expected: `priceResolver` import 실패.

- [ ] **Step 3: 78개 기본 가격과 3개 특별 가격을 구조화한다**

```ts
export type FloorBand = '1' | '2' | '3-4' | '5-6' | '7-9' | '10-15' | '16-20' | '21-29';
export const BASE_PRICE_ROWS: readonly BasePriceRow[] = [/* 78 verified rows */];
export const PRICE_OVERRIDES: readonly PriceOverride[] = [/* 3 verified rows */];
export const LINE_ASSIGNMENTS: readonly LineAssignment[] = [/* 67 building-type mappings */];
```

- [ ] **Step 4: 가격 판정 순수 함수를 구현한다**

블록·동·타입·층을 검증하고 가능한 라인의 가격 후보를 집합으로 모은다. 후보 1개는 `exact`, 2개 이상은 `range`, 입력 불가는 `unavailable`을 반환한다. 일부 저층과 21~29층은 `occupancy: 'needs-contract-check'`로 표시한다.

- [ ] **Step 5: 35개 판정과 데이터 무결성 테스트를 통과시킨다**

Run: `npm test -- tests/priceResolver.test.ts`

Expected: 35개 판정과 81행·라인 배정 무결성 PASS.

- [ ] **Step 6: 커밋한다**

```bash
git add src/data/prices src/lib/priceResolver.ts tests/priceResolver.test.ts
git commit -m "feat(price): 동 층 타입 공식 공급가 조회 추가"
```

### Task 3: 프로필 v2와 쉬운 비용 계산

**Files:**
- Modify: `src/lib/profile.ts`
- Modify: `tests/profile.test.ts`
- Modify: `src/pages/calculator.astro`
- Modify: `src/scripts/calculator.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `resolveOfficialPrice`, 기존 `calculateTotalCost`
- Produces: `parseProfileV2(raw: string | null): UserProfileV2 | null`
- Produces: 빠른 계산 입력과 공식·예상 결과 UI

- [ ] **Step 1: v1 마이그레이션과 v2 검증 테스트를 작성한다**

```ts
expect(parseProfileV2(JSON.stringify({ v: 1, block: 'AB23', type: '84A' })))
  .toMatchObject({ v: 2, block: 'AB23', unitType: '84A' });
expect(parseProfileV2(JSON.stringify({ v: 2, block: 'AB23', building: 6304, floor: 2, unitType: '84A' })))
  .toMatchObject({ building: 6304, floor: 2 });
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- tests/profile.test.ts`

Expected: `parseProfileV2` 부재로 FAIL.

- [ ] **Step 3: v2 저장·마이그레이션을 구현한다**

`profile.v2`는 동·층·타입·계산 조건을 저장하되 사용자가 `이 기기에 내 선택 저장`을 누른 경우에만 기록한다. 기존 `profile.v1`은 읽어서 v2 형태로 변환하되 동·층을 생성하지 않는다.

- [ ] **Step 4: 계산기 첫 화면을 3단계 선택으로 바꾼다**

`동 선택 → 층 선택 → 타입 선택 → 계산하기` 순서이며 가능한 타입만 노출한다. 라인 예외에서는 결과 영역에서만 호 라인을 추가 선택한다.

- [ ] **Step 5: 공식 분양가와 예상 비용을 분리해 렌더링한다**

공식 분양가, 납부금액, 예상 부대비용, 시점별 현금, 대출 승계액 순서로 보여준다. 기존 세부 입력은 `<details>`의 `계산 조건 바꾸기` 안에 둔다.

- [ ] **Step 6: 홈에 빠른 계산 카드를 연결한다**

홈의 동·층·타입 선택은 `/calculator?building=6304&floor=2&type=84A`로 이동하고 계산 페이지가 URL 값을 검증해 초기화한다.

- [ ] **Step 7: 테스트·타입검사·빌드를 실행한다**

Run: `npm test -- tests/profile.test.ts tests/priceResolver.test.ts && npm run typecheck && npm run build`

Expected: 모두 PASS.

- [ ] **Step 8: 커밋한다**

```bash
git add src/lib/profile.ts tests/profile.test.ts src/pages/calculator.astro src/scripts/calculator.ts src/pages/index.astro
git commit -m "feat(calc): 공식 분양가 기반 쉬운 비용 계산 제공"
```

### Task 4: 납부 내보내기·계좌 대조·권리 시계

**Files:**
- Create: `src/data/contract/paymentSafety.ts`
- Create: `src/lib/ics.ts`
- Create: `src/lib/rights.ts`
- Create: `tests/ics.test.ts`
- Create: `tests/rights.test.ts`
- Create: `src/components/PaymentSafety.astro`
- Modify: `src/pages/calculator.astro`
- Modify: `src/scripts/calculator.ts`

**Interfaces:**
- Produces: `serializeIcs(events: readonly CalendarEvent[]): string`
- Produces: `buildRightsClocks(input: RightsClockInput): readonly RightsClock[]`
- Produces: `PAYMENT_ACCOUNTS`, `PAYMENT_SAFETY_STEPS`

- [ ] **Step 1: ICS와 권리 시계 실패 테스트를 작성한다**

```ts
expect(serializeIcs([{ id: 'interim-1', title: '중도금 1회', date: '2026-12-15' }]))
  .toContain('DTSTART;VALUE=DATE:20261215');
expect(buildRightsClocks(input).map((clock) => clock.kind))
  .toEqual(['resale', 'residence', 'reapplication']);
```

- [ ] **Step 2: 모듈 부재 실패를 확인한다**

Run: `npm test -- tests/ics.test.ts tests/rights.test.ts`

- [ ] **Step 3: ICS 직렬화와 권리 참고 시계를 구현한다**

ICS에는 CRLF, 텍스트 이스케이프, 안정된 UID를 적용한다. 권리 시계는 확정 법률판단 대신 기준일·설명·마지막 확인일·최종 확인기관을 반환한다.

- [ ] **Step 4: 계좌 대조 데이터를 구조화한다**

블록·납부항목·은행·예금주·공고 페이지·가상계좌 여부를 한 레코드에 둔다. 계좌번호 복사 함수는 만들지 않는다.

- [ ] **Step 5: 계산 결과에 다운로드·인쇄·계좌·권리 UI를 붙인다**

납부 일정 ICS, 인쇄 버튼, 송금 전 5요소, 송금 후 이체확인증 보관 체크, 권리 시계 3개를 결과 아래에 배치한다.

- [ ] **Step 6: 테스트·타입검사·빌드를 실행한다**

Run: `npm test -- tests/ics.test.ts tests/rights.test.ts && npm run typecheck && npm run build`

- [ ] **Step 7: 커밋한다**

```bash
git add src/data/contract src/lib/ics.ts src/lib/rights.ts tests/ics.test.ts tests/rights.test.ts src/components/PaymentSafety.astro src/pages/calculator.astro src/scripts/calculator.ts
git commit -m "feat(payment): 납부 달력과 계좌 권리 확인 도구 추가"
```

### Task 5: 사건 기반 입주 일정과 로컬 저장

**Files:**
- Create: `src/data/movein/tasks.ts`
- Create: `src/lib/moveInPlanner.ts`
- Create: `src/lib/moveInStorage.ts`
- Create: `tests/moveInPlanner.test.ts`
- Create: `tests/moveInStorage.test.ts`
- Create: `src/pages/move-in.astro`
- Create: `src/scripts/move-in.ts`

**Interfaces:**
- Produces: `deriveMoveInTasks(dates: MoveInEventDates, today: string): readonly DerivedMoveInTask[]`
- Produces: `parseMoveInState(raw: string | null): MoveInState`
- Produces: `serializeMoveInState(state: MoveInState): string`

- [ ] **Step 1: 날짜 변경·저장 실패 테스트를 작성한다**

```ts
expect(deriveMoveInTasks({ selectedMoveInDate: '2029-12-10' }, '2029-11-01'))
  .toContainEqual(expect.objectContaining({ id: 'move-in-meter-baseline', dueDate: '2029-12-10' }));
expect(parseMoveInState('{bad')).toEqual(emptyMoveInState());
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- tests/moveInPlanner.test.ts tests/moveInStorage.test.ts`

- [ ] **Step 3: 입주 행동 데이터와 순수 파생 함수를 구현한다**

사전방문, 이사, 계량기, 전입, 학교, 의료, 폐기물, 공원 확인 행동을 사건 기준으로 파생한다. 미래 운영정보는 `recheckAt`을 가진다.

- [ ] **Step 4: 로컬 상태 검증과 JSON 백업을 구현한다**

손상된 값은 빈 상태로 강등하고 기존 데이터를 덮어쓰기 전에 가져오기 파일 전체를 검증한다.

- [ ] **Step 5: 입주 준비 페이지의 일정·체크 탭을 구현한다**

상단에 `다가오는 할 일`, 아래에 사건 날짜 입력, 지금·입주 전·입주일·입주 후 체크리스트, ICS·JSON·인쇄를 제공한다.

- [ ] **Step 6: 테스트·타입검사·빌드를 실행한다**

Run: `npm test -- tests/moveInPlanner.test.ts tests/moveInStorage.test.ts && npm run typecheck && npm run build`

- [ ] **Step 7: 커밋한다**

```bash
git add src/data/movein src/lib/moveInPlanner.ts src/lib/moveInStorage.ts tests/moveInPlanner.test.ts tests/moveInStorage.test.ts src/pages/move-in.astro src/scripts/move-in.ts
git commit -m "feat(movein): 사건 기반 입주 일정과 체크리스트 추가"
```

### Task 6: 견적 비교·실측·하자대장

**Files:**
- Create: `src/lib/moveInTools.ts`
- Create: `tests/moveInTools.test.ts`
- Modify: `src/pages/move-in.astro`
- Modify: `src/scripts/move-in.ts`

**Interfaces:**
- Produces: `normalizeQuoteRows(quotes: readonly Quote[]): QuoteComparison`
- Produces: `validateDefectRecord(input: unknown): DefectRecord | null`
- Consumes: `MoveInState` 저장 어댑터

- [ ] **Step 1: 견적 정규화와 하자 검증 테스트를 작성한다**

```ts
expect(normalizeQuoteRows([{ vendor: 'A', items: [{ category: '이사', amountWon: 1_000_000 }] }]).totals.A)
  .toBe(1_000_000);
expect(validateDefectRecord({ id: '', room: '거실' })).toBeNull();
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- tests/moveInTools.test.ts`

- [ ] **Step 3: 견적·실측·하자 순수 모델을 구현한다**

견적은 업체 별칭·항목·수량·금액·부가세·추가비를 정규화한다. 실측은 통로와 제품 치수를 저장한다. 하자는 ID·공간·관찰·상태·접수·방문·재점검을 검증한다.

- [ ] **Step 4: IndexedDB 사진 저장 어댑터를 구현한다**

사진은 `lakepark-defects` 데이터베이스에 하자 ID별 Blob으로 저장한다. 미지원이면 텍스트 대장만 동작한다. 개별·전체 삭제를 제공한다.

- [ ] **Step 5: 입주 준비 페이지에 세 도구를 연결한다**

`사전점검 / 실측·견적 / 하자대장` 섹션을 앵커로 제공하고 모바일에서 한 열 표·폼으로 동작하게 한다.

- [ ] **Step 6: 테스트·타입검사·빌드를 실행한다**

Run: `npm test -- tests/moveInTools.test.ts && npm run typecheck && npm run build`

- [ ] **Step 7: 커밋한다**

```bash
git add src/lib/moveInTools.ts tests/moveInTools.test.ts src/pages/move-in.astro src/scripts/move-in.ts
git commit -m "feat(movein): 견적 실측 하자 관리 도구 추가"
```

### Task 7: 모바일 뉴스형 홈·단지 소식·생활 정보

**Files:**
- Create: `src/lib/editorial.ts`
- Create: `tests/editorial.test.ts`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/status.astro`
- Modify: `src/pages/guide.astro`
- Modify: `src/pages/timeline.astro`

**Interfaces:**
- Produces: `toEditorialUpdate(item: StatusItem): EditorialUpdate`
- Produces: `getEditorialFeed(items, options): readonly EditorialUpdate[]`
- Consumes: `STATUS_BOARD`, `BUILDING_IMPACTS`, `UNIT_GUIDE`

- [ ] **Step 1: 기사 어댑터의 상태·정렬·카피 테스트를 작성한다**

```ts
expect(toEditorialUpdate(operatingItem).status).toBe('operating');
expect(getEditorialFeed(items, { category: 'transport' }).every((item) => item.category === 'transport')).toBe(true);
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- tests/editorial.test.ts`

- [ ] **Step 3: 상태 원장의 기사형 파생 함수를 구현한다**

헤드라인·요약·현재 의미·다음 확인·확인일·출처를 생성한다. 원 데이터는 복제하지 않는다.

- [ ] **Step 4: 홈을 뉴스형 구성으로 완성한다**

대표 기사 1개, 빠른 계산, 최근 업데이트 3~5개, 다음 입주 행동, 생활 정보 2~3개를 배치한다.

- [ ] **Step 5: 단지 소식과 생활 정보를 재구성한다**

단지 소식은 기사형 필터 피드, 생활 정보는 타입·동 영향과 2029 재확인 행동을 제공한다. `/timeline`은 `/move-in`으로 명확히 연결한다.

- [ ] **Step 6: 테스트·타입검사·빌드를 실행한다**

Run: `npm test -- tests/editorial.test.ts tests/status.test.ts && npm run typecheck && npm run build`

- [ ] **Step 7: 커밋한다**

```bash
git add src/lib/editorial.ts tests/editorial.test.ts src/pages/index.astro src/pages/status.astro src/pages/guide.astro src/pages/timeline.astro
git commit -m "feat(content): 단지 소식과 생활 정보를 뉴스형으로 개편"
```

### Task 8: 개인정보·접근성·전체 검증·Vercel 배포

**Files:**
- Modify: `src/pages/privacy.astro`
- Modify: `src/pages/about.astro`
- Modify: `README.md`
- Verify: all changed files

**Interfaces:**
- Consumes: 완성된 모든 작업공간
- Produces: 검증된 정적 빌드와 Vercel production URL

- [ ] **Step 1: 실제 저장 동작과 공개 문구를 일치시킨다**

```text
호수는 묻지 않습니다. 동·층·타입은 비용 조회에만 사용하며,
사용자가 선택한 경우에만 이 기기에 저장됩니다.
```

localStorage·IndexedDB·JSON·사진·전체 삭제 방법과 서버 전송 없음을 문서화한다.

- [ ] **Step 2: 접근성과 인쇄 스타일을 검수한다**

모든 입력 label, 오류 `aria-live`, 키보드 포커스, 44px 터치 대상, 상태 텍스트, reduced-motion, 프린트 시 메뉴 숨김을 확인한다.

- [ ] **Step 3: 전체 자동 검증을 실행한다**

Run: `npm test`

Expected: 모든 테스트 PASS.

Run: `npm run typecheck`

Expected: TypeScript 오류 0개.

Run: `npm run build`

Expected: 모든 경로 정적 생성.

Run: `git diff --check`

Expected: 공백 오류 0개.

- [ ] **Step 4: 로컬 프로덕션 빌드를 브라우저로 검수한다**

390×844, 768×1024, 1280×900에서 홈·비용 계산·입주 준비·단지 소식·생활 정보를 확인한다. 콘솔 오류, 수평 넘침, 잘린 입력, 잘못된 메뉴 현재 상태가 없어야 한다.

- [ ] **Step 5: 구현 결과를 커밋한다**

```bash
git add src tests README.md package.json package-lock.json astro.config.mjs
git commit -m "feat: 검단레이크파크 통합 입주 서비스 완성"
```

- [ ] **Step 6: Vercel production 배포를 실행한다**

Run: `npx vercel --prod --yes`

Expected: production deployment URL 반환.

- [ ] **Step 7: 배포 URL에서 핵심 경로를 검증한다**

홈·비용 계산·입주 준비·단지 소식·생활 정보가 200으로 열리고, 배포 화면에서 빠른 계산과 로컬 체크가 동작해야 한다.

- [ ] **Step 8: 최종 배포 커밋과 상태를 기록한다**

Vercel이 생성한 설정 변경이 있으면 검토 후 커밋하고 `git status --short`가 깨끗한지 확인한다.

---

## Plan Self-Review

- 설계 17개 섹션을 Task 1~8에 매핑했다.
- 공식 가격, 계산, 납부, 계좌, 권리, 입주 일정, 체크리스트, 견적, 실측, 하자, 기사형 피드, 개인정보, 접근성, 배포가 모두 작업에 포함된다.
- 모든 새 순수 함수는 첫 사용 전에 인터페이스가 정의돼 있다.
- 테스트가 없는 고위험 가격·날짜·저장·직렬화 로직이 없다.
- 미결정 자리표시자와 정의되지 않은 대체 함수가 없다.
