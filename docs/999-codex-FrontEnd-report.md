# FrontEnd 코드 리뷰 리포트

> 기준일: 2026-05-19
> 리뷰 대상: `frontend`
> 기준 자료:
> - 실제 `frontend` 코드
> - `docs/2-erd.md`
> - `docs/3-execution-plan.md`

## 검토 범위

- 활성 라우트:
  - `/recipe-test`
  - `/history`
- 핵심 페이지:
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
  - `frontend/src/features/history/pages/MyHistoryPage.vue`
- API 계약:
  - `frontend/src/features/recipe_test/api/recipeTestApi.ts`

## 검토 방식

- 라우터, 메인 페이지, 주요 컴포넌트, API 클라이언트를 정적 분석했다.
- 현재 워크스페이스에서 프런트 빌드를 다시 실행했다.
  - `cd frontend && npm run build`

## 검증 결과 요약

- 현재 빌드: 실패
- 주요 실패 원인:
  - `frontend/tsconfig.json` 이 TypeScript JSON 설정 파일이 아니라 Vite 설정 코드로 덮여 있음
  - `RecipeTestPage.vue` 내부에 다수의 문법 오류/문자열 파손이 존재함
- 현재 계약/아키텍처 관점 핵심 리스크:
  - 프런트가 기대하는 `POST /api/recipe-test/invalidate-runtime-cache` 가 현재 백엔드에 없음
  - `recipe-test` 기능은 여전히 live infra 의존적이며 mock fallback 이 제한적임
  - snapshot polling 은 존재하지만 worker 운영 전제가 강함

## 종합 요약

현재 프런트는 기능 구조 자체는 명확하다. `/recipe-test` 는 설비 선택, CAS/JOB/RECIPE 탐색, 편집, 전송, 이력 조회로 이어지는 메인 워크벤치이고, `/history` 는 작업 이력 화면이다. `docs/2-erd.md` 와 `docs/3-execution-plan.md` 가 설명하는 현재 시스템 구조와 방향은 대체로 프런트 코드와 맞는다.

문제는 두 층으로 나뉜다.

1. 계약/운영 제약
- 백엔드와의 실제 계약에서 `invalidate-runtime-cache` 가 빠져 있다.
- `recipe-test` 는 실 DB/FTP 의존성이 강해 로컬 mock 기대와 다르다.
- preview 범위, transfer 제약, actor 신뢰도 같은 정책이 프런트에서 완전히 닫혀 있지 않다.

2. 프런트 코드 품질/런타임 결함
- 현재 빌드가 깨져 있다.
- `RecipeTestPage.vue` 하나에 상태와 흐름이 과도하게 집중돼 있다.
- 일부 상태/prop/편집 흐름이 불안정해 보이며, 실패 UX 도 충분히 분리돼 있지 않다.

## 1. 계약/아키텍처 이슈

### 1. Critical — `invalidate-runtime-cache` 계약이 프런트 기준 미완성

- 파일:
  - `frontend/src/features/recipe_test/api/recipeTestApi.ts`
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
  - `backend/app/api/routes/recipe_test_impl.py`
- 문제:
  - 프런트는 `POST /api/recipe-test/invalidate-runtime-cache` 를 전제로 snapshot hash 변경 후 reload 흐름을 구성한다.
  - 현재 백엔드 활성 라우트에는 해당 경로가 없다.
- 영향:
  - polling 기반 자동 동기화가 완결되지 않는다.
- 권장 조치:
  - 실행 계획의 `P1-01` 과 맞춰 백엔드 구현 우선
  - 프런트는 구현 전까지 실패 상황을 더 명확히 처리

### 2. High — `recipe-test` 는 live infra 의존적이고 mock 범위가 제한적임

- 파일:
  - `frontend/src/features/recipe_test/api/recipeTestApi.ts`
  - `docs/2-erd.md`
  - `docs/3-execution-plan.md`
- 문제:
  - 프런트의 핵심 API 경로는 실 Postgres/Mongo/FTP 기반 백엔드를 기대한다.
  - 로컬 mock 으로 전체 사용 시나리오를 재현할 수 있다는 보장이 없다.
- 영향:
  - 프런트 개발/검증과 실제 운영 동작 사이 간극이 생긴다.
- 권장 조치:
  - mock/live 테스트 전략 분리
  - 실패 메시지와 빈 상태를 구분

### 3. Medium — snapshot polling 은 worker 운영 전제를 강하게 가짐

- 파일:
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
  - `docs/2-erd.md`
  - `docs/3-execution-plan.md`
- 문제:
  - 프런트는 `/api/recipe-inventory/snapshot` 을 3초 polling 한다.
  - 하지만 snapshot 의 유용성은 worker 가 실제로 inventory 를 갱신하고 있다는 운영 전제에 의존한다.
- 영향:
  - worker 미실행/지연 상황에서 프런트는 “변화 없음”과 “운영 미준비”를 구분하기 어렵다.
- 권장 조치:
  - snapshot 빈 결과/오래된 결과에 대한 상태 메시지 보강
  - 운영 문서와 함께 사용자-facing 설명 필요

### 4. Medium — preview/transfer/audit 정책이 프런트에서 완전히 닫혀 있지 않음

- 파일:
  - `docs/2-erd.md`
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
  - `frontend/src/features/history/pages/MyHistoryPage.vue`
- 문제:
  - preview 는 일부 sourceKind 만 충분히 지원된다.
  - transfer 는 `maker`, `modelGroup` 기준이지만 세부 업무 정책은 문서화가 더 필요하다.
  - audit actor 는 localStorage 기반이라 신뢰도가 낮다.
- 영향:
  - 프런트 UX 가 “지원 안 함/운영 정책/권한” 을 명확히 전달하지 못할 수 있다.
- 권장 조치:
  - no-preview, partial-preview, transfer 제한, actor 정책을 UI와 문서에서 명시

## 2. 빌드/런타임 이슈

### 5. Critical — `frontend/tsconfig.json` 이 실제 TS 설정 파일이 아님

- 파일:
  - `frontend/tsconfig.json`
- 문제:
  - `tsconfig.json` 이 JSON 이 아니라 Vite 설정 코드로 덮여 있다.
- 근거:
  - 파일 시작부가 `import { defineConfig } from 'vite'`
  - 빌드 시 `tsconfig.json(1,1): error TS1005: '{' expected.`
- 영향:
  - `vue-tsc` 단계부터 빌드가 중단된다.
- 권장 조치:
  - `tsconfig.json` 을 정상 JSON 으로 복구
  - Vite 설정은 `vite.config.ts` 를 정본으로 유지

### 6. Critical — `RecipeTestPage.vue` 가 현재 문법적으로 손상돼 있음

- 파일:
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
- 문제:
  - 현재 페이지 내부에 다수의 문법 오류, 문자열 파손, 잘못된 토큰이 있어 SFC 자체가 컴파일되지 않는다.
- 근거:
  - 빌드 에러가 `RecipeTestPage.vue:48`, `2922`, `3288`, `3436`, `3968`, `4106` 등 다수 위치에서 발생
- 영향:
  - `/recipe-test` 화면은 현재 빌드 기준으로 배포 불가 상태다.
- 권장 조치:
  - 우선 문법 손상 구간 복구
  - 이후 상태/핸들러 분리 리팩터링 진행

### 7. High — 프런트 핵심 상태가 `RecipeTestPage.vue` 에 과도하게 집중됨

- 파일:
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
- 문제:
  - 설비 선택, 파일 목록, 편집 상태, cart, polling, 모달, selection, preview 가 한 파일에 과도하게 몰려 있다.
- 영향:
  - 작은 수정도 회귀 위험이 크다.
  - 현재와 같은 문법 손상/merge 오염이 발생했을 때 복구 비용이 커진다.
- 권장 조치:
  - 실행 계획의 후순위 작업으로 composable/서브 컴포넌트 분리

## 3. 상태/UX 이슈

### 8. High — 편집 상태가 엔티티와 강하게 결합돼 있지 않음

- 파일:
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
- 문제:
  - `jobEditMode`, `casEditMode` 는 boolean 중심이고, 실제 어떤 엔티티를 편집 중인지 상태 고정이 약하다.
- 영향:
  - 편집 중 선택 전환 시 저장 대상 혼선, 변경 손실 위험이 있다.
- 권장 조치:
  - `editingJobId`, `editingCasId` 같은 엔티티 결합 상태 도입
  - 선택 전환 시 discard/save 확인 절차 강화

### 9. Medium — History 오류 상태가 빈 결과와 구분되지 않음

- 파일:
  - `frontend/src/features/history/pages/MyHistoryPage.vue`
- 문제:
  - 조회 실패 시 사용자에게는 “이력이 없습니다”와 유사하게 보일 수 있다.
- 영향:
  - 장애가 숨겨지고 운영 판단이 어려워질 수 있다.
- 권장 조치:
  - empty state 와 error state 분리
  - 재시도 UI 또는 오류 배너 제공

### 10. Medium — `actorName` 정책이 UI/운영 관점에서 약함

- 파일:
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
  - `frontend/src/features/recipe_test/components/RecipeTestHeader.vue`
  - `frontend/src/features/history/pages/MyHistoryPage.vue`
- 문제:
  - actor 는 localStorage 기반이며, 화면에서 현재 사용자 컨텍스트를 명시적으로 보여주는 흐름이 약하다.
- 영향:
  - 이력 신뢰도와 사용자 인식이 떨어진다.
- 권장 조치:
  - 최소한 현재 actor 표시
  - 장기적으로는 서버/인증 정책과 연결

### 11. Medium — 알림/에러 UX 가 일관되지 않음

- 파일:
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
  - `frontend/src/features/history/pages/MyHistoryPage.vue`
  - `frontend/src/features/recipe_test/components/Win97ConfirmDialog.vue`
- 문제:
  - `window.alert`, `console.error`, 커스텀 확인 모달이 혼재한다.
- 영향:
  - 실패 원인 파악과 사용자 경험이 일관되지 않다.
- 권장 조치:
  - 확인/성공/실패/부분 실패를 하나의 알림 체계로 통합

### 12. Low — 정보 구조와 시각 언어가 다소 혼재함

- 파일:
  - `frontend/src/router/index.ts`
  - `frontend/src/components/TopBarNav.vue`
  - `frontend/src/features/recipe_test/components/*`
  - `frontend/src/features/history/pages/MyHistoryPage.vue`
- 문제:
  - `/recipe` 는 `/recipe-test` 로 redirect 되는데 상단 nav 에서는 독립 메뉴처럼 보인다.
  - Win97 스타일 패널과 현대식 카드 UI 가 혼재한다.
- 영향:
  - 정보 구조와 제품 톤이 약간 흔들린다.
- 권장 조치:
  - `/recipe` 메뉴 의미 정리
  - 시각 언어 범위와 기준 컴포넌트 정리

## 빌드 결과

- 실행 명령:
  - `cd frontend && npm run build`
- 결과:
  - 실패
- 주요 오류:
  - `RecipeTestPage.vue` 다중 TypeScript/SFC 문법 오류
  - `tsconfig.json` 파싱 오류

## `docs/2-erd.md`, `docs/3-execution-plan.md` 와의 정합성

- 정합한 부분
  - 활성 백엔드가 `/api/recipe-test/*`, `/api/recipe-inventory/*` 를 제공한다는 전제
  - snapshot polling 이 실제 프런트 흐름에 존재한다는 점
  - actor 정책, mock 범위, preview 범위, transfer 정책이 아직 완전히 닫히지 않았다는 점

- 프런트 보고서에서 우선 반영해야 하는 계획 포인트
  - `P1-01` `invalidate-runtime-cache`
  - `P1-02` mock/live 테스트 전략 분리
  - `P2-04` actor 정책 명확화
  - `P3-01` API 계약 검증 자동화

## 우선순위 제안

### 즉시 조치
1. `tsconfig.json` 복구
2. `RecipeTestPage.vue` 문법 손상 복구
3. `invalidate-runtime-cache` 계약 복구
4. `recipe-test` mock/live 테스트 전략 정리

### 다음 단계
1. 편집 상태를 엔티티 기준으로 재구성
2. History 오류 상태 분리
3. 알림/오류 UX 일원화
4. actor 표시/정책 명확화

## 결론

현재 프런트의 가장 큰 문제는 “백엔드 라우터가 없다”가 아니다. 현재 계약 관점의 핵심 이슈는 `invalidate-runtime-cache` 와 live infra 의존성이고, 현재 코드 관점의 핵심 이슈는 **빌드가 깨져 있다는 점**이다.

우선순위는 디자인 정리나 dead code 제거보다 아래 네 가지가 먼저다.
- `tsconfig.json` 복구
- `RecipeTestPage.vue` 컴파일 가능 상태 복구
- `invalidate-runtime-cache` 계약 복구
- mock/live 테스트 전략 분리
