# Backend 코드 리뷰 리포트

기준일: 2026-05-18  
리뷰 대상: `backend`  
기준 자료:
- 실제 `backend` 코드
- `docs/1-prd.md`
- `docs/2-erd.md`
- `docs/3-execution-plan.md`

원칙:
- 실제 코드를 우선했다.
- 문서와 코드가 충돌하는 경우 실제 코드를 기준으로 판단했다.
- 문서가 오래되었거나 틀린 경우 별도 이슈로 표시했다.
- 실제 코드에 없는 내용은 추측하지 않았다.
- 불확실한 항목은 `확인 필요`로 표시했다.

검토 방식:
- 메인 엔트리포인트, 라우터, 서비스, 저장소 계층, 테스트를 정적 분석했다.
- `pytest -q`를 실행해 전체 테스트 수집 상태를 확인했다.
- `pytest -q backend/tests/test_mockup_routes.py`를 별도 실행해 현재 테스트 파일의 실제 통과 여부를 확인했다.
- `python3 -m py_compile backend/app/api/routes/recipe_test.py`로 문법 오류를 확인했다.
- 병렬 sub-agent를 사용해 API 구조, DB/스토리지, 보안/테스트, 코드 품질 관점을 교차 검토했다.

검증 결과 요약:
- `pytest -q`: 실패
  - `backend/app/api/routes/recipe_test.py:1701` 문법 오류로 수집 단계 중단
- `pytest -q backend/tests/test_mockup_routes.py`: `43 passed in 0.01s`
- `python3 -m py_compile backend/app/api/routes/recipe_test.py`: 실패

## 종합 요약

현재 실제 앱 엔트리포인트 `backend/app/main.py`, `backend/main.py`는 `/`와 `/api/recipe-units`만 노출하며, 문서가 전제하는 `/api/recipe-test/*`, `/api/recipe-inventory/*`, `/api/recipe-file-ops/*`는 등록되지 않았다. 또한 분리 라우터는 `recipe_test_impl.py`에 존재하지 않는 핸들러를 호출하고, `recipe_test_ops.py`는 존재하지 않는 서비스 함수를 import한다. 즉, 문서상 핵심 기능은 현재 코드 기준으로 라우팅 계층부터 깨져 있다.

DB/스토리지 측면에서는 `LOCAL_EDIT_BASE`가 OS tempdir에 고정돼 있고, SQLite/JSONL/VM/shadow 저장이 영속성 없이 분산되어 있다. 캐시 적재는 파일 쓰기, SQLite 버전 기록, inventory 상태 갱신이 분리돼 있어 원자성이 약하다. 테스트는 실제 API나 저장 계층을 검증하지 않고 정적 mock 데이터 shape 검증에 집중되어 있다.

## 상세 이슈

### 1. Critical — 실제 앱에 핵심 백엔드 라우터가 등록되어 있지 않음
- 파일 경로:
  - `backend/app/main.py`
  - `backend/main.py`
- 문제:
  - FastAPI 앱이 `/`, `/api/recipe-units`만 노출하며 `recipe-test`, `recipe-inventory`, `recipe-file-ops` 관련 router를 하나도 등록하지 않는다.
- 근거:
  - `backend/app/main.py:1-45`, `backend/main.py:1-43`에는 `FastAPI(...)`와 두 개의 핸들러만 있고 `include_router()`가 없다.
  - 저장소 전체 검색에서도 `include_router` 사용이 확인되지 않았다.
- 수정 방향:
  - 정본 엔트리포인트를 하나로 확정하고, 실제로 동작 가능한 router만 명시적으로 등록해야 한다.
  - 단, 단순 등록 전에 아래 2번, 3번 구조 결함을 먼저 해소해야 한다.
- 위험도:
  - 문서상 주요 API 전체가 실제로는 404 또는 미노출 상태다.

### 2. Critical — 분리 라우터가 `recipe_test_impl.py`에 없는 핸들러를 호출함
- 파일 경로:
  - `backend/app/api/routes/recipe_test_eqp.py`
  - `backend/app/api/routes/recipe_test_content.py`
  - `backend/app/api/routes/recipe_test_history.py`
  - `backend/app/api/routes/recipe_file_ops.py`
  - `backend/app/api/routes/recipe_test_impl.py`
- 문제:
  - 분리 라우터가 `impl.get_eqp_options()`, `impl.load_recipe_test()`, `impl.get_recipe_content()`, `impl.save_cas()` 등 여러 함수를 호출하지만 `recipe_test_impl.py`에는 해당 핸들러 구현이 없다.
- 근거:
  - `recipe_test_eqp.py:7-13`, `recipe_test_content.py:7-25`, `recipe_test_history.py:7-8`, `recipe_file_ops.py:8-38`는 모두 `impl.*` 호출에 의존한다.
  - `recipe_test_impl.py`는 요청 모델과 헬퍼 함수 중심이며 `wc -l` 기준 845행에서 종료된다.
  - 저장소 검색상 `get_recipe_content`, `save_cas`, `persist_cas`, `save_job`, `persist_job`, `clone_recipe`, `rename_file`, `delete_files`, `transfer_files` 정의는 분리 라우터 외부에서 확인되지 않았다.
- 수정 방향:
  - `recipe_test.py`를 정본으로 살릴지, `recipe_test_impl.py`를 완전한 구현으로 복원할지 먼저 결정해야 한다.
  - 둘을 병행 유지하면 계속 split-brain 상태가 유지된다.
- 위험도:
  - router를 등록하더라도 호출 시 즉시 `AttributeError` 또는 500으로 이어질 가능성이 높다.

### 3. Critical — `recipe_test_ops.py`가 존재하지 않는 서비스 함수를 import함
- 파일 경로:
  - `backend/app/api/routes/recipe_test_ops.py`
  - `backend/app/services/file_ops_service.py`
- 문제:
  - `recipe_test_ops.py`는 `delete_file`, `rename_file_via_copy_delete`, `save_as_file`, `transfer_many`를 import하지만 `file_ops_service.py`에는 해당 함수 정의가 없다.
- 근거:
  - `recipe_test_ops.py:5-9` import 구문 확인.
  - `file_ops_service.py`에는 `connect_ftp`, `ftp_read_bytes_at_path`, `ftp_write_bytes_at_path`, `ftp_delete_at_path`, `ftp_copy_with_shadow`, `ftp_copy_delete_with_shadow`, `ftp_delete_with_shadow`, `format_ftp_error`만 존재한다.
- 수정 방향:
  - 라우터 계약을 실제 서비스 API와 일치시키거나, 필요한 서비스 함수를 정식 구현해야 한다.
  - 파일명과 책임도 함께 정리하는 편이 안전하다.
- 위험도:
  - 의존성이 설치된 실제 환경에서는 모듈 import 단계부터 실패할 수 있다.

### 4. Critical — `backend/app/api/routes/recipe_test.py` 문법 오류로 전체 테스트 수집이 깨짐
- 파일 경로:
  - `backend/app/api/routes/recipe_test.py`
- 문제:
  - 사용 여부와 무관하게 문법 오류 파일이 저장소에 남아 있어 `pytest -q` 전체 실행이 수집 단계에서 중단된다.
- 근거:
  - `backend/app/api/routes/recipe_test.py:1701`에 `[<backend/app/api/routes/recipe_test.py> - part4]` 텍스트가 그대로 남아 있다.
  - `python3 -m py_compile backend/app/api/routes/recipe_test.py`가 동일 지점에서 실패했다.
  - `pytest -q`도 동일 원인으로 실패했다.
- 수정 방향:
  - 해당 파일을 정식 코드로 유지할지 삭제/격리할지 결정해야 한다.
  - 최소한 테스트 수집 경로를 깨지 않도록 문법 오류 상태는 즉시 해소해야 한다.
- 위험도:
  - CI 또는 로컬 전체 테스트 실행 자체가 신뢰 불가능해진다.

### 5. High — `recipe_test.py`와 `recipe_test_impl.py`가 중복 상태이며 정본이 불명확함
- 파일 경로:
  - `backend/app/api/routes/recipe_test.py`
  - `backend/app/api/routes/recipe_test_impl.py`
- 문제:
  - 동일한 상수, FTP 헬퍼, CFG 파싱, 캐시 처리 로직이 두 파일에 중복되어 있고 한쪽은 대형 모놀리식, 다른 한쪽은 미완성 분리본이다.
- 근거:
  - `RECIPE_SOURCE_CONFIG`, `parse_pol_system_cfg`, FTP read helper, 설비 마스터 조회 로직이 양쪽에 반복된다.
  - `recipe_test.py`에는 일부 실제 핸들러가 있으나 문법 오류가 있고, `recipe_test_impl.py`는 헬퍼만 존재한다.
- 수정 방향:
  - 단일 정본 모듈을 확정하고 나머지는 제거 또는 분리 목적에 맞게 재구성해야 한다.
  - 서비스 계층으로 공통 로직을 내리고 라우터는 HTTP 계약만 담당하도록 구조를 정리하는 편이 적절하다.
- 위험도:
  - 수정 대상 파일을 잘못 선택하기 쉽고, 동일 버그가 두 군데에서 따로 진화할 수 있다.

### 6. High — `/recipe-test/*`와 `/recipe-file-ops/*`의 책임과 파일명이 뒤집혀 있음
- 파일 경로:
  - `backend/app/api/routes/recipe_test_ops.py`
  - `backend/app/api/routes/recipe_file_ops.py`
  - `docs/1-prd.md`
- 문제:
  - 파일명과 실제 prefix가 반대로 배치되어 있어 유지보수자가 잘못된 모듈을 수정하기 쉽다.
- 근거:
  - `recipe_test_ops.py:12`의 prefix는 `/recipe-file-ops`.
  - `recipe_file_ops.py:6`의 prefix는 `/recipe-test`.
  - `docs/1-prd.md`는 이를 반대로 설명한다.
- 수정 방향:
  - 코드 파일명과 prefix 책임을 일치시키거나, 문서를 코드 기준으로 정정해야 한다.
- 위험도:
  - 라우팅 복구 작업에서 잘못된 파일을 기준으로 수정할 가능성이 높다.

### 7. High — 서비스 레이어 경계가 약하고 라우터가 DB/FTP/캐시를 직접 오케스트레이션함
- 파일 경로:
  - `backend/app/api/routes/recipe_test.py`
  - `backend/app/api/routes/recipe_test_impl.py`
  - `backend/app/services/ftp_eqp_ip.py`
  - `backend/app/services/ftp_credentials.py`
- 문제:
  - 라우트 모듈이 직접 `create_engine(POSTGRES_URL)`, FTP 접근, 캐시 무효화, 파일 조작, 이력 기록을 수행한다.
- 근거:
  - `recipe_test_impl.py:338`에서 직접 `create_engine(POSTGRES_URL)` 호출.
  - `ftp_eqp_ip.py`, `ftp_credentials.py`에도 유사한 인프라 접근 로직이 별도 존재한다.
  - `recipe_test.py`는 구조상 더 많은 오케스트레이션을 라우트 레벨에 포함한다.
- 수정 방향:
  - `equipment lookup`, `FTP credential lookup`, `recipe load`, `file mutation`, `inventory query`를 별도 application service로 분리해야 한다.
- 위험도:
  - 인프라 정책 변경 시 라우트 파일 다수를 동시에 수정해야 하며 회귀 위험이 높다.

### 8. High — 캐시/이력/VM/shadow 저장이 tempdir에 고정되어 영속성이 없음
- 파일 경로:
  - `backend/app/services/temp_file_store.py`
  - `backend/app/services/history_service.py`
  - `backend/app/services/recipe_cache_store.py`
  - `backend/app/services/recipe_vm_store.py`
  - `docs/3-execution-plan.md`
- 문제:
  - SQLite 캐시, JSONL 이력, VM 파일, shadow 백업이 모두 OS tempdir 아래 저장되며 환경변수 오버라이드가 없다.
- 근거:
  - `temp_file_store.py:6`의 `LOCAL_EDIT_BASE = Path(tempfile.gettempdir()) / "recipe_test_edit"`.
  - `history_service.py`, `recipe_cache_store.py`, `recipe_vm_store.py`가 이를 직접 사용한다.
- 수정 방향:
  - `LOCAL_EDIT_BASE`를 환경변수로 외부화하고, 이력/캐시/shadow 경로를 영속 디렉터리로 분리해야 한다.
- 위험도:
  - 재기동이나 tempdir 정리 정책에 따라 이력, 캐시, 복구용 shadow 파일이 함께 사라질 수 있다.

### 9. High — 캐시 적재 경로가 원자적이지 않아 파일/SQLite/state 불일치 가능성이 있음
- 파일 경로:
  - `backend/app/services/recipe_inventory_sync.py`
  - `backend/app/services/recipe_vm_store.py`
  - `backend/app/services/recipe_cache_store.py`
- 문제:
  - 파일 저장, SQLite 버전 기록, inventory 상태 갱신이 서로 다른 단계와 커넥션으로 분리되어 있다.
- 근거:
  - `recipe_inventory_sync.py:208`의 `cache_recipe_file_from_live()`는 `save_vm_file()` 후 `store_file_version()`을 호출한다.
  - `sync_equipment_inventory_once()`는 루프 종료 후 `touch_inventory_state()`를 별도 호출한다.
  - `store_file_version()`도 raw 파일 저장 후 SQLite commit을 수행한다.
- 수정 방향:
  - staging 파일 저장, SQLite 단일 트랜잭션, 상태 갱신을 하나의 동기화 단위로 묶는 설계가 필요하다.
- 위험도:
  - 중간 실패 시 orphan 파일, 최신 버전과 어긋난 `inventory_state`, VM 메타/SQLite 불일치가 남을 수 있다.

### 10. High — shadow 백업이 파일명만 키로 사용해 서로 덮어써질 수 있음
- 파일 경로:
  - `backend/app/services/temp_file_store.py`
  - `backend/app/services/file_ops_service.py`
- 문제:
  - 동일한 파일명이 다른 설비 또는 다른 경로에서 사용되면 shadow 백업이 충돌한다.
- 근거:
  - `write_local_shadow_file()`는 `LOCAL_EDIT_BASE / file_name`에 바로 저장한다.
  - `ftp_copy_with_shadow()`와 `ftp_delete_with_shadow()`는 설비 ID나 remote path를 shadow 경로에 포함하지 않는다.
- 수정 방향:
  - `eqp_id`, `path`, timestamp 또는 request id를 shadow 경로/파일명에 포함해야 한다.
- 위험도:
  - 실제 복구가 필요할 때 가장 최근 작업이 이전 백업을 덮어썼을 수 있다.

### 11. High — 현재 비활성 라우트 기준으로 인증/인가가 전혀 없음
- 파일 경로:
  - `backend/app/api/routes/recipe_test.py`
  - `backend/app/api/routes/recipe_test_ops.py`
  - `backend/app/api/routes/recipe_inventory.py`
  - `backend/app/main.py`
- 문제:
  - 라우트 구현 어디에도 `Depends`, `Security`, 토큰/세션 검증, 설비별 권한 체크가 없다.
- 근거:
  - 조회/변경 라우트 전반이 무인증 함수 형태다.
  - `actorName`, `actorTeam`도 요청값을 그대로 신뢰하는 구조다.
- 수정 방향:
  - 라우터를 실제로 살리기 전에 인증/인가와 감사 주체 강제 방식을 먼저 정의해야 한다.
- 위험도:
  - 현재 엔트리포인트에는 직접 노출되지 않지만, 등록 시 곧바로 비인가 조회/복사/삭제/전송 위험이 된다.

### 12. High — CORS 설정이 전혀 없음
- 파일 경로:
  - `backend/app/main.py`
  - `backend/main.py`
- 문제:
  - `CORSMiddleware` 등록이 없고 관련 설정값도 없다.
- 근거:
  - 저장소 검색에서 `CORSMiddleware` 사용이 확인되지 않았다.
  - `main.py` 계열은 단순 `FastAPI(...)` 생성만 수행한다.
- 수정 방향:
  - `CORS_ORIGINS` 기반 allowlist와 필요한 메서드/헤더만 허용하는 명시적 정책이 필요하다.
- 위험도:
  - 브라우저 기반 프론트 연동 장애가 발생하거나, 추후 급하게 과도 개방할 가능성이 있다.

### 13. Medium — PostgreSQL `Engine`과 Mongo `MongoClient`를 호출마다 새로 생성함
- 파일 경로:
  - `backend/app/api/routes/recipe_test_impl.py`
  - `backend/app/services/ftp_eqp_ip.py`
  - `backend/app/services/ftp_credentials.py`
  - `docs/3-execution-plan.md`
- 문제:
  - DB와 Mongo 연결 객체를 함수 호출마다 생성하고 바로 닫는다.
- 근거:
  - `recipe_test_impl.py:338`의 `load_eqp_master_options()`는 함수 내부에서 `create_engine(POSTGRES_URL)` 호출.
  - `ftp_eqp_ip.py:9`, `ftp_credentials.py:14`는 `MongoClient()`를 매번 생성한다.
- 수정 방향:
  - 모듈 싱글턴 또는 FastAPI lifespan 관리 객체로 옮겨 연결 재사용을 보장해야 한다.
- 위험도:
  - 요청 증가 시 handshake/connection churn 비용이 누적된다.

### 14. Medium — `list_latest_versions()`가 설비 전체 버전을 읽고 Python에서 후필터링함
- 파일 경로:
  - `backend/app/services/recipe_cache_store.py`
  - `backend/app/services/recipe_inventory_sync.py`
- 문제:
  - `source_path`와 `exts` 조건을 SQL이 아니라 Python 루프에서 처리한다.
- 근거:
  - `recipe_cache_store.py`의 `list_latest_versions()`는 SQL에서 `WHERE eqp_id = ?`만 사용하고, 이후 `for row in rows:`에서 `source_path`/`exts`를 필터링한다.
  - 이 함수는 `recipe_inventory_sync.py`의 cache/live merge path에서 사용된다.
- 수정 방향:
  - `source_path`, 확장자 조건을 SQL로 내리고 필요한 인덱스를 재검토해야 한다.
- 위험도:
  - 버전 이력이 커질수록 source별 조회가 설비 전체 스캔으로 비효율화된다.

### 15. Medium — `parse_cas_slots()` 기본 슬롯 수가 25가 아니라 24임
- 파일 경로:
  - `backend/app/api/routes/recipe_test_impl.py`
  - `backend/tests/test_mockup_routes.py`
- 문제:
  - CAS 슬롯이 비어 있는 경우 최소 24개만 생성되도록 구현되어 있다.
- 근거:
  - `recipe_test_impl.py:740` 부근에서 `max(parsed.keys(), default=24)` 후 `max(max_slot, 24)`를 사용한다.
  - 테스트 계약은 `backend/tests/test_mockup_routes.py`에서 슬롯 1~25를 기대한다.
- 수정 방향:
  - 최소 슬롯 수를 25로 고정해야 계약과 일치한다.
- 위험도:
  - 일부 CAS 파일에서 slot 25가 누락되면 API 결과 형상이 달라질 수 있다.

### 16. Medium — 에러 처리와 응답 shape가 일관되지 않음
- 파일 경로:
  - `backend/app/api/routes/recipe_test.py`
  - `backend/app/api/routes/recipe_inventory.py`
  - `backend/app/api/routes/recipe_test_ops.py`
- 문제:
  - 대부분의 예외를 400으로 평탄화하지만 일부는 404를 사용하고, 일부는 HTTP 200에 `"partial"`/`"failed"` 본문을 반환한다.
- 근거:
  - `recipe_inventory.py`는 `{'items': ...}`, `{'item': ...}`, bare state를 혼용한다.
  - `recipe_test_ops.py /delete`는 실패를 HTTP 200의 본문 상태 문자열로 처리한다.
- 수정 방향:
  - 성공/실패 envelope, status code 기준, upstream FTP/DB 오류 매핑 규칙을 정리해야 한다.
- 위험도:
  - 프론트와 운영 도구가 경로별로 다른 예외 해석 로직을 가져야 한다.

### 17. Medium — 로깅이 구조화되어 있지 않고 내부 예외를 그대로 외부에 노출함
- 파일 경로:
  - `backend/app/api/routes/recipe_test.py`
  - `backend/app/api/routes/recipe_inventory.py`
  - `backend/tools/recipe_inventory_worker.py`
  - `backend/app/RMS/RMS_down.py`
- 문제:
  - `except Exception as e: raise HTTPException(..., detail=str(e))` 패턴과 `print` 중심 출력이 혼재한다.
- 근거:
  - 라우터는 내부 예외 메시지를 외부 응답 detail로 그대로 반환한다.
  - 워커/스크립트는 구조화 logger 없이 `print`를 사용한다.
- 수정 방향:
  - 내부 로그는 structured logger로 남기고, 외부 응답은 일반화된 에러 코드와 메시지로 축소해야 한다.
- 위험도:
  - 장애 분석은 어렵고 내부 정보는 과다 노출되는 조합이다.

### 18. High — 자동화 테스트가 실제 백엔드 경로를 거의 검증하지 않음
- 파일 경로:
  - `backend/tests/test_mockup_routes.py`
  - `backend/tests/mockup_data.py`
- 문제:
  - 테스트는 실제 라우터/서비스 호출 없이 mock 데이터 shape만 검증한다.
- 근거:
  - 테스트 docstring 자체가 static mockup module only를 명시한다.
  - `pytest -q backend/tests/test_mockup_routes.py`는 통과하지만 `pytest -q` 전체는 코드 문법 오류로 실패한다.
  - `TestClient`, `monkeypatch`, SQLite 임시 DB, FTP/Mongo/Postgres 모킹 테스트가 없다.
- 수정 방향:
  - 최소한 라우팅 smoke test, 서비스 단위 mock test, 저장 경로 및 캐시 일관성 테스트를 추가해야 한다.
- 위험도:
  - 현재 43개 통과는 실제 운영 안정성과 거의 연결되지 않는다.

## 문서 불일치 이슈

### 19. High — `docs/1-prd.md`가 `recipe_test_impl.py`를 실제 핸들러 구현 파일로 설명함
- 파일 경로:
  - `docs/1-prd.md`
  - `backend/app/api/routes/recipe_test_impl.py`
- 문제:
  - PRD는 `recipe_test_impl.py`를 “핵심 구현 로직 (모든 핸들러 함수 포함)”으로 설명하지만 실제 파일은 핸들러 없이 종료된다.
- 근거:
  - `docs/1-prd.md`의 폴더 구조 설명과 실제 `recipe_test_impl.py` 상태가 다르다.
- 수정 방향:
  - 문서를 실제 코드 기준으로 정정하거나, 코드를 문서 설명대로 복구해야 한다.
- 위험도:
  - 후속 작업자가 잘못된 기준 문서를 보고 구조를 오판한다.

### 20. High — `docs/1-prd.md`의 라우터 파일 책임 설명이 실제 prefix와 다름
- 파일 경로:
  - `docs/1-prd.md`
  - `backend/app/api/routes/recipe_test_ops.py`
  - `backend/app/api/routes/recipe_file_ops.py`
- 문제:
  - PRD는 `recipe_test_ops.py`와 `recipe_file_ops.py`의 경로 소유 관계를 실제 코드와 반대로 설명한다.
- 근거:
  - 실제 prefix는 `recipe_test_ops.py`가 `/recipe-file-ops`, `recipe_file_ops.py`가 `/recipe-test`.
- 수정 방향:
  - 문서와 코드를 하나의 기준으로 맞춰야 한다.
- 위험도:
  - 잘못된 모듈을 수정하는 실수 가능성이 높다.

### 21. High — `docs/2-erd.md`와 `docs/3-execution-plan.md`가 실제 런타임 경계를 과대 가정함
- 파일 경로:
  - `docs/2-erd.md`
  - `docs/3-execution-plan.md`
  - `backend/app/main.py`
- 문제:
  - ERD와 Execution Plan은 `/api/recipe-test/*`, `/api/recipe-inventory/*`가 동작 중인 전제로 저장소와 우선순위를 서술하지만 실제 엔트리포인트에는 연결되어 있지 않다.
- 근거:
  - `backend/app/main.py`에는 해당 router 등록이 없다.
- 수정 방향:
  - 문서의 “현재 구현”과 “계획”을 실제 등록된 앱 경계 기준으로 다시 써야 한다.
- 위험도:
  - 운영 검증, 장애 대응, 우선순위 결정이 잘못된 전제를 바탕으로 이뤄질 수 있다.

### 22. High — `docs/3-execution-plan.md`의 EP-01 우선순위 가정이 실제 코드 상태와 맞지 않음
- 파일 경로:
  - `docs/3-execution-plan.md`
  - `backend/app/api/routes/recipe_test_eqp.py`
  - `backend/app/api/routes/recipe_test_content.py`
  - `backend/app/api/routes/recipe_test_ops.py`
  - `backend/app/api/routes/recipe_test_impl.py`
- 문제:
  - Execution Plan은 “라우터 등록만 추가”를 Critical 선행 작업으로 보지만, 실제로는 분리 라우터와 서비스 계층 자체가 불완전하다.
- 근거:
  - 위 2번, 3번 이슈 때문에 단순 `include_router()`는 해결이 아니라 500 유발 가능성이 높다.
- 수정 방향:
  - Phase 1 최우선을 `정본 라우팅 구조 확정`, `죽은/미완성 라우터 정리`, `핵심 핸들러 복구`로 재정의해야 한다.
- 위험도:
  - 계획서 순서대로 진행하면 가장 먼저 잘못된 구조를 외부로 노출할 수 있다.

## 리뷰 항목별 결론

1. API 구조와 라우팅
- 현재 실제 앱 기준으로는 `/api/recipe-units`만 유효하다.
- `recipe-test`, `recipe-inventory`, `recipe-file-ops`는 문서상 구조와 실제 연결 상태가 크게 다르다.

2. 서비스 레이어 구조
- 라우터에 오케스트레이션이 과도하게 몰려 있다.
- 서비스 경계가 약하고 중복 로직이 많다.

3. DB 접근 방식과 트랜잭션
- `create_engine()`/`MongoClient()` 재생성이 반복된다.
- SQLite/파일 저장 경계가 원자적이지 않다.

4. ERD와 실제 코드 불일치
- ERD는 동작 중인 API를 전제로 저장소 흐름을 설명하지만 현재 엔트리포인트에는 연결되지 않는다.

5. PRD 요구사항 충족 여부
- PRD가 묘사하는 핵심 API 구조는 현재 코드 기준으로 충족되지 않는다.

6. Execution Plan과의 우선순위 정합성
- EP-01 “등록만 추가”는 실제 코드 상태를 과소평가한다.
- 라우팅 구조 정리가 누락된 상태에서 후속 단계로 가는 계획은 부정합이다.

7. 에러 처리와 로깅
- 에러 매핑이 일관되지 않고 내부 예외 문자열을 외부에 그대로 노출한다.
- 구조화 로깅이 없다.

8. 보안, CORS, 환경변수, Secret 관리
- 비활성 라우트 기준 인증/인가가 없다.
- CORS 설정이 없다.
- `backend/.env` 직접 로드와 insecure default가 존재한다.

9. 테스트 부족 영역
- 실 API, 실 저장소, 장애 분기, 보안 정책을 검증하지 않는다.
- 전체 테스트 수집도 현재는 깨져 있다.

10. 중복 코드, dead code, 리팩토링 후보
- `recipe_test.py`와 `recipe_test_impl.py` 중복이 가장 큰 리팩토링 후보다.
- `recipe_test.py`는 현재 dead code에 가까우며 문법 오류까지 포함한다.

## 우선순위 제안

### 즉시 조치 필요
- `backend/app/main.py`와 `backend/main.py` 중 정본 엔트리포인트 확정
- `recipe_test.py` / `recipe_test_impl.py` 중 정본 구현 파일 확정
- 문법 오류 파일 제거 또는 수집 대상에서 제외
- 분리 라우터와 실제 서비스 함수 계약 정합성 복구

### 다음 단계
- `LOCAL_EDIT_BASE` 환경변수화 및 영속 경로 분리
- 캐시 적재 트랜잭션/원자성 재설계
- 인증/인가, CORS, 구조화 로깅 도입
- mock shape 테스트 외 실제 API/서비스 테스트 추가

## 확인 필요

- 실제 배포 커맨드가 `backend/main.py`를 쓰는지 `backend/app/main.py`를 쓰는지
- `recipe_test.py`를 레거시 보관 파일로 볼지, 실제 구현 정본으로 복구할지
- 실제 운영 환경에서 PostgreSQL/MongoDB/FTP 연결이 어디까지 활성 사용 중인지
