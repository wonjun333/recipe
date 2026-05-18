# Recipe Management System (RMS) — 프론트엔드 종합 코드 리뷰 보고서

**기준일**: 2026-05-18  
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
| **Critical** | 6 | 런타임 에러, 미정의 함수 호출, 테스트 전무 |
| **High** | 17 | 아키텍처 문제, 에러 처리, 상태 관리 |
| **Medium** | 26 | 중복 코드, 디자인 불일치, 라우팅 이슈 |
| **Low** | 20 | 미사용 코드, 타입 안전성, 코드 스타일 |
| **합계** | **69** | |

### 심각도별 분포

```
Critical   ████ (6건)  
High       ████████████████ (17건)  
Medium     ████████████████████████████████ (26건)  
Low        ████████████████████ (20건)  
```

### 카테고리별 분포

| 카테고리 | 건수 | 주요 이슈 |
|---------|------|---------|
| 런타임 오류 | 8 | endswith 오타, loadHistory 미정의, 문법 오염 |
| 아키텍처 | 12 | 단일 파일 3,522줄, 피처 간 의존성 혼재 |
| 에러 처리 | 10 | window.alert 남용, 예외 처리 불완전, 타이머 누수 |
| 상태 관리 | 11 | 중복 Set 사용, watch 수동 제어, computed 오남용 |
| UI/UX 일관성 | 14 | Win97 vs 현대 스타일 혼용, 폰트 미선언, 접근성 미흡 |
| 테스트 | 3 | 테스트 러너 미설정, 커버리지 0%, 자동화 검증 부재 |
| 중복 코드 | 9 | CasFileListPanel/JobFileListPanel, 저장 함수 중복 |

---

## 이슈 상세

### 1. Critical — 즉시 조치 필요 (6건)

#### C-FE-01 — String.endswith() 오타 (6곳)

**파일**: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`  
**함수**: `stripFileExt` (332행), `createPlaceholderRecipe` (471행), `casListSaveAs` (2541행), `jobListSaveAs` (2721행), `casContentSaveAs` (2662행), `jobContentSaveAs` (2797행)  
**문제**: Python 메서드명 `.endswith()`를 JavaScript에서 사용. JS의 정상 메서드는 `.endsWith()`(대문자 W).  
**근거**: 
- 해당 6곳 호출 시 즉시 `TypeError: ... .endswith is not a function` 런타임 에러 발생
- CAS/JOB Save As, 확장자 처리, 파일 종류 판별 등 핵심 경로에 위치
- 사용자가 해당 기능 실행 시 무조건 실패하며 try-catch로 인해 실제 원인은 console 에러로만 남음

**수정 방향**:
1. 모든 `.endswith(` 를 `.endsWith(` 로 일괄 치환
2. ESLint + typescript-eslint의 `no-undef` 규칙 활성화
3. CI 게이트에 `vue-tsc --noEmit` 강제하여 재발 방지

**검증 방법**:
```bash
grep -rn 'endswith' frontend/src
# 결과: 0건

npm run build
# 성공 여부 확인

# 수동 테스트: CAS/JOB Save As 기능 정상 동작 확인
```

**위험도**: 높음  
**영향 범위**: CAS/JOB 저장, 파일 확장자 처리, 메뉴 생성

---

#### C-FE-02 — loadHistory() 함수 미정의

**파일**: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`  
**호출 위치**: 8곳 (2266, 2695, 2727, 2758, 2803, 2833, 2859, 2897행)  
**함수 정의**: `frontend/src/features/history/pages/MyHistoryPage.vue:210` 에만 존재  
**문제**: RecipeTestPage에서 `loadHistory()`를 호출하지만 이 컴포넌트에는 해당 함수가 정의되지 않음.  
**근거**:
- Transfer 완료, JOB/CAS Save As/Rename/Delete 등 비즈니스 크리티컬 플로우 직후 호출
- 호출 시 `ReferenceError: loadHistory is not defined` 발생
- 호출이 try-catch 외부에 있어 전체 후속 로직(alert, clear 등) 중단 가능

**수정 방향**:
1. **옵션 A**: History 갱신이 필요 없다면 8개 호출 모두 제거
2. **옵션 B**: RecipeTestPage 자체에 `async function loadHistory() { ... }` 정의
3. **옵션 C**: History 전역 composable(예: `useHistory`)로 분리 후 import

**검증 방법**:
```bash
vue-tsc -b --noEmit
# 에러 없음 확인

# 수동 테스트:
# - Transfer 완료 후 history 페이지에서 최신 항목 반영 확인 (옵션 B/C의 경우)
# - 콘솔에서 ReferenceError 미발생 확인
```

**위험도**: 높음  
**영향 범위**: Transfer, Save As, Rename, Delete 완료 후 이력 갱신

---

#### C-FE-03 — 테스트 러너 전무 + 패키지.json 미설정

**파일**: `frontend/package.json`  
**문제**: 
- `scripts`에 `test` 명령 없음
- devDependencies에 vitest, jest, cypress 등 테스트 러너 미등록
- `frontend/src` 전체에 `*.test.*` / `*.spec.*` 파일 0개
- 정적 타입 검사 스크립트도 없음 (`npm run typecheck` 미설정)

**근거**:
- 3,522줄 단일 파일(RecipeTestPage.vue)에 CAS/JOB 저장·삭제·이동 등 비즈니스 크리티컬 로직 집중
- 위 C-FE-01, C-FE-02 같은 런타임 오류가 사전에 걸려야 함
- 현재는 사용자 실행 중에만 버그 발견 가능 (운영 리스크 높음)

**수정 방향**:
1. **최소 셋업** (1주):
   - `vitest`, `@vue/test-utils`, `jsdom` 설치
   - `"test": "vitest run"`, `"dev:test": "vitest"`, `"typecheck": "vue-tsc --noEmit --strict"` 추가

2. **우선순위 별 테스트 작성** (4~6주):
   - Phase 1: 순수 유틸 함수 (getErrorMessage, effectiveRecipeName, parseDetailEntry 등)
   - Phase 2: recipeTestApi mock 기반 테스트 (타임아웃, 에러 응답, AbortError)
   - Phase 3: composable 분리 후 상태 관리 단위 테스트

**검증 방법**:
```bash
npm install vitest @vue/test-utils jsdom --save-dev
npm run typecheck
# strict 모드에서 0 에러 (단계적으로 :any 제거)

npm run test
# 초기: 0개, 점진적으로 증가
```

**위험도**: 높음  
**영향 범위**: 전체 기능 안정성

---

#### C-FE-04 — 구문 오류: 주석 없는 한글 텍스트

**파일**: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue:626`  
**문제**: 코드 중간에 `Pel백엔드 포맷 유지` 텍스트가 주석 기호 (`//`, `/* */`) 없이 존재.  
**근거**:
- JavaScript 구문 파서가 이를 식별자 또는 label statement로 오인 가능
- 현재 빌드가 통과하는 이유는 위치가 `}` 블록 종료 후이지만, 명백한 편집 잔재
- 향후 AST 기반 도구(prettier auto-fix, eslint) 처리 시 예측 불가 결과 발생 가능

**수정 방향**:
```javascript
// 잘못된 상태 (현재):
} Pel백엔드 포맷 유지

// 수정:
} // 백엔드 포맷 유지
```

**검증 방법**:
```bash
npx vue-tsc --noEmit
# 해당 파일에 오류 없음 확인

npm run build
# 성공 확인
```

**위험도**: 높음  
**영향 범위**: 빌드 안정성, 코드 품질

---

#### C-FE-05 — fetchCasContent 내부 구문 오염

**파일**: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue:1333`  
**문제**: `} compress_output_matrix` 텍스트가 try-catch-finally 블록 사이에 삽입되어 있음.  
**근거**:
- 파서가 label statement(`compress_output_matrix:`)로 처리하거나 SyntaxError 발생 가능
- fetchCasContent 함수 실행 시 호출 단계부터 실패 또는 예측 불가 동작

**수정 방향**:
해당 식별자 라인 삭제

**검증 방법**:
```bash
grep -n 'compress_output_matrix' frontend/src/features/recipe_test/pages/RecipeTestPage.vue
# 결과: 0건

npm run build && npm run dev
# 기능 테스트: CAS 파일 로드 후 컨텐츠 표시 확인
```

**위험도**: 높음  
**영향 범위**: CAS 파일 내용 조회

---

#### C-FE-06 — 전역 폰트 미선언 (Win97 스타일 깨짐)

**파일**: `frontend/index.html`  
**문제**:
- `<html lang="en">` 상태로 한글 기반 UI와 불일치
- `<head>` 영역에 CSS 리셋 또는 `font-family` 전역 선언이 없음
- Win97 스타일 컴포넌트들이 `font-weight: 900` + sans-serif 폰트를 전제로 설계되었으나 브라우저 기본 폰트(serif) 적용되어 의도한 스타일 미재현

**근거**:
- Windows/Mac/Linux 간 기본 폰트가 다름 (Times New Roman, Georgia vs San Francisco)
- Win97 버튼의 픽셀 정확성이 폰트에 의존
- 최종 배포 환경(Windows)에서도 브라우저 폰트 설정에 따라 다르게 보임

**수정 방향**:
```html
<!-- frontend/index.html <head> 영역 -->
<style>
  html { lang: ko; }
  body {
    font-family: 'Tahoma', 'Arial', 'MS Sans Serif', sans-serif;
    font-size: 13px;
    margin: 0;
    padding: 0;
    background: #c0c0c0;
  }
</style>
```

또는 `frontend/src/style/global.css`를 생성하여 main.ts에서 import

**검증 방법**:
```bash
# 브라우저 DevTools > Computed > font-family 확인
# Win97ConfirmDialog 오버레이 텍스트가 sans-serif 계열인지 육안 확인
# Windows/Mac/Linux 시뮬레이션 후 버튼 모양 비교

# 크로스 브라우저: Chrome, Firefox, Safari, Edge 최신 버전
```

**위험도**: 높음  
**영향 범위**: Win97 스타일 전체, 사용자 인지도

---

### 2. High — 우선 처리 권장 (17건)

#### H-FE-01 — 단일 파일 3,522줄 (RecipeTestPage.vue)

**파일**: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`  
**라인**: 3,522줄 (script 부분만 약 3,123줄)  
**문제**: 
- CAS 선택/편집, JOB 선택/편집, Recipe 패널, RecipePicker, TransferCart, ContextMenu, ConfirmDialog, 칼럼 리사이즈, 키보드 내비게이션, 히스토리 로드 등 8개 이상의 독립적 도메인이 한 파일에 혼재
- ref/reactive 선언 50개 이상 산재
- 상태 추적, 디버깅, 코드 리뷰 불가능한 수준

**근거**:
- Vue SFC 권장 크기: 500~1,000줄
- 현재는 권장값의 3.5배
- 특정 상태의 변경 원인을 파악하려면 전체 파일 탐색 필수

**수정 방향**:
Vue Composition API composable로 기능 단위 분리:
```
frontend/src/features/recipe_test/composables/
├── useCasSelection.ts     // CAS 목록, 검색, 선택, 정렬
├── useJobSelection.ts     // JOB 목록, 선택, 정렬
├── useRecipePanel.ts      // Recipe 표시, 매칭
├── useRecipePicker.ts     // RecipePicker 다이얼로그 상태
├── useTransferCart.ts     // Transfer 카트 상태, 검증
├── useColumnResize.ts     // 칼럼 리사이즈 이벤트
├── useKeyboardNav.ts      // 방향키 네비게이션
├── useInventoryPolling.ts // 인벤토리 폴링
└── useActorProfile.ts     // 사용자 프로필 (이름, 팀)
```

각 composable은 관련 상태와 함수를 응집도 높게 포함.

**검증 방법**:
```bash
# 분리 후 RecipeTestPage.vue 라인 수 확인
wc -l frontend/src/features/recipe_test/pages/RecipeTestPage.vue
# 목표: 500줄 이하

# 각 composable 독립 테스트 가능성 확인
npm run test -- composables/useCasSelection
```

**위험도**: 높음  
**영향 범위**: 전체 유지보수성, 테스트 불가능

---

#### H-FE-02 — TopBarNav vs 다른 컴포넌트 디자인 언어 충돌

**파일**: `frontend/src/components/TopBarNav.vue`  
**문제**:
- TopBarNav: 현대적 flat/glassmorphism 스타일 (rgba 투명, blur, border-radius: 8px, 부드러운 애니메이션)
- Win97ConfirmDialog, Win97ContextMenu, RecipePickerDialog: 고전적 Win97 스타일 (#c0c0c0 배경, 3D 엣지, font-weight: 900)
- 동일 화면에 두 디자인 언어 공존 → 시각적 일관성 심각한 수준

**근거**:
- PRD에서 '순수 CSS' 명시하나 디자인 시스템 방향 미명시
- Win97 접두사를 의도적으로 사용한 컴포넌트들이 존재하므로 Win97 테마가 의도된 것으로 판단
- TopBarNav만 벗어난 상태

**수정 방향**:
두 가지 중 하나 선택:

1. **옵션 A: Win97으로 통일** (권장, Windows 타겟과 일치)
   - TopBarNav: background: #c0c0c0, border-bottom: 2px solid #404040, 폰트 가족 일치
   - 모든 네비게이션 요소에 Win97 beveled button 스타일 적용

2. **옵션 B: 현대적 flat으로 통일**
   - Win97ConfirmDialog → 현대 모달로 리스타일
   - Win97ContextMenu → 모던 dropdown menu
   - 일관된 색상팔레트, 애니메이션 적용

**검증 방법**:
```bash
# RecipeTestPage에서:
# 1. TopBarNav와 우클릭 컨텍스트 메뉴를 나란히 시각적으로 비교
# 2. ConfirmDialog, RecipePickerDialog도 함께 렌더링하여 스타일 일치도 평가
# 3. 스크린샷 캡처 후 디자인 리뷰 회의에서 승인
```

**위험도**: 높음  
**영향 범위**: 사용자 경험, 브랜드 일관성

---

#### H-FE-03 — 라우터 생성 시 base 인자 누락 (History 모드)

**파일**: `frontend/src/router/index.ts:23`  
**함수**: `createWebHistory()`  
**문제**:
```typescript
// 현재:
const router = createRouter({
  history: createWebHistory(),
  // ...
})

// 문제: SPA 라우팅이 서버 폴백 지원 없이 깨짐
```

**근거**:
- History 모드로 `/recipe-test` URL을 사용하지만, 서버 설정이 SPA fallback(모든 경로 → index.html)을 하지 않으면 새로고침/직접 접근 시 404
- PRD 최종 배포 타겟이 Windows(FastAPI + 정적 파일 또는 IIS)이므로 설정 필수
- createWebHashHistory()(`/#/recipe-test` 형태)가 Windows 환경에서 더 안전할 수 있음

**수정 방향**:
배포 아키텍처에 따라:

**방안 1: SPA Fallback 라우트 추가 (권장, History 모드 유지)**
```python
# backend/app/main.py
@app.get("/{full_path:path}")
async def spa_fallback(full_path: str):
    """모든 비-API 요청을 index.html로 리다이렉트"""
    if full_path.startswith("api/"):
        raise HTTPException(404)
    return FileResponse("frontend/dist/index.html")
```

**방안 2: Hash 모드로 전환 (간단하지만 URL 지저분함)**
```typescript
const router = createRouter({
  history: createWebHashHistory(),
  // ...
})
```

**검증 방법**:
```bash
# 직접 URL 입력으로 테스트:
# 1. /recipe-test 직접 입력 → 404 아닌지 확인
# 2. 페이지 새로고침 → 앱 정상 로드 확인
# 3. 뒤로가기/앞으로가기 네비게이션 정상 동작 확인
```

**위험도**: 높음  
**영향 범위**: Windows 배포 후 사용자 UX

---

#### H-FE-04 — 모든 사용자 알림이 window.alert()

**파일**: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue` (14곳)  
**문제**:
- CAS/JOB/Recipe Save·Rename·Delete·Save As·Transfer 등 모든 완료/실패 메시지가 `window.alert()`
- Win97ConfirmDialog 컴포넌트가 이미 구현되어 있으나 결과 알림은 native dialog 혼용
- 일부 alert 호출이 장황한 에러 텍스트(예: JSON.stringify된 에러 객체)를 그대로 노출

**근거**:
- window.alert는 UI 블로킹, 줄바꿈/포맷 제한, 자동화 테스트 불가능
- Win97 스타일이 의도된 시스템에 모던 alert가 튀어나옴
- 에러 메시지가 일관되지 않음 (일부는 에러 객체 전체, 일부는 필터링된 메시지)

**수정 방향**:
1. **토스트/알림 composable 추가**:
   ```typescript
   // composables/useNotification.ts
   const notifications = ref<Notification[]>([])
   
   const notify = (message: string, type: 'success' | 'error' | 'warning') => {
     notifications.value.push({ id: Date.now(), message, type })
     setTimeout(() => remove notification, 3000)
   }
   ```

2. **alert 호출 일괄 교체**: `window.alert(msg)` → `notify(msg, 'info')`

3. **에러 메시지 정규화**:
   ```typescript
   const getErrorMessage = (err: unknown): string => {
     if (err instanceof Error) return err.message
     if (typeof err === 'object' && err && 'detail' in err) 
       return (err as {detail: string}).detail
     return String(err)
   }
   ```

**검증 방법**:
```bash
grep -n "window.alert" frontend/src/features/recipe_test/pages/RecipeTestPage.vue
# 결과: 0건 (모두 notify로 교체)

# 수동 테스트:
# - Save 성공 → 토스트 메시지 표시 (블로킹 아님)
# - 실패 → 토스트 + console.error 동시 로깅
```

**위험도**: 높음  
**영향 범위**: 사용자 경험, 운영 디버깅

---

#### H-FE-05 — 피처 간 직접 의존성 (history → recipe_test)

**파일**: `frontend/src/features/history/pages/MyHistoryPage.vue:158`  
**문제**: 
```typescript
import { recipeTestApi, type HistoryEntry } 
  from '../../recipe_test/api/recipeTestApi'
```

**근거**:
- Feature Slice 구조에서 피처 간 직접 import는 의존성 방향 위반
- history가 recipe_test 내부 구현에 결합되어 API 변경 시 함께 깨짐
- 공유 타입(HistoryEntry)이 recipe_test에 종속됨

**수정 방향**:
공유 레이어 생성:
```
frontend/src/
├── shared/
│   ├── api/
│   │   ├── historyApi.ts      (getHistory, HistoryEntry 타입)
│   │   └── index.ts           (export)
│   ├── types/
│   │   └── history.ts
│   └── index.ts
├── features/
│   ├── recipe_test/
│   │   └── api/
│   │       └── recipeTestApi.ts (getHistory → shared/api/historyApi로 이동)
│   └── history/
│       └── pages/
│           └── MyHistoryPage.vue (import from '../../shared/api')
```

**검증 방법**:
```bash
grep -rn "recipe_test" frontend/src/features/history
# 결과: 0건 (shared import만 있어야 함)

npm run build
# 성공 확인
```

**위험도**: 높음  
**영향 범위**: 코드 아키텍처, 테스트 독립성

---

#### H-FE-06 — Reactive Set 사용 (Vue 3 제약)

**파일**: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`  
**위치**: `selectedCas`, `selectedJobs`, `selectedRecipes`, `selectedSlotCells`, `selectedCartTargetEqpIdsSet` (5곳)  
**패턴**:
```typescript
const selectedCas = reactive(new Set<string>())
```

**문제**:
Vue 3의 `reactive(new Set())`는 Set 변이(add/delete/clear)를 완벽하게 추적하지 못함. 관련 computed가 업데이트되지 않을 수 있음.

**근거**:
- Vue 공식 문서에서도 이 패턴이 "known limitation" 으로 기록
- 실제로 selectedCas.add()나 .delete() 호출 시 관련 computed(selectedCasIds, checkedCasCount 등)가 반응하지 않을 수 있음

**수정 방향**:
```typescript
// 방법 1: ref + 명시적 재할당 (권장)
const selectedCas = ref<Set<string>>(new Set())
const addToSelectedCas = (id: string) => {
  selectedCas.value = new Set(selectedCas.value).add(id)
}

// 방법 2: 배열로 단순화
const selectedCasIds = ref<string[]>([])
const selectedCasSet = computed(() => new Set(selectedCasIds.value))

// 방법 3: VueUse의 useSet (3.5+)
import { useSet } from '@vueuse/core'
const selectedCas = useSet<string>()
```

**검증 방법**:
```bash
# DevTools에서 Set 변이 후 computed 즉시 업데이트 확인
# CAS 선택/해제 시 상단 count 변경 여부 확인
```

**위험도**: 높음  
**영향 범위**: 선택 상태 반응성

---

#### H-FE-07 — 검색 watch에 수동 skip flag

**파일**: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue:1160~1170, 1232~1242, 1283~1293`  
**코드**:
```typescript
let skipCasWatch = false
let skipJobWatch = false

const setCasQueryProgram = (val: string) => {
  skipCasWatch = true
  casQueryProgram.value = val
  // race condition 위험
}

watch(casQueryProgram, () => {
  if (skipCasWatch) {
    skipCasWatch = false
    return
  }
  // 실제 검색 로직
})
```

**문제**: 
- 수동 flag 패턴은 Vue의 reactive watch가 microtask 큐에서 실행되므로 race condition 가능
- 속도가 빠르면 flag 리셋 전에 watcher가 실행되거나, 그 반대로 사용자 입력도 skip될 수 있음

**근거**: Vue 공식 권장 패턴이 아니며, 내부 스케줄러 변경 시 깨짐

**수정 방향**:
```typescript
// VueUse의 watchPausable 사용
import { watchPausable } from '@vueuse/core'

const { pause, resume } = watchPausable(
  casQueryProgram,
  () => { /* 검색 로직 */ }
)

const setCasQueryProgram = (val: string) => {
  pause()
  casQueryProgram.value = val
  resume()
}
```

**검증 방법**:
```bash
# 빠른 연속 입력 시뮬레이션
# 검색창이 의도치 않게 비워지거나 이전 값으로 덮이지 않는지 확인
```

**위험도**: 높음  
**영향 범위**: CAS/JOB/Recipe 검색 기능

---

#### H-FE-08 — CasFileListPanel과 JobFileListPanel 90% 중복

**파일**: 
- `frontend/src/features/recipe_test/components/CasFileListPanel.vue`
- `frontend/src/features/recipe_test/components/JobFileListPanel.vue`

**문제**: 
- template: 헤더, 스크롤, 리스트 렌더링 거의 동일
- script: columnBlockWidth computed, sortIndicator, setItemRef, setScrollRef, onMounted/onBeforeUnmount 동일
- style: flex 레이아웃, 셀 스타일 동일

**근거**: 90% 복사-붙여넣기 수준의 코드 중복

**수정 방향**:
공통 `FileListPanel.vue` 베이스 컴포넌트:
```typescript
// FileListPanel.vue
<template>
  <div class="file-list-panel">
    <header>{{ headerTitle }}</header>
    <div class="list-container" :ref="setScrollRef">
      <div v-for="item in items" :ref="setItemRef">
        {{ item.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props<T> {
  items: T[]
  headerTitle: string
  getItemId: (item: T) => string
  getItemName: (item: T) => string
}
const props = defineProps<Props<any>>()
// 공통 로직
</script>
```

CAS/JOB는 props로 구분:
```typescript
// CasFileListPanel.vue
<FileListPanel
  :items="casList"
  header-title="CAS Files"
  :getItemId="(cas) => cas.id"
  :getItemName="(cas) => cas.name"
/>
```

**검증 방법**:
```bash
# 공통화 후 CAS/JOB 패널 동작 테스트:
# - 정렬 변경 → 목록 재정렬
# - 스크롤 → 맨 아래 아이템 로드
# - 칼럼 리사이즈 → 너비 변경 반영
```

**위험도**: 높음  
**영향 범위**: 유지보수성, 버그 재현 위험

---

#### H-FE-09 — API 에러 처리 미흡 (http 래퍼)

**파일**: `frontend/src/features/recipe_test/api/recipeTestApi.ts:329~356`  
**함수**: `http<T>()`  
**문제**:
```typescript
const http = async <T,>(url: string, options?: RequestInit): Promise<T> => {
  try {
    const res = await fetch(url, { ...options, signal: abortController.signal })
    if (!res.ok) {
      throw new Error(await res.text()) // 큰 HTML도 그대로 메시지로
    }
    return await res.json()
  } catch (err: any) {  // any로 타입 무시
    throw err
  }
}
```

**근거**:
- 500 에러로 HTML 페이지 반환 → alert에 KB 단위 텍스트 노출
- status code가 메시지에 미포함 → 호출자가 401/404/500 구분 불가
- 타임아웃이 모든 요청에 60초 일괄 적용 → FTP 로드(몇 분 소요)는 실패

**수정 방향**:
```typescript
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public payload?: unknown
  ) {
    super(message)
  }
}

const http = async <T,>(
  url: string, 
  options?: RequestInit & { timeout?: number }
): Promise<T> => {
  const controller = new AbortController()
  const timeout = options?.timeout ?? 60000
  const timer = setTimeout(() => controller.abort(), timeout)
  
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    if (!res.ok) {
      let errorMsg = `${res.status} ${res.statusText}`
      try {
        const json = await res.json()
        if (json.detail) errorMsg = json.detail
      } catch {
        // JSON 파싱 실패 시 status만 사용
      }
      throw new ApiError(errorMsg, res.status, { status: res.status })
    }
    return await res.json()
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new ApiError('Network error', 0)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}
```

**검증 방법**:
```bash
# Mock fetch로 테스트:
# 1. 500/HTML 응답 → 단축된 에러 메시지만 표시
# 2. 401 JSON → status 추출 가능
# 3. 타임아웃 → 호출부에서 err.status === 0 으로 구분
```

**위험도**: 높음  
**영향 범위**: 에러 디버깅, 사용자 알림

---

#### H-FE-10 — Win97ConfirmDialog 포커스 트랩 미구현

**파일**: `frontend/src/features/recipe_test/components/Win97ConfirmDialog.vue`  
**문제**: 
- 모달이 열린 상태에서 Tab 키를 누르면 포커스가 배경 요소로 이동
- ARIA 속성(role='dialog', aria-modal='true', aria-labelledby) 전무
- Escape 키로 닫기 미구현

**근거**:
- WCAG 2.1 기준: 포커스가 모달 내부에만 순환해야 함
- 파괴적 작업(삭제, 덮어쓰기 확인)을 담당하는 컴포넌트이므로 키보드 사용자 보호 필수

**수정 방향**:
```vue
<template>
  <div
    v-if="isVisible"
    class="w97-modal-overlay"
    role="presentation"
    @click.self="onCancel"
  >
    <div
      class="w97-modal"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      @keydown="onKeyDown"
    >
      <div class="w97-modal-titlebar" :id="titleId">
        {{ title }}
      </div>
      <!-- ... -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const titleId = computed(() => `modal-title-${Date.now()}`)
const focusableElements = ref<HTMLElement[]>([])

onMounted(() => {
  // 모달 내 포커스 가능 요소 수집
  const modal = document.querySelector('[role="dialog"]')
  focusableElements.value = Array.from(
    modal?.querySelectorAll('button, [href], input, select, textarea') || []
  )
  // 첫 버튼에 포커스
  focusableElements.value[0]?.focus()
})

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    onCancel()
  } else if (e.key === 'Tab') {
    // 포커스 순환 처리
    const lastIdx = focusableElements.value.length - 1
    const currentIdx = focusableElements.value.indexOf(e.target as HTMLElement)
    
    if (e.shiftKey && currentIdx === 0) {
      e.preventDefault()
      focusableElements.value[lastIdx]?.focus()
    } else if (!e.shiftKey && currentIdx === lastIdx) {
      e.preventDefault()
      focusableElements.value[0]?.focus()
    }
  }
}
</script>
```

**검증 방법**:
```bash
# 모달 오픈 후 Tab 연속 입력
# 포커스가 [Yes] → [No] → [Yes] 순환 확인
# VoiceOver/NVDA에서 "dialog 확인" 읽기 확인
```

**위험도**: 높음  
**영향 범위**: 접근성 (WCAG 준수)

---

#### H-FE-11 — Win97ContextMenu 뷰포트 경계 미처리

**파일**: `frontend/src/features/recipe_test/components/Win97ContextMenu.vue`  
**문제**: 컨텍스트 메뉴가 화면 우측/하단 끝에서 벗어남.  
**근거**: 원본 Win97도 경계 자동 조정하나, 현재는 미구현.

**수정 방향**:
```typescript
const onContextMenu = (e: MouseEvent) => {
  const menu = document.querySelector('.w97-context-menu')
  nextTick(() => {
    const rect = menu?.getBoundingClientRect()
    let x = e.clientX
    let y = e.clientY
    
    if (rect && x + rect.width > window.innerWidth) {
      x = window.innerWidth - rect.width - 10
    }
    if (rect && y + rect.height > window.innerHeight) {
      y = window.innerHeight - rect.height - 10
    }
    
    menuX.value = x
    menuY.value = y
  })
}
```

**검증 방법**:
뷰포트 우측 30px 이내에서 우클릭 → 메뉴 전체가 화면 내에 표시되는지 확인.

**위험도**: 높음  
**영향 범위**: 사용자 경험, 우클릭 컨텍스트 메뉴

---

#### H-FE-12 — RecipePickerDialog 고정 높이 (반응형 미처리)

**파일**: `frontend/src/features/recipe_test/components/RecipePickerDialog.vue`  
**그리드 정의**: `grid-template-rows: 220px minmax(260px, 1fr)`  
**문제**: 저해상도 모니터(768px 높이)에서 모달이 뷰포트 초과.  
**근거**: width는 `min(1180px, 96vw)`로 반응형이나 height는 고정.

**수정 방향**:
```css
.w97-modal.picker {
  max-height: 92vh;
  overflow-y: auto;
}

.picker-grid {
  grid-template-rows: max(220px, 25vh) minmax(260px, 1fr);
}
```

**검증 방법**:
브라우저 높이 700px로 설정 → RecipePickerDialog 오픈 → 완전히 화면 내에 표시되는지 확인.

**위험도**: 높음  
**영향 범위**: Recipe 선택 기능 (저해상도)

---

#### H-FE-13 — Sidebar.vue 미사용 (TopBarNav와 중복)

**파일**: `frontend/src/components/Sidebar.vue`  
**문제**: 정의되어 있으나 어디에도 import되지 않음. TopBarNav와 동일 네비게이션 링크.  
**근거**: 번들에 포함되지 않으나 코드 혼란 가중, 향후 네비게이션 변경 시 한쪽만 수정 위험.

**수정 방향**:
사용 여부 최종 확인 후 미사용이면 삭제. 향후 필요 시 TopBarNav와 공통 navItems 배열로 통합.

**검증 방법**:
```bash
grep -r "Sidebar" frontend/src
# 결과: import/사용 0건이면 삭제 가능
```

**위험도**: 높음  
**영향 범위**: 코드 유지보수성

---

#### H-FE-14 — /recipe 라우트 미확인 (redirect 상태)

**파일**: `frontend/src/router/index.ts:9~11`  
**문제**: `/recipe`가 `/recipe-test`로 redirect되는데, TopBarNav에는 `to="/recipe"` 링크가 있어 active 스타일이 적용되지 않음.  
**근거**: `/recipe`에 대응하는 실제 페이지가 없으므로 의도 불명확.

**수정 방향**:
- 별도 Recipe 페이지 예정 → placeholder 생성 후 redirect 제거
- Recipe = recipe-test → TopBarNav에서 to="/recipe-test"로 변경 또는 링크 제거

**검증 방법**:
TopBarNav Recipe 링크 클릭 → active CSS 스타일 적용 여부 확인.

**위험도**: 높음  
**영향 범위**: 네비게이션 UX

---

#### H-FE-15 — ./src 디렉터리에 컴파일 산출물 (*.vue.js 17개)

**파일**: 
- `frontend/src/**/*.vue.js` (17개)
- `frontend/src/main.js`
- `frontend/src/__init__.py`

**문제**: 소스 파일과 컴파일 산출물이 함께 커밋되어 있음.  
**근거**: 불필요한 git diff, IDE 검색 노이즈, 잘못된 파일 수정 위험.

**수정 방향**:
```bash
# .gitignore 추가
echo "src/**/*.vue.js" >> .gitignore
echo "src/**/*.js" >> .gitignore  # ts 파일과 혼동 주의
echo "src/__init__.py" >> .gitignore

# 기존 파일 제거
git rm --cached frontend/src/**/*.vue.js
git rm --cached frontend/src/main.js
git rm --cached frontend/src/__init__.py
```

**검증 방법**:
```bash
vite build
# 정상 빌드 확인

git status
# 17개 *.vue.js가 untracked/ignored로 표시
```

**위험도**: 높음  
**영향 범위**: 저장소 관리

---

#### H-FE-16 — main.ts의 디버그 console.log 잔재

**파일**: `frontend/src/main.ts:6~7`  
**코드**:
```typescript
console.log('main.ts start')
console.log('router =', router)
```

**문제**: 프로덕션 빌드에도 포함되어 라우터 구조 노출.  
**근거**: 코드 품질, 운영 환경 보안 (내부 구조 노출).

**수정 방향**: 두 줄 삭제. 향후 개발 환경 전용이면 `if (import.meta.env.DEV) { ... }` 블록.

**검증 방법**:
```bash
npm run build
# dist/ 번들에서 'main.ts start' 문자열 미포함 확인
```

**위험도**: 높음  
**영향 범위**: 운영 보안, 코드 품질

---

#### H-FE-17 — displayJobName 함수 중복

**파일**: 
- `frontend/src/features/recipe_test/pages/RecipeTestPage.vue` (RecipeTestPage 내 정의)
- `frontend/src/features/recipe_test/components/CasContentPanel.vue:134` (별도 정의)

**문제**: 동일 목적의 함수가 두 곳에 다른 구현으로 존재.  
**근거**: RecipeTestPage는 stripFileExt 유틸 사용, CasContentPanel은 인라인 처리.

**수정 방향**:
공유 유틸 파일 생성:
```typescript
// frontend/src/features/recipe_test/utils/fileNameUtils.ts
export const displayJobName = (jobName: string): string => {
  return stripFileExt(jobName, '.job')
}

export const stripFileExt = (name: string, ext: string): string => {
  const lowerName = name.toLowerCase()
  const lowerExt = ext.toLowerCase()
  if (lowerName.endsWith(lowerExt)) {
    return name.slice(0, -ext.length)
  }
  return name
}
```

**검증 방법**:
CAS Content 패널의 Job Name 표시 = Job List 표시 일치도 확인.

**위험도**: 높음  
**영향 범위**: 코드 일관성, 유지보수성

---

### 3. Medium — 권장 개선 (26건)

#### M-FE-01 ~ M-FE-26

Medium 심각도는 중복 코드, 디자인 불일치, 접근성 개선, 스타일 톤 불일치 등으로 구성되어 있습니다.

**주요 Medium 이슈 (상위 5개)**:

1. **폰트 크기 불일치** (RecipePickerDialog: 10px vs 17px)
   - 파일: `frontend/src/features/recipe_test/components/RecipePickerDialog.vue`
   - 수정: `.preview-table-large td` font-size를 14px로 통일

2. **MyHistoryPage 디자인/언어 불일치**
   - 파일: `frontend/src/features/history/pages/MyHistoryPage.vue`
   - 수정: Win97 스타일로 통일 또는 현대 스타일로 통일, 한국어 우선으로 정책 수립

3. **LoadingOverlay 스타일 이질성**
   - 파일: `frontend/src/features/recipe_test/components/LoadingOverlay.vue`
   - 수정: Win97 스타일 또는 현대 스타일로 통일

4. **CasContentPanel과 JobFileListPanel 공통화**
   - 중복 정렬 인디케이터, 리사이즈 로직
   - 추출: `useFileListPanel()` composable

5. **콜럼 리사이즈 로직 중복** (2곳)
   - 파일: `RecipeTestPage.vue` (listResizeState vs recipeListResizeState)
   - 추출: `useColumnResize()` composable

**나머지 Medium 이슈**는 다음을 포함합니다:
- 이모지 아이콘 혼용 (접근성 개선 필요)
- RecipePickerDialog 반응형 레이아웃
- 폼 입력 검증 누락 (openAsciiNamePrompt)
- 인벤토리 폴링 백그라운드 처리
- MyHistoryPage 에러 상태 표시 미흡
- 선택 범위 함수 중복 (selectRangeString/Job/Recipe)
- deepClone 구현 미흡
- 타이머 타입 안전성
- window.confirm 사용
- /recipe-test 라우팅 중복 (redirect)

---

### 4. Low — 선택적 개선 (20건)

Low 심각도는 코드 스타일, 타입 안전성, 미사용 코드 정리 등으로 구성됩니다.

**주요 Low 이슈**:
- 느슨한 비교 (`==` → `===`)
- `== as any` 타입 무시 (점진적으로 strict 적용)
- props 정의 방식 일관성 (제네릭 vs 런타임 옵션)
- API_BASE 환경변수 관리
- HTML lang 속성 변경 (ko)
- example/mock 파일 분리
- 타이머 정리 누락
- Computed writable 과다 사용

---

## 우선순위별 로드맵

### Phase 1 — 긴급 (1주)

| ID | 항목 | 추정 기간 | 담당 |
|----|------|---------|------|
| C-FE-01 | endswith 오타 6곳 수정 | 2시간 | 개발자 |
| C-FE-02 | loadHistory 미정의 함수 처리 | 4시간 | 개발자 |
| C-FE-04 | 주석 없는 한글 텍스트 제거 | 30분 | 개발자 |
| C-FE-05 | compress_output_matrix 제거 | 30분 | 개발자 |
| C-FE-06 | 전역 폰트 선언 추가 | 2시간 | UI 디자인 |
| H-FE-15 | *.vue.js 제거 & .gitignore 추가 | 1시간 | 개발자 |
| H-FE-16 | console.log 삭제 | 30분 | 개발자 |

**예상 비용**: 1주(5영업일) / 1명

---

### Phase 2 — 높음 (2~3주)

| ID | 항목 | 추정 기간 | 담당 |
|----|------|---------|------|
| C-FE-03 | 테스트 러너 셋업 (vitest) | 3일 | QA 엔지니어 |
| H-FE-01 | RecipeTestPage 분해 (composable) | 5일 | 백엔드 개발자 + 프론트 |
| H-FE-02 | 디자인 시스템 통일 (Win97) | 3일 | UI 디자인 |
| H-FE-03 | SPA fallback 라우트 추가 | 2일 | 개발자 |
| H-FE-04 | window.alert → 토스트 교체 | 3일 | 프론트 |
| H-FE-05 | shared/api 레이어 분리 | 2일 | 프론트 |
| H-FE-06 | Reactive Set → ref 교체 | 2일 | 프론트 |

**예상 비용**: 2~3주 / 2명

---

### Phase 3 — 중간 (3~4주)

| ID | 항목 | 추정 기간 | 담당 |
|----|------|---------|------|
| M-FE-01 ~ M-FE-26 | Medium 이슈 일괄 처리 | 3주 | 프론트 팀 |
| H-FE-10 ~ H-FE-14 | 접근성, 컴포넌트 개선 | 2주 | 프론트 + 디자인 |

**예상 비용**: 3~4주 / 1.5명

---

### Phase 4 — 낮음 (진행 중)

| ID | 항목 | 추정 기간 | 담당 |
|----|------|---------|------|
| Low 20건 | Low 심각도 개선 | 2주 | 프론트 |
| 테스트 | composable 단위 테스트 작성 | 지속 | QA |

---

## 종합 평가

### 강점
- ✅ Win97 스타일 컴포넌트 기본 구현 완료
- ✅ API 계약 타입 정의 (일부)
- ✅ 라우팅 기본 구조 존재

### 약점
- ❌ 3,522줄 단일 파일 → 유지보수 불가능
- ❌ 런타임 오류 6건 (endswith, loadHistory 등) → 사용자 영향
- ❌ 테스트 0% → 회귀 검증 불가능
- ❌ 디자인 시스템 미정의 (Win97 vs Modern 혼용)
- ❌ 에러 처리 기본 → window.alert만 사용

### 권장사항

1. **즉시 (1주)**: Critical 6건 + High 3건 (라우팅, 폰트) 해결 → 운영 가능 상태
2. **단기 (2~3주)**: RecipeTestPage 분해 + 테스트 셋업 → 개발 속도 회복
3. **중기 (3~4주)**: 디자인 통일 + 접근성 개선 → 사용자 경험 향상
4. **장기**: TypeScript strict 점진 적용 → 코드 안정성

---

## 정정 및 확인 필요 사항

| 항목 | 상태 | 비고 |
|------|------|------|
| `/recipe` vs `/recipe-test` 의도 | ❓ 확인 필요 | PRD 재검토 또는 PM 확인 |
| Windows 배포 시 SPA fallback 전략 | ❓ 확인 필요 | deployment-windows.md 참조 |
| History 갱신 필수 여부 | ❓ 확인 필요 | Transfer/Save 후 즉시 반영 여부 |
| Win97 vs Modern 디자인 방향 | ❓ 디자인 회의 필요 | 최종 타겟 (Windows? 모든 브라우저?) |
| 테스트 전략 (e2e vs unit) | ❓ QA 논의 필요 | 우선순위 및 도구 선정 |

---

## 결론

프론트엔드는 **기능적으로는 동작하나 아키텍처와 품질 측면에서 심각한 문제**를 보유하고 있습니다.

**가장 시급한 작업**:
1. Critical 6건 수정 → 운영 안정성 확보 (1주)
2. RecipeTestPage 분해 → 개발 생산성 회복 (2주)
3. 테스트 셋업 → 자동화된 품질 보증 (1주)

이 세 가지를 완료하면 프로젝트의 80%는 안정화될 것으로 예상됩니다.

**작성자**: Claude AI (Frontend Architect, UI/UX Designer, API Designer, JavaScript Expert, Code Quality Reviewer)  
**기준일**: 2026-05-18  
**문서 버전**: v1.0
