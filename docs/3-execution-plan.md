# Execution Plan - Recipe Project

## 1. Document Purpose

이 문서는 현재 저장소 기준의 실제 구현 상태를 정리하고,
제품을 "실행 가능한 recipe management system"으로 만들기 위한
현실적인 수행 계획을 제시한다.

중요:
- 이 문서는 이상적인 설계 문서가 아니라 실행 문서다.
- "서비스 코드가 존재함"과 "실제 앱에서 동작함"을 구분한다.
- 체크박스는 현재 저장소 반영 여부를 추적하기 위한 것이다.

---

## 2. Executive Summary

현재 저장소는 다음 상태에 가깝다.

- `frontend`: 설비 선택 + CAS/JOB 조회 중심의 축소형 UI가 존재
- `backend`: inventory/cache/preview/history용 서비스 계층은 상당수 존재
- 하지만 실제 핵심 제품 흐름은 아직 조립되지 않음
  - FastAPI 앱이 recipe 라우터를 등록하지 않음
  - `recipe_test_impl.py` 가 placeholder
  - frontend contract와 backend availability가 어긋남

즉, 지금 필요한 일은 "미세 개선"이 아니라
"앱 조립 + 계약 정렬 + 핵심 구현 복구"다.

---

## 3. Intended Product Behavior

코드 전체를 기준으로 파악한 제품 의도는 다음과 같다.

### Frontend 의도

- 설비를 선택하고 `CAS -> JOB -> RECIPE` 관계를 단계적으로 탐색
- CAS/JOB 목록 검색 및 선택
- JOB 내부 recipe 참조를 클릭해 recipe source list / preview 확인
- rename/delete/clone/transfer/save/persist 작업 수행
- transfer cart 기반 다중 파일 이동
- Win97 스타일 작업 UI + modern header/cart UX
- history 확인

### Backend 의도

- `/recipe-test`:
  - 설비 목록 제공
  - 작업공간 로드
  - CAS/JOB/RECIPE content 반환
  - recipe source list / debug info 제공
  - CAS/JOB save/persist
  - clone / rename / delete / transfer
  - history 제공
- `/recipe-inventory`:
  - sync failure 조회
  - merged inventory entry 조회
  - latest cached version 조회
  - per-equipment inventory state 조회
- inventory worker:
  - FTP polling
  - cache / preview / version capture

---

## 4. Repository Truth: Current State

## 4.1 Frontend Status

### Implemented in code

- [x] Vue + Vite 앱 셸 존재
- [x] Top navigation 존재
- [x] 설비 선택 header 존재
- [x] `Recipe Test` 페이지 존재
- [x] `My History` 페이지 존재
- [x] `recipeTestApi.ts` 에 광범위한 API contract 정의
- [x] richer UI components 존재
  - CAS/JOB panel
  - recipe panel
  - recipe picker
  - transfer cart
  - context menu
  - confirm dialog

### Actually wired

- [x] 설비 옵션 조회
- [x] Load 요청
- [x] CAS 목록 표시
- [x] JOB 목록 표시
- [x] CAS content raw JSON 표시
- [x] JOB content raw JSON 표시
- [x] History table 표시

### Not wired or incomplete

- [ ] recipe list 표시
- [ ] recipe source list / preview UI 연결
- [ ] transfer cart 실제 동작
- [ ] rename/delete UI 동작
- [ ] save/persist UI 동작
- [ ] runtime-cache/inventory 관리 UI
- [ ] build/typecheck clean 상태 보장

## 4.2 Backend Status

### Service layer exists

- [x] FTP read/write/delete helpers
- [x] local shadow backup helper
- [x] JOB parser
- [x] recipe preview service for text recipes
- [x] POL/CON binary decoder
- [x] SQLite cache/version store
- [x] local VM store
- [x] history JSONL store
- [x] inventory sync service
- [x] inventory worker
- [x] cloud protected registry loader

### API route files exist

- [x] `recipe_test_eqp.py`
- [x] `recipe_test_content.py`
- [x] `recipe_test_history.py`
- [x] `recipe_test_ops.py`
- [x] `recipe_inventory.py`

### Critical gaps

- [ ] `backend/app/main.py` 에 recipe routers 포함
- [ ] `recipe_test_impl.py` 실제 구현
- [ ] `/api/recipe-inventory/snapshot` 라우트
- [ ] `/api/recipe-test/invalidate-runtime-cache` 라우트
- [ ] duplicate route wrapper 정리
- [ ] `pol_con_encoder.py` 구현

## 4.3 Confirmed Risks In Current Code

- [x] `recipe_test_impl.py` placeholder로 인한 HTTP 501
- [x] `main.py` 라우터 미조립
- [x] `is_cloud_protected_file()` 호출 시그니처 불일치 가능성
- [x] worker logging contract mismatch
- [x] hardcoded infra endpoint 존재
- [x] shadow backup filename collision risk
- [x] frontend/backend E2E test 부재

---

## 5. Architecture Baseline

현재/목표 공통의 핵심 아키텍처는 hybrid 구조다.

```text
Frontend (Vue 3 + TypeScript)
    ->
FastAPI API
    ->
Reference systems
    - PostgreSQL: equipment metadata
    - MongoDB: FTP credentials
    ->
Canonical file source
    - Equipment FTP
    ->
Local operational storage
    - SQLite: inventory/version/failure/state
    - Filesystem VM store: mirrored files + meta
    - Filesystem shadow store: destructive op backup
    - JSONL: action history
```

### Important architectural rule

- 설비 파일의 원본 source of truth는 FTP다.
- SQLite는 canonical business DB가 아니다.
- local stores는 cache / mirror / version / audit 목적이다.

---

## 6. Gap Analysis

## 6.1 Product-Level Gaps

- 앱 엔트리포인트와 recipe 기능이 연결되지 않음
- 핵심 read/write API가 placeholder
- frontend가 기대하는 API와 backend가 실제 노출하는 API가 다름
- richer frontend UX가 대부분 비활성
- write-path E2E 검증이 전혀 없음

## 6.2 Contract Gaps

frontend contract 기준 존재하지만 backend에서 비어 있거나 불명확한 항목:

- [ ] `GET /api/recipe-test/eqp-options` reachable
- [ ] `POST /api/recipe-test/load` reachable
- [ ] `GET /api/recipe-test/cas-content` reachable
- [ ] `GET /api/recipe-test/job-content` reachable
- [ ] `GET /api/recipe-test/recipe-content` reachable
- [ ] `GET /api/recipe-test/history` reachable
- [ ] `GET /api/recipe-test/recipe-source-list` reachable
- [ ] `POST /api/recipe-test/cas/save` reachable
- [ ] `POST /api/recipe-test/cas/persist` reachable
- [ ] `POST /api/recipe-test/job/save` reachable
- [ ] `POST /api/recipe-test/job/persist` reachable
- [ ] `POST /api/recipe-test/file/rename` reachable
- [ ] `POST /api/recipe-test/file/delete` reachable
- [ ] `POST /api/recipe-test/transfer` reachable
- [ ] `POST /api/recipe-test/recipe/clone` reachable
- [ ] `GET /api/recipe-inventory/failures` reachable
- [ ] `GET /api/recipe-inventory/entries` reachable
- [ ] `GET /api/recipe-inventory/latest-version` reachable
- [ ] `GET /api/recipe-inventory/state` reachable
- [ ] `GET /api/recipe-inventory/snapshot` defined
- [ ] `POST /api/recipe-test/invalidate-runtime-cache` defined

## 6.3 Data / Domain Gaps

- CAS/JOB의 persisted schema가 없음
- current ERD와 actual storage가 어긋남
- history는 DB table이 아닌 JSONL
- `.pol/.con` encode path가 미완성

---

## 7. Delivery Principles

실행 순서는 아래 원칙을 따라야 한다.

1. 먼저 앱을 "reachable" 하게 만든다.
2. 그 다음 read-path를 복구한다.
3. 그 다음 write-path를 붙인다.
4. 그 다음 inventory contract를 맞춘다.
5. 마지막에 UX 확장과 binary encode 같은 고난도 기능을 다룬다.

이 순서를 어기면, 큰 컴포넌트를 붙여도 실제로는 테스트할 수 없는 상태가 반복된다.

---

## 8. Phased Execution Plan

## Phase 0. Repository Stabilization

목표:
- 현재 상태를 문서와 코드 양쪽에서 동일하게 만든다.
- 제품 흐름의 blocking issue를 드러낸다.

### Tasks

- [x] frontend/backend intent 재파악
- [x] 문서-코드 불일치 검토
- [x] PRD/ERD/execution plan 재작성
- [ ] README 또는 runbook에 실제 실행 제약 명시
- [ ] 하드코딩된 인프라 의존성 정리 방향 확정

### Exit Criteria

- 문서가 현재 상태와 목표 상태를 분리해 설명
- 팀이 "무엇이 구현되어 있고 무엇이 비어 있는지" 동일하게 이해

---

## Phase 1. App Bootstrap And Router Wiring

목표:
- 실제 FastAPI 앱이 recipe 관련 라우터를 노출하도록 만든다.

### Tasks

- [ ] canonical app entrypoint 결정
- [ ] `backend/app/main.py` 또는 대체 엔트리포인트에 `recipe-test` 라우터 include
- [ ] `recipe-inventory` 라우터 include
- [ ] import path 정리
- [ ] `/`, health check, recipe endpoints 공존 방식 결정
- [ ] 로컬 실행 명령/환경 정의

### Deliverables

- FastAPI 앱 실행 시 recipe routes가 Swagger/OpenAPI에 노출

### Exit Criteria

- [ ] `/api/recipe-test/*` 라우트 등록 확인
- [ ] `/api/recipe-inventory/*` 라우트 등록 확인
- [ ] 최소 smoke test 1회 통과

---

## Phase 2. Restore Core Read APIs

목표:
- frontend의 기본 조회 흐름을 실제로 살린다.

### Scope

우선순위 read API:
- `GET /api/recipe-test/eqp-options`
- `POST /api/recipe-test/load`
- `GET /api/recipe-test/cas-content`
- `GET /api/recipe-test/job-content`
- `GET /api/recipe-test/recipe-content`
- `GET /api/recipe-test/history`
- `GET /api/recipe-test/recipe-source-list`

### Tasks

- [ ] `recipe_test_impl.py` 복구 또는 재구현 전략 결정
- [ ] `get_eqp_options()` 구현
- [ ] `load_recipe_test()` 구현
- [ ] `get_cas_content()` 구현
- [ ] `get_job_content()` 구현
- [ ] `get_recipe_content()` 구현
- [ ] `get_history()` 구현
- [ ] `get_recipe_source_list()` 구현
- [ ] 필요 시 `get_metrology_source_debug()` 구현

### Implementation Guidance

- equipment metadata는 Postgres 기반 설비 정보 활용
- FTP credential은 Mongo에서 조회
- file content는 live FTP 또는 VM store/cache에서 읽도록 구성
- JOB은 parser 기반으로 structured payload 반환
- recipe는 decoder/parser 기반 preview payload 반환
- history는 JSONL store 연동

### Exit Criteria

- [ ] frontend `Load -> CAS select -> JOB select` 흐름이 실제 응답으로 동작
- [ ] recipe preview API가 최소 1개 포맷에서 동작
- [ ] history API가 빈 목록 또는 데이터 목록을 정상 반환

---

## Phase 3. Align API Contract

목표:
- frontend contract와 backend contract를 동일하게 만든다.

### Tasks

- [ ] `recipeTestApi.ts` 전체 contract 검토
- [ ] backend 실제 제공 범위와 비교
- [ ] `snapshot` route 구현 또는 frontend contract에서 제거
- [ ] `invalidate-runtime-cache` route 구현 또는 frontend contract에서 제거
- [ ] duplicate router file 통합
- [ ] request/response schema freeze
- [ ] source kind enum 정합성 검증

### Exit Criteria

- [ ] 현재 프론트가 호출하는 경로가 모두 서버 기준 정의됨
- [ ] 미지원 API는 frontend에서 제거 또는 disabled 처리

---

## Phase 4. Inventory And Cache Hardening

목표:
- inventory 계층을 "서비스 존재" 상태에서 "신뢰 가능한 운영 기능" 상태로 끌어올린다.

### Tasks

- [ ] `is_cloud_protected_file()` 호출/시그니처 정합성 수정
- [ ] partial failure 시 inventory hash/state 처리 정책 수정
- [ ] worker logging contract 수정
- [ ] `snapshot` API 정의 및 구현
- [ ] runtime cache invalidation 동작 설계
- [ ] retained cached file 정책 검증
- [ ] failure resolution 정책 검증

### Exit Criteria

- [ ] inventory worker 1회 실행 시 runtime exception 없이 동작
- [ ] failure/state/latest-version API 일관성 확인
- [ ] partial FTP failure가 false deletion처럼 기록되지 않음

---

## Phase 5. Write APIs For CAS/JOB/File Ops

목표:
- 실제 파일 변경 작업을 수행할 수 있게 만든다.

### Scope

- CAS save / persist
- JOB save / persist
- rename
- delete
- transfer
- clone

### Tasks

- [ ] CAS 수정 모델 정의
- [ ] CAS save 구현
- [ ] CAS persist 구현
- [ ] JOB save 구현
- [ ] JOB persist 구현
- [ ] rename 구현
- [ ] delete 구현
- [ ] transfer 구현
- [ ] clone 구현
- [ ] write 후 VM store/cache refresh 정책 구현
- [ ] history append 연계
- [ ] destructive op 이전 shadow backup 강화

### Exit Criteria

- [ ] 최소 1개 CAS write-path 검증
- [ ] 최소 1개 JOB write-path 검증
- [ ] rename/delete/transfer 중 최소 1개 실환경 검증
- [ ] history에 작업 결과가 남음

---

## Phase 6. Frontend Wiring Expansion

목표:
- 이미 존재하는 richer UI 컴포넌트를 실제 흐름에 연결한다.

### Tasks

- [ ] CAS/JOB panel 컴포넌트 기반 화면 재구성
- [ ] recipe list 및 preview panel 연결
- [ ] recipe picker dialog 연결
- [ ] transfer cart 연결
- [ ] context menu / confirm dialog 연결
- [ ] actorName / actorTeam 입력 UX 추가
- [ ] inventory 상태/오류 표시 UX 검토
- [ ] stale `eqpId` filter bug 수정
- [ ] async content race 방지
- [ ] build/typecheck 실패 수정

### Exit Criteria

- [ ] 현재 존재하는 주요 UI 컴포넌트가 실제 workflow에 연결
- [ ] frontend build/typecheck 통과
- [ ] load/select/preview 흐름 UX 일관성 확보

---

## Phase 7. Binary Recipe Edit Scope Decision

목표:
- `.pol/.con` 역인코딩을 MVP에 포함할지 명확히 결정한다.

### Current Status

- [x] decode 존재
- [ ] encode 미구현

### Decision Tasks

- [ ] business priority 재확인
- [ ] 바이너리 포맷 명세 확보 여부 확인
- [ ] encode를 MVP 제외 항목으로 둘지 결정
- [ ] 필요 시 별도 technical spike 수행

### Recommendation

현재 저장소 기준으로는 `.pol/.con` encode를 MVP blocker로 두지 않는 편이 합리적이다.
먼저 CAS/JOB/file op/read-path를 완성하는 것이 우선이다.

---

## Phase 8. Verification And Release Readiness

목표:
- 제품을 실제로 신뢰 가능한 상태로 검증한다.

### Required Verification

- [ ] backend smoke tests
- [ ] frontend build/typecheck
- [ ] inventory worker dry run
- [ ] read-path integration test
- [ ] write-path integration test
- [ ] history verification
- [ ] rollback/shadow backup verification

### Recommended Test Layers

- unit tests
  - parser/decoder
  - inventory helpers
  - cache store
- API tests
  - route registration
  - read endpoints
  - write endpoints
- frontend tests
  - equipment selection state
  - content loading state
  - error handling

---

## 9. Work Breakdown By Area

## 9.1 Backend

- [ ] app bootstrap
- [ ] route inclusion
- [ ] `recipe_test_impl.py` rebuild
- [ ] inventory bug fixes
- [ ] write-path implementation
- [ ] config cleanup
- [ ] tests

## 9.2 Frontend

- [ ] build/type issues 해결
- [ ] filter/race bug 해결
- [ ] richer workflow wiring
- [ ] inventory/diagnostic UX
- [ ] actor metadata UX
- [ ] tests

## 9.3 Docs / Ops

- [x] PRD 정정
- [x] ERD 정정
- [x] execution plan 정정
- [ ] local run guide
- [ ] environment variable guide
- [ ] operational troubleshooting guide

---

## 10. Suggested Execution Order

실행 순서는 아래를 권장한다.

1. Phase 1: App bootstrap
2. Phase 2: Core read APIs
3. Phase 3: API contract alignment
4. Phase 4: Inventory/cache hardening
5. Phase 5: Write APIs
6. Phase 6: Frontend wiring
7. Phase 8: Verification
8. Phase 7: Binary encode scope 확정 또는 별도 spike

이 순서의 이유:
- 먼저 도달 가능한 앱이 필요하다.
- 그 다음 읽기 흐름이 살아야 UI 검증이 가능하다.
- 계약을 맞춘 뒤 write-path를 붙여야 재작업이 줄어든다.

---

## 11. Milestone Checklist

### Milestone A. App Reachable

- [ ] Swagger에 recipe routes 노출
- [ ] frontend dev proxy를 통해 최소 1개 recipe endpoint 호출 성공

### Milestone B. Read Flow Usable

- [ ] 설비 선택 가능
- [ ] CAS 목록 조회 가능
- [ ] JOB 목록 조회 가능
- [ ] JOB parsed payload 조회 가능
- [ ] recipe preview 조회 가능

### Milestone C. Inventory Trustworthy

- [ ] worker 예외 없이 실행
- [ ] state/latest-version/failures 정합성 확보
- [ ] snapshot policy 확정

### Milestone D. Write Flow Usable

- [ ] CAS/JOB save-persist 1개 이상 검증
- [ ] rename/delete/transfer 1개 이상 검증
- [ ] history 기록 검증

### Milestone E. Frontend Workflow Integrated

- [ ] panel-based UI 연결
- [ ] transfer cart 연결
- [ ] recipe picker 연결
- [ ] error state 표시

### Milestone F. Release Candidate

- [ ] build/typecheck pass
- [ ] smoke/integration tests pass
- [ ] 문서와 실제 동작 정합성 확인

---

## 12. Deferred / Optional Work

- [ ] POL/CON reverse encoder
- [ ] full diff viewer
- [ ] WebSocket push
- [ ] normalized relational domain model
- [ ] edit-session persistence
- [ ] multi-user concurrency control

---

## 13. Notes For Maintainers

- "서비스 코드가 있다"는 사실만으로 기능이 동작한다고 판단하면 안 된다.
- frontend에 unused component가 많으므로, UI 의도와 실제 wiring을 구분해서 봐야 한다.
- ERD는 현재 storage reality를 기준으로 이해해야 한다.
- binary recipe editing은 별도 고난도 주제이며, 현재 제품 복구의 선행조건은 아니다.
