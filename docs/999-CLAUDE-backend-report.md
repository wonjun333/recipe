# Backend Code Review Report

**작성**: 2026-05-19  
**대상**: `/home/dev/project/recipe/backend`

---

## Executive Summary

| 심각도 | 건수 |
|--------|------|
| **Critical** | 10건 |
| **High** | 16건 |
| **Medium** | 5건 |

---

## 1. Critical

### C-01 — invalidate-runtime-cache 엔드포인트 미구현

- **파일**: `app/api/routes/recipe_test_impl.py`
- **문제**: 프런트가 `POST /api/recipe-test/invalidate-runtime-cache`를 호출하지만 핸들러 없음 → 404
- **수정**:
  ```python
  class InvalidateCacheRequest(BaseModel):
      eqpId: str

  @router.post("/invalidate-runtime-cache")
  def invalidate_runtime_cache(req: InvalidateCacheRequest):
      for cache in (BOOTSTRAP_CACHE, CAS_CACHE, JOB_CACHE, RECIPE_CACHE, RECIPE_SOURCE_CACHE):
          cache.pop(req.eqpId, None)
      return {"status": "ok", "eqpId": req.eqpId}
  ```

---

### C-02 — recipe_test.py SyntaxError (import 불가)

- **파일**: `app/api/routes/recipe_test.py:1146`
- **문제**: `if (!target_norm):` — Python에는 `!` 단항 연산자가 없음. `python -m py_compile` 즉시 실패
- **수정**: `if not target_norm:`
- **추가 조치**: recipe_test.py는 main.py에 등록되지 않아 사실상 dead code. 수정 후 삭제 검토.

---

### C-03 — recipe_test.py ↔ recipe_test_impl.py 대규모 중복

- **파일**: `recipe_test.py`(2,252행), `recipe_test_impl.py`(2,099행), 합계 4,351행
- **문제**: 동일 함수(RECIPE_SOURCE_CONFIG, parse_pol_system_cfg, connect_ftp 등), 동일 상수, 동일 prefix. `recipe_test.py`는 main.py에 미등록 — dead code
- **수정**: `recipe_test.py` 삭제. thin wrapper 파일(recipe_test_eqp.py, recipe_test_content.py, recipe_test_history.py, recipe_test_ops.py, recipe_file_ops.py)도 main.py에 미등록이므로 함께 삭제 검토

---

### C-04 — bare `except Exception: pass` 남용

- **파일**: `recipe_test_impl.py` 34건, `file_ops_service.py` 11건, `recipe_inventory_sync.py` 6건 등
- **문제**: 어떤 예외인지 알 수 없음. FTP 장애·디스크 IO 오류가 전부 묻힘
- **수정**:
  ```python
  except ftplib.all_errors as e:
      logger.exception("FTP error: %s", e)
  except Exception:
      logger.exception("Unexpected error")
      raise
  ```

---

### C-05 — 인증/권한 전혀 없음

- **파일**: 모든 라우터
- **문제**: JWT·API Key·Depends 없음. actorName/actorTeam 클라이언트 임의 지정 → 감사 로그 위조 가능
- **수정**: 사내 SSO/API Key 기반 `Depends` 미들웨어 도입

---

### C-06 — CORS 미설정

- **파일**: `app/main.py`
- **문제**: `CORSMiddleware` 미등록. 프런트가 다른 포트에서 호출하면 즉시 CORS 차단
- **수정**:
  ```python
  from fastapi.middleware.cors import CORSMiddleware
  app.add_middleware(
      CORSMiddleware,
      allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
      allow_credentials=True,
      allow_methods=["GET", "POST"],
      allow_headers=["*"],
  )
  ```

---

### C-07 — FTP 경로 입력 무검증 (Path Traversal)

- **파일**: `file_ops_service.py`, `recipe_file_ops.py`
- **문제**: `sourceDir`, `targetDir`, `filenames`가 검증 없이 `ftp.cwd()`, STOR/DELE에 직접 전달. `../../` 경로 조작 가능
- **수정**: 허용 경로 화이트리스트, 파일명 `[A-Za-z0-9_.\-]+` 정규식 검증

---

### C-08 — RMS_down.py 하드코딩 Linux 절대경로

- **파일**: `app/RMS/RMS_down.py:59`
- **문제**: `output_path = "/root/project/recipe/backend/app/data/..."` — Windows 타겟 환경에서 동작 불가
- **수정**: `Path(__file__).resolve().parents[2] / 'data' / 'cloud_protected_files.csv'`

---

### C-09 — 라우터 핸들러 실행 테스트 전무

- **파일**: `tests/test_mockup_routes.py`, `tests/test_api_routes.py`
- **문제**: 정적 dict 구조 검증만 존재. TestClient·monkeypatch 0건. FTP/PG/Mongo 의존성 mocking 없음
- **수정**: `conftest.py` 신설, 외부 의존 monkeypatch, 각 엔드포인트 happy-path 테스트 추가

---

### C-10 — DB 자격증명 기본값 무음 fallback

- **파일**: `app/config.py`, `db.py`
- **문제**: `MONGO_URL` 기본값 `mongodb://127.0.0.1:27017/`, `POSTGRES_URL` 빈 문자열, `DB_PASSWORD` 기본값 `""`. `.env` 누락 시 의도치 않게 로컬 DB 접속 시도
- **수정**: 필수 env 누락 시 앱 시작 단계에서 `RuntimeError` 발생

---

## 2. High

### H-01 — backend/main.py vs backend/app/main.py 진입점 이중화

- **파일**: `backend/main.py`, `backend/app/main.py`
- **문제**: 두 파일 모두 FastAPI 앱 선언. `backend/main.py`는 라우터 미등록 레거시 버전. 배포 시 진입점 혼동
- **수정**: `backend/main.py` 삭제 또는 `from app.main import app`으로 축소

---

### H-02 — 동일 함수 3-4벌 정의 (DRY 위반)

- **파일**: `recipe_test.py`, `recipe_test_impl.py`, `recipe_inventory_sync.py`, `file_ops_service.py`
- **문제**: `connect_ftp`, `parse_pol_system_cfg`, `_normalize_cfg_lines` 등이 파일마다 독립 정의. 버그 수정 시 누락 발생
- **수정**: `app/services/ftp_client.py`, `app/services/text_utils.py`로 공통 분리

---

### H-03 — FTP 연결 매 작업마다 신규 생성

- **파일**: `file_ops_service.py`, `recipe_test_impl.py`
- **문제**: read/write/exists 각각 connect→login→quit. 파일 30개 복사 시 30번 로그인
- **수정**: 컨텍스트 매니저 `FtpSession` 도입 후 작업 묶음 단위로 연결 공유

---

### H-04 — load_eqp_master_options() 4중 fallback 쿼리

- **파일**: `recipe_test_impl.py:335-428`
- **문제**: `eqp_model_bucker`(오타)·`eqp_model_bucket`, `site`·`line_id` 조합으로 4개 쿼리 순차 시도. 매번 최소 1건 PostgreSQL 에러
- **수정**: 앱 시작 시 `information_schema.columns`로 컬럼 존재 여부 1회 확인

---

### H-05 — get_inventory_entry 전체 스캔 (N+1)

- **파일**: `recipe_cache_store.py:236-241`
- **문제**: 단일 name 조회를 전체 목록 SELECT 후 Python 루프로 처리
- **수정**: `WHERE eqp_id=? AND source_path=? AND name=?` 직접 쿼리

---

### H-06 — PostgreSQL 접근 방식 혼재

- **파일**: `db.py`(psycopg 직접 연결), `ftp_eqp_ip.py`(sqlalchemy 매 호출마다 create_engine)
- **문제**: 커넥션 풀 미재사용. 호출마다 TCP 연결 신규 생성
- **수정**: SQLAlchemy 엔진 싱글톤으로 통일, FastAPI lifespan 초기화

---

### H-07 — MongoClient 매 호출마다 생성·해제

- **파일**: `ftp_credentials.py`, `ftp_eqp_ip.py`
- **문제**: 매번 `MongoClient()` 생성 후 `close()`. 내부 커넥션 풀 미재사용
- **수정**: 모듈 수준 싱글톤 또는 FastAPI lifespan DI

---

### H-08 — SQLite WAL 미설정 + 트랜잭션 비원자

- **파일**: `recipe_cache_store.py`
- **문제**: WAL 미설정 → 동시 쓰기 `database is locked`. 파일 기록 후 DB INSERT 중간 실패 시 고아 파일
- **수정**: `PRAGMA journal_mode=WAL`, 파일 임시 저장 후 INSERT 성공 시 rename

---

### H-09 — ensure_schema() 모든 API 호출마다 실행

- **파일**: `recipe_cache_store.py`
- **문제**: 공개 함수 첫 줄마다 CREATE TABLE IF NOT EXISTS + PRAGMA table_info + ALTER. 워커 1 cycle에서 수십 번 메타 쿼리
- **수정**: 모듈 로드 시 1회 실행 또는 `@lru_cache(maxsize=1)`

---

### H-10 — JSONL 이력 파일 동시 쓰기 위험 + O(N) 읽기

- **파일**: `history_service.py`
- **문제**: `open('a')` 동시 append OS 원자성 불확실(Windows 위험). 전체 파일 스캔 후 정렬 O(N log N)
- **수정**: SQLite `recipe_action_history` 테이블로 이관

---

### H-11 — print() 기반 로깅

- **파일**: `tools/recipe_inventory_worker.py`, `app/RMS/RMS_down.py`
- **문제**: 레벨·타임스탬프·요청 ID 없음. 운영 로그 분석 불가
- **수정**: `logging.getLogger(__name__)`, RotatingFileHandler

---

### H-12 — HTTPException(detail=str(exc)) 예외 chain 손실

- **파일**: `recipe_test_impl.py`, `recipe_file_ops.py` 등
- **문제**: `raise ... from e` 미사용. 모든 오류가 HTTP 400으로 반환. FTP 오류·파일 없음·권한 오류 구분 불가
- **수정**: 예외 종류별 status code 분리 (404/422/500), 내부 로그와 사용자 메시지 분리

---

### H-13 — 평문 FTP 사용

- **파일**: `file_ops_service.py`
- **문제**: `ftplib.FTP`만 사용. 자격증명·레시피 내용 평문 전송
- **수정**: `FTP_TLS_ENABLED` env, `ftplib.FTP_TLS` + `prot_p()` 토글

---

### H-14 — FTP 자격증명 다단계 전파

- **파일**: `recipe_test_impl.py`, `recipe_inventory_sync.py`
- **문제**: `(ftp_ip, ftp_id, ftp_pw)` 튜플이 함수 위치 인자로 전달. 예외 traceback에 비밀번호 노출. `mark_inventory_failure(str(exc))`로 DB 영구 저장 가능
- **수정**: `FtpCredential` dataclass + `__repr__` 마스킹

---

### H-15 — 전역 캐시 TTL·상한 없음

- **파일**: `recipe_test_impl.py`
- **문제**: `BOOTSTRAP_CACHE`, `CAS_CACHE`, `JOB_CACHE`, `RECIPE_CACHE`, `RECIPE_SOURCE_CACHE` 무제한 dict. lock 없는 dict → 멀티스레드 race 가능
- **수정**: `cachetools.TTLCache(maxsize=500, ttl=3600)` 또는 Redis

---

### H-16 — thin wrapper 파일들 dead code

- **파일**: `recipe_test_eqp.py`, `recipe_test_content.py`, `recipe_test_history.py`, `recipe_test_ops.py`, `recipe_file_ops.py`
- **문제**: 모두 `recipe_test_impl`을 impl로 import해서 위임. `app/main.py`에 등록되지 않아 실제로 호출되는 경로 없음
- **수정**: 삭제

---

## 3. Medium

### M-01 — 영속 데이터를 tempdir에 저장

- **파일**: `temp_file_store.py`, `recipe_cache_store.py`, `history_service.py`
- **문제**: SQLite, JSONL, raw 파일 모두 `tempfile.gettempdir()` 하위. Windows 재부팅·디스크 정리 시 삭제
- **수정**: `RECIPE_DATA_DIR` env로 영구 경로 지정

---

### M-02 — SQL 에러 원문 클라이언트 노출

- **파일**: `recipe_test_impl.py`, `recipe_file_ops.py`
- **문제**: `HTTPException(detail=str(exc))`로 컬럼명·경로·IP 정보 외부 노출
- **수정**: 도메인 예외로 변환, 내부 로그와 사용자 메시지 분리

---

### M-03 — cloud_protected 시그니처 불일치

- **파일**: `recipe_inventory_sync.py`, `cloud_protected_registry.py`
- **문제**: `is_cloud_protected_file(file_name)` 단일 인자 함수를 `is_cloud_protected_file(eqp_id, source_path, name, source_kind)` 4인자로 호출. `# type: ignore`로 억제 중. 워커 실행 시 TypeError
- **수정**: 호출 시그니처 정합화

---

### M-04 — 미사용 import 다수

- **파일**: `recipe_test_impl.py` 등
- **문제**: `html`, `tempfile` 등 미사용 import
- **수정**: `ruff check --select=F401 --fix`

---

### M-05 — _LIVE_PATH_CACHE 동시성 미고려

- **파일**: `recipe_inventory_sync.py`
- **문제**: 모듈 전역 dict를 lock 없이 read/write. 워커 멀티스레드 시 race condition
- **수정**: `threading.Lock` 또는 `cachetools.TTLCache`

---

## 4. 즉시 수정 순서

| 순번 | 항목 | 파일 | 난이도 |
|------|------|------|--------|
| 1 | C-01: invalidate-runtime-cache 핸들러 추가 | recipe_test_impl.py | 낮음 |
| 2 | C-02: recipe_test.py SyntaxError 수정 후 삭제 | recipe_test.py | 낮음 |
| 3 | C-06: CORS 미들웨어 추가 | app/main.py | 낮음 |
| 4 | C-10: DB 자격증명 기본값 제거 | config.py, db.py | 낮음 |
| 5 | H-16: thin wrapper 파일 삭제 | routes/*.py | 낮음 |
| 6 | H-01: backend/main.py 레거시 삭제 | backend/main.py | 낮음 |
| 7 | C-04: bare except → logging | 전체 | 중간 |
| 8 | C-07: FTP 경로 입력 검증 | file_ops_service.py | 중간 |
| 9 | C-08: RMS_down.py 경로 수정 | RMS_down.py | 낮음 |
| 10 | M-03: cloud_protected 시그니처 수정 | recipe_inventory_sync.py | 낮음 |

---

## 5. 미구현 / 점검 필요

- [ ] `POST /api/recipe-test/invalidate-runtime-cache` — C-01 참조
- [ ] `.env` git 추적 여부 확인
- [ ] 인증 미들웨어 도입 계획 수립 (C-05)
- [ ] `core.recipe_unit` 테이블 실제 존재 여부 확인 (사내 psql)
- [ ] 인벤토리 워커 운영 방식·주기 문서화
