# 풀스택 통합 수정 계획 (Fullstack Integrated Fix Plan)

**기준일**: 2026-05-19
**대상**: `/home/dev/project/recipe` 전체
**기준 문서**:
- `docs/999-CLAUDE-backend-report.md` (BackEnd Critical 10 / High 16 / Medium 5)
- `docs/999-CLAUDE-FrontEnd-report.md` (FrontEnd Critical 2 / High 14 / Medium 26 / Low 20)
- `docs/3-execution-plan.md` (Phase 1-4)

**원칙**:
- 소스 코드 수정 금지 (분석과 계획만 수행)
- 실제 코드 우선 (문서 → 코드)
- 추측 금지 (확인 필요는 명시)
- 기존 기능 보존과 점진적 개선 최우선
- CLAUDE.md 원칙 준수 (Windows 호환성, mockup/real data 분리)

---

## 1. 통합 수정 방향 요약

### 현황 진단

**프로젝트 전체 상태**: 🟠 **부분 동작 (코드 품질·보안 보강 필요)**

| 측면 | 상태 | 근거 |
|------|------|------|
| **API 라우팅** | 🟡 대부분 동작 | `main.py`에 `recipe_test_router`, `recipe_inventory_router` 등록됨. `recipe_test_impl.py`에 `@router.*` 핸들러 16개 존재. 누락은 `POST /api/recipe-test/invalidate-runtime-cache` 1건 |
| **코드 품질** | 🔴 위험 | `recipe_test.py`(2,252행)와 thin wrapper 파일들(`recipe_test_eqp.py` 외 4건) 합계 4,351행 dead code. `recipe_test.py:1146` SyntaxError(`if (!target_norm):`). bare `except Exception: pass` 51건+ |
| **보안** | 🔴 치명적 | 인증/권한 미들웨어 없음, CORS 미설정, FTP 경로 검증 없음(path traversal), DB 자격증명 기본값 fallback |
| **FrontEnd 런타임** | 🟡 주요 기능 동작 | RecipeTestPage.vue(4,358행) 정상 컴파일. `.endsWith()` 사용 정상, `loadHistory()` no-op stub 정의됨(line 370). Critical 잔존 2건은 테스트 러너 미설정과 전역 폰트 미선언 |
| **테스트** | 🔴 전무 | BE: TestClient·monkeypatch 0건. FE: vitest/jest 미설치, *.test/*.spec 파일 0개 |

### 수정 전략의 3가지 원칙

1. **Phase 1 (즉시 차단 해제 + 보안 Critical)**
   - 누락 엔드포인트 1건 추가, SyntaxError 1건 수정, dead code 정리, FE 폰트/테스트 셋업, DB 자격증명·FTP 경로·CORS·인증 기반 마련
   - 예상 기간: 1-2주
   - 영향도: 최고 (보안·코드 정합성·테스트 부재 해소)

2. **Phase 2 (안정화 + 품질)**: 데이터 영속성, 연결 풀, MOCK_MODE 분기, 에러 처리, 테스트 확장
   - 목표: Windows 배포 가능 상태로 만들기
   - 예상 기간: 3-6주

3. **Phase 3-4 (장기 개선)**: 아키텍처 정제(RecipeTestPage 분해, JSONL→SQLite), 성능 최적화, 운영 안정성
   - 목표: 프로덕션 운영 체계 확립
   - 예상 기간: 지속적

---

## 2. FrontEnd/BackEnd 공통 이슈

### 2-1. 코드 구조 정합성 (Architecture)

#### 이슈: dead code 정리 + 누락 엔드포인트 1건 (Architecture-01)
**심각도**: 🔴 Critical
**상태**: Phase 1 필수

**현황**:
- `backend/app/main.py`는 이미 `recipe_test_router`, `recipe_inventory_router`를 `include_router()`로 등록함 → 핸들러 16개 정상 노출
- 누락된 단 1개 엔드포인트: `POST /api/recipe-test/invalidate-runtime-cache` (FE는 호출, BE에는 핸들러 없음 → 404)
- `recipe_test.py`(2,252행)는 `main.py`에 등록되지 않은 dead code이며 동일 로직이 `recipe_test_impl.py`(2,099행)에도 존재함 — 4,351행 중복
- thin wrapper 5종(`recipe_test_eqp.py`, `recipe_test_content.py`, `recipe_test_history.py`, `recipe_test_ops.py`, `recipe_file_ops.py`)도 모두 `main.py`에 미등록 dead code
- `recipe_test.py:1146` `if (!target_norm):` — Python에 `!` 단항 연산자가 없어 `py_compile` 즉시 실패

**수정 계획**:

```
✅ Phase 1 수정 항목 (FIX-ARCH-01)

- [ ] Step 1: invalidate-runtime-cache 핸들러 추가
  파일: app/api/routes/recipe_test_impl.py
  구현:
    class InvalidateCacheRequest(BaseModel):
        eqpId: str

    @router.post("/invalidate-runtime-cache")
    def invalidate_runtime_cache(req: InvalidateCacheRequest):
        for cache in (BOOTSTRAP_CACHE, CAS_CACHE, JOB_CACHE,
                      RECIPE_CACHE, RECIPE_SOURCE_CACHE):
            cache.pop(req.eqpId, None)
        return {"status": "ok", "eqpId": req.eqpId}

- [ ] Step 2: recipe_test.py:1146 SyntaxError 수정 후 파일 삭제 검토
  현재: if (!target_norm):
  수정: if not target_norm:
  추가 조치: recipe_test.py는 main.py에 등록되지 않은 dead code → 수정 후 삭제

- [ ] Step 3: thin wrapper 5종 삭제 (dead code 제거)
  - app/api/routes/recipe_test_eqp.py
  - app/api/routes/recipe_test_content.py
  - app/api/routes/recipe_test_history.py
  - app/api/routes/recipe_test_ops.py
  - app/api/routes/recipe_file_ops.py
  근거: 모두 main.py에 미등록, recipe_test_impl.py가 실제 핸들러 보유

- [ ] Step 4: backend/main.py vs backend/app/main.py 이중 진입점 정리
  backend/main.py는 라우터 미등록 레거시. 삭제 또는 `from app.main import app`으로 축소
```

**검증 방법**:
```bash
# 1) 누락 엔드포인트 동작 확인
curl -X POST http://localhost:8000/api/recipe-test/invalidate-runtime-cache \
  -H "Content-Type: application/json" \
  -d '{"eqpId":"EQP001"}'
# 기대: 200 {"status":"ok","eqpId":"EQP001"}

# 2) SyntaxError 해소 확인
python -m py_compile backend/app/api/routes/recipe_test.py
# 기대: 성공 (또는 파일 자체 삭제됨)

# 3) dead code 삭제 확인
ls backend/app/api/routes/ | grep -E '(recipe_test_eqp|recipe_test_content|recipe_test_history|recipe_test_ops|recipe_file_ops)\.py'
# 기대: 출력 없음
```

**위험도**: 낮음 (dead code 삭제는 노출 라우트에 영향 없음, 신규 핸들러 1개는 독립 동작)
**예상 기간**: 4-6 시간

---

### 2-2. FrontEnd Critical 2건 (Error & Setup)

#### 이슈: 테스트 러너 전무 + 전역 폰트 미선언
**심각도**: 🔴 Critical
**상태**: FrontEnd 독립 수정 가능

> 구버전 보고서에 명시되었던 다음 항목들은 실제 코드 확인 결과 존재하지 않으므로 본 계획에서 제외했다:
> - `.endswith()` 오타 6곳 (실제 코드는 모두 `.endsWith()`)
> - `loadHistory()` 미정의 (RecipeTestPage.vue:370에 no-op stub 정의됨)
> - `Pel백엔드 포맷 유지` 한글 텍스트 (코드에 없음)
> - `compress_output_matrix` 식별자 오염 (코드에 없음)

```
✅ FrontEnd Phase 1 수정 항목 (FIX-ERROR-01)

1. [ ] C-FE-01: 테스트 러너 미설정
   - 파일: frontend/package.json, frontend/vite.config.ts
   - 현황: test 스크립트 없음, vitest/jest 미설치, *.test/*.spec 파일 0개
   - Phase 1: vitest @vue/test-utils jsdom 설치 + scripts/test/typecheck 추가
     npm install -D vitest @vue/test-utils jsdom
     "scripts": {
       "test": "vitest run",
       "dev:test": "vitest",
       "typecheck": "vue-tsc --noEmit"
     }
   - Phase 2: 순수 함수(stripFileExt, displayJobName, displayRecipeName,
     naturalCompare 등) 단위 테스트 작성
   - 예상 기간: Phase 1은 4시간, Phase 2는 진행형

2. [ ] C-FE-02: 전역 폰트 미선언
   - 파일: frontend/index.html (head)
   - 현황: lang="en", body font-family 선언 없음 (13줄짜리 minimal HTML)
   - 수정 (옵션 A, index.html 직접 수정):
     <html lang="ko">
       <head>
         <style>
           body {
             font-family: 'Tahoma', 'Arial', 'MS Sans Serif', sans-serif;
             font-size: 13px;
             background: #c0c0c0;
           }
         </style>
       </head>
   - 수정 (옵션 B, 권장): frontend/src/style.css 생성 후 main.ts에서 import
   - 검증: 브라우저 DevTools > Computed > font-family 확인
   - 예상 기간: 2시간
```

**검증 방법**:
```bash
# 빌드 / 타입 검사
npm run build
npm run typecheck

# 테스트 러너 실행
npm test

# 폰트 적용 확인 (브라우저)
# DevTools > Computed에서 body font-family가 Tahoma/Arial 계열인지 확인
```

**위험도**: 낮음
**예상 기간**: Phase 1은 1일

---

## 3. API 계약 정합성

### 3-1. 엔드포인트 인벤토리 (현재 상태)

| 영역 | 상태 |
|------|------|
| `recipe_test_impl.py`에 `@router.*` 핸들러 16개 | ✅ 구현됨 (main.py에 include_router로 등록) |
| `recipe_inventory.py` 핸들러 | ✅ 구현됨 |
| `POST /api/recipe-test/invalidate-runtime-cache` | ❌ 미구현 (FE는 호출, 404) — Architecture-01 Step 1에서 해결 |

### 3-2. 수정 계획

```
✅ Phase 1 API 계약 수정 (FIX-API-01)

- [ ] invalidate-runtime-cache 핸들러 1건 추가 (Architecture-01 Step 1과 동일)

확인 완료 사항:
- recipe_test_impl.py에 GET/POST 핸들러 16개 정상 정의됨
- main.py에서 recipe_test_router, recipe_inventory_router 등록됨
- FE recipeTestApi.ts가 호출하는 경로들 대부분 200 응답 가능
```

**검증 방법**:
```bash
# FastAPI 라우트 목록 확인
python -c "
from app.main import app
for r in app.routes:
    if hasattr(r, 'methods'):
        print(r.methods, r.path)
" | grep recipe
```

**위험도**: 낮음
**예상 기간**: 1시간 (핸들러 1개 추가)

---

## 4. DB/데이터 흐름 수정 계획

### 4-1. 데이터 영속성

#### 이슈: tempdir 기반 영속 데이터 (Persist-01)
**심각도**: 🟡 Medium → 운영상 🟠 High
**관련**: BE M-01

```
✅ Phase 2 수정 항목 (FIX-PERSIST-01)

- [ ] backend/app/services/temp_file_store.py 수정
  현재: LOCAL_EDIT_BASE = Path(tempfile.gettempdir()) / 'recipe_test_edit'
  수정 후:
    import os
    _DATA_DIR = Path(os.getenv('RECIPE_DATA_DIR',
                               str(Path(tempfile.gettempdir()))
                               if os.name != 'nt'
                               else r'C:\ProgramData\RecipeRMS'))
    LOCAL_EDIT_BASE = _DATA_DIR / 'recipe_test_edit'

- [ ] recipe_cache_store.py, history_service.py에도 동일 RECIPE_DATA_DIR 적용

- [ ] backend/.env.example에 RECIPE_DATA_DIR 추가
  RECIPE_DATA_DIR=/opt/recipe-rms/data  # Linux
  RECIPE_DATA_DIR=C:\ProgramData\RecipeRMS  # Windows

- [ ] docs/windows-deployment-guide.md 업데이트
  - RECIPE_DATA_DIR 설정 방법
  - 기존 임시 파일 이관 절차

작업량: 3-4시간
예상 기간: Phase 2 초기
```

#### 이슈: JSONL 이력 동시성 + O(N) 읽기 (Persist-02)
**심각도**: 🟠 High (BE H-10)

```
✅ Phase 2 (단기) + Phase 3 (장기) 수정 항목 (FIX-PERSIST-02)

Option A (Phase 2, 단기): 파일 잠금
- [ ] filelock 라이브러리 도입
  from filelock import FileLock
  with FileLock(str(history_file) + '.lock'):
      with open(history_file, 'a', encoding='utf-8') as f: ...
- 예상 기간: 2시간

Option B (Phase 3, 권장 장기): SQLite 이관 (ERD §12.5 권고)
- [ ] recipe_cache_store에 recipe_action_history 테이블 추가
- [ ] history_service.append_history_entry()를 SQLite INSERT로 교체
- [ ] 기존 .jsonl 파일을 migration 스크립트로 일괄 삽입
- 예상 기간: 3-4시간
```

#### 이슈: SQLite WAL 미설정 + ensure_schema() 매 호출 (Persist-03)
**심각도**: 🟠 High (BE H-08, H-09)

```
✅ Phase 1-2 수정 항목 (FIX-PERSIST-03)

- [ ] recipe_cache_store.py 리팩토링
  현재: 공개 함수마다 ensure_schema() 호출 → CREATE TABLE IF NOT EXISTS 반복
  수정:
    _schema_initialized = False
    def _ensure_schema_once():
        global _schema_initialized
        if not _schema_initialized:
            _ensure_schema()
            _schema_initialized = True

- [ ] WAL 모드 + busy_timeout 설정
  def _connect():
      conn = sqlite3.connect(...)
      conn.execute('PRAGMA journal_mode=WAL')
      conn.execute('PRAGMA synchronous=NORMAL')
      conn.execute('PRAGMA busy_timeout=5000')
      return conn

예상 기간: 2-3시간
```

---

### 4-2. 데이터베이스 연결 풀링

#### 이슈: PostgreSQL per-request create_engine (Connectivity-01, BE H-06)

```
✅ Phase 2 수정 항목 (FIX-CONNECTIVITY-01)

파일: backend/app/services/ftp_eqp_ip.py
현황: 함수 내부에서 create_engine() → 매 호출마다 신규 engine

수정:
- [ ] 모듈 수준 싱글톤 engine
  _engine = None
  def get_engine():
      global _engine
      if _engine is None:
          _engine = create_engine(POSTGRES_URL, poolclass=QueuePool,
                                  pool_size=10, max_overflow=20)
      return _engine

- [ ] db.py(psycopg 직접)와 ftp_eqp_ip.py(SQLAlchemy) PostgreSQL 접근 방식 통일

- [ ] FastAPI lifespan에서 engine.dispose()

예상 기간: 3-4시간
```

#### 이슈: MongoDB per-request MongoClient (Connectivity-02, BE H-07)

```
✅ Phase 2 수정 항목 (FIX-CONNECTIVITY-02)

파일: backend/app/services/ftp_credentials.py, ftp_eqp_ip.py
현황: 매 호출마다 MongoClient() 생성·close()

수정:
- [ ] 모듈 수준 싱글톤 MongoClient + FastAPI lifespan cleanup
- [ ] ADDCMP.FTP_STATUS 컬렉션 접근 중복 코드 통합 → shared/services/mongo_client.py

예상 기간: 2시간
```

---

## 5. 환경 설정 / Mockup / Real Data 대응

### 5-1. MOCK_MODE 환경변수 기반 분기

```
✅ Phase 1-2 수정 항목 (FIX-MOCKUP-01)

1. [ ] backend/app/config.py에 MOCK_MODE 플래그 추가
   MOCK_MODE: bool = os.getenv('MOCK_MODE', '0') == '1'

2. [ ] 서비스 계층 분기
   - ftp_eqp_ip.load_lk_model_eqps(): MOCK_MODE면 mockup_data 반환
   - file_ops_service.connect_ftp(): MOCK_MODE면 MockFTP 반환
   - history_service.list_history_entries(): MOCK_MODE면 mockup 반환

3. [ ] conftest.py 신설 (사외 환경 테스트용)
   @pytest.fixture(autouse=True)
   def mock_dependencies(monkeypatch):
       monkeypatch.setenv('MOCK_MODE', '1')
       monkeypatch.setattr('app.services.ftp_eqp_ip.load_lk_model_eqps',
                           lambda: mockup_data.MOCK_EQP_OPTIONS['items'])

4. [ ] .env (개발, MOCK_MODE=1) vs .env.prod (사내, MOCK_MODE=0) 분리

예상 기간: Phase 1은 4시간, Phase 2는 테스트 작성 진행형
```

### 5-2. FrontEnd API 에러 처리 개선 (FE H-FE-09)

```
✅ Phase 1-2 수정 항목 (FIX-MOCKUP-02)

파일: frontend/src/features/recipe_test/api/recipeTestApi.ts:121~148 http() 함수

현황:
- catch (err: any) — any 타입
- 500 에러로 HTML 반환 시 KB 단위 텍스트가 Error.message에 그대로 담김
- 60초 일괄 타임아웃 → FTP 전송 등 장시간 호출에 부적합

수정:
- [ ] ApiError 클래스 정의
  class ApiError extends Error {
    constructor(message: string, public status: number, public payload?: unknown) {
      super(message)
    }
  }

- [ ] http<T>() 개선
  - JSON detail 우선 추출 후 .slice(0, 200)으로 절단
  - 호출별 timeout 옵션 받기
  - ApiError로 throw하여 호출자가 status 분기

- [ ] invalidateRuntimeCache(), getInventoryRecipeSnapshot() 호출부에서 graceful fallback

예상 기간: 2-3시간
```

---

## 6. 보안 / 에러 처리 / 로깅

### 6-1. Critical 보안 패치 (즉시)

```
✅ Phase 1 보안 수정 (FIX-SEC-01)

1. [ ] C-06: CORS 미들웨어 추가
   파일: backend/app/main.py
   from fastapi.middleware.cors import CORSMiddleware
   app.add_middleware(
       CORSMiddleware,
       allow_origins=os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(','),
       allow_credentials=True,
       allow_methods=['GET', 'POST'],
       allow_headers=['*'],
   )
   예상 기간: 1시간

2. [ ] C-07: FTP Path Traversal 방지
   파일: backend/app/services/file_ops_service.py, recipe_file_ops 경유 핸들러
   - 파일명 정규식: SAFE_FILENAME_RE = re.compile(r'^[A-Za-z0-9_.\-]+$')
   - remoteDir 화이트리스트: CAS/JOB/RECIPE 기본 경로 prefix 검증
   - ftp.cwd() 호출 전 validate_filename / validate_remote_dir 호출
   예상 기간: 3-4시간

3. [ ] C-10: DB 자격증명 기본값 fallback 제거
   파일: backend/db.py, backend/app/config.py
   - MONGO_URL, POSTGRES_URL, DB_PASSWORD 기본값 삭제
   - 시작 시 누락이면 RuntimeError 발생
   예상 기간: 1시간

4. [ ] C-08: RMS_down.py 하드코딩 절대경로 수정
   파일: backend/app/RMS/RMS_down.py:59
   현재: output_path = "/root/project/recipe/backend/app/data/..."
   수정: Path(__file__).resolve().parents[2] / 'data' / 'cloud_protected_files.csv'
   예상 기간: 30분

5. [ ] H-14: FtpCredential dataclass + __repr__ 마스킹
   현재: (ftp_ip, ftp_id, ftp_pw) 튜플이 traceback에 비밀번호 노출
   수정:
     @dataclass(frozen=True)
     class FtpCredentials:
         host: str; user: str; password: str
         def __repr__(self): return f'FtpCredentials(host={self.host!r}, user=***, password=***)'
   - mark_inventory_failure(str(exc)) 호출 시 자격증명 패턴 제거(re.sub)
   예상 기간: 2시간
```

### 6-2. High 우선순위 보안

```
✅ Phase 2 보안 수정 (FIX-SEC-02)

1. [ ] C-05: 인증/권한 미들웨어 도입
   파일: backend/app/dependencies/auth.py (신규)
   - 사내 인증 또는 API Key 기반 Depends 미들웨어
   - actorName/actorTeam을 클라이언트 임의 지정 차단 → 인증 토큰에서 추출
   예상 기간: 1-2일

2. [ ] C-04: bare except → logging 전환 (51건+)
   파일: recipe_test_impl.py 34건, file_ops_service.py 11건, recipe_inventory_sync.py 6건
   수정:
     except ftplib.all_errors as e:
         logger.exception("FTP error")
     except Exception:
         logger.exception("Unexpected error")
         raise
   예상 기간: 1-2일

3. [ ] H-13: FTP_TLS 옵션 토글
   파일: file_ops_service.py
   - FTP_TLS_ENABLED env로 ftplib.FTP_TLS + prot_p() 사용 여부 결정
   예상 기간: 2시간

4. [ ] M-02: HTTPException(detail=str(exc)) 외부 노출 차단
   - 내부 로그(logger.exception)와 외부 메시지("Internal server error") 분리
   예상 기간: 2시간
```

---

## 7. 테스트 / 검증

### 7-1. 테스트 프레임워크 셋업

```
✅ Phase 1-2 수정 항목 (FIX-TEST-01)

BackEnd:
1. [ ] backend/tests/conftest.py 신설
   import pytest
   from fastapi.testclient import TestClient
   from app.main import app

   @pytest.fixture
   def client():
       return TestClient(app)

   @pytest.fixture(autouse=True)
   def mock_dependencies(monkeypatch):
       monkeypatch.setenv('MOCK_MODE', '1')
       monkeypatch.setattr('app.services.ftp_eqp_ip.load_lk_model_eqps',
                           lambda: mockup_data.MOCK_EQP_OPTIONS['items'])

2. [ ] backend/tests/test_api_routes.py 신설 (라우터 핸들러 happy-path)
   def test_get_eqp_options(client):
       resp = client.get('/api/recipe-test/eqp-options')
       assert resp.status_code == 200
   def test_post_invalidate_cache(client):
       resp = client.post('/api/recipe-test/invalidate-runtime-cache',
                           json={'eqpId': 'EQP001'})
       assert resp.status_code == 200

3. [ ] pytest 설정 (pyproject.toml 또는 pytest.ini)
   markers:
     integration: 실제 DB 연결 (사내 환경만)

예상 기간: 4-6시간

FrontEnd:
1. [ ] vitest + @vue/test-utils + jsdom 설치
2. [ ] vite.config.ts에 vitest test 설정 (environment: jsdom)
3. [ ] package.json scripts 추가: test, test:ui, coverage
4. [ ] 순수 함수 단위 테스트부터 작성
   - stripFileExt.spec.ts, displayJobName.spec.ts, naturalCompare.spec.ts

예상 기간: 4-6시간
```

### 7-2. CI/CD 검증 게이트

```
✅ Phase 2 수정 항목 (FIX-TEST-02)

.github/workflows/ci.yml (신규):

1. [ ] 빌드: python -m py_compile, npm run build, vue-tsc --noEmit
2. [ ] 린트: ruff check backend/, eslint frontend/src/
3. [ ] 테스트: pytest -m 'not integration' --cov, npm test
4. [ ] 보안 스캔: bandit, grep 자격증명 패턴, windows-compatibility-check.py
5. [ ] Windows 호환성: 경로 260자, CRLF, encoding='utf-8' 검사

예상 기간: 1-2일
```

---

## 8. Phase별 수정 체크리스트

### Phase 1: 즉시 차단 해제 + 보안 Critical (1-2주)

**목표**: 누락 엔드포인트 1건 추가, dead code/SyntaxError 정리, 보안 Critical 즉시 조치, 테스트 셋업

```
🔴 CRITICAL (BE):
- [ ] C-01 / ARCH-01-Step1: invalidate-runtime-cache 핸들러 추가
  파일: recipe_test_impl.py
  예상: 1시간
  검증: curl POST → 200

- [ ] C-02 / ARCH-01-Step2: recipe_test.py:1146 SyntaxError 수정 후 삭제
  예상: 30분
  검증: py_compile 성공 또는 파일 자체 삭제

- [ ] C-03 / H-16 / ARCH-01-Step3: thin wrapper 5종 + recipe_test.py 삭제
  예상: 1시간
  검증: main.py에 미등록 dead code 0건

- [ ] C-06 / SEC-01-1: CORS 미들웨어 추가
  예상: 1시간

- [ ] C-07 / SEC-01-2: FTP path traversal 검증
  예상: 3-4시간

- [ ] C-10 / SEC-01-3: DB 자격증명 기본값 제거
  예상: 1시간

- [ ] C-08 / SEC-01-4: RMS_down.py 절대경로 수정
  예상: 30분

🔴 CRITICAL (FE):
- [ ] C-FE-01: vitest/jest 셋업
  예상: 4시간

- [ ] C-FE-02: 전역 폰트 선언
  예상: 2시간

🟠 HIGH (병렬 가능):
- [ ] H-01: backend/main.py 레거시 정리
  예상: 1시간

- [ ] H-14 / SEC-01-5: FtpCredential dataclass + 자격증명 마스킹
  예상: 2시간

- [ ] M-03: cloud_protected_registry 시그니처 정합화
  예상: 1시간

- [ ] H-FE-09 / MOCKUP-02: recipeTestApi http() 에러 처리
  예상: 2-3시간

- [ ] TEST-01: conftest.py + 기본 라우터 happy-path 테스트
  예상: 4-6시간

총 예상: 1-2주 (병렬 시 1주)
```

### Phase 2: 안정화 (3-4주)

```
- [ ] C-04: bare except → logging (51건+)
- [ ] C-05: 인증/권한 미들웨어 도입
- [ ] PERSIST-01: RECIPE_DATA_DIR 환경변수 (temp_file_store / history_service / recipe_cache_store)
- [ ] PERSIST-02-A: history 파일 잠금 (filelock)
- [ ] PERSIST-03: ensure_schema 1회 실행 + WAL/busy_timeout
- [ ] CONNECTIVITY-01: PostgreSQL 커넥션 풀 + lifespan
- [ ] CONNECTIVITY-02: MongoDB 싱글톤 + 중복 제거
- [ ] MOCKUP-01: MOCK_MODE 환경변수 + 서비스 분기
- [ ] H-13: FTP_TLS 옵션
- [ ] M-02: HTTPException detail 내부/외부 분리
- [ ] H-FE-04: window.alert(25곳) → notify composable
- [ ] H-FE-10: Win97ConfirmDialog ARIA + 포커스 트랩 + Escape
- [ ] TEST-02: CI/CD 검증 게이트

총 예상: 3-4주
```

### Phase 3: 품질 향상 (4-6주)

```
- [ ] H-FE-01: RecipeTestPage.vue(4,358행) composable 분해
- [ ] H-FE-08: CasFileListPanel / JobFileListPanel 통합
- [ ] H-FE-05: features/history → shared/api/historyApi로 이동 (피처 의존성 제거)
- [ ] H-FE-06: reactive Set → ref/배열 + computed
- [ ] H-FE-07: skipWatch flag → watchPausable
- [ ] PERSIST-02-B: JSONL → SQLite recipe_action_history 이관
- [ ] H-03: FtpSession 컨텍스트 매니저 도입
- [ ] H-04: eqp_master_options 4중 fallback 제거 (information_schema 1회 확인)
- [ ] H-05: get_inventory_entry N+1 → WHERE 직접 쿼리
- [ ] H-FE-03: SPA fallback 또는 hash 모드
- [ ] Windows-01: 배포 스크립트 (backup.bat, start.bat)
- [ ] Windows-02: 경로/인코딩 호환성 전수 검사

총 예상: 4-6주
```

### Phase 4: 장기 개선 (지속적)

```
- [ ] RBAC, 감사 로깅, OAuth2/MFA
- [ ] H-15: 전역 캐시 TTL/상한 (cachetools.TTLCache 또는 Redis)
- [ ] H-11: print() → logging.RotatingFileHandler
- [ ] BE/FE 커버리지 80%+
- [ ] 성능 기준선 대시보드
- [ ] UI 디자인 톤 최종 결정 (Win97 vs 현대)
- [ ] API 문서화 (Swagger/OpenAPI)
```

---

## 9. 파일별 수정 대상

### BackEnd

| 파일 | 현 상태 | Phase | 우선 | 수정 내용 |
|------|--------|-------|------|---------|
| `app/main.py` | 라우터 등록 완료, CORS/인증 미설정 | 1-2 | 🔴 C | CORS, 인증 미들웨어, lifespan(DB 풀 cleanup) 추가 |
| `app/api/routes/recipe_test_impl.py` | 핸들러 16개 정상, invalidate-runtime-cache 누락 | 1 | 🔴 C | invalidate-runtime-cache 핸들러 추가, bare except 정리 |
| `app/api/routes/recipe_test.py` | dead code 2,252행, line 1146 SyntaxError | 1 | 🔴 C | 삭제 (또는 SyntaxError 수정 후 삭제) |
| `app/api/routes/recipe_test_eqp.py` | dead code (thin wrapper, main.py 미등록) | 1 | 🔴 C | 삭제 |
| `app/api/routes/recipe_test_content.py` | dead code | 1 | 🔴 C | 삭제 |
| `app/api/routes/recipe_test_history.py` | dead code | 1 | 🔴 C | 삭제 |
| `app/api/routes/recipe_test_ops.py` | dead code | 1 | 🔴 C | 삭제 |
| `app/api/routes/recipe_file_ops.py` | dead code | 1 | 🔴 C | 삭제 |
| `app/services/file_ops_service.py` | 경로 검증 없음, bare except 11건 | 1 | 🔴 C | path traversal 방지, logging |
| `app/services/recipe_inventory_sync.py` | 자격증명 다단계 전파, bare except 6건 | 1-2 | 🟠 H | FtpCredentials dataclass, logging |
| `app/services/temp_file_store.py` | tempdir 고정 | 2 | 🟠 H | RECIPE_DATA_DIR 환경변수 |
| `app/services/recipe_cache_store.py` | ensure_schema 과다, WAL 미설정, N+1 | 2 | 🟠 H | 1회 ensure + WAL + 직접 쿼리 |
| `app/services/history_service.py` | JSONL 동시성 + O(N) | 2-3 | 🟠 H | filelock(단기) → SQLite 이관(장기) |
| `app/services/ftp_eqp_ip.py` | per-request engine | 2 | 🟠 H | SQLAlchemy 싱글톤 |
| `app/services/ftp_credentials.py` | per-request MongoClient | 2 | 🟠 H | MongoClient 싱글톤 |
| `app/config.py` | MOCK_MODE 없음, DB URL 기본값 위험 | 1-2 | 🔴 C | MOCK_MODE 분기, 필수 env validation |
| `db.py` | DB_PASSWORD 기본값 "" | 1 | 🔴 C | 기본값 제거, 시작 시 RuntimeError |
| `backend/main.py` | 라우터 미등록 레거시 진입점 | 1 | 🟠 H | 삭제 또는 `from app.main import app` |
| `app/RMS/RMS_down.py` | 하드코딩 Linux 절대경로 | 1 | 🔴 C | Path(__file__) 기반 |
| `tools/recipe_inventory_worker.py` | print() 기반 로깅 | 3-4 | 🟢 L | logging.RotatingFileHandler |
| `tests/conftest.py` | 미존재 | 1 | 🟠 H | TestClient + monkeypatch fixture |

### FrontEnd

| 파일 | 현 상태 | Phase | 우선 | 수정 내용 |
|------|--------|-------|------|---------|
| `index.html` | 폰트/lang 미선언 (13줄) | 1 | 🔴 C | lang="ko", body font-family 추가 |
| `package.json` | test 스크립트 없음 | 1 | 🔴 C | vitest 설치 + scripts |
| `pages/RecipeTestPage.vue` | 4,358행 단일 파일, window.alert 25곳 | 1-3 | 🟠 H | Phase 1은 그대로, Phase 3에서 composable 분해 |
| `api/recipeTestApi.ts` | http() line 121~148 에러 처리 미흡 | 1 | 🟠 H | ApiError 정의, 호출별 timeout |
| `components/TopBarNav.vue` | 디자인 톤 충돌 | 2 | 🟠 H | Win97 또는 현대 통일 |
| `components/Win97ConfirmDialog.vue` | ARIA 미구현 | 2 | 🟠 H | role/aria-modal, 포커스 트랩, Escape |
| `components/CasFileListPanel.vue` | JobFileListPanel과 90% 중복 | 3 | 🟡 M | 공통 FileListPanel + 슬롯 |
| `features/history/pages/MyHistoryPage.vue` | recipe_test 직접 import | 3 | 🟠 H | shared/api/historyApi로 이동 |
| `router/index.ts` | createWebHistory base 없음 | 3 | 🟠 H | SPA fallback 또는 hash 모드 |

---

## 10. 우선순위 × 위험도 매트릭스

```
Critical (🔴 즉시):
- C-01 (invalidate-runtime-cache) — 1시간
- C-02 (recipe_test.py SyntaxError) + C-03 (dead code 삭제) — 1-2시간
- C-06 (CORS) — 1시간
- C-07 (FTP path traversal) — 3-4시간
- C-10 (DB 자격증명) — 1시간
- C-FE-01 (vitest 셋업) — 4시간
- C-FE-02 (전역 폰트) — 2시간

High (🟠 단기 1-2주):
- C-04 (bare except 51건+) — 1-2일
- C-05 (인증) — 1-2일
- PERSIST-01/03 (RECIPE_DATA_DIR + WAL) — 5-7시간
- CONNECTIVITY-01,02 (DB 풀) — 5-6시간
- H-FE-04 (window.alert → notify) — 1-2일
- H-FE-09 (ApiError) — 2-3시간

Medium (🟡 중기 2-4주):
- H-FE-01 (RecipeTestPage 분해) — 1-2주
- H-FE-08 (FileListPanel 통합) — 3-4일
- TEST-01 (테스트 작성) — 1주
- UI 톤 통일 — 3-4일

Low (🟢 장기):
- H-15 (전역 캐시 TTL)
- API 문서화
- 성능 대시보드
```

---

## 11. 롤백 전략

### 11-1. 변경 전 백업

```
✅ 각 Phase 시작 전:

- [ ] backup.bat 실행 (docs/windows-deployment-guide.md 참조)
  구성: .env, SQLite 파일, 이력 JSONL, cloud_protected_files.csv
  위치: C:\Backup\RecipeRMS\YYYYMMDD
  검증: 백업 파일 체크섬

- [ ] Git branch 생성
  git checkout -b phase-1-critical-fix
```

### 11-2. Phase별 롤백

#### Phase 1 롤백 (코드 정리 + 보안)

**변경 범위**: dead code 삭제, 핸들러 1개 추가, FE 폰트/테스트 셋업, CORS/path validation/DB 자격증명

```
1. [ ] git revert <commits> → git push
2. [ ] 데이터 롤백 불필요 (코드 변경만)
3. [ ] 서비스 재시작
4. [ ] 헬스체크
   curl POST /api/recipe-test/invalidate-runtime-cache → 롤백 후 404 (원래 상태)
   curl /api/recipe-test/eqp-options → 200 유지 (등록 라우터는 영향 없음)
```

**예상 복구 시간**: 15분

#### Phase 2 롤백 (데이터 영속성 + 풀)

```
1. [ ] DB 데이터 롤백 (SQLite 백업본 복원)
2. [ ] .env 백업본 교체
3. [ ] git revert
4. [ ] 서비스 재시작
5. [ ] 데이터 검증 (recipe_action_history 건수 비교)
```

**예상 복구 시간**: 30분

#### Phase 3 롤백 (아키텍처)

```
1. [ ] git revert (RecipeTestPage 분해 이전)
2. [ ] npm run build → frontend/dist 재배포
3. [ ] 브라우저 캐시 무효화 (cache-busting hash)
```

**예상 복구 시간**: 10분

---

## 12. 완료 기준

### Phase 1 완료 기준 (즉시 차단 해제 + 보안)

**필수**:
- [ ] `POST /api/recipe-test/invalidate-runtime-cache` → 200 응답
- [ ] dead code(recipe_test.py + thin wrapper 5종) 삭제 → `routes/` 디렉터리 정리
- [ ] `python -m py_compile backend/**/*.py` 0건 에러
- [ ] CORS 헤더 정상 응답
- [ ] DB env 누락 시 RuntimeError 발생
- [ ] FTP path traversal 입력 → 403/400

**FrontEnd**:
- [ ] `npm run build`, `npm run typecheck` 성공
- [ ] `npm test` 실행 가능 (최소 1개 테스트 통과)
- [ ] 브라우저 DevTools에서 body font-family가 Tahoma/Arial 계열

**테스트**:
- [ ] BE conftest.py + happy-path 테스트 최소 통과
- [ ] FE vitest 셋업 + stripFileExt 등 순수 함수 1개 테스트 통과

### Phase 2 완료 기준 (안정화)

**데이터**:
- [ ] WAL 모드로 동시 접근 시 `database is locked` 0건
- [ ] history append 동시성에 filelock 적용 후 데이터 손실 0건
- [ ] Windows 재부팅 후 RECIPE_DATA_DIR 영속 데이터 유지

**보안**:
- [ ] 인증 토큰 없으면 401
- [ ] bare except → logging 전환 100% (grep 검증)
- [ ] 로그에 패스워드 노출 0건

**성능**:
- [ ] `/api/recipe-test/eqp-options` < 1초 (캐시 포함)
- [ ] PostgreSQL/MongoDB 커넥션 풀 재사용 확인 (메트릭)

### Phase 3 완료 기준 (품질)

**테스트**:
- [ ] BE 커버리지 ≥ 60%
- [ ] FE 커버리지 ≥ 40%
- [ ] E2E 시나리오 (로드 → 편집 → 저장 → 이력) 통과

**Windows 호환성**:
- [ ] Windows 10/11 + Python 3.9+ 정상 동작
- [ ] 모든 파일 open() encoding='utf-8' 명시
- [ ] 경로 길이 260자 이내
- [ ] CRLF 라인 엔딩 처리

**아키텍처**:
- [ ] RecipeTestPage.vue < 1,000줄 (composable 분해)
- [ ] 피처 간 순환 의존성 0건
- [ ] CasFileListPanel / JobFileListPanel 통합 완료

### Phase 4 완료 기준 (운영)

- [ ] API 문서화 (Swagger/OpenAPI)
- [ ] 성능 기준선 대시보드 (응답 시간, 캐시 hit, 메모리)
- [ ] 보안 감시 알림 (인증 실패 임계치, path traversal 시도)
- [ ] 운영 가이드 (backup/restore/모니터링)

---

## 부록. 주요 파일 변경 요약

### backend/app/api/routes/recipe_test_impl.py

**Before** (해당 라우터에 invalidate-runtime-cache 핸들러 없음):
```python
@router.get("/eqp-options")
def get_eqp_options(...): ...
# ... 16개 핸들러 존재, invalidate-runtime-cache 누락
```

**After**:
```python
class InvalidateCacheRequest(BaseModel):
    eqpId: str

@router.post("/invalidate-runtime-cache")
def invalidate_runtime_cache(req: InvalidateCacheRequest):
    for cache in (BOOTSTRAP_CACHE, CAS_CACHE, JOB_CACHE,
                  RECIPE_CACHE, RECIPE_SOURCE_CACHE):
        cache.pop(req.eqpId, None)
    return {"status": "ok", "eqpId": req.eqpId}
```

### backend/app/api/routes/recipe_test.py

**Before** (line 1146, 2,252행 dead code 파일):
```python
if (!target_norm):  # SyntaxError: ! 단항 연산자 없음
    ...
```

**After**: 파일 자체 삭제 (main.py에 미등록, recipe_test_impl.py와 중복)

### backend/app/main.py

**Before**:
```python
app = FastAPI()
app.include_router(recipe_test_router, prefix="/api/recipe-test")
app.include_router(recipe_inventory_router, prefix="/api/recipe-inventory")
# CORS, 인증 미들웨어 없음
```

**After**:
```python
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(','),
    allow_credentials=True,
    allow_methods=['GET', 'POST'],
    allow_headers=['*'],
)
app.include_router(recipe_test_router, prefix="/api/recipe-test")
app.include_router(recipe_inventory_router, prefix="/api/recipe-inventory")
# Phase 2: 인증 Depends, lifespan(DB 풀 cleanup) 추가
```

### backend/app/services/temp_file_store.py

**Before**:
```python
LOCAL_EDIT_BASE = Path(tempfile.gettempdir()) / 'recipe_test_edit'
```

**After**:
```python
import os
_DATA_DIR = Path(os.getenv('RECIPE_DATA_DIR',
                           str(Path(tempfile.gettempdir())) if os.name != 'nt'
                           else r'C:\ProgramData\RecipeRMS'))
LOCAL_EDIT_BASE = _DATA_DIR / 'recipe_test_edit'
```

### frontend/index.html

**Before** (13줄, lang="en", 폰트 미선언):
```html
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>recipe-ui</title>
  </head>
  <body><div id="app"></div></body>
</html>
```

**After**:
```html
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <title>recipe-ui</title>
    <style>
      body {
        font-family: 'Tahoma', 'Arial', 'MS Sans Serif', sans-serif;
        font-size: 13px;
        background: #c0c0c0;
      }
    </style>
  </head>
  <body><div id="app"></div></body>
</html>
```

### frontend/src/features/recipe_test/api/recipeTestApi.ts

**Before** (line 121~148, catch any, 전역 60초 타임아웃):
```typescript
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 60000)
  try {
    const res = await fetch(...)
    if (!res.ok) throw new Error(await res.text() || 'API request failed')
    return res.json() as Promise<T>
  } catch (err: any) { ... }
}
```

**After**:
```typescript
class ApiError extends Error {
  constructor(message: string, public status: number, public payload?: unknown) {
    super(message)
  }
}

async function http<T>(path: string, init?: RequestInit, timeoutMs = 60000): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(...)
    if (!res.ok) {
      const text = await res.text()
      let detail = text.slice(0, 200)
      try { detail = JSON.parse(text)?.detail ?? detail } catch {}
      throw new ApiError(detail, res.status)
    }
    return res.json() as Promise<T>
  } finally { clearTimeout(timer) }
}
```

---

## 마치며

이 풀스택 수정 계획은:
1. **Phase 1 (1-2주)**: 누락 엔드포인트 1건 + dead code/SyntaxError 정리 + 보안 Critical(CORS, FTP path, DB 자격증명) + FE 폰트/테스트 셋업
2. **Phase 2 (3-4주)**: 안정화 → bare except, 인증, 데이터 영속성(RECIPE_DATA_DIR, WAL), 연결 풀, MOCK_MODE, FE alert/접근성
3. **Phase 3 (4-6주)**: 품질 → RecipeTestPage 분해, FileListPanel 통합, 피처 의존성 제거, JSONL→SQLite 이관, Windows 배포 스크립트
4. **Phase 4 (지속적)**: 운영 → RBAC, 모니터링 대시보드, 캐시 TTL, API 문서화

각 Phase는 **독립적으로 롤백 가능**하며, **기존 동작 보존**을 최우선으로 한다.

기준 문서:
- `docs/999-CLAUDE-backend-report.md` (Critical 10 / High 16 / Medium 5)
- `docs/999-CLAUDE-FrontEnd-report.md` (Critical 2 / High 14 / Medium 26 / Low 20)
- `docs/3-execution-plan.md` (Phase 1-4)
- `CLAUDE.md` (Windows 호환성, mockup/real data 분리)
- `docs/windows-deployment-guide.md` (배포 절차)
