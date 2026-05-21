# Execution Plan — Recipe Management System

> 기준일: 2026-05-19
> 기준 문서: `docs/1-prd.md`, `docs/2-erd.md`
> 기준 코드: `/home/dev/project/recipe`
> 원칙: 실제 코드 기준으로 작성. 구현된 항목은 다시 계획으로 잡지 않음. 불확실한 항목은 `확인 필요`로 표기.

---

## 0. 현재 상태 요약

### 코드 근거
- 백엔드 활성 엔트리포인트는 `backend/app/main.py`이며, 이미 `recipe_test_impl`와 `recipe_inventory`를 등록하고 있다.
- `GET /api/recipe-test/eqp-options`, `POST /api/recipe-test/load`, `GET /api/recipe-test/history`, `GET /api/recipe-inventory/snapshot` 등 핵심 read 경로는 `recipe_test_impl.py`, `recipe_inventory.py`에 구현돼 있다.
- 프런트의 `RecipePickerDialog`, `TransferCartPanel`, `Win97ConfirmDialog`, `Win97ContextMenu` 는 이미 import 및 사용 중이다.

### 현재 실행 계획에서 바로 정정할 점
- `EP-01 main.py 서브라우터 등록`은 현재 기준으로 완료 항목이다. 신규 작업으로 둘 이유가 없다.
- `EB-01 snapshot 구현`은 현재 기준으로 완료 항목이다.
- `EF-01 snapshot 404 대응`은 현재 기준으로 틀린 전제다. 실제 누락은 `invalidate-runtime-cache` 쪽이다.
- `RecipePickerDialog/TransferCartPanel/Win97*` 를 “stub” 또는 “미연동” 전제로 둔 작업은 현재 코드와 맞지 않는다.
- `mock 모드로 사내 DB/FTP 없이 recipe-test 전체 동작` 전제는 현재 코드와 맞지 않는다. `RECIPE_USE_MOCK` 는 `recipe-units` 에만 적용된다.

---

## 1. Phase 1 — 실제 동작 불일치 해소

### P1-01 — `invalidate-runtime-cache` 엔드포인트 구현

- **우선순위**: `Critical`
- **배경**:
  - 프런트는 `POST /api/recipe-test/invalidate-runtime-cache` 를 호출한다.
  - 활성 백엔드에는 해당 경로가 없다.
  - 테스트도 이 엔드포인트를 기대한다.
- **대상 파일**:
  - `backend/app/api/routes/recipe_test_impl.py`
  - 필요 시 관련 테스트 파일
- **작업 내용**:
  - `eqpId` 단위 런타임 캐시 무효화 엔드포인트 추가
  - 최소 대상: `BOOTSTRAP_CACHE`, `CAS_CACHE`, `JOB_CACHE`, `RECIPE_CACHE`, `RECIPE_SOURCE_CACHE`
  - 응답 shape를 프런트 기대값과 일치시킴: `{ status, eqpId }`
- **완료 기준**:
  - `POST /api/recipe-test/invalidate-runtime-cache` → HTTP 200
  - 프런트의 snapshot poll 이후 reload 흐름이 404 없이 동작
- **검증 방법**:
  - `backend/tests/test_api_routes.py` 기준 호출 확인
  - 수동: load 후 invalidate 호출, 재조회 시 캐시 재적재 확인

```
- [ ] P1-01: invalidate-runtime-cache 엔드포인트 구현
```

---

### P1-02 — 테스트 전략 분리: mock 테스트와 실환경 테스트 재정의

- **우선순위**: `Critical`
- **배경**:
  - 현재 `backend/tests/test_api_routes.py` 는 사내 Postgres/Mongo/FTP 가 없는 환경에서도 `/api/recipe-test/*` 가 200을 반환한다고 가정한다.
  - 하지만 실제 활성 코드의 `recipe-test` 라우트는 실 인프라 의존적이다.
- **대상 파일**:
  - `backend/tests/test_api_routes.py`
  - `backend/tests/test_mockup_routes.py`
  - 필요 시 신규 mock 주입용 fixture
- **작업 내용**:
  - 테스트를 두 층으로 분리
  - `unit/mock`: mock 데이터 또는 monkeypatch 기반
  - `integration/live`: 사내 인프라 전제
  - 현재의 잘못된 “기본 pytest 전부 통과” 가정을 제거
- **완료 기준**:
  - 로컬 기본 테스트는 외부 인프라 없이 안정적으로 통과
  - 실환경 테스트는 별도 마커 또는 문서화된 수동 절차로 분리
- **검증 방법**:
  - `pytest` 기본 실행 시 외부 인프라 미의존
  - live 테스트는 `-m live` 같은 별도 실행으로 분리

```
- [ ] P1-02-a: 외부 인프라 의존 테스트 분리
- [ ] P1-02-b: recipe-test mock 전략 정의 또는 monkeypatch 도입
```

---

### P1-03 — 실행 계획/PRD의 잘못된 전제 정리

- **우선순위**: `High`
- **배경**:
  - `docs/1-prd.md` 와 기존 `docs/3-execution-plan.md` 에 “미구현/stub” 전제가 남아 있어 현재 코드와 어긋난다.
- **대상 파일**:
  - `docs/1-prd.md`
  - `docs/3-execution-plan.md`
- **작업 내용**:
  - 이미 구현된 UI/API를 미구현 항목 목록에서 제거
  - 실제 미구현 항목만 남김
- **완료 기준**:
  - 문서 기준 우선순위가 현재 코드와 일치

```
- [ ] P1-03: 문서 상의 구 구현 상태와 실제 코드 상태 정합화
```

---

## 2. Phase 2 — 운영 리스크 해소

### P2-01 — `LOCAL_EDIT_BASE` 환경변수화 및 영속 경로 전환

- **우선순위**: `High`
- **배경**:
  - 현재 `temp_file_store.py` 는 `tempfile.gettempdir()` 하위 `recipe_test_edit` 를 고정 사용한다.
  - history/shadow/cache 가 재부팅 또는 OS 정책에 따라 유실될 수 있다.
- **대상 파일**:
  - `backend/app/services/temp_file_store.py`
  - `backend/app/config.py`
  - `backend/.env.example`
  - 필요 시 `history_service.py`, `recipe_cache_store.py`, `recipe_vm_store.py`
- **작업 내용**:
  - `LOCAL_EDIT_BASE` 환경변수 지원
  - 미설정 시 기존 fallback 유지
  - 관련 저장소가 동일 베이스 경로를 사용하도록 정리
- **완료 기준**:
  - 환경변수 지정 시 이력/캐시/shadow 파일이 영속 경로에 생성
  - 미지정 시 기존 동작 유지
- **검증 방법**:
  - history 기록 후 파일 생성 위치 확인
  - 서버 재기동 후 이력 재조회 확인

```
- [ ] P2-01-a: LOCAL_EDIT_BASE 환경변수 지원
- [ ] P2-01-b: 이력/캐시/VM 저장 경로 영속화 점검
```

---

### P2-02 — `cloud_protected` 호출 시그니처 불일치 수정

- **우선순위**: `High`
- **배경**:
  - `recipe_inventory_sync.py` 는 `is_cloud_protected_file(eqp_id, source_path, name, source_kind)` 형태로 호출한다.
  - 실제 함수 시그니처는 `is_cloud_protected_file(file_name)` 이다.
  - 현재 `type: ignore` 로 덮고 있어 런타임 리스크가 있다.
- **대상 파일**:
  - `backend/app/services/recipe_inventory_sync.py`
  - `backend/app/services/cloud_protected_registry.py`
- **작업 내용**:
  - 실제 필요한 판정 입력값을 정의
  - 함수 시그니처와 호출부를 일치시킴
- **완료 기준**:
  - 워커/인벤토리 경로에서 cloud protected 판정이 예외 없이 동작
- **검증 방법**:
  - 대상 함수 단위 테스트
  - worker 1회 실행 시 예외 없음 확인

```
- [ ] P2-02: cloud_protected 판정 함수/호출부 정합화
```

---

### P2-03 — 인벤토리 워커와 API 계약 점검

- **우선순위**: `High`
- **배경**:
  - PRD의 “오프라인 조회 지원”은 인벤토리 워커가 정상 운영된다는 전제가 있어야 성립한다.
  - 현재 워커 운영 방식, 주기, 배포 절차가 문서화돼 있지 않다.
- **대상 파일**:
  - `backend/tools/recipe_inventory_worker.py`
  - `backend/app/services/recipe_inventory_sync.py`
  - 운영 문서
- **작업 내용**:
  - 워커 실행 방법과 운영 주기 확인
  - snapshot API 가 워커 결과를 전제로 하는 부분 문서화
- **완료 기준**:
  - 워커 수동/자동 실행 절차 명시
  - snapshot 빈 결과가 “장애인지 미실행인지” 판별 기준 문서화

```
- [ ] P2-03-a: 인벤토리 워커 운영 방식 확인
- [ ] P2-03-b: snapshot API 운영 전제 문서화
```

---

### P2-04 — 이력 actor 정책 명확화

- **우선순위**: `Medium`
- **배경**:
  - 현재 `actorName` 은 프런트 localStorage 값, `actorTeam` 은 현재 선택 팀에 의존한다.
  - 감사 추적 요건이 있다면 신뢰 수준이 낮다.
- **대상 파일**:
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
  - `backend/app/services/history_service.py`
  - 관련 mutation route
- **작업 내용**:
  - 현재 정책을 문서화
  - 인증 도입 전까지 허용 범위를 명시
  - 장기적으로는 서버 측 신원 연동 여부 결정
- **완료 기준**:
  - 운영자가 actor 값의 신뢰 한계를 이해할 수 있는 문서 존재

```
- [ ] P2-04: actorName/actorTeam 감사 정책 문서화
```

---

## 3. Phase 3 — 구조 안정화

### P3-01 — API 계약 검증 자동화

- **우선순위**: `Medium`
- **배경**:
  - 프런트 `recipeTestApi.ts` 와 백엔드 구현 간 드리프트가 이미 발생했다.
- **대상 파일**:
  - `frontend/src/features/recipe_test/api/recipeTestApi.ts`
  - `backend/app/api/routes/*.py`
  - 테스트 코드
- **작업 내용**:
  - 프런트가 호출하는 전체 경로와 백엔드 실제 등록 경로 대조
  - 특히 `saveCas/saveJob`, `snapshot`, `invalidate-runtime-cache` 포함
- **완료 기준**:
  - 프런트 API 함수별 대응 백엔드 경로 표 존재
  - 404/shape mismatch 항목 0건

```
- [ ] P3-01: 프런트-백엔드 API 계약 체크리스트/테스트 작성
```

---

### P3-02 — 인메모리 캐시 정책 정리

- **우선순위**: `Medium`
- **배경**:
  - 현재 `BOOTSTRAP_CACHE`, `CAS_CACHE`, `JOB_CACHE`, `RECIPE_CACHE`, `RECIPE_SOURCE_CACHE` 는 무제한 dict 이다.
  - 장시간 운영 시 메모리/신선도 기준이 없다.
- **대상 파일**:
  - `backend/app/api/routes/recipe_test_impl.py`
- **작업 내용**:
  - TTL 또는 max-size 적용 여부 결정
  - invalidate API 와의 관계 명시
- **완료 기준**:
  - 캐시 만료 정책이 문서와 코드에 반영

```
- [ ] P3-02: 런타임 캐시 TTL/max-size 정책 수립 및 적용
```

---

### P3-03 — SQLite 쓰기 일관성 개선

- **우선순위**: `Medium`
- **배경**:
  - inventory/version/state 쓰기 경로는 워커 안정성과 직접 연결된다.
- **대상 파일**:
  - `backend/app/services/recipe_cache_store.py`
- **작업 내용**:
  - WAL 모드 검토
  - partial write 가능성 확인
  - 필요한 경우 트랜잭션 경계 정리
- **완료 기준**:
  - worker 중단 시 DB 일관성 검증 기준 확보

```
- [ ] P3-03-a: SQLite WAL 도입 검토
- [ ] P3-03-b: inventory/version/state 쓰기 원자성 점검
```

---

### P3-04 — 레거시 파일 정리

- **우선순위**: `Medium`
- **배경**:
  - `backend/app/api/routes/recipe_test.py`, `recipe_file_ops.py`, `backend/main.py`, `backend/db.py` 등 중복/레거시 경로가 혼재한다.
- **대상 파일**:
  - `backend/app/api/routes/recipe_test.py`
  - `backend/app/api/routes/recipe_file_ops.py`
  - `backend/main.py`
  - `backend/db.py`
- **작업 내용**:
  - 실제 사용 여부와 비활성화 방침 결정
  - 유지 시 목적 명시, 미사용이면 정리
- **완료 기준**:
  - 활성 경로와 레거시 경로가 문서상 명확히 분리

```
- [ ] P3-04-a: recipe_test.py 레거시 여부 확정
- [ ] P3-04-b: recipe_file_ops.py 사용 여부 확정
- [ ] P3-04-c: backend/main.py, db.py 레거시 여부 확정
```

---

## 4. Phase 4 — 배포/운영 강화

### P4-01 — Windows 운영 경로 확정

- **우선순위**: `Medium`
- **배경**:
  - PRD는 Windows 배포를 전제로 하나, 실제 운영 디렉토리/로그/백업 기준이 없다.
- **대상 파일**:
  - 운영 문서
  - 필요 시 `start.bat` 또는 `start.ps1`
- **작업 내용**:
  - 영속 데이터 경로, 로그 경로, 실행 스크립트 정의
  - 워커 자동 기동 방식 정의
- **완료 기준**:
  - Windows 배포 문서만으로 초기 기동 가능

```
- [ ] P4-01-a: Windows 기동 스크립트 작성
- [ ] P4-01-b: Windows 배포 체크리스트 작성
- [ ] P4-01-c: 워커 자동 시작 절차 작성
```

---

### P4-02 — 실환경 통합 검증

- **우선순위**: `Medium`
- **배경**:
  - 이 프로젝트는 설계상 Postgres, Mongo, FTP, SQLite, JSONL 이 모두 맞물린다.
  - 실환경 검증 없이는 핵심 기능 품질을 보장하기 어렵다.
- **검증 시나리오**:
  - 설비 목록 조회
  - Load
  - CAS 조회/수정/Save As
  - JOB 조회/수정/Save As
  - Recipe clone/rename/delete
  - Transfer
  - History 조회
  - Snapshot polling + invalidate
- **완료 기준**:
  - 최소 1개 테스트 설비군에서 end-to-end 시나리오 통과

```
- [ ] P4-02: 사내 실환경 통합 테스트 수행
```

---

## 5. 보류 또는 재판정 항목

### 확인 필요
- `RECIPE_USE_MOCK` 를 `recipe-test` 전체에 확장할지, 아니면 테스트 전용 monkeypatch 전략으로 갈지 결정 필요
- `recipe_file_ops.py` 는 실제 클라이언트가 쓰지 않으므로 유지 이유 확인 필요
- `recipe-units` 와 `backend/db.py` 의 실사용 여부 확인 필요
- `eqp_model_bucket` / `eqp_model_bucker` 컬럼 폴백은 실제 DB 확인 전까지 유지 권장
- `JSONL -> SQLite history 이관` 은 현 시점 즉시 작업보다 운영 요구 확인이 먼저다

---

## 6. 우선순위 요약

### Critical
- `P1-01` `invalidate-runtime-cache` 구현
- `P1-02` 테스트 전략 분리

### High
- `P1-03` 문서 전제 정합화
- `P2-01` 영속 경로 환경변수화
- `P2-02` cloud_protected 시그니처 정합화
- `P2-03` 인벤토리 워커 운영 방식 확정

### Medium
- `P2-04` actor 정책 명확화
- `P3-01` API 계약 검증 자동화
- `P3-02` 런타임 캐시 정책 수립
- `P3-03` SQLite 쓰기 일관성 개선
- `P3-04` 레거시 파일 정리
- `P4-01` Windows 배포/운영 절차 정리
- `P4-02` 실환경 통합 검증

---
