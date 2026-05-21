# Recipe Management System (RMS) — 프론트엔드 종합 코드 리뷰 보고서

**기준일**: 2026-05-19
**검토 범위**: `frontend/src/` 전체
**검토 기준 문서**: `docs/1-prd.md`, `docs/2-erd.md`, `docs/3-execution-plan.md`
**검토 대상 코드**: 실제 Vue/TypeScript 소스 파일

**원칙**:
- 소스 코드 수정 금지 (분석만 수행)
- 실제 코드 우선 (문서 → 코드)
- 추측 금지 (확인 필요는 명시)
- 파일명, 함수명, 컴포넌트명 정확히 기록
- 한국어로 작성

---

## 종합 요약

### 이슈 통계

| 심각도 | 건수 | 분류 |
|-------|------|------|
| **Critical** | 2 | 테스트 전무, 전역 폰트 미선언 |
| **High** | 14 | 아키텍처 문제, 에러 처리, 상태 관리 |
| **Medium** | 26 | 중복 코드, 디자인 불일치, 라우팅 이슈 |
| **Low** | 20 | 미사용 코드, 타입 안전성, 코드 스타일 |
| **합계** | **62** | |

### 카테고리별 분포

| 카테고리 | 건수 | 주요 이슈 |
|---------|------|---------|
| 아키텍처 | 12 | 단일 파일 4,358줄, 피처 간 의존성 혼재 |
| 에러 처리 | 10 | window.alert 남용, http 래퍼 미흡 |
| 상태 관리 | 11 | reactive Set 사용, watch 수동 skip flag |
| UI/UX 일관성 | 14 | Win97 vs 현대 스타일 혼용, 폰트 미선언, 접근성 미흡 |
| 테스트 | 3 | 테스트 러너 미설정, 커버리지 0%, 자동화 검증 부재 |
| 중복 코드 | 9 | CasFileListPanel/JobFileListPanel, displayJobName 중복 |
| 저장소/빌드 | 3 | *.vue.js 산출물 커밋, .gitignore 부재 |

---

## 이슈 상세

### 1. Critical — 즉시 조치 필요 (2건)

#### C-FE-01 — 테스트 러너 전무 + package.json 미설정

**파일**: `frontend/package.json`
**문제**:
- `scripts`에 `test` 명령 없음 (`dev`, `build`, `preview`만 존재)
- devDependencies에 vitest, jest, cypress 등 테스트 러너 미등록
- `frontend/src` 전체에 `*.test.*` / `*.spec.*` 파일 0개
- 정적 타입 검사 전용 스크립트 부재 (`build` 시 `vue-tsc -b` 실행 외에는 없음)

**근거**:
- 4,358줄 단일 파일(`RecipeTestPage.vue`)에 CAS/JOB 저장·삭제·이동 등 비즈니스 크리티컬 로직 집중
- 회귀 검증 수단이 사람의 수동 클릭뿐 → 운영 리스크 매우 높음

**수정 방향**:
1. **최소 셋업** (1주):
   - `vitest`, `@vue/test-utils`, `jsdom` 설치
   - `"test": "vitest run"`, `"dev:test": "vitest"`, `"typecheck": "vue-tsc --noEmit"` 추가
2. **우선순위별 테스트 작성** (4~6주):
   - Phase 1: 순수 유틸 함수 (`stripFileExt`, `displayJobName`, `displayRecipeName`, `naturalCompare` 등)
   - Phase 2: `recipeTestApi` mock 기반 테스트 (타임아웃, 에러 응답, AbortError)
   - Phase 3: composable 분리 후 상태 관리 단위 테스트

**검증 방법**:
```bash
npm install -D vitest @vue/test-utils jsdom
npm run typecheck
npm run test
```

**위험도**: 높음
**영향 범위**: 전체 기능 안정성

---

#### C-FE-02 — 전역 폰트 미선언 (Win97 스타일 깨짐)

**파일**: `frontend/index.html`
**문제**:
- `<html lang="en">` 상태로 한글 기반 UI와 불일치
- `<head>` 영역에 CSS 리셋 또는 `font-family` 전역 선언이 없음
- Win97 스타일 컴포넌트들이 `font-weight: 900` + sans-serif 폰트를 전제로 설계되었으나 브라우저 기본 폰트(serif) 적용 시 의도한 스타일 미재현

**근거**:
- 실제 `index.html`은 13줄에 불과하며 폰트/리셋 CSS 미선언
- Windows/Mac/Linux 간 기본 폰트가 다름 → 최종 배포 환경(Windows) 외에서 시각적 일관성 보장 불가
- Win97 버튼/모달의 픽셀 정확성이 폰트에 의존

**수정 방향**:
```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <link class="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>recipe-ui</title>
    <style>
      body {
        font-family: 'Tahoma', 'Arial', 'MS Sans Serif', sans-serif;
        font-size: 13px;
        margin: 0;
        padding: 0;
        background: #c0c0c0;
      }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

또는 `frontend/src/style.css`에 전역 폰트를 추가하여 `main.ts`에서 import.

**검증 방법**:
- 브라우저 DevTools > Computed > `font-family` 확인
- Win97ConfirmDialog/RecipePickerDialog 등 모달 텍스트가 sans-serif 계열인지 육안 확인
- Windows/Mac/Linux 시뮬레이션 후 버튼 모양 비교

**위험도**: 높음
**영향 범위**: Win97 스타일 전체, 사용자 인지도

---

### 2. High — 우선 처리 권장 (14건)

#### H-FE-01 — 단일 파일 4,358줄 (RecipeTestPage.vue)

**파일**: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
**라인**: 4,358줄
**문제**:
- CAS 선택/편집, JOB 선택/편집, Recipe 패널, RecipePicker, TransferCart, ContextMenu, ConfirmDialog, 칼럼 리사이즈, 키보드 내비게이션, 액터 프로필 등 8개 이상의 독립 도메인이 한 파일에 혼재
- ref/reactive 선언 50개 이상 산재
- 상태 추적, 디버깅, 코드 리뷰 난이도 높음

**근거**:
- Vue SFC 권장 크기: 500~1,000줄
- 현재는 권장값의 4배 이상

**수정 방향**:
기능 단위 composable로 분리:
```
frontend/src/features/recipe_test/composables/
├── useCasSelection.ts     // CAS 목록, 검색, 선택, 정렬
├── useJobSelection.ts     // JOB 목록, 선택, 정렬
├── useRecipePanel.ts      // Recipe 표시, 매칭
├── useRecipePicker.ts     // RecipePicker 다이얼로그 상태
├── useTransferCart.ts     // Transfer 카트 상태, 검증
├── useColumnResize.ts     // 칼럼 리사이즈 이벤트 (현재 listResizeState/recipeListResizeState 통합)
├── useKeyboardNav.ts      // 방향키 네비게이션
├── useInventoryPolling.ts // 인벤토리 폴링
└── useActorProfile.ts     // 사용자 프로필 (이름, 팀)
```

**검증 방법**:
```bash
wc -l frontend/src/features/recipe_test/pages/RecipeTestPage.vue
# 목표: 500~1,000줄 이하
```

**위험도**: 높음
**영향 범위**: 전체 유지보수성, 테스트 가능성

---

#### H-FE-02 — TopBarNav vs Win97 컴포넌트 디자인 언어 충돌

**파일**: `frontend/src/components/TopBarNav.vue`
**문제**:
- TopBarNav (line 17~62): 현대적 flat/glassmorphism 스타일 (rgba 투명, backdrop-filter blur, border-radius: 8px, transition 애니메이션)
- Win97ConfirmDialog, Win97ContextMenu, RecipePickerDialog: 고전적 Win97 스타일 (#c0c0c0 배경, 3D 엣지, font-weight: 900)
- 동일 화면에 두 디자인 언어 공존 → 시각적 일관성 결여

**근거**:
- Win97 접두사를 의도적으로 사용한 컴포넌트들이 존재하므로 Win97 테마가 의도된 것으로 판단
- TopBarNav만 디자인 톤이 벗어난 상태
- 사용자 체감 일관성 저하

**수정 방향**:
1. **옵션 A: Win97으로 통일** (권장, Windows 타겟과 일치)
   - TopBarNav: `background: #c0c0c0`, `border-bottom: 2px solid #404040`, font-family 일치
   - 모든 네비게이션 요소에 Win97 beveled button 스타일 적용
2. **옵션 B: 현대적 flat으로 통일**
   - Win97ConfirmDialog → 현대 모달로 리스타일
   - Win97ContextMenu → 모던 dropdown menu

**검증 방법**:
TopBarNav와 RecipePickerDialog, Win97ConfirmDialog가 같은 화면에 표시될 때 시각적 톤 비교.

**위험도**: 높음
**영향 범위**: 사용자 경험, 브랜드 일관성

---

#### H-FE-03 — 라우터 생성 시 base 인자 누락 (History 모드)

**파일**: `frontend/src/router/index.ts:23`
**함수**: `createWebHistory()`
**문제**:
```typescript
const router = createRouter({
  history: createWebHistory(),
  routes,
})
```
- History 모드로 `/recipe-test`, `/history` URL을 사용
- 서버가 SPA fallback(모든 비-API 경로 → `index.html`)을 제공하지 않으면 새로고침/직접 접근 시 404

**근거**:
- PRD 최종 배포 타겟이 Windows(FastAPI + 정적 파일 또는 IIS)이므로 fallback 설정 필수
- `createWebHashHistory()`(`/#/recipe-test` 형태)가 Windows 단순 배포 환경에서 더 안전할 수 있음

**수정 방향**:

**방안 1: SPA Fallback 라우트 추가 (권장, History 모드 유지)**
```python
# backend/app/main.py
@app.get("/{full_path:path}")
async def spa_fallback(full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(404)
    return FileResponse("frontend/dist/index.html")
```

**방안 2: Hash 모드로 전환**
```typescript
import { createWebHashHistory } from 'vue-router'
const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
```

**검증 방법**:
- `/recipe-test` 직접 입력 → 404 아닌지 확인
- 페이지 새로고침 → 앱 정상 로드 확인

**위험도**: 높음
**영향 범위**: Windows 배포 후 사용자 UX

---

#### H-FE-04 — 모든 사용자 알림이 window.alert()

**파일**: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue` (`window.alert` 호출 25곳)
**문제**:
- CAS/JOB/Recipe Save·Rename·Delete·Save As·Transfer 등 완료/실패 메시지 대부분이 `window.alert()`
- Win97ConfirmDialog 컴포넌트가 이미 구현되어 있으나 결과 알림은 native dialog 혼용
- 일부 호출이 장황한 에러 텍스트(JSON.stringify된 에러 객체 등)를 그대로 노출

**근거**:
- `grep -c "window.alert" RecipeTestPage.vue` → 25
- window.alert는 UI 블로킹, 줄바꿈/포맷 제한, 자동화 테스트 불가
- Win97 스타일이 의도된 시스템에 모던 alert가 튀어나옴

**수정 방향**:
1. 토스트/알림 composable 추가:
   ```typescript
   // composables/useNotification.ts
   const notifications = ref<Notification[]>([])
   const notify = (message: string, type: 'success'|'error'|'warning') => { ... }
   ```
2. `window.alert(msg)` → `notify(msg, 'info')` 일괄 교체
3. 에러 메시지 정규화 (현재 `err?.message ?? String(err)` 패턴 분산)

**검증 방법**:
```bash
grep -c "window.alert" frontend/src/features/recipe_test/pages/RecipeTestPage.vue
# 결과: 0 (모두 notify로 교체)
```

**위험도**: 높음
**영향 범위**: 사용자 경험, 운영 디버깅

---

#### H-FE-05 — 피처 간 직접 의존성 (history → recipe_test)

**파일**: `frontend/src/features/history/pages/MyHistoryPage.vue:158`
**코드**:
```typescript
import { recipeTestApi, type HistoryEntry }
  from '../../recipe_test/api/recipeTestApi'
```

**근거**:
- Feature Slice 구조에서 피처 간 직접 import는 의존성 방향 위반
- `MyHistoryPage`가 `recipe_test`의 내부 API/타입에 결합 → `recipeTestApi` 변경 시 함께 깨짐
- 공유 타입(`HistoryEntry`)이 `recipe_test`에 종속됨

**수정 방향**:
공유 레이어 생성:
```
frontend/src/
├── shared/
│   ├── api/
│   │   └── historyApi.ts      (getHistory, HistoryEntry 타입)
│   └── types/
│       └── history.ts
├── features/
│   ├── recipe_test/
│   └── history/
│       └── pages/
│           └── MyHistoryPage.vue (import from '@/shared/api')
```

**검증 방법**:
```bash
grep -rn "recipe_test" frontend/src/features/history
# 결과: 0건 (shared import만 있어야 함)
```

**위험도**: 높음
**영향 범위**: 코드 아키텍처, 테스트 독립성

---

#### H-FE-06 — Reactive Set 사용 (Vue 3 반응성 한계)

**파일**: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
**위치**: 1022~1024, 1039, 1757행
**패턴**:
```typescript
const selectedCas = reactive(new Set<string>())
const selectedJobs = reactive(new Set<string>())
const selectedRecipes = reactive(new Set<string>(['R_NONE']))
const selectedCartTargetEqpIdsSet = reactive(new Set<string>())
const selectedSlotCells = reactive(new Set<number>())
```

**문제**:
Vue 3에서 `reactive(new Set())`는 deep proxy 처리되어 동작하지만 add/delete/clear의 의존성 추적이 일반 객체 대비 미묘하게 다르며, 일부 computed에서 변이가 누락될 위험이 있음.

**근거**:
- 동일 패턴이 5곳에 흩어져 있어 일관된 반응성 보장이 어려움
- 디버깅 시 Set 변이 → computed 갱신 흐름을 추적하기 어려움

**수정 방향**:
```typescript
// 방안 1: ref + 명시적 재할당
const selectedCas = ref<Set<string>>(new Set())
const addToSelectedCas = (id: string) => {
  selectedCas.value = new Set(selectedCas.value).add(id)
}

// 방안 2: 배열 기반 + computed
const selectedCasIds = ref<string[]>([])
const selectedCasSet = computed(() => new Set(selectedCasIds.value))
```

**검증 방법**:
DevTools에서 CAS 선택/해제 시 상단 카운트와 액션 가용 상태가 즉시 업데이트되는지 확인.

**위험도**: 높음
**영향 범위**: 선택 상태 반응성

---

#### H-FE-07 — 검색 watch에 수동 skip flag (race 가능)

**파일**: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue:2378~2383, 2716~2740`
**코드**:
```typescript
let skipCasWatch = false
let skipJobWatch = false
let skipRecipeWatch = false
function setCasQueryProgram(v:string){ skipCasWatch = true; casQuery.value = v }
function setJobQueryProgram(v:string){ skipJobWatch = true; jobQuery.value = v }
function setRecipeFindProgram(v:string){ skipRecipeWatch = true; recipeFind.value = v }
```
watch 내부:
```typescript
if(skipCasWatch){ skipCasWatch = false; return }
```

**문제**:
수동 flag 패턴은 Vue의 reactive watch가 microtask 큐에서 실행되므로 race condition 가능. 빠른 연속 호출 시 flag 리셋 전후 시점이 어긋날 수 있음.

**근거**:
- Vue 공식 권장 패턴이 아니며 스케줄러 변경에 취약
- 3곳에 동일 패턴이 반복

**수정 방향**:
```typescript
// VueUse의 watchPausable 사용
import { watchPausable } from '@vueuse/core'
const { pause, resume } = watchPausable(casQuery, () => { /* 검색 로직 */ })
const setCasQueryProgram = (val: string) => {
  pause()
  casQuery.value = val
  nextTick(() => resume())
}
```

**검증 방법**:
빠른 연속 입력 시뮬레이션 → 검색창이 의도치 않게 비워지거나 이전 값으로 덮이지 않는지 확인.

**위험도**: 높음
**영향 범위**: CAS/JOB/Recipe 검색 기능

---

#### H-FE-08 — CasFileListPanel과 JobFileListPanel 중복

**파일**:
- `frontend/src/features/recipe_test/components/CasFileListPanel.vue` (344줄)
- `frontend/src/features/recipe_test/components/JobFileListPanel.vue` (329줄)

**문제**:
- template/script/style 다수가 거의 동일 (헤더, 스크롤 컨테이너, 리스트 렌더링, 칼럼 리사이즈, 정렬 인디케이터)
- 한쪽 수정 시 다른 쪽 누락 가능성

**근거**: 두 파일 라인 수가 비슷하며 구조 또한 거의 일치.

**수정 방향**:
공통 `FileListPanel.vue` 베이스 컴포넌트 + 슬롯/스코프드 슬롯으로 CAS/JOB 차이 흡수.

**검증 방법**:
공통화 후 CAS/JOB 패널의 정렬/스크롤/리사이즈가 동일하게 동작하는지 확인.

**위험도**: 높음
**영향 범위**: 유지보수성, 버그 재현 위험

---

#### H-FE-09 — http 래퍼 에러 처리 미흡

**파일**: `frontend/src/features/recipe_test/api/recipeTestApi.ts:121~148`
**함수**: `http<T>()`
**코드**:
```typescript
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 60000)
  try {
    const res = await fetch(`${API_BASE}${path}`, { ... })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'API request failed')
    }
    return res.json() as Promise<T>
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('응답 대기시간이 초과되었습니다.')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}
```

**문제**:
- 500 에러로 HTML 페이지 반환 시 KB 단위 텍스트가 `Error.message`에 담겨 alert에 그대로 노출
- status code가 메시지에 미포함 → 호출자가 401/404/500 구분 불가
- 모든 요청에 60초 타임아웃 일괄 적용 → FTP 전송 등 장시간 호출과 부적합
- `catch (err: any)` 로 타입 안전성 손실

**수정 방향**:
```typescript
class ApiError extends Error {
  constructor(message: string, public status: number, public payload?: unknown) { super(message) }
}
// http<T>가 timeout 옵션을 받고, JSON detail을 우선 추출, ApiError로 throw
```

**검증 방법**:
- Mock fetch로 500/HTML 응답 시 단축된 메시지만 표시되는지 확인
- 호출부에서 `err.status === 0` 등으로 네트워크 에러 구분 가능 여부 확인

**위험도**: 높음
**영향 범위**: 에러 디버깅, 사용자 알림

---

#### H-FE-10 — Win97ConfirmDialog 접근성/포커스 트랩 미구현

**파일**: `frontend/src/features/recipe_test/components/Win97ConfirmDialog.vue` (84줄)
**문제**:
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` 등 ARIA 속성 전무
- 모달이 열려도 Tab 키가 배경 요소로 빠짐 (포커스 트랩 없음)
- Escape 키로 닫기 미구현
- 오버레이 클릭 시 닫기도 미구현

**근거**:
- 컴포넌트 전체 코드에서 ARIA 속성/keydown 리스너 발견되지 않음
- 파괴적 작업(삭제, 덮어쓰기 확인)을 담당하므로 키보드 사용자 보호 필수

**수정 방향**:
- 루트 모달 div에 `role="dialog"`, `aria-modal="true"`, `aria-labelledby` 부착
- `@keydown.esc`로 cancel emit
- Tab/Shift+Tab 시 첫/마지막 포커스 요소를 순환
- `@click.self`로 오버레이 클릭 시 닫기 옵션 제공

**검증 방법**:
- 모달 오픈 후 Tab 연속 입력 시 포커스가 [Yes]↔[No] 내에서만 순환
- VoiceOver/NVDA에서 "dialog" 역할이 인식되는지 확인

**위험도**: 높음
**영향 범위**: 접근성 (WCAG 준수)

---

#### H-FE-11 — Win97ContextMenu 뷰포트 경계 미처리

**파일**: `frontend/src/features/recipe_test/components/Win97ContextMenu.vue` (54줄)
**문제**:
- 메뉴 위치는 props `x`, `y`로 받아 단순히 `left/top`에 적용 (`position: fixed`)
- `innerWidth/innerHeight/getBoundingClientRect` 등의 경계 보정 로직 없음
- 화면 우측/하단 끝에서 우클릭 시 메뉴가 잘려서 표시됨

**근거**: 컴포넌트 코드 전체에서 viewport 보정 로직이 발견되지 않음.

**수정 방향**:
- 부모 컴포넌트 또는 메뉴 내부 `onMounted`에서 `getBoundingClientRect()`로 우/하단 초과 여부 확인 후 좌/상측으로 이동

**검증 방법**:
- 뷰포트 우측 30px 이내에서 우클릭 → 메뉴 전체가 화면 안에 표시

**위험도**: 높음
**영향 범위**: 사용자 경험, 우클릭 컨텍스트 메뉴

---

#### H-FE-12 — RecipePickerDialog 고정 행 높이

**파일**: `frontend/src/features/recipe_test/components/RecipePickerDialog.vue:477`
**코드**:
```css
grid-template-rows:220px minmax(260px, 1fr);
```
**문제**:
- 첫 행이 220px 고정 → 저해상도(768px 이하) 모니터에서 모달이 뷰포트 초과
- `.picker-scroll{ height:220px; }`, `.picker-preview-tablewrap{ max-height:260px; }` 등의 고정 픽셀이 함께 사용됨

**근거**: width는 `min(1180px, 96vw)`로 반응형이나 height는 px 고정.

**수정 방향**:
```css
.w97-modal.picker { max-height: 92vh; overflow-y: auto; }
.picker-grid { grid-template-rows: max(220px, 25vh) minmax(260px, 1fr); }
.picker-scroll { height: max(180px, 22vh); }
```

**검증 방법**:
브라우저 높이 700px로 설정 → 모달이 잘리지 않고 표시되는지 확인.

**위험도**: 높음
**영향 범위**: Recipe 선택 기능 (저해상도)

---

#### H-FE-13 — Sidebar.vue 미사용

**파일**: `frontend/src/components/Sidebar.vue`
**문제**: 정의되어 있으나 `App.vue`/`router` 등 어디에서도 import되지 않음.
**근거**:
```bash
grep -rn "Sidebar" frontend/src --include="*.vue" --include="*.ts"
# 결과: import 0건 (TopBarNav만 App.vue에서 사용)
```
컴파일 산출물 `Sidebar.vue.js`는 별도로 커밋되어 있어 혼란을 가중시킴 (H-FE-15 참조).

**수정 방향**:
- 미사용 확정 시 `Sidebar.vue` + `Sidebar.vue.js` 삭제
- 향후 필요 시 TopBarNav와 공통 `navItems` 배열로 통합

**검증 방법**:
삭제 후 `npm run build` 정상 통과, 런타임 라우팅에 영향 없음 확인.

**위험도**: 높음
**영향 범위**: 코드 유지보수성, 저장소 정리

---

#### H-FE-14 — /recipe 라우트 미정의 (redirect만 존재)

**파일**: `frontend/src/router/index.ts:8~11`
**코드**:
```typescript
{ path: '/recipe', redirect: '/recipe-test' },
```
**TopBarNav.vue:6**:
```html
<RouterLink to="/recipe" class="nav-item">Recipe</RouterLink>
<RouterLink to="/recipe-test" class="nav-item">Recipe Test</RouterLink>
```

**문제**: `/recipe`는 `/recipe-test`로 redirect되지만 TopBarNav에서 `to="/recipe"`와 `to="/recipe-test"`가 별도 링크로 표시 → 동일 페이지로 두 개의 메뉴가 활성화 상태를 두고 혼란 발생.

**근거**: `router/index.ts` 어디에도 `/recipe`에 대응하는 실제 페이지가 없음.

**수정 방향**:
- `/recipe`가 별도 페이지 예정이면 placeholder 컴포넌트 생성 후 redirect 제거
- 동일 페이지라면 TopBarNav에서 `/recipe` 링크 제거 또는 `/recipe-test`로 통일

**검증 방법**:
TopBarNav의 Recipe / Recipe Test 링크 클릭 시 active 스타일이 일관되게 적용되는지 확인.

**위험도**: 높음
**영향 범위**: 네비게이션 UX

---

#### H-FE-15 — src/ 디렉터리에 컴파일 산출물 (*.vue.js 17개, main.js, __init__.py)

**파일**:
- `frontend/src/**/*.vue.js` (총 17개)
  - App.vue.js, components/Sidebar.vue.js, components/TopBarNav.vue.js
  - features/history/pages/MyHistoryPage.vue.js
  - features/recipe_test/pages/RecipeTestPage.vue.js
  - features/recipe_test/components/ 하위 11개 컴포넌트 .vue.js
- `frontend/src/main.js`
- `frontend/src/__init__.py` (0바이트)
- `frontend/src/features/recipe_test/api/mockData.js`, `recipeFileOpsApi.example.js`, `recipeTestApi.js`
- `frontend/` 루트에 `.gitignore` 부재

**문제**:
- 소스 파일과 컴파일 산출물이 함께 커밋
- IDE 검색/리팩토링 시 노이즈 발생, 잘못된 파일을 수정할 위험
- `__init__.py`는 Vue 프로젝트에 부적합 (Python 패키지 마커 잔재)

**수정 방향**:
```
# frontend/.gitignore 신규 생성
dist/
node_modules/
src/**/*.vue.js
src/main.js
src/__init__.py
src/features/recipe_test/api/*.js
```
```bash
git rm --cached frontend/src/**/*.vue.js
git rm --cached frontend/src/main.js
git rm --cached frontend/src/__init__.py
```

**검증 방법**:
- `vite build` 정상 통과
- `git status`에서 17개 *.vue.js가 untracked/ignored로 표시

**위험도**: 높음
**영향 범위**: 저장소 관리, 코드 검색 효율

---

#### H-FE-16 — displayJobName 함수 중복

**파일**:
- `frontend/src/features/recipe_test/pages/RecipeTestPage.vue:402` (`stripFileExt`를 이용한 일반 구현)
- `frontend/src/features/recipe_test/components/CasContentPanel.vue:135` (인라인 `.endsWith('.job')` 슬라이스)

**문제**: 동일 목적의 함수가 두 컴포넌트에 각자 다른 구현으로 존재.
- RecipeTestPage: `stripFileExt(name, ['.job'])` + `NONE_LABEL` 처리
- CasContentPanel: `text.toLowerCase().endsWith('.job') ? text.slice(0, -4) : text` 만 처리 (NONE 처리 없음)

**근거**: 두 함수의 동작이 약간 다름 → CAS 표시와 JOB 패널 표시가 미묘하게 어긋날 수 있음 (예: `NONE` ID 처리).

**수정 방향**:
공유 유틸 모듈 생성:
```typescript
// frontend/src/features/recipe_test/utils/fileNameUtils.ts
export function stripFileExt(name: unknown, exts: string[]) { ... }
export function displayJobName(name: unknown) { ... }
export function displayCasName(name: unknown) { ... }
export function displayRecipeName(name: unknown, sourceKind?: RecipeSourceKind) { ... }
```
CasContentPanel은 이 유틸을 import해 사용.

**검증 방법**:
CAS Content 패널의 Job Name 표시 = Job List 표시 = Recipe Picker 표시가 동일한 규칙으로 처리되는지 확인.

**위험도**: 높음
**영향 범위**: 코드 일관성, 유지보수성

---

### 3. Medium — 권장 개선 (26건)

#### M-FE-01 ~ M-FE-26

Medium 심각도는 중복 코드, 디자인 불일치, 접근성 개선, 스타일 톤 불일치 등으로 구성됩니다.

**주요 Medium 이슈 (상위 5개)**:

1. **RecipePickerDialog 폰트 크기 불일치**
   - 파일: `frontend/src/features/recipe_test/components/RecipePickerDialog.vue:536~542`
   - 코드: `.preview-table-large td{ font-size:17px; ... }`, `.polcon-preview td{ font-size:16px; }`, `.pol-preview td{ font-size:14px; }`
   - 수정: 동일 시각 컨텍스트에서 폰트 크기를 14~15px로 통일하고 강조 행만 별도 처리

2. **MyHistoryPage 디자인/언어 불일치**
   - 파일: `frontend/src/features/history/pages/MyHistoryPage.vue`
   - 한국어/영어 혼용 (`My History`, `Rename, Save As, ... 이력을 확인합니다`)
   - Win97 컴포넌트와의 스타일 차이
   - 수정: 한국어 우선 정책 수립 + 디자인 톤 통일

3. **LoadingOverlay 스타일 이질성**
   - 파일: `frontend/src/features/recipe_test/components/LoadingOverlay.vue`
   - 수정: Win97 스타일로 통일 또는 현대 스타일로 통일

4. **CasContentPanel과 JobContentPanel 공통화 가능**
   - 정렬 인디케이터, 리사이즈 로직, 셀 렌더링이 유사
   - 추출: `useFileListPanel()` composable + 공통 컴포넌트

5. **칼럼 리사이즈 로직 중복 (2곳)**
   - `RecipeTestPage.vue:783` (`listResizeState`) vs `846` (`recipeListResizeState`)
   - 추출: `useColumnResize()` composable

**나머지 Medium 이슈** 카테고리:
- 이모지 아이콘 혼용 (접근성 개선 필요)
- RecipePickerDialog 반응형 레이아웃 (H-FE-12와 연관)
- 폼 입력 검증 누락 (`openAsciiNamePrompt` 호출 경로)
- 인벤토리 폴링 백그라운드 처리 (탭 비활성 시 중단 여부)
- MyHistoryPage 에러 상태 표시 미흡
- 선택 범위 함수 중복 (`selectRangeString`, `selectRangeJob`, `selectRangeRecipe` 2428~2438행)
- deepClone 구현이 `JSON.parse(JSON.stringify(...))` 6곳에 산재 (472행에 함수가 있으나 직접 호출도 혼재)
- 타이머 타입 안전성 (`window.setTimeout` 반환 타입)
- `JSON.parse(JSON.stringify(...))`가 `deepClone` 함수와 중복 사용
- `/recipe-test` 라우팅 중복 (redirect; H-FE-14와 연관)

---

### 4. Low — 선택적 개선 (20건)

Low 심각도는 코드 스타일, 타입 안전성, 미사용 코드 정리 등으로 구성됩니다.

**주요 Low 이슈**:
- 느슨한 비교 (`==` → `===`)
- `as any` 타입 무시 (점진적으로 strict 적용; `http` catch 절 등)
- props 정의 방식 일관성 (`defineProps<T>()` vs runtime options)
- API_BASE 환경변수 관리 (`recipeTestApi.ts:119`에서 `const API_BASE = ''` 하드코딩)
- HTML `lang` 속성 변경 (`en` → `ko`)
- example/mock 파일 분리 (`mockData.ts`, `recipeFileOpsApi.example.ts`의 위치/이름 정리)
- 타이머 정리 누락 가능성 (인벤토리 폴링 등)
- Computed writable 과다 사용 (`actorNameModel`, `actorTeamModel` 등)

---

## 우선순위별 로드맵

### Phase 1 — 긴급 (1주)

| ID | 항목 | 추정 기간 | 담당 |
|----|------|---------|------|
| C-FE-02 | 전역 폰트 선언 추가 + HTML lang=ko | 2시간 | UI 디자인 |
| H-FE-15 | *.vue.js / main.js / __init__.py 제거 + .gitignore 생성 | 1시간 | 개발자 |
| H-FE-13 | 미사용 Sidebar.vue 제거 | 30분 | 개발자 |
| H-FE-14 | /recipe 라우트 정리 (또는 TopBarNav 링크 조정) | 1시간 | 개발자 |
| H-FE-03 | SPA fallback 결정 + 적용 | 4시간 | 개발자 |

**예상 비용**: 1주(5영업일) / 1명

---

### Phase 2 — 높음 (2~3주)

| ID | 항목 | 추정 기간 | 담당 |
|----|------|---------|------|
| C-FE-01 | 테스트 러너 셋업 (vitest) + 첫 유틸 테스트 | 3일 | QA 엔지니어 |
| H-FE-01 | RecipeTestPage 분해 (composable) | 5일 | 프론트 |
| H-FE-02 | 디자인 시스템 통일 (Win97 또는 Modern) | 3일 | UI 디자인 |
| H-FE-04 | window.alert → 토스트/Win97 알림 교체 | 3일 | 프론트 |
| H-FE-05 | shared/api 레이어 분리 | 2일 | 프론트 |
| H-FE-06 | reactive Set → ref 또는 배열로 교체 | 2일 | 프론트 |
| H-FE-09 | http 래퍼 에러/타임아웃 옵션 개선 | 1일 | 프론트 |
| H-FE-16 | displayJobName/stripFileExt 유틸 통합 | 1일 | 프론트 |

**예상 비용**: 2~3주 / 2명

---

### Phase 3 — 중간 (3~4주)

| ID | 항목 | 추정 기간 | 담당 |
|----|------|---------|------|
| H-FE-07 | watchPausable 도입 (skip flag 제거) | 2일 | 프론트 |
| H-FE-08 | FileListPanel 공통화 | 3일 | 프론트 |
| H-FE-10 | Win97ConfirmDialog 접근성/포커스 트랩 | 2일 | 프론트 |
| H-FE-11 | Win97ContextMenu 뷰포트 보정 | 1일 | 프론트 |
| H-FE-12 | RecipePickerDialog 반응형 height | 1일 | 프론트 |
| M-FE-01 ~ M-FE-26 | Medium 이슈 일괄 처리 | 3주 | 프론트 팀 |

**예상 비용**: 3~4주 / 1.5명

---

### Phase 4 — 낮음 (지속)

| ID | 항목 | 추정 기간 | 담당 |
|----|------|---------|------|
| Low 20건 | Low 심각도 개선 | 2주 | 프론트 |
| 테스트 | composable 단위 테스트 누적 | 지속 | QA |

---

## 종합 평가

### 강점
- Win97 스타일 컴포넌트 기본 구현 완료 (`Win97ConfirmDialog`, `Win97ContextMenu`, `RecipePickerDialog`, `TransferCartPanel` 등 import 및 사용 확인)
- API 계약 타입 정의 (`recipeTestApi.ts`의 `LoadResponse`, `CasContentResponse` 등)
- 라우팅 기본 구조 존재 (`/recipe-test`, `/history`)
- `recipeTestApi.invalidateRuntimeCache`가 `recipeTestApi.ts:165`에 정의되어 있고 백엔드 `api/routes/recipe_test.py`에서도 처리 함수가 존재 (P1-01 해소 상태)

### 약점
- 4,358줄 단일 파일 `RecipeTestPage.vue` → 유지보수 어려움
- 테스트 0% → 회귀 검증 불가
- 디자인 시스템 미정의 (Win97 vs Modern 혼용)
- 에러 처리가 기본 수준 → `window.alert` 25회 + HTML 응답 그대로 노출
- 소스/산출물 분리 미흡 (`*.vue.js`, `*.js`, `__init__.py` 커밋)

### 권장사항

1. **즉시 (1주)**: 폰트 선언 + 저장소 정리 + 라우팅/사이드바 정리 → 정돈된 상태 확보
2. **단기 (2~3주)**: 테스트 러너 + RecipeTestPage 분해 + 알림 체계 → 개발 속도 회복
3. **중기 (3~4주)**: 디자인 통일 + 접근성 + 컴포넌트 공통화 → 사용자 경험 향상
4. **장기**: TypeScript strict 점진 적용 → 코드 안정성

---

## 정정 및 확인 필요 사항

| 항목 | 상태 | 비고 |
|------|------|------|
| `/recipe` vs `/recipe-test` 의도 | 확인 필요 | PRD 재검토 또는 PM 확인 (H-FE-14) |
| Windows 배포 시 SPA fallback 전략 | 확인 필요 | History 모드 유지 여부 (H-FE-03) |
| Win97 vs Modern 디자인 방향 | 디자인 회의 필요 | 최종 타겟이 Windows 일관성인지 확인 (H-FE-02) |
| 테스트 전략 (e2e vs unit) | QA 논의 필요 | 우선순위 및 도구 선정 (C-FE-01) |
| `loadHistory()` stub의 유지 여부 | 확인 필요 | RecipeTestPage.vue:370의 빈 함수가 의도된 no-op인지, MyHistoryPage 폴링과 연결할지 결정 |

---

## 결론

프론트엔드는 **기능적으로는 동작하지만 아키텍처/품질 측면에서 개선이 필요한 상태**입니다.

**가장 시급한 작업**:
1. 저장소/HTML 기본 정비(폰트, .gitignore, 미사용 파일) → 정돈된 상태 확보 (1주)
2. RecipeTestPage 분해 → 개발 생산성 회복 (2주)
3. 테스트 셋업 → 자동화된 품질 보증 (1주)

이 세 가지를 완료하면 후속 개선(디자인 통일, 접근성, 공통화)의 토대가 마련됩니다.

**작성자**: Claude AI (Frontend Architect, UI/UX Designer, API Designer, JavaScript Expert, Code Quality Reviewer)
**기준일**: 2026-05-19
**문서 버전**: v2.0
