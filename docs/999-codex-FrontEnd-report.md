# FrontEnd 코드 리뷰 보고서

기준일: 2026-05-18  
검토 범위 우선순위: `frontend` 디렉토리 우선, 필요 시 `backend/app/api/routes`, `backend/app/main.py`, `backend/main.py` 확인  
기준 자료: `docs/1-prd.md`, `docs/2-erd.md`, `docs/3-execution-plan.md`, 실제 소스코드  
원칙:
- 문서와 코드가 충돌하면 실제 코드를 우선했다.
- 실제 코드에 없는 내용은 추측하지 않았다.
- 불확실한 항목은 `확인 필요`로 표기했다.
- 소스코드는 수정하지 않았고, 본 문서만 생성했다.

## 검토 요약

- 현재 FrontEnd는 `frontend/src/features/recipe_test/pages/RecipeTestPage.vue` 중심의 단일 대형 페이지 구조이며, 라우팅은 `/recipe-test`, `/history` 두 축이다.
- 실제 상태 기준으로는 UI/상태/계약/빌드 모두에 중대한 문제가 있다. 특히 `frontend/tsconfig.json` 손상, `RecipeTestPage.vue` 구문 손상, FrontEnd가 호출하는 `/api/recipe-test/*`, `/api/recipe-inventory/*` 계약과 실제 Backend 엔트리포인트 불일치가 가장 큰 리스크다.
- 문서상 계획(`docs/3-execution-plan.md`)에 적힌 미구현 항목 일부가 실제 코드에도 그대로 남아 있으며, 현재는 기능 부족 수준을 넘어 빌드/실행 차단 요인으로 확인된다.

## 검토 항목별 요약

| 항목 | 판단 |
|---|---|
| 1. 프로젝트 구조와 라우팅 | 라우트 수는 적지만 정보 구조가 모호하고 `/recipe` 메뉴가 실질적으로 중복 |
| 2. 컴포넌트 구조와 재사용성 | `RecipeTestPage.vue`에 책임 과집중, 재사용성 낮음 |
| 3. API 호출 구조와 Backend 계약 정합성 | 실제 엔드포인트 등록/구현 불일치로 매우 취약 |
| 4. 상태 관리와 데이터 흐름 | 선택 상태, 편집 상태, 검색 상태, 복원 상태가 서로 충돌 |
| 5. Win97 스타일 구현 범위 적절성 | 범위가 고정되지 않아 패널/헤더/히스토리 간 시각 언어 충돌 |
| 6. 에러 처리와 사용자 알림 | 읽기 API는 조용히 실패, 일부 화면은 빈 상태와 오류를 구분하지 못함 |
| 7. 빌드/런타임 위험 | 현재 빌드 실패가 재현됨 |
| 8. 테스트 부족 영역 | test/lint 자동화 부재, 핵심 시나리오 회귀 방어선 없음 |
| 9. 중복 코드, dead code, 리팩토링 후보 | 생성 산출물 혼입, 미사용 파일, 대형 파일 구조 문제 존재 |

## 주요 이슈

### 1. [Critical] `frontend/tsconfig.json`이 실제 TypeScript 설정이 아니어서 빌드가 즉시 실패함

- 파일 경로: `frontend/tsconfig.json`
- 문제: TypeScript 설정 파일이 JSON이 아니라 Vite 설정 코드로 덮여 있다.
- 근거:
  - 파일 시작부가 `import { defineConfig } from 'vite'`로 시작한다.
  - `npm run build` 실행 시 `tsconfig.json(1,1): error TS1005: '{' expected.`가 재현됐다.
  - 실제 `vite.config.ts`도 별도로 존재한다.
- 수정 방향:
  - `tsconfig.json`을 정상 JSON 설정으로 복구해야 한다.
  - `vite.config.ts`만 Vite 설정의 source of truth로 유지해야 한다.
  - 생성 산출물 또는 잘못된 복사 과정으로 덮인 것인지 `확인 필요`.
- 위험도: 빌드/배포 차단, 모든 프론트엔드 검증 차단
- 검증 방법:
  - `frontend/tsconfig.json`이 JSON 형식인지 확인
  - `cd frontend && npm run build` 재실행 시 `tsconfig.json` 관련 파싱 오류가 사라져야 함

### 2. [Critical] `RecipeTestPage.vue`에 비정상 토큰이 삽입되어 SFC 자체가 컴파일되지 않음

- 파일 경로: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
- 문제: 핵심 페이지 스크립트에 코드가 아닌 문자열과 깨진 제어 흐름이 섞여 있다.
- 근거:
  - `626`행 `Pel백엔드 포맷 유지`
  - `1333`행 `compress_output_matrix`
  - `3224`행 고아 `} else {`
  - `npm run build`에서 `RecipeTestPage.vue(626,2)`, `(1334,3)`, `(1476,14)`, `(3224,9)` 오류 재현
- 수정 방향:
  - 손상된 구간을 정상 TypeScript 문법으로 복구해야 한다.
  - 최근 병합/자동 생성/수동 편집 과정에서 소스가 오염됐는지 `확인 필요`.
  - 복구 후 페이지 로직을 더 작은 composable/handler로 분리하는 것이 안전하다.
- 위험도: `/recipe-test` 화면 전체 렌더/빌드 차단
- 검증 방법:
  - `cd frontend && npm run build` 성공
  - `/recipe-test` 초기 진입과 `Load` 동작 확인

### 3. [Critical] FrontEnd가 호출하는 `/api/recipe-test/*`, `/api/recipe-inventory/*` 계약이 실제 Backend 엔트리포인트에 등록되어 있지 않음

- 파일 경로:
  - `frontend/src/features/recipe_test/api/recipeTestApi.ts`
  - `backend/app/main.py`
  - `backend/main.py`
- 문제: FrontEnd는 `/api/recipe-test/*`, `/api/recipe-inventory/*`를 광범위하게 호출하지만 실제 FastAPI 앱 엔트리포인트에는 해당 라우터 등록이 없다.
- 근거:
  - FrontEnd는 `getEqpOptions`, `load`, `getCasContent`, `getJobContent`, `getRecipeContent`, `persistCas`, `persistJob`, `deleteFiles`, `transferFiles`, `getInventoryRecipeSnapshot`, `invalidateRuntimeCache`, `getHistory`, `cloneRecipe` 등을 모두 `/api/...`로 호출한다.
  - `backend/app/main.py`, `backend/main.py`에는 `include_router(...)`가 없고, 등록된 경로는 `GET /`, `GET /api/recipe-units`뿐이다.
  - `docs/3-execution-plan.md`의 `EP-01`도 라우터 미등록을 Critical로 명시하고 있다.
- 수정 방향:
  - 실제 ASGI 엔트리포인트 하나를 확정하고, FrontEnd가 호출하는 라우터를 `/api` prefix로 명시 등록해야 한다.
  - 현재 `backend/app/main.py`와 `backend/main.py`가 병존하므로 실제 운영 엔트리포인트는 `확인 필요`.
- 위험도: 개발/운영 환경에서 API 404 가능성 매우 높음
- 검증 방법:
  - `uvicorn` 기동 후 `/api/recipe-test/eqp-options`, `/api/recipe-test/load`, `/api/recipe-test/history` 직접 호출
  - 404 없이 응답하는지 확인

### 4. [High] FrontEnd가 실제로 사용하는 API 중 일부는 라우터 선언만 있고 구현이 확인되지 않음

- 파일 경로:
  - `frontend/src/features/recipe_test/api/recipeTestApi.ts`
  - `backend/app/api/routes/recipe_test_content.py`
  - `backend/app/api/routes/recipe_file_ops.py`
  - `backend/app/api/routes/recipe_test_impl.py`
- 문제: 읽기/쓰기 엔드포인트 일부가 라우터 wrapper만 있고 실제 구현 함수가 보이지 않는다.
- 근거:
  - `recipe_test_content.py`는 `impl.get_recipe_content(...)`를 호출하지만 `recipe_test_impl.py`에서 `def get_recipe_content` 구현이 확인되지 않았다.
  - `recipe_file_ops.py`는 `impl.save_cas`, `impl.persist_cas`, `impl.persist_job`, `impl.rename_file`, `impl.delete_files`, `impl.transfer_files`, `impl.clone_recipe`에 위임하지만, `recipe_test_impl.py`에서 해당 함수 정의가 확인되지 않았다.
  - 이 항목은 실제 엔드포인트 미등록 이슈와 별개로, 등록 후에도 런타임 오류가 발생할 수 있다는 의미다.
- 수정 방향:
  - FrontEnd payload/response shape 기준으로 실제 구현을 추가하거나, 미지원 기능이라면 FrontEnd 호출을 제거/비활성화해야 한다.
  - 레거시 `recipe_test.py`와 `recipe_test_impl.py` 중 어느 쪽이 실제 구현 원천인지 `확인 필요`.
- 위험도: 저장/삭제/복제/미리보기 같은 핵심 작업 런타임 실패 가능
- 검증 방법:
  - `rg`로 구현 함수 존재 여부 재확인
  - 엔드포인트 직접 호출 후 500/AttributeError 여부 확인

### 5. [High] inventory polling 계약이 FrontEnd와 Backend 사이에서 맞지 않음

- 파일 경로:
  - `frontend/src/features/recipe_test/api/recipeTestApi.ts`
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
  - `backend/app/api/routes/recipe_inventory.py`
- 문제: FrontEnd는 3초 polling으로 `/api/recipe-inventory/snapshot`과 `/api/recipe-test/invalidate-runtime-cache`를 전제하지만, Backend 라우트에는 해당 경로가 없다.
- 근거:
  - `RecipeTestPage.vue`는 `3211`행 부근에서 `getInventoryRecipeSnapshot()` 호출, hash 변경 시 `invalidateRuntimeCache()` 호출
  - `recipe_inventory.py`에는 `/failures`, `/entries`, `/latest-version`, `/state`만 있고 `/snapshot`이 없다
  - `backend/app/api/routes` 전체에서도 `invalidate-runtime-cache` 정의가 확인되지 않았다
- 수정 방향:
  - polling을 유지할 계획이면 `/snapshot`, `/invalidate-runtime-cache` 계약을 실제 구현해야 한다.
  - 아니라면 FrontEnd polling 로직을 제거하거나 `/state` 기반으로 재설계해야 한다.
- 위험도: 불필요한 404 반복, 콘솔 오류 누적, 상태 복원 로직 오동작
- 검증 방법:
  - `/api/recipe-inventory/snapshot?eqpId=...` 직접 호출
  - polling 중 네트워크 탭에서 404/실패 반복 여부 확인

### 6. [Critical] 부모-자식 prop 계약이 어긋나 핵심 리스트/다이얼로그 상태 전달이 깨져 있음

- 파일 경로:
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
  - `frontend/src/features/recipe_test/components/CasFileListPanel.vue`
  - `frontend/src/features/recipe_test/components/JobFileListPanel.vue`
  - `frontend/src/features/recipe_test/components/RecipePickerDialog.vue`
- 문제: 부모가 전달하는 prop 이름/타입과 자식이 기대하는 계약이 다르다.
- 근거:
  - 부모는 `CasFileListPanel`에 `:cas-cols="casCols"`, `JobFileListPanel`에 `:job-cols="jobCols"`를 전달한다.
  - 두 자식 컴포넌트는 모두 `columns` prop만 정의하고 렌더링도 `columns`를 사용한다.
  - 부모는 `RecipePickerDialog`에 `:preview-id="previewRecipe"`를 전달하지만, 자식은 `previewId: string`과 별도 `previewRecipe: RecipeDetail | null`를 기대한다.
- 수정 방향:
  - 리스트 계열 prop 이름을 `columns`로 통일해야 한다.
  - `RecipePickerDialog`는 `previewId`와 `previewRecipe`를 분리해 명시 전달해야 한다.
  - 현재 빌드 실패 상태라 Vue runtime warning 재확인은 `확인 필요`.
- 위험도: 핵심 목록/미리보기 상태 전달 오류, 선택/렌더링 실패 가능
- 검증 방법:
  - Vue warning 로그 확인
  - CAS/JOB 리스트와 picker preview가 실제로 렌더링/동기화되는지 확인

### 7. [High] CAS/JOB 선택 상태와 content 표시 조건이 뒤집혀 있음

- 파일 경로: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`, `frontend/src/features/recipe_test/components/JobContentPanel.vue`
- 문제: 단일 선택 시 보여야 할 CAS/JOB content가 반대로 계산되어 숨겨질 가능성이 높다.
- 근거:
  - `showJobContent = computed(() => !selectedJobSingleReal.value)`
  - `casContentVisible = computed(() => !casSelectedSingle.value && casContentCanShow.value)`
  - 컨텍스트 메뉴 편집 가능 여부도 `!selectedJobSingleReal.value`, `!casSelectedSingle.value` 조건을 사용한다.
- 수정 방향:
  - `hasSingleJobSelection`, `hasSingleCasSelection` 같은 단일 소스를 기준으로 content 표시/편집 가능/preview 계산을 통일해야 한다.
- 위험도: 단일 선택 UX 역전, 편집 진입 불가, 사용성 저하
- 검증 방법:
  - 단일 CAS/JOB 선택 시 content panel과 Edit 메뉴가 활성화되는지 확인
  - 다중 선택 또는 `(None)` 선택 시에만 비활성 상태가 되는지 확인

### 8. [High] 편집 상태와 선택 상태가 분리되어 있지 않아 다른 항목 선택 시 저장 대상이 흔들릴 수 있음

- 파일 경로: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
- 문제: `jobEditMode`, `casEditMode`가 전역 boolean 수준이고, 실제로 어떤 CAS/JOB를 편집 중인지 고정되지 않는다.
- 근거:
  - Job 편집은 `jobEditMode`와 `jobBaseline` map으로만 관리된다.
  - 편집 중에도 `onJobClick`으로 다른 Job 선택이 가능하다.
  - Save/Cancel은 항상 현재 선택된 Job 기준으로 동작한다.
  - CAS는 편집 중 리스트 클릭 시 확인 없이 `casEditMode`를 끄는 로직이 있다.
- 수정 방향:
  - `editingJobId`, `editingCasId`처럼 편집 상태를 엔티티와 결합해야 한다.
  - 선택 전환 시 discard/save 확인을 거치게 해야 한다.
- 위험도: 데이터 손실, 잘못된 대상 저장, 사용자 혼란
- 검증 방법:
  - 편집 중 다른 CAS/JOB 클릭 시 저장 확인이 뜨는지 확인
  - 저장/취소 대상이 원래 편집하던 엔티티로 유지되는지 확인

### 9. [Medium] 검색 입력과 선택 상태 요약이 같은 state를 공유해 watcher 우회 로직이 과도함

- 파일 경로: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
- 문제: 검색창이 실제 검색어와 현재 선택 요약 문자열을 동시에 담고 있다.
- 근거:
  - `casQuery`, `jobQuery`, `recipeFind`가 검색 입력으로 사용된다.
  - 선택 시 `setCasQueryProgram`, `setJobQueryProgram`, `setRecipeFindProgram`으로 선택 이름/다중 선택 요약을 다시 써넣는다.
  - 이를 우회하려고 `skip*Watch`, `hasComma()` 같은 예외 로직이 들어가 있다.
- 수정 방향:
  - 검색어 state와 선택 상태 표시용 state를 분리해야 한다.
  - 선택 요약은 read-only label/computed로 두는 편이 안전하다.
- 위험도: 예기치 않은 필터 초기화, 선택 동기화 불안정
- 검증 방법:
  - 다중 선택 후 검색창 내용이 의도치 않게 변경되는지 확인
  - 검색어를 지웠을 때 선택 상태가 리셋되지 않는지 확인

### 10. [Medium] Recipe 삭제 payload 생성 로직이 잘못되어 API 계약에 맞는 `items`를 만들지 못함

- 파일 경로: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
- 문제: 삭제 대상 필터가 반대로 작성되어 유효한 `RecipeDetail`을 제거하고 있다.
- 근거:
  - `filter((r): r is RecipeDetail => !r)`는 `RecipeDetail`이 아니라 falsy 값만 통과시키는 조건이다.
  - 이후 `map(r => ({ kind: 'recipe', name: r.name, ... }))`는 정상 데이터가 아닌 값에 의존하게 된다.
- 수정 방향:
  - 필터 조건을 실제 `RecipeDetail` 존재 케이스만 남기도록 수정해야 한다.
  - 전송 직전 `items.length === ids.length` 검증을 넣는 편이 안전하다.
- 위험도: 삭제 기능 무효 또는 런타임 오류
- 검증 방법:
  - recipe 1건 선택 후 삭제 직전 `items` shape 확인
  - 실제 API 호출 payload가 `{ kind, name, sourceKind }[]`인지 검증

### 11. [High] `actorName`을 입력하거나 확인할 UI가 없어 History의 사용자 식별 정보가 `Unknown`으로 떨어질 수 있음

- 파일 경로:
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
  - `frontend/src/features/recipe_test/components/RecipeTestHeader.vue`
  - `frontend/src/features/history/pages/MyHistoryPage.vue`
- 문제: History가 핵심 컬럼으로 사용하는 `actorName`을 사용자가 화면에서 입력/확인할 방법이 없다.
- 근거:
  - `RecipeTestPage.vue`에는 `actorName` 관련 state와 localStorage 복원 로직이 있다.
  - `RecipeTestHeader.vue` 템플릿에는 이를 바인딩한 입력 필드가 없다.
  - `MyHistoryPage.vue`는 `actorName || 'Unknown'`을 표시한다.
- 수정 방향:
  - 작업 전 사용자 식별 정보를 명시적으로 수집/표시해야 한다.
  - 최소한 현재 사용자 컨텍스트를 헤더에 노출해 History와 연결해야 한다.
- 위험도: 감사 추적 신뢰도 하락
- 검증 방법:
  - 새 세션에서 localStorage 없이 작업 수행 후 `/history` 이름 컬럼 확인

### 12. [High] History 조회 실패가 사용자에게 전달되지 않고 빈 결과와 동일하게 처리됨

- 파일 경로: `frontend/src/features/history/pages/MyHistoryPage.vue`
- 문제: History 로드 실패 시 사용자는 실패를 인지하지 못하고 단순히 “이력이 없습니다.”로 보게 된다.
- 근거:
  - `loadHistory()`의 `catch`는 `console.error(err)` 후 `items.value = []`만 수행한다.
  - 렌더링은 `groupedItems.length === 0`이면 항상 빈 상태 문구를 표시한다.
- 수정 방향:
  - 빈 상태와 오류 상태를 분리해야 한다.
  - 오류 배너, 재시도 버튼, 실패 사유 표시가 필요하다.
- 위험도: 장애 은폐, 운영 중 오판 가능
- 검증 방법:
  - `getHistory()` 실패 상황에서 오류 상태 UI가 별도로 보이는지 확인

### 13. [Medium] 에러 처리와 사용자 알림 체계가 `window.alert`, `console.error`, 커스텀 모달로 분산되어 있음

- 파일 경로:
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
  - `frontend/src/features/recipe_test/components/Win97ConfirmDialog.vue`
  - `frontend/src/features/history/pages/MyHistoryPage.vue`
- 문제: 확인은 커스텀 모달, 성공/실패는 `window.alert`, 일부 읽기 실패는 `console.error`만 사용해 사용자 경험과 장애 가시성이 일관되지 않다.
- 근거:
  - `Win97ConfirmDialog`는 삭제/확인 흐름에 사용된다.
  - `RecipeTestPage.vue`에는 `window.alert(...)` 호출이 대량 존재한다.
  - `getRecipeContent`, `getCasContent`, `getJobContent`, `loadHistory` 실패는 사용자 알림 없이 로그만 남긴다.
- 수정 방향:
  - 확인/성공/실패/부분 실패를 하나의 알림 체계로 통합해야 한다.
  - FastAPI `{"detail": ...}` 오류 body 파싱도 같이 정리해야 한다.
- 위험도: 실패 원인 식별 어려움, 상호작용 불안정
- 검증 방법:
  - Load/Transfer/Delete/History 실패를 각각 발생시켜 알림 위치와 내용이 일관적인지 확인

### 14. [Medium] Win97 스타일 적용 범위가 고정되지 않아 화면 간 시각 언어가 충돌함

- 파일 경로:
  - `frontend/src/App.vue`
  - `frontend/src/components/TopBarNav.vue`
  - `frontend/src/features/recipe_test/components/RecipeTestHeader.vue`
  - `frontend/src/features/recipe_test/components/CasFileListPanel.vue`
  - `frontend/src/features/recipe_test/components/RecipePanel.vue`
  - `frontend/src/features/recipe_test/components/TransferCartPanel.vue`
  - `frontend/src/features/history/pages/MyHistoryPage.vue`
- 문제: Win97 bevel 패널과 현대식 카드/blur/rounded UI가 같은 앱 내에서 혼재한다.
- 근거:
  - `TopBarNav.vue`, `RecipeTestHeader.vue`, `TransferCartPanel.vue`, `MyHistoryPage.vue`는 현대식 카드 UI
  - `CasFileListPanel.vue`, `JobFileListPanel.vue`, `RecipePanel.vue`, `Win97ConfirmDialog.vue`는 Win97 스타일
- 수정 방향:
  - Win97를 앱 전체 테마로 갈지, `recipe_test` 내부 장식으로 제한할지 먼저 결정해야 한다.
  - 공통 스타일 토큰 또는 베이스 컴포넌트(`Win97Button`, `Win97Panel` 등)로 정리하는 편이 좋다.
- 위험도: 제품 정체성 혼선, 유지보수 비용 증가
- 검증 방법:
  - `/recipe-test`, `/history`를 오가며 상단/패널/오버레이가 하나의 시스템처럼 읽히는지 디자인 리뷰

### 15. [Medium] 라우팅과 네비게이션 정보 구조가 모호함

- 파일 경로:
  - `frontend/src/router/index.ts`
  - `frontend/src/components/TopBarNav.vue`
- 문제: `Recipe`와 `Recipe Test`가 별도 메뉴처럼 보이지만 실제로 `/recipe`는 `/recipe-test`로 리다이렉트된다.
- 근거:
  - 라우터는 `/recipe`를 독립 페이지가 아닌 redirect로 처리한다.
  - 상단 네비게이션은 `Recipe`, `Recipe Test`, `My History`를 동등 항목으로 노출한다.
- 수정 방향:
  - `Recipe`가 독립 기능이 아니라면 메뉴를 통합/제거해야 한다.
  - 독립 기능이라면 별도 page/route를 명시적으로 만들어야 한다.
- 위험도: 정보 구조 혼란, 메뉴 의미 약화
- 검증 방법:
  - 상단 각 메뉴 클릭 시 서로 다른 화면/상태가 실제로 제공되는지 확인

### 16. [Medium] 테스트와 lint 자동화가 없어서 현재 같은 회귀를 사전에 막지 못함

- 파일 경로: `frontend/package.json`
- 문제: FrontEnd에 `test`, `lint` 스크립트가 없고, 테스트 파일도 확인되지 않았다.
- 근거:
  - `scripts`에는 `dev`, `build`, `preview`만 있다.
  - `npm run test`, `npm run lint`는 스크립트 부재로 실패한다.
  - 현재 빌드가 깨진 상태도 사전 방어선 없이 작업 트리에 존재한다.
- 수정 방향:
  - 최소한 `vue-tsc`, `lint`, unit test 자동화를 추가해야 한다.
  - 특히 `RecipeTestPage.vue`의 선택/편집/삭제/복원/polling 흐름은 우선 테스트 대상이다.
- 위험도: 회귀 재발 가능성 높음
- 검증 방법:
  - `npm run lint && npm run test && npm run build`가 CI 또는 로컬에서 통과

### 17. [Low] 생성 산출물과 dead code가 소스 트리에 섞여 있음

- 파일 경로:
  - `frontend/src/components/Sidebar.vue`
  - `frontend/src/App.vue.js`
  - `frontend/src/main.js`
  - `frontend/src/router/index.js`
  - `frontend/src/features/**/*.vue.js`
  - `frontend/vite.config.js`
  - `frontend/tsconfig.tsbuildinfo`
  - `frontend/src/__init__.py`
  - `frontend/src/features/recipe_test/api/recipeFileOpsApi.example.ts`
  - `frontend/src/features/recipe_test/api/mockData.ts`
- 문제: 미사용 파일과 생성 산출물이 `src` 및 프론트 루트에 혼재해 source of truth가 흐려진다.
- 근거:
  - `Sidebar.vue`는 참조가 확인되지 않았다.
  - `*.vue.js`, `main.js`, `router/index.js`, `vite.config.js`, `tsconfig.tsbuildinfo`가 존재한다.
  - `recipeFileOpsApi.example.ts`, `mockData.ts`도 현재 사용 흔적이 확인되지 않았다.
- 수정 방향:
  - 산출물은 출력 디렉토리로 분리하고 ignore 정책을 명확히 해야 한다.
  - 미사용 파일은 제거 또는 `examples`/`__mocks__`로 격리하는 편이 좋다.
  - `__init__.py`의 용도는 `확인 필요`.
- 위험도: 리뷰/머지/배포 혼선
- 검증 방법:
  - `git status`에서 생성 산출물이 더 이상 추적 후보로 잡히지 않는지 확인
  - import graph 재확인

### 18. [Low] 타입 안정성이 약하고 `any` 사용이 많아 계약 오류를 컴파일 단계에서 잡기 어려움

- 파일 경로:
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
  - `frontend/src/features/recipe_test/api/recipeTestApi.ts`
  - `frontend/src/features/history/pages/MyHistoryPage.vue`
- 문제: 핵심 흐름에 `any`가 많아 응답 shape 불일치나 상태 구조 오류를 타입 시스템이 방어하지 못한다.
- 근거:
  - `deepClone(value: any)`, `jobsData = ref<any[]>([])`, `cartItems = ref<any[]>([])`, `applyInventoryRecipeSnapshot(snapshot: any)` 등
  - `LoadResponse.meta?: any`
  - `MyHistoryPage.vue`의 `(row: any)` 사용
- 수정 방향:
  - snapshot, history row, load meta, UI row 타입을 구체화해야 한다.
  - `ref<any[]>`, `(row: any)` 제거가 필요하다.
- 위험도: 런타임 오류를 사전 탐지하기 어려움
- 검증 방법:
  - 구체 타입 도입 후 `vue-tsc` 통과
  - 주요 API 응답을 대상으로 단위 테스트 추가

## 우선순위 제안

1. `Critical`
   - `frontend/tsconfig.json` 복구
   - `RecipeTestPage.vue` 구문 손상 복구
   - 실제 Backend 엔트리포인트와 FrontEnd API 계약 일치
   - 부모-자식 prop 계약 오류 수정
2. `High`
   - 미구현 API/누락 구현 정리
   - CAS/JOB 선택/편집 상태 로직 정상화
   - inventory polling 계약 정리
   - History 사용자 식별/오류 표시 보강
3. `Medium/Low`
   - 알림 체계 통합
   - Win97 스타일 범위 결정
   - 테스트/lint 추가
   - dead code/산출물 정리

## 확인 필요

- 실제 운영/개발에서 어떤 `main.py`가 ASGI 엔트리포인트인지
- `recipe_test_impl.py` 외 다른 모듈에서 동일 이름 구현을 주입하는 구조가 있는지
- `frontend/src/__init__.py`의 용도
- `*.vue.js`, `vite.config.js`, `tsconfig.tsbuildinfo`가 의도적 산출물인지
- `RecipeTestPage.vue`의 비정상 토큰이 수동 편집인지 자동 생성/병합 산출물인지

## 재현 및 검증 기록

- 실행 명령: `cd /home/dev/project/recipe/frontend && npm run build`
- 확인 결과:
  - `tsconfig.json` 파싱 오류 재현
  - `RecipeTestPage.vue` 구문 오류 재현
- 정적 확인:
  - FrontEnd API 경로와 Backend 라우터/엔트리포인트 비교
  - 컴포넌트 prop 계약 비교
  - 미사용 파일 및 생성 산출물 존재 확인
