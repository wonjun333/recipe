# Backend 코드 리뷰 리포트

> 기준일: 2026-05-19
> 리뷰 대상: `backend`
> 기준 자료:
> - 실제 `backend` 코드
> - `docs/2-erd.md`
> - `docs/3-execution-plan.md`

## 검토 범위

- 활성 엔트리포인트: `backend/app/main.py`
- 활성 핵심 라우터:
  - `backend/app/api/routes/recipe_test_impl.py`
  - `backend/app/api/routes/recipe_inventory.py`
- 주요 저장소/서비스:
  - `history_service.py`
  - `recipe_cache_store.py`
  - `recipe_vm_store.py`
  - `recipe_inventory_sync.py`
  - `cloud_protected_registry.py`

## 검토 방식

- 엔트리포인트, 라우터, 저장소 계층, 캐시/이력 서비스, 테스트를 정적 분석했다.
- 현재 워크스페이스에서 아래 테스트를 실행했다.
  - `pytest -q backend/tests/test_api_routes.py`
  - `pytest -q backend/tests/test_mockup_routes.py`

## 검증 결과 요약

- 활성 라우터 등록:
  - `backend/app/main.py` 는 `/api/recipe-test/*`, `/api/recipe-inventory/*` 를 등록한다.
- 테스트 결과:
  - `pytest -q backend/tests/test_api_routes.py` → `2 failed`
  - `pytest -q backend/tests/test_mockup_routes.py` → `43 passed`
- 현재 핵심 리스크:
  - `POST /api/recipe-test/invalidate-runtime-cache` 미구현
  - `recipe-test` 테스트가 실인프라 의존성과 맞지 않음
  - 이력/캐시/shadow 저장이 tempdir 기반
  - `cloud_protected` 판정 함수 시그니처 불일치
  - 레거시 파일이 함께 남아 있어 정본 경계가 흐림

## 종합 요약

현재 백엔드는 `backend/app/main.py` 를 통해 `recipe_test_impl.py`, `recipe_inventory.py` 를 실제로 사용한다. 핵심 read/write API 구조는 존재하며, ERD와 실행 계획이 전제하는 주 경로와 대체로 맞는다.

문제의 중심은 라우터 부재가 아니라 계약과 운영 안정성이다. 프런트가 기대하는 `invalidate-runtime-cache` API가 없고, `recipe-test` 테스트는 로컬 기본 환경에서 실인프라 없이 통과할 수 없는 구조다. 또한 이력/캐시/shadow 저장 경로가 tempdir 기반이라 운영 영속성이 약하고, 인벤토리 워커의 `cloud_protected` 판정 계약에는 시그니처 불일치가 있다.

## 상세 이슈

### 1. Critical — `invalidate-runtime-cache` API 계약 불일치

- 파일:
  - `frontend/src/features/recipe_test/api/recipeTestApi.ts`
  - `backend/app/api/routes/recipe_test_impl.py`
- 문제:
  - 프런트는 `POST /api/recipe-test/invalidate-runtime-cache` 를 호출한다.
  - 활성 백엔드에는 해당 경로가 없다.
- 영향:
  - snapshot polling 이후 자동 reload 흐름이 완전하지 않다.
  - `backend/tests/test_api_routes.py` 의 한 축이 이 계약을 전제로 실패한다.
- 권장 조치:
  - `eqpId` 단위 캐시 무효화 엔드포인트 추가
  - 최소 대상: `BOOTSTRAP_CACHE`, `CAS_CACHE`, `JOB_CACHE`, `RECIPE_CACHE`, `RECIPE_SOURCE_CACHE`

### 2. Critical — `recipe-test` 기본 테스트와 런타임 모델 불일치

- 파일:
  - `backend/tests/test_api_routes.py`
  - `backend/app/api/routes/recipe_test_impl.py`
- 문제:
  - 현재 테스트는 로컬 기본 환경에서 `/api/recipe-test/eqp-options` 가 200을 반환한다고 가정한다.
  - 실제 활성 코드의 `recipe-test` 경로는 Postgres/Mongo/FTP 의존성이 강하다.
- 근거:
  - 이번 실행에서 `pytest -q backend/tests/test_api_routes.py` 는 `2 failed` 였다.
  - 첫 실패는 `/api/recipe-test/eqp-options` 가 `400` 을 반환해서 발생했다.
- 영향:
  - 기본 테스트 결과가 현재 운영 모델을 정확히 반영하지 못한다.
- 권장 조치:
  - 테스트를 `unit/mock` 과 `integration/live` 로 분리
  - 기본 pytest 경로에서는 monkeypatch 또는 mock fixture 사용

### 3. High — `LOCAL_EDIT_BASE` 미환경변수화로 영속성 약함

- 파일:
  - `backend/app/services/temp_file_store.py`
  - `backend/app/services/history_service.py`
  - `backend/app/services/recipe_cache_store.py`
  - `backend/app/services/recipe_vm_store.py`
- 문제:
  - history, shadow, SQLite cache, VM cache 가 모두 tempdir 하위에 저장된다.
  - 운영 경로를 외부 설정으로 바꿀 수 없다.
- 영향:
  - 재기동/OS 정리 정책에 따라 이력과 복구용 파일이 유실될 수 있다.
- 권장 조치:
  - `LOCAL_EDIT_BASE` 환경변수 지원
  - history/cache/shadow/VM 저장소가 동일 베이스 경로 정책을 따르도록 정리

### 4. High — `cloud_protected` 판정 함수 계약 불일치

- 파일:
  - `backend/app/services/recipe_inventory_sync.py`
  - `backend/app/services/cloud_protected_registry.py`
- 문제:
  - 호출부는 `eqp_id`, `source_path`, `name`, `source_kind` 를 넘긴다.
  - 실제 함수는 `file_name` 하나만 받는다.
- 영향:
  - 워커/인벤토리 경로에서 런타임 예외 또는 잘못된 판정 가능성이 있다.
- 권장 조치:
  - 함수 시그니처와 호출부를 하나로 정리
  - 실제 판정 기준이 파일명만으로 충분한지 먼저 확정

### 5. High — mock 전략이 활성 `recipe-test` 계약과 분리됨

- 파일:
  - `backend/app/settings.py`
  - `backend/app/main.py`
  - `backend/app/api/routes/mock_recipe_backend.py`
  - `backend/tests/test_mockup_routes.py`
- 문제:
  - `RECIPE_USE_MOCK` 는 사실상 `/api/recipe-units` 에만 적용된다.
  - 핵심 `/api/recipe-test/*` 는 실인프라 의존적이다.
  - mockup 테스트는 통과하지만 활성 앱 경로를 보장하지 않는다.
- 영향:
  - 로컬 개발/CI/문서의 mock 기대치가 실제 동작과 다를 수 있다.
- 권장 조치:
  - `recipe-test` mock 전략을 명시적으로 설계
  - 또는 mock helper 를 테스트 전용 경로로 명확히 분리

### 6. Medium — 런타임 캐시 정책 부재

- 파일:
  - `backend/app/api/routes/recipe_test_impl.py`
- 문제:
  - `BOOTSTRAP_CACHE`, `CAS_CACHE`, `JOB_CACHE`, `RECIPE_CACHE`, `RECIPE_SOURCE_CACHE` 에 TTL/max-size 기준이 없다.
- 영향:
  - 장시간 운영 시 stale data 와 메모리 증가 가능성이 있다.
- 권장 조치:
  - `invalidate-runtime-cache` 구현과 함께 TTL/max-size 정책 수립

### 7. Medium — 이력 actor 값 신뢰도 낮음

- 파일:
  - `backend/app/services/history_service.py`
  - 관련 mutation route
- 문제:
  - `actorName`, `actorTeam` 은 프런트 전달값을 그대로 기록한다.
- 영향:
  - 감사 로그 기준으로는 신뢰도가 낮다.
- 권장 조치:
  - 단기: 현재 정책을 문서화
  - 장기: 인증 또는 서버 측 actor 강제

### 8. Medium — 레거시 파일 잔존으로 정본 경계가 흐림

- 파일:
  - `backend/main.py`
  - `backend/app/api/routes/recipe_test.py`
  - `backend/app/api/routes/recipe_file_ops.py`
  - `backend/db.py`
- 문제:
  - 활성 백엔드 외에 별도 엔트리포인트/레거시 라우터가 함께 남아 있다.
- 영향:
  - 유지보수 시 잘못된 파일을 수정할 위험이 있다.
- 권장 조치:
  - 활성/레거시 파일을 문서화
  - 미사용 파일은 정리 또는 deprecation 표기

## 테스트 관찰

### 통과
- `pytest -q backend/tests/test_mockup_routes.py` → `43 passed`

### 실패
- `pytest -q backend/tests/test_api_routes.py` → `2 failed`

### 해석
- `test_mockup_routes.py` 는 mock 데이터 shape 검증으로는 유효하다.
- `test_api_routes.py` 실패는 현재 활성 백엔드가 완전히 깨졌다는 뜻보다는:
  - `eqp-options` 가 실인프라 없는 로컬 환경에서 400
  - `invalidate-runtime-cache` 미구현
  를 보여준다.

## `docs/2-erd.md`, `docs/3-execution-plan.md` 와의 정합성

- `docs/2-erd.md` 와는 대체로 정합하다.
  - 활성 백엔드가 `recipe_test_impl.py` + `recipe_inventory.py` 라는 전제가 맞다.
  - 런타임 캐시 무효화 계약 불명확, actor 정책 약함, transfer 정책 추가 정의 필요라는 지적도 현재 유효하다.

- `docs/3-execution-plan.md` 와도 대체로 정합하다.
  - 특히 아래 항목이 실제 코드 리스크와 맞는다.
  - `invalidate-runtime-cache`
  - mock/live 테스트 분리
  - `LOCAL_EDIT_BASE`
  - `cloud_protected` 시그니처 정합화
  - 레거시 파일 정리

## 우선순위 제안

### 즉시 조치
1. `invalidate-runtime-cache` 구현
2. `test_api_routes.py` 를 mock/live 전략으로 분리
3. `LOCAL_EDIT_BASE` 환경변수화
4. `cloud_protected` 함수 계약 수정

### 다음 단계
1. 런타임 캐시 TTL/max-size 정책
2. actor/audit 정책 명확화
3. 레거시 엔트리포인트/중복 라우트 정리
4. Windows 운영 경로/워커 운영 절차 문서화

## 결론

현재 백엔드는 활성 라우터와 핵심 API 구조를 갖추고 있다. 다만 프런트-백엔드 계약 하나가 빠져 있고, 테스트 전략과 운영 저장소 정책이 현재 런타임 모델과 완전히 맞지 않는다.

현재 백엔드에서 가장 중요한 일은 새로운 기능 추가보다 다음 네 가지를 먼저 맞추는 것이다.
- `invalidate-runtime-cache` 계약 복구
- mock/live 테스트 전략 분리
- tempdir 기반 저장소 영속화
- `cloud_protected` 판정 계약 정리
