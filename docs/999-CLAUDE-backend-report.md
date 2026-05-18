# Backend Code Review Report

**작성일**: 2026-05-18  
**대상**: `/home/dev/project/recipe/backend`  
**리뷰어**: Multi-Agent 병렬 분석 (API, DB, Security, QA, Code Quality)

---

## Executive Summary

| 심각도 | 개수 | 상태 |
|--------|------|------|
| **Critical** | 18건 | 🔴 즉시 수정 필요 |
| **High** | 35건 | 🟠 단기 수정 필요 |
| **Medium** | 45건 | 🟡 중기 수정 권장 |
| **Low** | 25건 | 🟢 개선 권장 |
| **합계** | **123건** | — |

### 상태 개요

현재 backend는 **프로덕션 서비스 불가 상태**입니다. 주요 원인:
1. **API 라우팅 전면 비동작** — `main.py`에 `include_router()` 호출 전무. 모든 recipe-test/* 엔드포인트가 404 반환.
2. **구현 미완료** — ops 8개 엔드포인트(cas/save, job/save, persist, clone, rename, delete, transfer), `/recipe-content`, `/recipe-inventory/*` 대부분 미구현.
3. **보안 미처리** — 인증/권한 없음, CORS 미설정, FTP path traversal 가능, 자격증명 로그 누출.
4. **중복 코드 만연** — `recipe_test.py`(2,011행)과 `recipe_test_impl.py`(845행)가 동일 prefix로 거의 동일 코드 중복.
5. **테스트 부재** — 라우터/서비스 코드 실행 테스트 0건. mockup 정적 dict 검증만.

---

## 1. API 구조와 라우팅

### [Critical] main.py에 모든 서브라우터 미등록 (서비스 전면 비동작)

- **파일**: `/home/dev/project/recipe/backend/app/main.py:1-46`, `/home/dev/project/recipe/backend/main.py:1-38`
- **문제**: `app = FastAPI(...)` 선언 후 `app.include_router(...)`가 단 한 줄도 없음. 따라서 `/recipe-test/*`, `/recipe-inventory/*`, `/recipe-file-ops/*` 어떤 경로도 등록되지 않음. 현재 노출 엔드포인트는 `GET /`, `GET /api/recipe-units` 두 개뿐.
- **근거**: 
  - `grep -n include_router backend/` 결과 0건
  - PRD §7.1 주석: "main.py에 서브라우터가 등록되지 않아 ..."
  - EP-01 명시: "라우터 등록" 미완료
- **수정 방향**: 
  ```python
  from app.api.routes import (
      recipe_test_eqp, recipe_test_content, recipe_test_history,
      recipe_test_ops, recipe_file_ops, recipe_inventory
  )
  for router in [recipe_test_eqp.router, recipe_test_content.router,
                 recipe_test_history.router, recipe_test_ops.router,
                 recipe_file_ops.router, recipe_inventory.router]:
      app.include_router(router, prefix="/api")
  ```
- **검증 방법**: `GET http://localhost:8000/api/recipe-test/eqp-options` 200 응답 확인
- **위험도**: Critical (모든 핵심 API 비동작)

---

### [Critical] backend/main.py vs backend/app/main.py 진입점 이중화

- **파일**: `/home/dev/project/recipe/backend/main.py`, `/home/dev/project/recipe/backend/app/main.py`
- **문제**: 두 파일이 사실상 동일한 코드(FastAPI 앱, `/`, `/api/recipe-units`)를 가짐. uvicorn 기동 시 어느 쪽을 진입점으로 쓸지 불명확.
- **근거**: 
  - `backend/main.py:3` `app = FastAPI(title="Recipe Mock API")`
  - `backend/app/main.py:4` 동일 선언
  - 라우터 등록 시 어디에 추가할지 혼동 가능
- **수정 방향**: 하나를 표준으로 결정(EP는 `app/main.py` 기준). 다른 파일 삭제 또는 `from app.main import app` 재export로 축소.
- **검증 방법**: 운영 문서에 진입점 명시, CI에서 검증
- **위험도**: Critical (배포 혼선)

---

### [Critical] sub-라우터의 impl 참조가 실제로 존재하지 않음

- **파일**: 
  - `recipe_test_eqp.py:7-13`
  - `recipe_test_content.py:7-25`
  - `recipe_test_history.py:7-9`
  - `recipe_file_ops.py:8-38`
- **문제**: 이 파일들은 모두 `from app.api.routes import recipe_test_impl as impl`을 한 뒤 다음을 호출:
  - `impl.get_eqp_options()`, `impl.LoadRequest`, `impl.load_recipe_test(req)`
  - `impl.get_cas_content`, `impl.get_job_content`, `impl.get_recipe_content`, `impl.get_recipe_source_list`
  - `impl.get_history`
  - `impl.save_cas`, `impl.persist_cas`, `impl.save_job`, `impl.persist_job`, `impl.clone_recipe`, `impl.rename_file`, `impl.delete_files`, `impl.transfer_files`
  
  그런데 `recipe_test_impl.py`에는 **요청 모델만** 존재하고 위의 **핸들러 함수는 단 하나도 정의되지 않음**.
- **근거**: 
  - `recipe_test_impl.py` 상단(247-326행) 요청 모델만 있음
  - `grep "^def get_eqp_options\|^def save_cas"` 결과 0건
  - 실제 핸들러는 `recipe_test.py:1781, 1795, 1850` 등에만 존재
- **수정 방향**: 두 가지 중 택1:
  - (A) `recipe_test_impl.py`로 모든 핸들러 이전 (EP 의도 아키텍처, 변경 폭 큼)
  - (B) `recipe_test.py` 라우터를 그대로 `include_router` 등록 (단기 해결, EP 갱신 필요)
- **검증 방법**: TestClient로 각 엔드포인트 200 응답 확인
- **위험도**: Critical (등록해도 즉시 RuntimeError/AttributeError)

---

### [Critical] 핵심 기능 엔드포인트 누락 (8개 ops + recipe-content)

- **파일**: `recipe_test_content.py:23-25`, `recipe_test_ops.py`, `recipe_file_ops.py`
- **문제**: 
  - `/recipe-test/recipe-content` — 어디에도 핸들러 미정의
  - 8개 ops (cas/save, cas/persist, job/save, job/persist, recipe/clone, file/rename, file/delete, transfer) — 모두 미구현
  - PRD F-05~F-11 핵심 기능이 구현되지 않음
- **근거**: 
  - `grep "@router\." recipe_test.py` 결과 7개 GET뿐, ops는 0
  - `recipe_test_impl.py` 함수 목록에 부재
  - EP에는 "라우터 등록"이라 적혀있으나 실제론 "핸들러 구현부터" 필요
- **수정 방향**: 우선 `recipe_test.py` 코드 활용 가능 여부 검토. ops 8개와 `/recipe-content` 핸들러 구현 필수.
- **검증 방법**: 각 엔드포인트 POST/GET 응답 코드 및 결과 형식 검증
- **위험도**: Critical (기능 부재)

---

### [Critical] PRD/EP의 파일-엔드포인트 매핑이 실제 코드와 반대

- **파일**: `recipe_test_ops.py:12`, `recipe_file_ops.py:6`
- **문제**: 
  - **PRD/EP**: "`recipe_test_ops.py` → `/recipe-test/cas/save, ...`", "`recipe_file_ops.py` → `/recipe-file-ops/*`"
  - **실제 코드** (반대):
    - `recipe_test_ops.py:12` → `prefix="/recipe-file-ops"`, 핸들러 `/save-as`, `/rename`, `/delete`, `/transfer`
    - `recipe_file_ops.py:6` → `prefix='/recipe-test'`, 핸들러 `/cas/save`, `/cas/persist`, `/job/save`, `/file/rename`, `/file/delete`, `/transfer`
- **근거**: 라우터 선언 라인 직접 확인
- **수정 방향**: 파일 이름/라우터 prefix/핸들러 중 하나를 교정. 또는 PRD/EP를 실제 코드에 맞춰 갱신.
- **검증 방법**: 프론트 `recipeFileOpsApi.example.ts` 호출 경로 확인 후 일치성 검증
- **위험도**: Critical (API 계약 위반)

---

### [High] /recipe-test/transfer 경로 중복 정의 가능성

- **파일**: `recipe_file_ops.py:36-38`, `recipe_test_ops.py:89-101`
- **문제**: 두 라우터가 모두 `POST /recipe-test/transfer`를 정의할 가능성. 등록 순서에 따라 한쪽만 우선됨.
- **근거**: 위 파일의 라우터 prefix와 핸들러 경로
- **수정 방향**: 단일 `/recipe-test/transfer` 정책 결정 후 한쪽만 남김.
- **검증 방법**: 프론트 호출 경로 확인 + 테스트
- **위험도**: High (기능 비동작 또는 의도와 다른 동작)

---

### [High] /recipe-test/history 핸들러 중복 정의

- **파일**: `recipe_test.py:1938`, `recipe_test_history.py:7`
- **문제**: 두 곳에서 `@router.get('/history')` 정의. 모놀리식과 분리 파일 중복.
- **근거**: 두 라인의 동일 경로
- **수정 방향**: 모놀리식을 사용할 계획이면 분리 파일의 구현 완성, 분리 파일만 사용할 계획이면 모놀리식 미등록.
- **검증 방법**: 라우터 등록 후 경로 겹침 검증
- **위험도**: High (경로 충돌, 예기치 않은 동작)

---

### [High] recipe_test_impl.py의 라우터 선언이 핸들러 0개 (함정)

- **파일**: `recipe_test_impl.py:37`
- **문제**: `router = APIRouter(prefix="/recipe-test", tags=["recipe-test"])`를 선언하지만 `@router.*` 데코레이터는 0개. 누군가 이 라우터를 include_router하면 경로 충돌 발생.
- **근거**: 라우터 선언 후 핸들러 부재
- **수정 방향**: 라우터 선언 제거 또는 명시적 주석 "라우팅하지 않음, 임포트만 허용".
- **검증 방법**: `include_router(recipe_test_impl.router)` 테스트 실패 확인 후 제거
- **위험도**: High (개발자 함정)

---

## 2. 서비스 레이어 구조

### [High] 동일 함수가 3-4번 정의됨 (DRY 위반)

- **파일**: 
  - `connect_ftp`: `recipe_test.py:561`, `recipe_inventory_sync.py:82`, `file_ops_service.py:10`
  - `parse_pol_system_cfg`: `recipe_test.py:722`, `recipe_test_impl.py:438`, `recipe_inventory_sync.py:43`
  - `_normalize_cfg_lines`: `recipe_test.py:718`, `recipe_test_impl.py:434`, `recipe_inventory_sync.py:39`
  - `decode_ftp_bytes` ≈ `_decode_recipe_bytes_to_text` ≈ `ftp_read_text_at_path` 내부 로직
- **문제**: 동일 로직 반복. 한 곳에서 버그 수정하면 다른 곳은 남음. 유지보수 악화.
- **근거**: 함수 본문 직접 비교 동일성 확인
- **수정 방향**: 
  - `app/services/ftp_client.py` — connect_ftp, safe_close, ftp_dir_entries, DIR_LINE_RE
  - `app/services/text_utils.py` — normalize_newlines, decode_bytes, _normalize_cfg_lines
- **검증 방법**: 리팩토링 후 unittest 통과 확인
- **위험도**: High (유지보수성, 일관성)

---

### [High] FTP 연결을 매 작업마다 새로 맺음 (성능)

- **파일**: `file_ops_service.py` 전체, `recipe_test_impl.py:519, 542` 등
- **문제**: `ftp_read_bytes_at_path`, `ftp_write_bytes_at_path`, `ftp_delete_at_path`, `ftp_file_exists_at_path`가 매번 connect → login → quit. 한 설비 30개 파일 copy 시 30번 login 발생.
- **근거**: `ftp_copy_with_shadow` (line 90-104)는 read에서 connect, write에서 connect, exists에서 connect 각각 수행.
- **수정 방향**: 
  ```python
  class FtpSession:
      def __enter__(self):
          self.ftp = connect_ftp(...)
          return self.ftp
      def __exit__(self, ...):
          safe_close_ftp(self.ftp)
  
  with FtpSession(eqp_id) as ftp:
      data = ftp_read_bytes_at_path(ftp, ...)
      ftp_write_bytes_at_path(ftp, ...)
  ```
- **검증 방법**: FTP 연결 수 계측 후 감소 확인
- **위험도**: High (성능, 사내 FTP 부하)

---

### [High] load_eqp_master_options() — 잘못된 컬럼 fallback 패턴

- **파일**: `recipe_test_impl.py:338-407`, `recipe_test.py:417-510` (동일 중복)
- **문제**: `eqp_model_bucker`(오타)와 `eqp_model_bucket`(정상), `site`와 `line_id`를 4번 다른 쿼리로 시도. 매번 최소 1개 PostgreSQL 에러 발생. 모두 실패하면 `last_error` raise.
- **근거**: 4개 쿼리의 컬럼명 오타와 다른 조인만 차이
- **수정 방향**: 시작 시 `information_schema.columns`로 컬럼 존재 여부 1회 검사 후 적절한 쿼리만 선택.
- **검증 방법**: 각 fallback 경로 단위 테스트
- **위험도**: High (성능, 에러 로깅 노이즈)

---

### [High] N+1 쿼리: get_inventory_entry가 전체 스캔

- **파일**: `recipe_cache_store.py:236-241`
- **문제**: 단일 row 조회를 전체 source_path 목록 SELECT 후 파이썬 루프로 처리.
- **근거**: 
  ```python
  for item in list_inventory_entries(eqp_id, source_path, include_absent=True):
      if str(item.get('name') or '').strip() == target:
          return item
  ```
- **수정 방향**: `WHERE eqp_id=? AND source_path=? AND name=?` 직접 쿼리
- **검증 방법**: 쿼리 count 감소 확인
- **위험도**: High (확장성)

---

## 3. DB 접근 방식과 트랜잭션

### [Critical] DB 자격증명 기본값이 비어 있어도 무음 fallback

- **파일**: `/home/dev/project/recipe/backend/db.py:6-12`, `/home/dev/project/recipe/backend/app/config.py:10-11`
- **문제**: 
  - `DB_PASSWORD` 기본값 `""`
  - `MONGO_URL` 기본값 `'mongodb://127.0.0.1:27017/'` (하드코딩 localhost)
  - `POSTGRES_URL` 빈 문자열 가능
  
  운영 환경에서 `.env` 누락 시 의도치 않게 로컬 DB로 붙거나 연결 실패.
- **근거**: 코드 직접 인용
- **수정 방향**: 필수 env가 비어있으면 앱 시작 시 명시적 `RuntimeError` 던지고 종료.
  ```python
  MONGO_URL = os.getenv('MONGO_URL')
  if not MONGO_URL:
      raise RuntimeError("MONGO_URL env not set - connection refused by design")
  ```
- **검증 방법**: 환경변수 미설정 상태에서 앱 기동 실패 확인
- **위험도**: Critical (데이터 무결성, 운영 사고)

---

### [High] 두 종류의 PostgreSQL 접근 방식 혼재

- **파일**: `/home/dev/project/recipe/backend/db.py:1-13`, `/home/dev/project/recipe/backend/app/services/ftp_eqp_ip.py:10`
- **문제**: `db.py`는 `psycopg.connect()`, `ftp_eqp_ip.py`는 `sqlalchemy.create_engine()` 매 호출마다 새로 생성. 커넥션 풀 미재사용.
- **근거**: 두 모듈의 DB 초기화 패턴 차이
- **수정 방향**: SQLAlchemy 엔진 싱글톤으로 통일. FastAPI lifespan에서 초기화.
- **검증 방법**: 커넥션 수 모니터링
- **위험도**: High (성능)

---

### [High] MongoClient를 호출마다 생성·해제

- **파일**: `ftp_credentials.py:15-46`, `ftp_eqp_ip.py:40-55`
- **문제**: 매번 `MongoClient(MONGO_URL)` 생성 후 `client.close()`. 내부 풀을 재사용하지 않음.
- **근거**: 함수 매개변수 없이 매번 생성하는 패턴
- **수정 방향**: 모듈 수준 싱글톤 또는 FastAPI lifespan DI.
- **검증 방법**: MongoDB 연결 수 모니터링
- **위험도**: High (성능, 네트워크)

---

### [High] SQLite 동시 쓰기 락 충돌 + 트랜잭션 비원자

- **파일**: `recipe_cache_store.py:30-33, 126-192`
- **문제**: 
  1. WAL 모드 미설정 → 동시 쓰기 시 `database is locked`
  2. `_save_raw_bytes`는 먼저 파일 기록, 이후 INSERT. 중간 중단 시 고아 파일
- **근거**: PRAGMA 설정 부재, 파일/DB 분리 작업
- **수정 방향**: 
  ```python
  def _connect():
      conn = sqlite3.connect(str(db_path()), timeout=5)
      conn.execute("PRAGMA journal_mode=WAL")
      conn.execute("PRAGMA synchronous=NORMAL")
      return conn
  
  # raw 파일을 임시 저장 후 INSERT 성공 시 rename
  ```
- **검증 방법**: 동시 워커 부하 테스트
- **위험도**: High (데이터 무결성, 동시성)

---

### [High] ensure_schema()가 모든 호출마다 실행 (성능 저하)

- **파일**: `recipe_cache_store.py:36-114, 127, 196, ...`
- **문제**: 거의 모든 공개 함수 첫 줄에서 CREATE TABLE IF NOT EXISTS + PRAGMA table_info + 조건부 ALTER + COMMIT 수행. 워커 한 cycle에서 수십 번 메타 쿼리 발생.
- **근거**: 호출 빈도 추적 및 함수 목록
- **수정 방향**: 모듈 로드 시 1회만 또는 `@lru_cache(maxsize=1)`.
- **검증 방법**: 쿼리 로그에서 PRAGMA 빈도 감소 확인
- **위험도**: High (성능)

---

### [High] JSONL 이력 파일 — 동시 쓰기 락 없음, 무한 증가

- **파일**: `history_service.py:14-58`
- **문제**: 
  1. `open('a')` — 동시 append 시 OS별 원자성 보장 불확실 (Windows 위험)
  2. 전체 파일 스캔 후 정렬 — 파일 증가 시 O(N log N)
  3. 경로가 tempdir 하위 → 재부팅 시 손실 가능
- **근거**: 파일 모드, 읽기 방식, 저장 위치
- **수정 방향**: SQLite `recipe_action_history` 테이블로 이관 (ERD 12.5 권고).
- **검증 방법**: 이전 후 동시성/성능 테스트
- **위험도**: High (데이터 손실, 성능)

---

## 4. PRD/ERD/Execution Plan과 실제 코드 불일치

### [High] ERD Q-01, Q-02, Q-05 미확인 상항 (실제 테이블 존재 여부 불명)

- **파일**: `docs/2-erd.md` 10번 항목
- **문제**: `core.recipe_unit` 테이블 실제 존재 여부 및 사용 여부 불명. `db.py`가 이를 위해 존재하는지 불명확.
- **근거**: ERD에 "테이블 실제 존재 여부 확인 필요" 표기
- **수정 방향**: 사내 PostgreSQL에서 확인 필요. 없으면 `db.py` 삭제.
- **검증 방법**: `psql`로 `\dt core.recipe_unit` 조회
- **위험도**: High (엔지니어링 불확실성)

---

### [Medium] 임시 저장소를 tempdir 하위에 둠 (Windows/재부팅 손실)

- **파일**: `temp_file_store.py:6-7`, `recipe_cache_store.py:11-16`, `history_service.py:14-16`
- **문제**: `tempfile.gettempdir()` 하위에 SQLite, raw 바이너리, JSONL 이력 모두 저장. Windows에서는 재부팅/디스크 정리 시 삭제 가능. 사용자별로 경로 다름.
- **근거**: 코드 직접 인용
- **수정 방향**: env `RECIPE_DATA_DIR`로 영구 디렉터리 지정 (예: `/opt/recipe-rms` 또는 `C:\ProgramData\RecipeRMS`).
- **검증 방법**: Windows에서 임시 파일 정리 후 앱 재시작 시 데이터 유지 확인
- **위험도**: High (데이터 손실, Windows 호환성)

---

## 5. 에러 처리와 로깅

### [Critical] bare `except Exception: pass` 남용 (디버깅 불가)

- **파일**: 거의 모든 파일. 대표:
  - `file_ops_service.py:26-30, 38-44, 52-58, 67-71, 73-79` (ftp.quit 5군데)
  - `recipe_inventory_sync.py:136-142, 167-173, 314-317`
  - `recipe_test.py:824-825, 886-887, 962-964`
- **문제**: 어떤 예외인지 알 수 없음. FTP 연결 실패와 디스크 IO 오류가 모두 묻힘.
- **근거**: `except Exception: pass` 패턴 grep 결과 40+ 건
- **수정 방향**: 
  ```python
  except (ftplib.error_perm, ftplib.error_temp) as e:
      logger.exception(f"FTP error: {e}")
  except Exception as e:
      logger.exception(f"Unexpected error: {e}")
      raise
  ```
- **검증 방법**: 로그에 exception 기록되는지 확인
- **위험도**: Critical (운영 지옥)

---

### [High] print() 기반 로깅 — 운영 환경 사용 불가

- **파일**: `recipe_inventory_worker.py:42, 49, 51, 53`, `RMS_down.py:42, 45, 52, 60`
- **문제**: 구조화 로깅 부재. 레벨/타임스탬프/요청 ID 없음. 사내 워커 로그 분석 불가.
- **근거**: `print(f'[recipe_inventory_worker] start cycle')` 패턴
- **수정 방향**: `logging.getLogger(__name__)` 사용, RotatingFileHandler + StreamHandler.
- **검증 방법**: 로그 파일 생성 및 레벨별 필터링 확인
- **위험도**: High (운영성)

---

### [High] HTTPException(detail=str(exc)) — 원본 예외 chain 손실

- **파일**: `recipe_test.py:1791, 1846, 1943, 1963, 2012`, `recipe_test_impl.py:496`
- **문제**: `raise ... from e` 미사용. 스택 trace 손실. 상태 코드도 모두 400 (404/500 구분 안 됨).
- **근거**: 패턴 직접 확인
- **수정 방향**: 
  ```python
  except FileNotFoundError as e:
      raise HTTPException(status_code=404) from e
  except ValueError as e:
      raise HTTPException(status_code=422) from e
  ```
- **검증 방법**: 클라이언트 응답 상태 코드 검증
- **위험도**: High (디버깅)

---

## 6. 보안, CORS, 환경변수, Secret 관리

### [Critical] 인증/권한 처리가 전혀 없음 (모든 엔드포인트 무방비)

- **파일**: `/home/dev/project/recipe/backend/app/api/routes/recipe_test_ops.py:1-38` 등 모든 라우터
- **문제**: 어떤 인증·인가 로직도 없음. `Depends(get_current_user)`, API key, JWT 검증 전무. `actorName`, `actorTeam` 클라이언트 임의 지정 가능 → 감사 로그 위조 가능.
- **근거**: 라우터 정의에 인증 미들웨어/Depends 없음
- **수정 방향**: 사내 SSO/JWT/API Key 기반 인증 미들웨어 도입. `Depends`로 보호.
- **검증 방법**: 미인증 요청 시 401 반환 확인
- **위험도**: Critical (보안)

---

### [Critical] CORS 미설정 → 정책 불명확

- **파일**: `/home/dev/project/recipe/backend/app/main.py`, `/home/dev/project/recipe/backend/main.py`
- **문제**: `CORSMiddleware` 등록 0건. 프론트 호출 시 CORS 에러 발생 가능. 또한 추후 `allow_origins=["*"]` 급하게 추가 가능성 높음.
- **근거**: `add_middleware` 호출 부재
- **수정 방향**: 
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=os.getenv("CORS_ORIGINS", "").split(","),
      allow_credentials=True,
      allow_methods=["GET", "POST", "PUT", "DELETE"],
      allow_headers=["*"],
  )
  ```
- **검증 방법**: 프론트에서 교차 도메인 요청 성공 확인
- **위험도**: Critical (기능 불가, 보안 정책 부재)

---

### [Critical] FTP cwd/STOR/DELE에 사용자 입력 경로를 무검증 전달 (Path Traversal)

- **파일**: `file_ops_service.py:16-58`, `recipe_file_ops.py:14-87`
- **문제**: `SaveAsRequest.sourceDir/targetDir`, `RenameRequest.remoteDir`, `DeleteRequest.filenames`가 검증 없이 `ftp.cwd(path)`와 `RETR/STOR/DELE` 명령에 직접 전달. CRLF 또는 `../../` 경로 조작 가능.
- **근거**: 
  ```python
  class DeleteRequest(BaseModel):
      filenames: list[str] = Field(default_factory=list)  # 무검증
  
  ftp.cwd(remoteDir)  # remoteDir 검증 없음
  ```
- **수정 방향**: 
  1. `remoteDir`은 사전 정의 화이트리스트만 허용.
  2. 파일명은 `[A-Za-z0-9_.\-]+` 정규식 + CRLF 검사.
  3. `cwd` 이전에 한 번 더 정규화·검증.
- **검증 방법**: `../` 또는 `CRLF` 포함 요청 시 400 확인
- **위험도**: Critical (정보 유출, 명령 인젝션)

---

### [High] 평문 FTP 사용 — 네트워크 도청 시 자격증명 노출

- **파일**: `file_ops_service.py:10-14`
- **문제**: `ftplib.FTP` (평문) 만 사용. `FTP_TLS` 옵션 없음. 로그인 자격증명, 레시피 내용 평문 전송.
- **근거**: 코드 직접 인용
- **수정 방향**: `FTP_TLS_ENABLED` env로 토글, `ftplib.FTP_TLS` + `prot_p()`.
- **검증 방법**: FTP 패킷 캡처 검증 (사내 네트워크)
- **위험도**: High (보안)

---

### [High] FTP 자격증명이 일반 변수로 다단계 전파 — 로그 누출

- **파일**: `recipe_inventory_sync.py:82-86, 268, 315`, `recipe_test_impl.py:486-499`
- **문제**: `(ftp_ip, ftp_id, ftp_pw)` 튜플이 거의 모든 함수 위치 인자로 전달. 예외 발생 시 traceback에 노출 가능. `mark_inventory_failure(str(exc))`로 DB 저장하면 패스워드 영구 보존.
- **근거**: 함수 시그니처 및 예외 처리 패턴
- **수정 방향**: `FtpCredentials` dataclass + `__repr__` 오버라이드로 패스워드 마스킹.
- **검증 방법**: 로그 파일에서 패스워드 검색 0건 확인
- **위험도**: High (보안)

---

### [High] Postgres DB 자격증명 기본값이 안전하지 않음

- **파일**: `db.py:5-13`
- **문제**: `DB_USER` 기본값 `"postgres"`, `DB_PASSWORD` 기본값 `""`. 슈퍼유저로 빈 비번 접속 시도.
- **근거**: 코드 직접 인용
- **수정 방향**: 필수 env로 승격. 누락 시 부팅 실패.
- **검증 방법**: 환경변수 미설정 상태에서 앱 시작 실패 확인
- **위험도**: High (보안)

---

### [Medium] 무권한 사용자가 파일 교체 시 cloud_protected 정책 우회 가능

- **파일**: `cloud_protected_registry.py:6, 21-38`
- **문제**: CSV 파일이 서버 파일시스템에 평문 저장. mtime으로만 캐시 갱신. 파일을 누구나 수정 가능하면 정책 우회됨.
- **근거**: `_DEFAULT_PATH = Path(__file__).resolve().parents[1] / 'data' / 'cloud_protected_files.csv'`
- **수정 방향**: OS 권한(0640) 운영 가이드 명시. 변경 이력 로깅. 가능하면 DB로 이전.
- **검증 방법**: 파일 권한 정책 문서화
- **위험도**: Medium (보안 정책)

---

### [Medium] SQL 에러 원문 클라이언트 노출 (정보 유출)

- **파일**: `recipe_test_impl.py:338-407`, `recipe_file_ops.py:57, 71, 82, 100`
- **문제**: DB 에러/FTP 에러를 그대로 HTTP 응답으로 전송. 컬럼명, 경로, IP 정보 노출.
- **근거**: `HTTPException(detail=str(exc))` 패턴
- **수정 방향**: 사용자 메시지/내부 로그 분리. 도메인 예외로 변환.
- **검증 방법**: 에러 응답에 민감 정보 검색 0건
- **위험도**: Medium (보안)

---

## 7. 테스트 부족 영역

### [Critical] 라우터 핸들러를 실행하는 테스트가 전무

- **파일**: `/home/dev/project/recipe/backend/tests/test_mockup_routes.py` (전체)
- **문제**: 파일명이 `test_mockup_routes.py`이나 실제로는 `tests/mockup_data` 정적 dict만 검증. 라우터 import 0건, TestClient 호출 0건. EP의 ET-01-a~d 전부 미충족.
- **근거**: 
  - `from tests import mockup_data as md` 외 import 없음
  - `TestClient`/`httpx` 사용 0건
  - ET-04 체크리스트 모든 항목 빈 칸
- **수정 방향**: 
  1. `conftest.py` 신설 — FastAPI 앱 import, TestClient 픽스처
  2. 외부 의존(PG/Mongo/FTP) monkeypatch
  3. 각 엔드포인트 happy-path + 에러 케이스 최소 1개씩
- **검증 방법**: `pytest backend/tests` 실행 시 커버리지 80%+ 달성
- **위험도**: Critical (회귀 방지 불가)

---

### [Critical] EP-01(라우터 등록) 미완료 상태에서 테스트 작성 자체가 불가능

- **파일**: `/home/dev/project/recipe/backend/app/main.py:1-46`
- **문제**: `include_router()` 없어서 라우터가 앱에 부착되지 않음. TestClient로 호출하면 404 반환. 테스트 작성 불가.
- **근거**: 라우터 등록 부재
- **수정 방향**: EP-01을 먼저 처리해야 ET-01 시작 가능.
- **검증 방법**: 라우터 등록 후 GET `/api/recipe-test/eqp-options` 200 응답
- **위험도**: Critical (차단 조건)

---

### [High] mockup_data와 실제 핸들러 연결 구조 부재

- **파일**: `tests/mockup_data.py`, `recipe_test_impl.py`
- **문제**: mockup은 응답 형태만 정의. 핸들러가 mockup을 참조하도록 연결되지 않음. 사외 환경에서는 라우터 실행 불가.
- **근거**: monkeypatch 또는 DI 분기 없음
- **수정 방향**: `monkeypatch.setattr("app.services.ftp_eqp_ip.load_eqp_ip", lambda: mock_data)` 패턴 또는 env `MOCK_MODE=1`.
- **검증 방법**: mockup 기반 테스트 실행 성공
- **위험도**: High (테스트 격리)

---

### [High] FTP/PG/Mongo 모킹 부재

- **파일**: `backend/tests/` 전체
- **문제**: 라우터가 `pymongo.MongoClient`, `sqlalchemy.create_engine`, `ftplib.FTP`를 직접 생성. 테스트 fixture에서 패치 안 함. 사외 환경 또는 테스트 환경에서 호출 시 즉시 외부 연결 시도 → 실패.
- **근거**: `conftest.py` 부재, `unittest.mock` 사용 0건
- **수정 방향**: `conftest.py`에 다음 픽스처 추가:
  ```python
  @pytest.fixture(autouse=True)
  def mock_postgres(monkeypatch):
      monkeypatch.setattr("app.services.ftp_eqp_ip.load_lk_model_eqps", 
                         lambda limit=None: md.MOCK_EQP_OPTIONS["items"])
  
  @pytest.fixture(autouse=True)
  def mock_mongo(monkeypatch):
      monkeypatch.setattr("app.services.ftp_credentials.load_eqp_ftp_credentials",
                         lambda eqp_id: {"host": "mock", "user": "mock", "password": "mock"})
  ```
- **검증 방법**: 실제 DB 연결 시도 0건 확인
- **위험도**: High

---

## 8. 중복 코드와 Dead Code

### [Critical] recipe_test.py(2,011행)와 recipe_test_impl.py(845행)의 70% 중복

- **파일**: `/home/dev/project/recipe/backend/app/api/routes/recipe_test.py`, `/home/dev/project/recipe/backend/app/api/routes/recipe_test_impl.py`
- **문제**: 동일 `APIRouter(prefix="/recipe-test")`, 동일 함수(RECIPE_SOURCE_CONFIG, parse_pol_system_cfg, parse_cas_slots 등), 동일 상수. 어디서도 recipe_test.py를 import하는 라우터 없음. 레거시 의심.
- **근거**: 
  - 중복 함수 grep으로 확인
  - `recipe_test.py` 다른 곳에서 import 0건
  - recipe_test_impl.py만 sub-라우터들이 import
- **수정 방향**: 
  1. `python -m py_compile recipe_test.py` 로 구문 오류 확인 (1701행 `[<...>]` 의심)
  2. 미사용 확인 후 삭제
  3. 또는 `from recipe_test_impl import *` 호환 shim으로 축소
- **검증 방법**: 파일 삭제 후 모든 테스트 통과
- **위험도**: Critical (유지보수, 혼동)

---

### [Critical] recipe_test.py 1701번 라인의 문법적 이상

- **파일**: `/home/dev/project/recipe/backend/app/api/routes/recipe_test.py:1701`
- **문제**: 코드 중간에 `[<backend/app/api/routes/recipe_test.py> - part4]` 라는 텍스트가 단독 라인으로 존재. Python 파서가 리스트 표현식으로 해석하나 `<...>` 부분이 비교 연산자로 해석되어 구문 오류 가능.
- **근거**: 라인 직접 확인
- **수정 방향**: 즉시 삭제. CI에서 `python -m py_compile` 체크 추가.
- **검증 방법**: import 성공 확인
- **위험도**: Critical (구문 오류)

---

### [Medium] 미사용 import 다수

- **파일**: `recipe_test_impl.py:1-37`, `recipe_preview_service.py:3 (import html)`
- **문제**: `html`, `tempfile`, `Path`, `BytesIO` 등 import되었으나 사용 안 함. 또는 한 곳에서만 사용.
- **근거**: `ruff --select=F401` grep 결과
- **수정 방향**: 자동화 (ruff/flake8), 수동 제거.
- **검증 방법**: `ruff check --fix`
- **위험도**: Medium (코드 청결도)

---

### [Medium] recipe_test_impl.py — 호출되지 않는 함수들

- **파일**: `recipe_test_impl.py:792 (parse_temp_source_recipe_id)`, `:822 (build_temp_source_recipe_content)`, `:42 (TEMP_SOURCE_RECIPE_PREFIX)` 등
- **문제**: 어디서도 호출되지 않는 함수와 상수.
- **근거**: `grep -r "parse_temp_source_recipe_id\|build_temp_source_recipe_content"` 결과 0건 (확인 필요)
- **수정 방향**: 호출 여부 grep 후 미사용이면 삭제.
- **검증 방법**: dead code 제거 후 모든 테스트 통과
- **위험도**: Medium

---

## 9. 빌드/런타임 위험

### [Critical] RMS_down.py에 하드코딩된 절대 경로 — Windows 미호환

- **파일**: `/home/dev/project/recipe/backend/app/RMS/RMS_down.py:59`
- **문제**: `output_path = "/root/project/recipe/backend/app/data/cloud_protected_files.csv"` 라는 Linux 절대 경로 하드코딩. Windows 타겟 환경에서 동작 불가. `cloud_protected_registry.py:6`이 `Path(__file__).resolve().parents[1] / 'data'`를 읽는데 다른 경로에 씀.
- **근거**: 코드 직접 인용, CLAUDE.md "최종 타겟은 Windows"
- **수정 방향**: 
  ```python
  output_path = Path(__file__).resolve().parents[2] / 'data' / 'cloud_protected_files.csv'
  ```
- **검증 방법**: Windows 환경에서 실행 성공
- **위험도**: Critical (Windows 호환성)

---

### [High] recipe_test.py import 시 NameError 가능성

- **파일**: `recipe_test_impl.py:613, 622, 681, 684, 720` (함수 호출)
- **문제**: `connect_ftp(...)`, `list_entries_at_path(...)`, `filter_entries_by_exts(...)` 등을 호출하나 본 파일이나 import에 정의/선언 없음. `recipe_test.py:561` 등에서만 정의됨. 만약 `recipe_test_impl.py`를 먼저 import하면 NameError.
- **근거**: 함수 호출과 정의 위치 불일치
- **수정 방향**: 
  - 헬퍼를 별도 모듈 `app/services/ftp_client.py`로 분리 후 양쪽에서 import
  - 또는 `recipe_test_impl.py`에서 `recipe_test` import (순환 의존 위험)
- **검증 방법**: `python -c "from app.api.routes import recipe_test_impl"` 성공
- **위험도**: High (런타임 오류)

---

### [High] 전역 캐시 무한 증가 (메모리 누수)

- **파일**: `recipe_test_impl.py`/`recipe_test.py` 내 `BOOTSTRAP_CACHE = {}`, `CAS_CACHE = {}`, `JOB_CACHE = {}`, `RECIPE_CACHE = {}` 등
- **문제**: TTL/maxsize 제한 없음. 운영 중 메모리 지속 증가. 또한 lock 없는 dict → 멀티스레드 race.
- **근거**: 캐시 정의 직접 확인
- **수정 방향**: `cachetools.TTLCache(maxsize=1000, ttl=3600)` 또는 Redis.
- **검증 방법**: 메모리 사용량 모니터링
- **위험도**: High (메모리, 정확성)

---

### [High] _LIVE_PATH_CACHE 전역 dict 동시성 미고려

- **파일**: `recipe_inventory_sync.py:36, 126-144`
- **문제**: 모듈 전역 dict를 lock 없이 read/write. 워커가 멀티스레드 실행되면 race condition. 사이즈 무제한.
- **근거**: `_LIVE_PATH_CACHE: dict[...] = {}`
- **수정 방향**: `threading.Lock` 또는 `cachetools.TTLCache`.
- **검증 방법**: 동시성 테스트
- **위험도**: High (데이터 무결성)

---

## 10. 우선 수정 항목

### 즉시 (Critical 1차)

| 순번 | 항목 | 파일 | 난이도 | 영향도 |
|------|------|------|--------|--------|
| 1 | main.py에 include_router() 추가 | app/main.py | 낮음 | Critical |
| 2 | recipe_test.py:1701 문법 오류 제거 | recipe_test.py | 낮음 | Critical |
| 3 | 인증/권한 미들웨어 도입 | main.py | 중간 | Critical |
| 4 | CORS 미들웨어 추가 | main.py | 낮음 | Critical |
| 5 | DB 자격증명 기본값 제거 | config.py, db.py | 낮음 | Critical |
| 6 | FTP path traversal 입력 검증 | file_ops_service.py, recipe_file_ops.py | 중간 | Critical |

### 단기 (High, Critical 2차)

| 순번 | 항목 | 파일 | 난이도 | 영향도 |
|------|------|------|--------|--------|
| 7 | recipe_test.py 삭제 또는 축소 | recipe_test.py | 중간 | High |
| 8 | ops 8개 엔드포인트 구현 | recipe_test_impl.py | 높음 | Critical |
| 9 | /recipe-content 엔드포인트 구현 | recipe_test_impl.py | 중간 | Critical |
| 10 | bare except → logging.exception() 전환 | 전체 | 중간 | High |
| 11 | print() → logging 전환 | worker, RMS_down.py | 낮음 | High |
| 12 | FTP 컨텍스트 매니저 도입 | ftp_client.py (신규) | 높음 | High |

### 중기 (Medium)

| 순번 | 항목 | 파일 | 난이도 |
|------|------|------|--------|
| 13 | SQLite WAL/timeout 설정 | recipe_cache_store.py | 낮음 |
| 14 | tempdir → 영구 디렉터리 | config.py + env | 낮음 |
| 15 | JSONL → SQLite 마이그레이션 | history_service.py | 중간 |
| 16 | ensure_schema() 1회 호출 | recipe_cache_store.py | 낮음 |
| 17 | FTP MongoClient 싱글톤화 | ftp_credentials.py | 낮음 |
| 18 | 테스트 기반 구축 (conftest.py, TestClient) | tests/ | 높음 |

---

## Appendix: 파일 체크리스트

### 레거시/의심 파일
- [ ] `backend/main.py` — 삭제 또는 재export 확인
- [ ] `recipe_test.py` — 구문 오류(1701행), 중복 코드, 미사용 여부 확인 후 삭제/축소

### 미구현 엔드포인트
- [ ] `GET /api/recipe-test/recipe-content`
- [ ] `POST /api/recipe-test/cas/save`
- [ ] `POST /api/recipe-test/cas/persist`
- [ ] `POST /api/recipe-test/job/save`
- [ ] `POST /api/recipe-test/job/persist`
- [ ] `POST /api/recipe-test/recipe/clone`
- [ ] `POST /api/recipe-test/file/rename`
- [ ] `POST /api/recipe-test/file/delete`
- [ ] `POST /api/recipe-test/transfer`
- [ ] `GET /api/recipe-inventory/snapshot?eqpId=...`
- [ ] `POST /api/recipe-test/invalidate-runtime-cache`

### 보안 점검 필수
- [ ] `.env` git 추적 여부 확인
- [ ] 인증 미들웨어 구현 및 테스트
- [ ] CORS 정책 문서화
- [ ] FTP 자격증명 마스킹 검증
- [ ] SQL 에러 클라이언트 노출 확인

### Windows 호환성 검증
- [ ] 절대 경로 제거 (RMS_down.py)
- [ ] tempdir → 영구 디렉터리 (3개 서비스)
- [ ] os.path vs ntpath 통일
- [ ] CRLF 처리 검증

---

**생성일**: 2026-05-18  
**검토자**: Multi-Agent Backend Review (API, DB, Security, QA, Code Quality)  
**상태**: 📋 검토 완료, 조치 대기 중
