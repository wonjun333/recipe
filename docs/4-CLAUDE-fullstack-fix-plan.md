# 풀스택 통합 수정 계획 (Fullstack Integrated Fix Plan)

**기준일**: 2026-05-18  
**대상**: `/home/dev/project/recipe` 전체  
**기준 문서**: 
- `docs/999-CLAUDE-backend-report.md` (BackEnd 123 이슈)
- `docs/999-CLAUDE-FrontEnd-report.md` (FrontEnd 69 이슈)
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

**프로젝트 전체 상태**: 🔴 **서비스 불가능 (인프라 단계)**

| 측면 | 상태 | 근거 |
|------|------|------|
| **API 라우팅** | 🔴 전면 비동작 | main.py include_router() 0건 → 모든 엔드포인트 404 |
| **핸들러 구현** | 🔴 impl 함수 미구현 | recipe_test_impl.py 16개 호출 함수 전부 미정의 |
| **FrontEnd 기능** | 🟠 부분 동작 불가 | 6개 Critical 런타임 오류(endswith, loadHistory 등) |
| **보안** | 🔴 치명적 | FTP path traversal, 자격증명 노출, 인증 전무 |
| **테스트** | 🔴 전무 | BE 0건, FE 0건, 검증 불가능 |

### 수정 전략의 3가지 원칙

1. **Phase 1 (Critical 차단 해제)**: EP-01(라우터 등록) + impl 함수 + prefix 정정
   - 목표: BE/FE 통신 가능 상태로 만들기
   - 예상 기간: 1-2주
   - 영향도: 최고 (이 없으면 다른 모든 작업 진행 불가)

2. **Phase 2-3 (안정화 + 품질)**: 데이터 영속성, 보안 강화, 테스트 기반 구축
   - 목표: Windows 배포 가능 상태로 만들기
   - 예상 기간: 3-6주

3. **Phase 4 (장기 개선)**: 아키텍처 정제, 성능 최적화, 운영 안정성
   - 목표: 프로덕션 운영 체계 확립
   - 예상 기간: 지속적

---

## 2. FrontEnd/BackEnd 공통 이슈

### 2-1. 아키텍처 계층 단절

#### 이슈: API 계층 전체 비동작 (Architecture-01)
**심각도**: 🔴 Critical  
**상태**: Blocking (Phase 1 필수 선행)

**현황**:
- [ ] BackEnd main.py에 include_router() 호출 없음
  - recipe_test_eqp.router, recipe_test_content.router, recipe_test_history.router
  - recipe_test_ops.router, recipe_file_ops.router, recipe_inventory.router
  - 현재 노출: GET /, GET /api/recipe-units 만 동작
  
- [ ] FrontEnd recipeTestApi.ts가 호출하는 14개 API 경로 모두 404 반환 가능성
  - /api/recipe-test/*, /api/recipe-inventory/*, /api/recipe-file-ops/*

**근본 원인**:
- EP-01 미완료 (실행계획에 "❌ 미완료" 명시)
- recipe_test_impl.py에 핸들러 함수 단 하나도 정의되지 않음 (impl.get_eqp_options() 등 16개 호출 함수 미존재)
- recipe_test.py(2011줄)와 recipe_test_impl.py(845줄) 간 역할 불명확

**수정 계획**:

```
✅ Phase 1 수정 항목 (FIX-ARCH-01)
- [ ] Step 1: backend/app/main.py에 include_router() 추가
  - from app.api.routes import recipe_test_eqp, recipe_test_content, recipe_test_history, 
    recipe_test_ops, recipe_file_ops, recipe_inventory
  - for router in [recipe_test_eqp.router, recipe_test_content.router, 
    recipe_test_history.router, recipe_test_ops.router, recipe_file_ops.router, 
    recipe_inventory.router]:
      app.include_router(router, prefix="/api")

- [ ] Step 2: recipe_test_impl.py에 핸들러 함수 추가 또는 recipe_test.py 직접 등록
  - 옵션 A: recipe_test.py의 get_eqp_options(line 1781), load_recipe_test(1795), 
    get_cas_content(1850) 등 7개 GET 핸들러를 recipe_test_impl.py로 이전
  - 옵션 B (임시): recipe_test.py를 그대로 recipe_test_eqp, recipe_test_content, 
    recipe_test_history로 등록 (코드 중복 유지하되 즉시 라우팅)
  - 권장: 옵션 B (단기) → 옵션 A로 점진 리팩토링 (중기)

- [ ] Step 3: recipe_test_ops.py와 recipe_file_ops.py의 prefix 교정
  - 현재: recipe_test_ops.py prefix='/recipe-file-ops', recipe_file_ops.py prefix='/recipe-test'
  - 수정 후: recipe_test_ops.py prefix='/recipe-test', recipe_file_ops.py prefix='/recipe-file-ops'
  - 또는 파일명과 구현 내용을 다시 매칭 (확인 필요)
```

**검증 방법**:
```bash
# 라우터 등록 확인
curl http://localhost:8000/api/recipe-test/eqp-options
# 기대 응답: 200, EqpOptionsResponse

# impl 함수 import 검사
python -c "from app.api.routes import recipe_test_impl; print(dir(recipe_test_impl.get_eqp_options))"
# AttributeError 없음 확인
```

**위험도**: 낮음 (기존 핸들러 변경 없음, 등록/라우팅만 추가)  
**예상 기간**: 4-8 시간

---

#### 이슈: impl 참조 함수 미구현 (Architecture-02)
**심각도**: 🔴 Critical  
**상태**: Blocking (Architecture-01과 연쇄)

**현황**:
- [ ] recipe_test_eqp.py, recipe_test_content.py, recipe_test_history.py, recipe_file_ops.py가 모두
  `from app.api.routes import recipe_test_impl as impl` 후 다음을 호출:
  - impl.get_eqp_options(), impl.load_recipe_test(), impl.get_cas_content()
  - impl.save_cas(), impl.persist_cas(), impl.save_job(), impl.persist_job()
  - impl.clone_recipe(), impl.rename_file(), impl.delete_files(), impl.transfer_files()

- [ ] 그러나 recipe_test_impl.py:1-845에는 다음이 정의되지 않음:
  - @router.* 데코레이터 0개 (router 선언만 있음, line 37)
  - 위의 16개 함수 모두 미정의
  - 실제 핸들러는 recipe_test.py(line 1780-2011)에만 존재

**수정 계획**:

```
✅ Phase 1 수정 항목 (FIX-ARCH-02)
Option A (권장 장기): recipe_test_impl.py로 함수 이전
- [ ] recipe_test.py의 get_eqp_options(1780), load_recipe_test(1794), 
  get_cas_content(1849), get_job_content(1901), get_history(1938) 등 
  구현부를 recipe_test_impl.py로 이전
- [ ] recipe_test_impl.py에 @router.* 데코레이터 추가
- [ ] recipe_test.py는 삭제하거나 recipe_test_impl 호출로 축소
- 작업량: 중상, 예상 기간: 1-2주

Option B (권장 단기): recipe_test.py 직접 등록
- [ ] recipe_test_eqp.py → recipe_test.py import 후 @router.get() 리팩토링 최소화
- [ ] impl.* 호출을 recipe_test.* 직접 호출로 변경
- [ ] 작업량: 적음, 예상 기간: 2-4시간
- 단점: 2011줄 파일이 계속 유지됨 (Phase 2/3에서 분리)

선택 기준: 
- Phase 1은 B로 빠르게 라우팅 정상화
- Phase 2에서 A로 점진 리팩토링 (FE-03 RecipeTestPage 분해와 병행)
```

**검증 방법**:
```bash
# TestClient로 엔드포인트 호출
python -c "
from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)
resp = client.get('/api/recipe-test/eqp-options')
print(resp.status_code)  # 200 기대
print(resp.json())  # EqpOptionsResponse 구조
"
```

**위험도**: 중간 (함수 이전 시 인자 변경 리스크)  
**예상 기간**: Phase 1은 2-4시간(옵션B), Phase 2는 1주(옵션A)

---

### 2-2. 런타임 오류와 구문 오염 (공통 Category)

#### 이슈: FrontEnd Critical 런타임 오류 6건 (Error-01)
**심각도**: 🔴 Critical  
**상태**: FrontEnd 독립적 수정 가능 (BE 무관)

**FrontEnd 6개 Critical**:

```
✅ FrontEnd Phase 1 수정 항목 (FIX-ERROR-01)

1. [ ] C-FE-01: String.endswith() 오타 (6곳)
   - 파일: frontend/src/features/recipe_test/pages/RecipeTestPage.vue
   - 위치: line 338(stripFileExt), 471(createPlaceholderRecipe), 
           2541(casListSaveAs), 2662(casContentSaveAs), 
           2721(jobListSaveAs), 2797(jobContentSaveAs)
   - 수정: .endswith( → .endsWith( 일괄 치환
   - 검증: grep -n "\.endswith(" frontend/src 결과 0건
   - 예상 기간: 1시간

2. [ ] C-FE-02: loadHistory() 미정의 (8곳)
   - 파일: RecipeTestPage.vue
   - 호출: line 2266, 2695, 2727, 2758, 2803, 2833, 2859, 2897
   - 정의: MyHistoryPage.vue:210 에만 존재
   - 옵션 선택 필요:
     * A (Phase 1 임시): 8곳 호출 제거 (사용자가 수동 새로고침)
     * B (Phase 2): useHistory composable 생성 후 자동 갱신
   - 권장: A (Phase 1) → B (Phase 2에서 대체)
   - 예상 기간: Phase 1은 30분

3. [ ] C-FE-04: 주석 없는 한글 텍스트 (구문 오염)
   - 파일: RecipeTestPage.vue:626
   - 내용: "Pel백엔드 포맷 유지" — 주석 기호 없이 코드 블록 내 삽입
   - 수정: 라인 삭제 또는 // 주석 처리
   - 예상 기간: 15분

4. [ ] C-FE-05: compress_output_matrix 식별자 오염
   - 파일: RecipeTestPage.vue:1333
   - 내용: } compress_output_matrix — try-catch 블록 사이에 삽입
   - 수정: 라인 삭제
   - 예상 기간: 15분

5. [ ] C-FE-06: 전역 폰트 미선언
   - 파일: frontend/index.html head
   - 현황: lang="en", body font-family 선언 없음
   - 수정: <style>html { font-family: 'Tahoma', 'Arial', sans-serif; }</style> 추가
   - 대체: frontend/src/style.css 생성 후 main.ts import
   - 검증: 브라우저 개발도구에서 body font-family 확인
   - 예상 기간: 2시간

6. [ ] C-FE-03: 테스트 러너 미설정
   - 파일: frontend/package.json, frontend/vite.config.ts
   - 현황: test 스크립트 없음, vitest/jest 미설정, 테스트 파일 0개
   - Phase 1: vitest @vue/test-utils jsdom 설치 + scripts/test 추가
   - Phase 2: 순수 함수(stripFileExt, deepClone, parseDetailEntry) 단위 테스트 작성
   - 예상 기간: Phase 1은 4시간, Phase 2는 진행형
```

**수정 순서**:
1. 1-5번 (텍스트 기반) → 1시간 이내 완료 가능
2. 6번 (테스트 프레임워크) → Phase 1 초기에 셋업

**검증 방법**:
```bash
# 구문 검사
npm run build

# 타입 검사
vue-tsc --noEmit

# 런타임 테스트 (라우터 등록 후)
npm run dev
# 브라우저: CAS/JOB Save As 실행 → TypeError 없음 확인
```

**위험도**: 낮음 (순수 텍스트 수정)  
**총 예상 기간**: Phase 1은 1-2일

---

## 3. API 계약 불일치 수정 계획

### 3-1. 미구현 엔드포인트 인벤토리

**확인됨 상태**:
- ✅ 구현됨 (코드 존재): 7개 GET (eqp-options, load, cas-content, job-content, recipe-source-list, history, metrology-source-debug)
- ❌ 미구현 (라우터 선언만): 1개 GET (recipe-content)
- ❌ 미구현 (완전 부재): 9개 ops (cas/job save·persist, recipe clone, file rename·delete, transfer, inventory snapshot, invalidate-runtime-cache)

### 3-2. 수정 계획

```
✅ Phase 1 API 계약 수정 항목 (FIX-API-01)

1. [ ] /api/recipe-test/recipe-content 구현
   - 라우터: recipe_test_content.py:23-25
   - impl 함수: impl.get_recipe_content(eqpId, recipeId) 미구현
   - 작업: recipe_test.py에 핸들러 있는지 검색
   - 상태: 확인 필요 (근처 코드 없음)

2. [ ] 9개 ops 엔드포인트 구현 (실행계획 EB-01-a)
   - POST /api/recipe-test/cas/save
   - POST /api/recipe-test/cas/persist
   - POST /api/recipe-test/job/save
   - POST /api/recipe-test/job/persist
   - POST /api/recipe-test/recipe/clone
   - POST /api/recipe-test/file/rename
   - POST /api/recipe-test/file/delete
   - POST /api/recipe-test/transfer
   - GET /api/recipe-inventory/snapshot
   - POST /api/recipe-test/invalidate-runtime-cache
   
   현황: 라우터 선언은 있으나 impl.save_cas 등 핸들러 함수 미정의
   
   수정 계획:
   - [ ] recipe_test.py 또는 별도 위치에서 핸들러 구현 코드 검색
   - [ ] 있으면: recipe_test_impl.py로 이전 + @router.post 데코레이터 추가
   - [ ] 없으면: 요청 모델(SaveCasRequest 등)은 recipe_test_impl.py에 있으므로 
           핸들러 구현 from scratch (작업량 상대적 증가)
   - 상태: 확인 필요

3. [ ] 라우터 prefix 정정 (Architecture-01의 Step 3과 연계)
   - recipe_test_ops.py prefix 교정
   - recipe_file_ops.py prefix 교정
```

**검증 방법**:
```bash
# 엔드포인트 등록 확인
curl -X POST http://localhost:8000/api/recipe-test/cas/save \
  -H "Content-Type: application/json" \
  -d '{"eqpId":"...", "casId":"..."}' 
# 기대: 200 또는 400 (입력 검증), 404 아님
```

**위험도**: 중상 (핸들러 구현 상태 미확인)  
**예상 기간**: 구현 코드 있으면 4시간, 없으면 2-3일

---

## 4. DB/데이터 흐름 수정 계획

### 4-1. 데이터 영속성 3대 문제

#### 이슈: temp_file_store.py - LOCAL_EDIT_BASE 환경변수 미지원 (Persist-01)
**심각도**: 🟠 High  
**영향**: Windows 배포 시 데이터 손실

```
✅ Phase 1-2 수정 항목 (FIX-PERSIST-01)

- [ ] backend/app/services/temp_file_store.py:6-7 수정
  현재: LOCAL_EDIT_BASE = Path(tempfile.gettempdir()) / 'recipe_test_edit'
  수정 후: 
    _DATA_DIR = Path(os.getenv('RECIPE_DATA_DIR', 
                               Path(tempfile.gettempdir()) 
                               if os.name != 'nt' 
                               else Path('C:\\ProgramData\\RecipeRMS'))
    LOCAL_EDIT_BASE = _DATA_DIR / 'recipe_test_edit'

- [ ] backend/.env.example에 RECIPE_DATA_DIR 환경변수 추가
  RECIPE_DATA_DIR=/opt/recipe-rms/data  # Linux
  또는
  RECIPE_DATA_DIR=C:\ProgramData\RecipeRMS  # Windows

- [ ] Windows 배포 가이드(docs/windows-deployment-guide.md) 업데이트
  - RECIPE_DATA_DIR 설정 방법
  - 기존 임시 파일 이관 절차

작업량: 3-4시간
예상 기간: Phase 2 초기
```

#### 이슈: history_service.py - JSONL 동시성 + 경로 문제 (Persist-02)
**심각도**: 🟠 High  
**영향**: 이력 손실 위험, 동시 append 원자성 미보장

```
✅ Phase 2 수정 항목 (FIX-PERSIST-02)

Option A (단기): 경로만 변경 + 파일 잠금
- [ ] history_service.py:56에서 tempdir 대신 RECIPE_DATA_DIR 사용
  HISTORY_DIR = Path(os.getenv('RECIPE_DATA_DIR', ...)) / 'history'
- [ ] filelock 라이브러리 도입하여 append 시 파일 잠금
  from filelock import FileLock
  with FileLock(history_file.with_suffix('.lock')):
    with open(history_file, 'a') as f: ...
- 예상 기간: 2시간

Option B (권장 중기): SQLite로 이관 (ERD §12.5 권고)
- [ ] recipe_cache_store.py에 recipe_action_history 테이블 추가
  CREATE TABLE recipe_action_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_name TEXT, actor_team TEXT, from_eqp_id TEXT,
    action TEXT, to_eqp_id TEXT, created_at TEXT NOT NULL,
    item_kind TEXT, source_name TEXT, target_name TEXT,
    recipe_name TEXT, request_id TEXT, status TEXT,
    reason TEXT, detail TEXT
  )
- [ ] history_service.py의 append_history_entry()를 SQLite INSERT로 교체
- [ ] 기존 .jsonl 파일을 migration 스크립트로 일괄 삽입
- [ ] history_service.py 전체를 recipe_cache_store와 통합
- 예상 기간: 3-4시간

권장 경로: Phase 2는 A (단기), Phase 3에서 B로 이관
```

#### 이슈: recipe_cache_store.py - ensure_schema() 매 호출 오버헤드 (Persist-03)
**심각도**: 🟠 High  
**영향**: 매 요청마다 4개 테이블 CREATE TABLE IF NOT EXISTS 실행 → 성능 저하

```
✅ Phase 1-2 수정 항목 (FIX-PERSIST-03)

- [ ] backend/app/services/recipe_cache_store.py:36-114 리팩토링
  
  현재: 모든 공개 함수 첫 줄에 ensure_schema() 호출
  수정 후: 
    _schema_initialized: bool = False
    
    def _ensure_schema_once():
      global _schema_initialized
      if not _schema_initialized:
        _ensure_schema()
        _schema_initialized = True
    
    # 모든 함수에서 ensure_schema() → _ensure_schema_once() 변경
    # 또는 @functools.lru_cache(maxsize=1) 적용

- [ ] WAL 모드 동시 활성화 (Persist-03과 함께)
  - [ ] _connect() 함수에 다음 추가:
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('PRAGMA synchronous=NORMAL')  
    conn.execute('PRAGMA busy_timeout=5000')

예상 기간: 2시간
```

---

### 4-2. 데이터베이스 연결 풀링

#### 이슈: PostgreSQL per-request create_engine (Connectivity-01)
**심각도**: 🟠 High

```
✅ Phase 2 수정 항목 (FIX-CONNECTIVITY-01)

파일: backend/app/services/ftp_eqp_ip.py:10
현황: load_lk_model_eqps() 함수 내부에서 create_engine(POSTGRES_URL) 
      → 매 호출마다 새 engine 생성, 커넥션 풀 미사용

수정:
- [ ] 모듈 수준 싱글톤 engine 생성
  engine = None
  def get_engine():
    global engine
    if engine is None:
      engine = create_engine(POSTGRES_URL, poolclass=QueuePool, 
                            pool_size=10, max_overflow=20)
    return engine

- [ ] 모든 함수에서 create_engine() 호출 제거 → get_engine() 사용으로 변경

- [ ] FastAPI lifespan event에서 engine cleanup
  @app.on_event("shutdown")
  async def shutdown():
    if engine:
      engine.dispose()

예상 기간: 3-4시간
```

#### 이슈: MongoDB per-request MongoClient (Connectivity-02)
**심각도**: 🟠 High

```
✅ Phase 2 수정 항목 (FIX-CONNECTIVITY-02)

파일: backend/app/services/ftp_credentials.py:15-46
      backend/app/services/ftp_eqp_ip.py:40-55
현황: load_eqp_ip(), load_eqp_ftp_credentials() 내부에서 MongoClient 생성·close()

수정:
- [ ] 모듈 수준 싱글톤 MongoClient
  mongo_client = None
  def get_mongo_client():
    global mongo_client
    if mongo_client is None:
      mongo_client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    return mongo_client

- [ ] FastAPI lifespan에서 cleanup
  @app.on_event("shutdown")
  async def shutdown():
    if mongo_client:
      mongo_client.close()

- [ ] 두 파일의 중복 구현 통합 (ADDCMP.FTP_STATUS 컬렉션 접근 코드 동일)
  → shared/services/mongo_client.py로 통합

예상 기간: 2시간
```

---

## 5. 환경 설정/Mockup/Real Data 대응 계획

### 5-1. MOCK_MODE 환경변수 기반 분기

```
✅ Phase 1-2 수정 항목 (FIX-MOCKUP-01)

1. [ ] backend/app/config.py에 MOCK_MODE 플래그 추가
   MOCK_MODE: bool = os.getenv('MOCK_MODE', '0') == '1'

2. [ ] 서비스 계층에 분기 추가
   - ftp_eqp_ip.load_lk_model_eqps():
     if MOCK_MODE: return mockup_data.MOCK_EQP_OPTIONS['items']
     else: return 실제 DB 조회
   
   - file_ops_service.connect_ftp():
     if MOCK_MODE: return MockFTP()
     else: return ftplib.FTP(ip, id, pw)
   
   - history_service.list_history_entries():
     if MOCK_MODE: return mockup_data.MOCK_HISTORY_ENTRIES
     else: return 실제 파일/DB 조회

3. [ ] conftest.py 신설 (사외 환경용 테스트)
   @pytest.fixture(autouse=True)
   def mock_dependencies(monkeypatch):
     monkeypatch.setattr('app.config.MOCK_MODE', True)
     monkeypatch.setattr('app.services.ftp_eqp_ip.load_lk_model_eqps', 
                        lambda limit=None: mockup_data.MOCK_EQP_OPTIONS['items'])

4. [ ] backend/.env (개발) vs .env.prod (사내)
   # .env (개발 환경)
   MOCK_MODE=1
   POSTGRES_URL=
   MONGO_URL=
   
   # .env.prod (사내 환경)
   MOCK_MODE=0
   POSTGRES_URL=postgresql://...
   MONGO_URL=mongodb://...

예상 기간: Phase 1은 4시간, Phase 2는 테스트 작성 진행형
```

### 5-2. FrontEnd API 에러 처리 개선

```
✅ Phase 1-2 수정 항목 (FIX-MOCKUP-02)

파일: frontend/src/features/recipe_test/api/recipeTestApi.ts:329-356 http() 함수

현황:
- catch (err: any) { ... } — any 타입
- throw new Error(text || 'API request failed') — 구조화 없음
- 500 에러로 HTML 반환 시 전체 HTML을 error message에 포함

수정:
- [ ] ApiError 클래스 정의
  interface ApiError extends Error {
    statusCode: number;
    payload?: unknown;
  }

- [ ] http<T>() 함수 개선
  async function http<T>(
    method: string, 
    url: string, 
    body?: any,
    timeout?: number
  ): Promise<T> {
    const res = await fetch(url, {
      timeout: timeout ?? 60000,  // per-request timeout
      ...
    });
    
    if (!res.ok) {
      const text = await res.text();
      let detail = text;
      try {
        const json = JSON.parse(text);
        detail = json.detail || json.message || text.slice(0, 200);
      } catch {}
      throw new ApiError(detail, res.status);
    }
    ...
  }

- [ ] getInventoryRecipeSnapshot(), invalidateRuntimeCache() 호출부에서 fallback 처리
  try {
    const snapshot = await getInventoryRecipeSnapshot(eqpId);
    ...
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) {
      console.warn('Snapshot API not implemented, skipping');
      // 계속 진행
    } else {
      throw err;
    }
  }

예상 기간: 2시간
```

---

## 6. 보안/에러 처리/로깅 수정 계획

### 6-1. Critical 보안 패치 (즉시)

```
✅ Phase 1 보안 수정 항목 (FIX-SEC-01)

1. [ ] FTP Path Traversal 방지 (SEC-01)
   파일: backend/app/services/file_ops_service.py
   
   - [ ] 파일명 정규식 검증
     SAFE_FILENAME_RE = re.compile(r'^[A-Za-z0-9_.\\-]+$')
     
     def validate_filename(name: str) -> bool:
       if not SAFE_FILENAME_RE.match(name):
         raise ValueError(f'Invalid filename: {name}')
       if len(name) > 255 or name in ('.', '..'):
         raise ValueError(f'Unsafe filename: {name}')
       return True
   
   - [ ] remoteDir 화이트리스트 검증
     ALLOWED_DIRS = {
       'CAS': '/설비경로/CAS',
       'JOB': '/설비경로/JOB',
       'RECIPE': '/설비경로/RECIPE',
     }
     
     def validate_remote_dir(dir_type: str, path: str) -> bool:
       if dir_type not in ALLOWED_DIRS:
         raise ValueError(f'Invalid dir_type: {dir_type}')
       base = ALLOWED_DIRS[dir_type]
       normalized = pathlib.Path(path).resolve()
       if not str(normalized).startswith(str(base)):
         raise ValueError(f'Path traversal detected: {path}')
       return True
   
   - [ ] cwd() 호출 전에 검증
     def connect_ftp(...):
       ...
       for dir_name in path.split('/'):
         validate_filename(dir_name)
       ftp.cwd(path)  # 이제 안전함

   예상 기간: 3-4시간

2. [ ] 자격증명 로그 누출 방지 (SEC-02)
   파일: backend/app/services/recipe_inventory_sync.py, ftp_credentials.py, db.py
   
   - [ ] FtpCredentials dataclass __repr__ 마스킹
     @dataclass(frozen=True)
     class FtpCredentials:
       host: str
       user: str
       password: str
       
       def __repr__(self) -> str:
         return f'FtpCredentials(host={self.host!r}, user={self.user!r}, password=***)'
       
       def __str__(self) -> str:
         return self.__repr__()
   
   - [ ] mark_inventory_failure(str(exc)) 에러 메시지 정제
     def mark_inventory_failure(..., error: str):
       # 자격증명 패턴 제거
       sanitized = re.sub(r'(password|passwd|pwd)=[^\s,)]+', 
                         r'\1=***', str(error))
       # DB에 저장
       ...
   
   - [ ] HTTPException(detail=str(exc)) 제거
     except Exception as e:
       logger.exception(e)  # 내부 로그에만 기록
       raise HTTPException(status_code=500, 
                          detail='Internal server error')

   예상 기간: 2시간

3. [ ] DB 자격증명 기본값 제거 (SEC-03)
   파일: backend/db.py, backend/app/config.py
   
   - [ ] 기본값 삭제 및 시작 시 검증
     if not POSTGRES_URL:
       raise RuntimeError('POSTGRES_URL environment variable not set')
     if not MONGO_URL:
       raise RuntimeError('MONGO_URL environment variable not set')
   
   - [ ] config.py에서 validation
     class Config:
       POSTGRES_URL: str = Field(...)  # 기본값 없음
       MONGO_URL: str = Field(...)
       
       @field_validator('POSTGRES_URL', 'MONGO_URL')
       @classmethod
       def urls_required(cls, v):
         if not v:
           raise ValueError('DB URL cannot be empty')
         return v

   예상 기간: 1시간
```

### 6-2. High 우선순위 보안

```
✅ Phase 2 보안 수정 항목 (FIX-SEC-02)

1. [ ] CORS 미들웨어 추가 (SEC-04)
   파일: backend/app/main.py
   
   from fastapi.middleware.cors import CORSMiddleware
   
   CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
   
   app.add_middleware(
     CORSMiddleware,
     allow_origins=CORS_ORIGINS,
     allow_credentials=True,
     allow_methods=['GET', 'POST', 'PUT', 'DELETE'],
     allow_headers=['*'],
   )

   예상 기간: 1시간

2. [ ] API Key 기반 인증 미들웨어 (SEC-05)
   파일: backend/app/dependencies/auth.py (신규)
   
   def verify_api_key(x_api_key: str = Header(...)) -> str:
     valid_keys = os.getenv('VALID_API_KEYS', '').split(',')
     if x_api_key not in valid_keys:
       raise HTTPException(status_code=401, detail='Invalid API Key')
     return x_api_key
   
   # 모든 ops 라우터에 Depends(verify_api_key) 부착
   @router.post('/cas/save')
   async def save_cas(..., api_key: str = Depends(verify_api_key)):
     ...

   예상 기간: 2시간

3. [ ] bare except → logging 전환 (SEC-08)
   파일: backend/app/services/file_ops_service.py, recipe_inventory_sync.py
   
   except Exception as e:
     pass
   
   →
   
   except Exception as e:
     logger.exception(f'FTP operation failed: {type(e).__name__}')
     # 보안 로그 채널에 별도 기록
     if isinstance(e, (ftplib.error_perm, ftplib.error_temp)):
       security_logger.warning(f'FTP auth/perm error: {e}')
     raise

   예상 기간: 2시간
```

---

## 7. 테스트/검증 계획

### 7-1. 테스트 프레임워크 셋업

```
✅ Phase 1-2 수정 항목 (FIX-TEST-01)

BackEnd:
1. [ ] conftest.py 신설
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

2. [ ] backend/tests/test_api_routes.py 신설
   def test_get_eqp_options(client):
     response = client.get('/api/recipe-test/eqp-options')
     assert response.status_code == 200
     assert 'items' in response.json()
   
   def test_post_load(client):
     body = {'line': 'Line1', 'team': 'Team1', 'eqpId': 'EQP001'}
     response = client.post('/api/recipe-test/load', json=body)
     assert response.status_code in [200, 400]  # mockup이면 200, 실제 FTP 실패면 400

3. [ ] pytest.ini 또는 pyproject.toml에 설정
   [tool:pytest]
   pythonpath = .
   testpaths = tests
   markers =
     integration: 실제 DB 연결 테스트 (사내 환경만)

예상 기간: 4-6시간

FrontEnd:
1. [ ] vitest + @vue/test-utils + jsdom 설치
   npm install -D vitest @vitest/ui @vue/test-utils jsdom

2. [ ] frontend/vite.config.ts에 vitest 설정
   export default defineConfig({
     test: {
       environment: 'jsdom',
       globals: true,
     }
   })

3. [ ] package.json scripts 추가
   "test": "vitest",
   "test:ui": "vitest --ui",
   "coverage": "vitest --coverage"

4. [ ] 순수 함수 테스트부터 시작
   - frontend/src/features/recipe_test/utils/stripFileExt.spec.ts
   - frontend/src/features/recipe_test/utils/deepClone.spec.ts

예상 기간: 4-6시간
```

### 7-2. CI/CD 검증 게이트

```
✅ Phase 2 수정 항목 (FIX-TEST-02)

.github/workflows/ci.yml (신규) 또는 별도 CI 도구:

1. [ ] 빌드 단계
   - python -m py_compile backend/**/*.py
   - npm run build
   - npm run type-check (TypeScript)

2. [ ] 린트 단계
   - ruff check backend/
   - eslint frontend/src/
   - prettier --check frontend/

3. [ ] 테스트 단계
   - pytest backend/tests/ -m 'not integration' --cov=backend/app
   - npm test -- --run (FrontEnd)
   - 목표: 커버리지 60% → 80%

4. [ ] 보안 스캔
   - bandit -r backend/app/ -ll
   - grep -r 'password.*=' backend/ (하드코딩 자격증명)
   - windows-compatibility-check.py 실행

5. [ ] Windows 호환성
   - python windows-compatibility-check.py
   - 경로 길이 260자 제한 검증
   - CRLF 라인 엔딩 확인

예상 기간: 4-8시간
```

---

## 8. Phase별 수정 체크리스트

### Phase 1: 기능 동작 (Critical 차단 해제) — 예상 1-2주

**목표**: API 라우팅 정상화, FrontEnd 기본 기능 동작

```
🔴 CRITICAL BLOCKING (순서 필수):

- [ ] ARCH-01: main.py에 include_router() 추가
  상태: ❌ 미완료 (EP-01)
  우선: 🔴 Critical
  예상: 2-4시간
  검증: curl http://localhost:8000/api/recipe-test/eqp-options → 200

- [ ] ARCH-02: recipe_test_impl.py 또는 recipe_test.py 핸들러 정상화
  상태: ❌ 미완료 (impl 함수 미정의)
  우선: 🔴 Critical
  예상: 2-4시간
  검증: TestClient로 엔드포인트 호출 → 404 아님

- [ ] ARCH-03: recipe_test_ops.py / recipe_file_ops.py prefix 정정
  상태: ❌ 미완료
  우선: 🔴 Critical
  예상: 1시간
  검증: FrontEnd API 경로와 BE 라우트 일치

🟠 HIGH (병렬 가능):

- [ ] ERROR-01-1: FrontEnd .endswith() 오타 6곳 수정
  예상: 1시간
  검증: grep -n "\.endswith(" → 0건

- [ ] ERROR-01-2: loadHistory() 미정의 — 임시 제거 (Option A)
  예상: 30분
  검증: TransferCart 완료 후 에러 없음

- [ ] ERROR-01-3,4,5: 한글 텍스트, compress_output_matrix, 폰트 선언
  예상: 2시간
  검증: npm run build 성공

- [ ] ERROR-01-6: vitest/jest 셋업
  예상: 4시간
  검증: npm test 실행 가능

- [ ] API-01: 임시 API 에러 처리 개선 (MOCKUP-02)
  예상: 2시간
  검증: 프론트 getInventoryRecipeSnapshot() 404 시 silently skip

- [ ] SEC-01,02,03: 자격증명 환경변수, FTP path 검증, DB 기본값
  예상: 6-8시간
  검증: .env 누락 시 RuntimeError, path traversal 테스트 403

총 예상: 1-2주 (병렬 시 1주)
```

### Phase 2: 안정화 (High 항목, 데이터 영속성) — 예상 3-4주

```
- [ ] PERSIST-01: LOCAL_EDIT_BASE 환경변수 (EP-02)
  예상: 4시간

- [ ] PERSIST-02-A: history 파일 잠금 (임시)
  예상: 2시간

- [ ] PERSIST-03: ensure_schema() + WAL 모드
  예상: 3-4시간

- [ ] CONNECTIVITY-01: PostgreSQL 커넥션 풀
  예상: 3-4시간

- [ ] CONNECTIVITY-02: MongoDB 싱글톤
  예상: 2시간

- [ ] MOCKUP-01: MOCK_MODE 환경변수 분기
  예상: 4시간

- [ ] SEC-02: CORS + API Key 인증 + 에러 정규화
  예상: 6시간

- [ ] TEST-01: conftest.py + 기본 테스트 작성
  예상: 8시간

총 예상: 3-4주
```

### Phase 3: 품질 향상 (Medium 항목, Windows 배포 준비) — 예상 4-6주

```
- [ ] FE-03: RecipeTestPage.vue 분해 (composable 추출)
  예상: 2-3주

- [ ] FE-05: CasFileListPanel / JobFileListPanel 통합
  예상: 3-4일

- [ ] FE-06: 아키텍처 정리 (피처 간 의존성)
  예상: 1주

- [ ] DB-PERSIST-02-B: JSONL → SQLite 이관
  예상: 3-4시간

- [ ] BE-TEST: 통합 테스트 + E2E 시나리오
  예상: 2주

- [ ] Windows-01: 배포 스크립트 (EP-03)
  예상: 3-4일

- [ ] Windows-02: 경로/인코딩 호환성 전수 검사
  예상: 2-3일

총 예상: 4-6주
```

### Phase 4: 개선 (Low 항목, 장기 운영) — 지속적

```
- [ ] SEC-03,4: RBAC, 감사 로깅, OAuth2/MFA
- [ ] TEST: 커버리지 80%+
- [ ] PERF: 응답 시간 목표값 설정 및 최적화
- [ ] UI: Win97 vs 현대 디자인 최종 결정
- [ ] MONITOR: 성능 기준선 대시보드
```

---

## 9. 파일별 수정 대상과 수정 목적

### BackEnd

| 파일 | 현 상태 | Phase | 우선 | 수정 내용 | 예상 영향 |
|------|--------|-------|------|---------|---------|
| `app/main.py` | ❌ 라우터 미등록 | 1 | 🔴 C | include_router() 추가 (6개 라우터) | 모든 API 404 → 동작 |
| `app/api/routes/recipe_test.py` | ⚠️ 2011줄, 7개만 구현 | 1-2 | 🔴 C | impl로 이전 또는 직접 등록 | 코드 정리, 유지보수성 |
| `app/api/routes/recipe_test_impl.py` | ❌ 핸들러 미구현 | 1 | 🔴 C | 16개 함수 구현 또는 수정 | ops 엔드포인트 동작 |
| `app/api/routes/recipe_test_ops.py` | ❌ prefix 혼동 | 1 | 🔴 C | prefix='/recipe-test'으로 정정 | API 경로 일치 |
| `app/api/routes/recipe_file_ops.py` | ❌ prefix 혼동 | 1 | 🔴 C | prefix='/recipe-file-ops'으로 정정 | API 경로 일치 |
| `app/api/routes/recipe_test_content.py` | ⚠️ 라우터만 | 1 | 🟠 H | /recipe-content 핸들러 구현 | 레시피 콘텐츠 조회 |
| `app/services/temp_file_store.py` | ⚠️ tempdir 고정 | 2 | 🟠 H | RECIPE_DATA_DIR 환경변수 지원 | Windows 영속성 |
| `app/services/recipe_cache_store.py` | ⚠️ ensure_schema 과다 | 1-2 | 🟠 H | 1회만 실행 + WAL 모드 | 성능 개선 |
| `app/services/history_service.py` | ⚠️ JSONL 동시성 | 2 | 🟠 H | 파일 잠금 또는 SQLite 이관 | 이력 안정성 |
| `app/services/ftp_eqp_ip.py` | ⚠️ per-request engine | 2 | 🟠 H | 커넥션 풀 싱글톤 | DB 연결 최적화 |
| `app/services/ftp_credentials.py` | ⚠️ per-request client | 2 | 🟠 H | MongoClient 싱글톤 | MongoDB 연결 최적화 |
| `app/services/file_ops_service.py` | 🔴 경로 검증 없음 | 1 | 🔴 C | path traversal 방지 | 보안 |
| `app/config.py` | ⚠️ MOCK_MODE 미분기 | 1-2 | 🟠 H | MOCK_MODE 환경변수 + 분기 | mockup/real 전환 |
| `db.py` | 🔴 기본값 위험 | 1 | 🔴 C | DB_PASSWORD 기본값 제거 | 보안 |
| `tests/conftest.py` | ❌ 미존재 | 1 | 🟠 H | monkeypatch fixture 추가 | 테스트 기반 확보 |

### FrontEnd

| 파일 | 현 상태 | Phase | 우선 | 수정 내용 | 예상 영향 |
|------|--------|-------|------|---------|---------|
| `pages/RecipeTestPage.vue` | 🔴 3522줄, 6개 C 오류 | 1-3 | 🔴 C | endswith/loadHistory/구문 오염 수정 → 분해 | 기능 복구 → 유지보수성 |
| `index.html` | ⚠️ 폰트 미선언 | 1 | 🔴 C | body font-family 추가 | UI 정렬 |
| `package.json` | ❌ test 스크립트 | 1 | 🔴 C | vitest 설치 + scripts 추가 | 테스트 가능 |
| `api/recipeTestApi.ts` | ⚠️ 에러 처리 미흡 | 1 | 🟠 H | ApiError 정의, graceful fallback | 에러 안정성 |
| `components/TopBarNav.vue` | ⚠️ 디자인 혼용 | 2 | 🟠 H | Win97 통일 또는 현대 통일 | UI 일관성 |
| `components/Win97ConfirmDialog.vue` | ⚠️ 접근성 미흡 | 2 | 🟠 H | ARIA + 포커스 트랩 + Escape | 접근성 |
| `components/CasFileListPanel.vue` | ⚠️ 90% 중복 | 2 | 🟡 M | JobFileListPanel과 통합 | 코드 중복 제거 |
| `features/history/MyHistoryPage.vue` | ⚠️ 피처 의존성 | 2 | 🟡 M | shared/api/historyApi로 이동 | 피처 간 의존성 제거 |

---

## 10. 우선순위와 위험도 매트릭스

```
┌─────────────────────────────────────────────────────────────────┐
│                      우선순위 × 위험도                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ 좌상단: 높은 우선, 낮은 위험 (빠른 개선)                         │
│ EP-01(라우터), C-FE-01(.endswith) → 즉시 수행                   │
│                                                                   │
│ 우상단: 높은 우선, 높은 위험 (신중한 접근)                       │
│ FIX-PERSIST (데이터 영속성) → 테스트 철저히                     │
│ FIX-CONNECTIVITY (DB 풀) → 리그레션 검증                        │
│                                                                   │
│ 좌하단: 낮은 우선, 낮은 위험 (점진적 개선)                       │
│ FIX-UI (디자인 통일) → 여유시간에 처리                          │
│ FIX-LOW (코드 스타일) → Phase 4                                 │
│                                                                   │
│ 우하단: 낮은 우선, 높은 위험 (신중한 검토)                       │
│ FE-03 (RecipeTestPage 분해) → Phase 3에 충분한 시간 할당        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

Critical (🔴 즉시):
- EP-01 (라우터 등록) — 1-2일
- ERROR-01-1 (.endswith) — 1시간
- SEC-01 (path traversal) — 4시간
- ERROR-01-6 (vitest) — 4시간

High (🟠 단기 1-2주):
- ARCH-02 (impl 함수) — 4시간
- PERSIST-01 (LOCAL_EDIT_BASE) — 4시간
- CONNECTIVITY-01,02 (풀) — 5시간
- SEC-02 (CORS/API Key) — 6시간

Medium (🟡 중기 2-4주):
- FE-03 (RecipeTestPage 분해) — 1-2주
- TEST-01 (테스트 작성) — 1주
- UI 통일 — 3-4일

Low (🟢 장기):
- Phase 4 개선 — 지속적
```

---

## 11. 롤백 전략

### 11-1. 변경 전 백업

```
✅ 각 Phase 시작 전:

- [ ] backup.bat 실행 (docs/windows-deployment-guide.md 참조)
  구성: .env, SQLite 파일, 이력 JSONL, cloud_protected_files.csv
  위치: 별도 버전 관리 디렉터리 (C:\Backup\RecipeRMS\YYYYMMDD)
  검증: 백업 파일 무결성 확인 (체크섬 또는 파일 크기)

- [ ] Git branch 생성
  git checkout -b phase-1-routing-fix
  git push -u origin phase-1-routing-fix
```

### 11-2. Phase별 롤백 프로세스

#### Phase 1 롤백

**변경 범위**: 라우터 등록, FrontEnd 오타 수정

```
Rollback Plan:
1. [ ] Git revert
   git revert HEAD~5..HEAD  # 최근 5커밋 되돌리기
   git push origin phase-1-routing-fix

2. [ ] 데이터 롤백 (선택)
   Phase 1은 코드 변경만 → 데이터 롤백 불필요

3. [ ] 서비스 재시작
   # Linux
   systemctl restart recipe-rms
   # Windows
   net stop RecipeRMS && net start RecipeRMS

4. [ ] 헬스체크
   curl http://localhost:8000/api/recipe-test/eqp-options
   # 만약 404: 롤백 성공 (원래 상태)
   # 만약 200: 롤백 실패 (캐시 문제 또는 불완전한 revert)
```

**예상 복구 시간**: 15분

#### Phase 2 롤백 (데이터 영속성)

**변경 범위**: 환경변수, DB 연결 풀, SQLite 스키마

```
Rollback Plan:
1. [ ] DB 데이터 롤백
   # SQLite 백업 파일을 원래 위치로 복원
   cp C:\Backup\RecipeRMS\20260518\recipe_cache.sqlite3 \
      C:\ProgramData\RecipeRMS\recipe_cache\recipe_cache.sqlite3

2. [ ] 환경변수 원복
   # .env를 백업본으로 교체
   cp C:\Backup\RecipeRMS\20260518\.env backend\.env

3. [ ] Code 롤백
   git revert HEAD~N..HEAD

4. [ ] 서비스 재시작

5. [ ] 데이터 검증
   # 이전 이력이 복구되었는지 확인
   SELECT COUNT(*) FROM recipe_action_history;
   # 백업 시점과 동일한 건수 기대
```

**예상 복구 시간**: 30분

#### Phase 3 롤백 (아키텍처 정리)

**변경 범위**: RecipeTestPage 분해, 컴포넌트 통합

```
Rollback Plan:
1. [ ] 코드 롤백
   git revert HEAD~M..HEAD  # 분해 이전 상태로

2. [ ] 번들 재빌드
   npm run build

3. [ ] 정적 파일 배포
   # frontend/dist/ 콘텐츠를 웹 서버에 재배포

4. [ ] 브라우저 캐시 무효화
   # 버전 번호 증가 또는 cache-busting hash 변경
```

**예상 복구 시간**: 10분

---

## 12. 완료 기준

### Phase 1 완료 기준 (기능 동작)

**필수 (ALL)**:
- [ ] `GET /api/recipe-test/eqp-options` → 200 응답 (mockup 또는 실제)
- [ ] `POST /api/recipe-test/load` → 200/400 응답 (FTP 실패 시 400 허용)
- [ ] `GET /api/recipe-test/cas-content` → 200 응답
- [ ] `GET /api/recipe-test/job-content` → 200 응답
- [ ] `GET /api/recipe-test/history` → 200 응답
- [ ] `POST /api/recipe-test/transfer` → 200/400 응답

**FrontEnd**:
- [ ] npm run build 성공 (TypeScript 오류 0건)
- [ ] CAS/JOB 파일 목록 UI 정상 표시
- [ ] Save As 클릭 시 TypeError 없음
- [ ] Transfer 완료 후 UI crash 없음

**테스트**:
- [ ] npm test 실행 가능 (0건 이상 테스트 존재)
- [ ] pytest backend/tests/ -m 'not integration' 최소 통과

### Phase 2 완료 기준 (안정화)

**데이터**:
- [ ] SQLite 동시 접근 'database is locked' 오류 0건 (WAL 모드)
- [ ] History 이력 append 중 데이터 손실 0건 (파일 잠금)
- [ ] Windows 재부팅 후 임시 파일 미소실 (RECIPE_DATA_DIR 사용)

**보안**:
- [ ] FTP path traversal 테스트 403 반환
- [ ] 로그에 패스워드 노출 0건 (grep 검증)
- [ ] CORS 헤더 정상 응답
- [ ] API Key 검증 401 반환

**성능**:
- [ ] `/api/recipe-test/eqp-options` 응답 시간 < 1초 (캐시 포함)
- [ ] 100개 파일 목록 정렬 < 500ms

### Phase 3 완료 기준 (품질)

**테스트**:
- [ ] BE 커버리지 ≥ 60%
- [ ] FE 커버리지 ≥ 40%
- [ ] E2E 시나리오 (로드 → 편집 → 저장 → 이력 조회) 통과

**Windows 호환성**:
- [ ] Windows 10/11 + Python 3.9+ 환경에서 정상 동작
- [ ] 경로 길이 260자 제한 내 모든 동작
- [ ] CRLF 라인 엔딩 처리

**아키텍처**:
- [ ] RecipeTestPage.vue < 1000줄 (composable 분해)
- [ ] 피처 간 순환 의존성 0건
- [ ] 컴포넌트 중복 코드 < 10%

### Phase 4 완료 기준 (운영)

**모니터링**:
- [ ] 성능 기준선 대시보드 구성 (응답 시간, 캐시 hit 율, 메모리)
- [ ] 보안 감시 알림 자동화 (인증 실패 임계치, path traversal 시도)

**문서**:
- [ ] API 문서화 (Swagger/OpenAPI)
- [ ] 운영 가이드 (backup, restore, 모니터링)
- [ ] 아키텍처 문서 (컴포넌트 다이어그램, 데이터 흐름)

---

## 부록. 주요 파일 변경 요약

### backend/app/main.py

**Before**:
```python
app = FastAPI()
# include_router() 호출 없음
```

**After**:
```python
app = FastAPI()
from app.api.routes import (
    recipe_test_eqp, recipe_test_content, recipe_test_history,
    recipe_test_ops, recipe_file_ops, recipe_inventory
)

for router in [
    recipe_test_eqp.router,
    recipe_test_content.router,
    recipe_test_history.router,
    recipe_test_ops.router,
    recipe_file_ops.router,
    recipe_inventory.router
]:
    app.include_router(router, prefix="/api")

# CORS, Auth, Error handlers 추가 (Phase 2)
```

### frontend/src/features/recipe_test/pages/RecipeTestPage.vue

**Before** (line 338):
```javascript
lower.endswith(extLower)  // ❌ TypeError
```

**After**:
```javascript
lower.endsWith(extLower)  // ✅ Correct
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
                           Path(tempfile.gettempdir()) if os.name != 'nt'
                           else Path('C:\\ProgramData\\RecipeRMS')))
LOCAL_EDIT_BASE = _DATA_DIR / 'recipe_test_edit'
```

---

## 마치며

이 풀스택 수정 계획은:
1. **Phase 1 (1-2주)**: Critical 차단 해제 → API 라우팅 정상화
2. **Phase 2 (3-4주)**: High 안정화 → Windows 배포 가능
3. **Phase 3 (4-6주)**: Medium 품질 → 운영 체계 확립
4. **Phase 4 (지속적)**: Low 개선 → 프로덕션 성숙도

각 Phase는 **독립적으로 롤백 가능**하며, **기존 기능 보존**을 최우선으로 합니다.

기준 문서:
- `docs/999-CLAUDE-backend-report.md` (123 이슈 상세)
- `docs/999-CLAUDE-FrontEnd-report.md` (69 이슈 상세)
- `docs/3-execution-plan.md` (기존 Phase 1-4)
- `CLAUDE.md` (Windows 호환성, mockup/real data)
- `docs/windows-deployment-guide.md` (배포 절차)
