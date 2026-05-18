# 풀스택 통합 수정 계획 — 요약본

**기준일**: 2026-05-18  
**대상**: `/home/dev/project/recipe` 전체  
**기준 문서**: docs/999-CLAUDE-backend-report.md, docs/999-CLAUDE-FrontEnd-report.md, docs/3-execution-plan.md

---

## 현황 진단

| 측면 | 상태 | 원인 |
|------|------|------|
| **API 라우팅** | 🔴 전면 비동작 | main.py include_router() 0건 |
| **핸들러 구현** | 🔴 impl 함수 미구현 | recipe_test_impl.py 16개 함수 미정의 |
| **FrontEnd 기능** | 🟠 부분 비동작 | 6개 Critical 런타임 오류 |
| **보안** | 🔴 치명적 | FTP path traversal, 인증 전무 |
| **테스트** | 🔴 전무 | BE/FE 0건, 검증 불가능 |

---

## Phase별 로드맵

### Phase 1: 기능 동작 (1-2주)

**Critical 차단 해제** — API 라우팅 정상화

```
✅ ARCH-01: main.py에 include_router() 추가 (6개 라우터)
  - 예상: 2-4시간
  - 검증: curl /api/recipe-test/eqp-options → 200

✅ ARCH-02: recipe_test_impl.py 핸들러 정상화
  - 옵션 A: 16개 함수 recipe_test_impl.py로 이전 (1-2주)
  - 옵션 B: recipe_test.py 직접 등록 (2-4시간, 임시)
  - 권장: Phase 1은 B → Phase 2에서 A

✅ ARCH-03: recipe_test_ops / recipe_file_ops prefix 정정
  - 예상: 1시간
  - 검증: FrontEnd API 경로와 일치

✅ ERROR-01: FrontEnd 6개 Critical 런타임 오류
  1. .endswith() 오타 6곳 → .endsWith() 치환 (1시간)
  2. loadHistory() 미정의 8곳 → 임시 제거 (30분)
  3. 한글 텍스트 오염 제거 (15분)
  4. compress_output_matrix 삭제 (15분)
  5. 전역 폰트 선언 추가 (2시간)
  6. vitest/jest 셋업 (4시간)

✅ SEC-01: Critical 보안 패치
  - FTP path traversal 검증 추가 (4시간)
  - DB 자격증명 기본값 제거 (1시간)
  - 자격증명 로그 누출 방지 (2시간)

총 예상: 1-2주 (병렬 시 1주)
```

### Phase 2: 안정화 (3-4주)

**High 항목 해결** — Windows 배포 가능 상태

```
✅ PERSIST-01: LOCAL_EDIT_BASE → RECIPE_DATA_DIR 환경변수 (4시간)
✅ PERSIST-03: ensure_schema() 1회 + WAL 모드 (3-4시간)
✅ CONNECTIVITY-01: PostgreSQL 커넥션 풀 싱글톤 (3-4시간)
✅ CONNECTIVITY-02: MongoDB 싱글톤 + cleanup (2시간)
✅ MOCKUP-01: MOCK_MODE 환경변수 분기 (4시간)
✅ SEC-02: CORS + API Key 인증 (6시간)
✅ TEST-01: conftest.py + 기본 테스트 (8시간)

총 예상: 3-4주
```

### Phase 3: 품질 향상 (4-6주)

**Medium 항목** — Windows 최종 배포 준비

```
✅ FE-03: RecipeTestPage.vue 분해 (composable 추출) (2-3주)
✅ FE-05: CasFileListPanel 통합 (3-4일)
✅ FE-06: 아키텍처 정리 (피처 간 의존성) (1주)
✅ PERSIST-02-B: JSONL → SQLite 이관 (3-4시간)
✅ BE-TEST: 통합 테스트 + E2E (2주)
✅ Windows 배포 스크립트 (3-4일)

총 예상: 4-6주
```

### Phase 4: 개선 (진행 중)

**Low 항목 + 운영 안정화**
- RBAC, 감사 로깅, OAuth2/MFA
- 커버리지 80%+ 목표
- 성능 최적화
- 모니터링 대시보드

---

## FrontEnd/BackEnd 공통 이슈

### 아키텍처 계층 단절 (ARCH-01, 02, 03)

**문제**: 
- BE main.py에 include_router() 호출 없음 → 모든 API 404
- recipe_test_impl.py에 16개 호출 함수 미정의
- recipe_test_ops / recipe_file_ops prefix 혼동

**수정**:
```python
# backend/app/main.py
from app.api.routes import (
    recipe_test_eqp, recipe_test_content, recipe_test_history,
    recipe_test_ops, recipe_file_ops, recipe_inventory
)

for router in [
    recipe_test_eqp.router, recipe_test_content.router,
    recipe_test_history.router, recipe_test_ops.router,
    recipe_file_ops.router, recipe_inventory.router
]:
    app.include_router(router, prefix="/api")
```

### 데이터 영속성 3대 문제

**PERSIST-01**: temp_file_store.py LocalEditBase → RECIPE_DATA_DIR
```python
_DATA_DIR = Path(os.getenv('RECIPE_DATA_DIR', 
                           Path(tempfile.gettempdir()) if os.name != 'nt'
                           else Path('C:\\ProgramData\\RecipeRMS')))
```

**PERSIST-02**: history_service.py JSONL 동시성 + 경로
- Phase 2: filelock 도입 (2시간)
- Phase 3: SQLite 이관 (3-4시간)

**PERSIST-03**: recipe_cache_store.py ensure_schema() 오버헤드
```python
_schema_initialized: bool = False

def _ensure_schema_once():
  global _schema_initialized
  if not _schema_initialized:
    _ensure_schema()
    _schema_initialized = True
```

---

## 보안 수정 계획

### Phase 1 Critical

| ID | 항목 | 파일 | 예상 |
|----|------|------|------|
| SEC-01 | FTP path traversal 검증 | file_ops_service.py | 4시간 |
| SEC-02 | 자격증명 마스킹 | recipe_inventory_sync.py | 2시간 |
| SEC-03 | DB 기본값 제거 | db.py, config.py | 1시간 |

### Phase 2 High

| ID | 항목 | 파일 | 예상 |
|----|------|------|------|
| SEC-04 | CORS 미들웨어 | main.py | 1시간 |
| SEC-05 | API Key 인증 | dependencies/auth.py | 2시간 |

---

## 테스트 및 검증

### BackEnd 테스트 (Phase 1-2)

```bash
# conftest.py 신설
@pytest.fixture
def client():
  return TestClient(app)

# test_api_routes.py
def test_get_eqp_options(client):
  response = client.get('/api/recipe-test/eqp-options')
  assert response.status_code == 200
```

### FrontEnd 테스트 (Phase 1-2)

```bash
npm install -D vitest @vue/test-utils jsdom
npm run test  # vitest로 실행
```

### CI/CD 검증 게이트 (Phase 2)

```
- 빌드: python -m py_compile, npm run build
- 린트: ruff check, eslint
- 테스트: pytest, npm test (커버리지 목표 60%+)
- 보안: bandit, windows-compatibility-check.py
```

---

## 완료 기준

### Phase 1 (기능 동작)

**필수**:
- [ ] `GET /api/recipe-test/eqp-options` → 200
- [ ] `POST /api/recipe-test/load` → 200/400
- [ ] npm run build 성공 (TypeScript 오류 0건)
- [ ] CAS/JOB 파일 목록 정상 표시
- [ ] Save As 클릭 시 TypeError 없음

### Phase 2 (안정화)

**필수**:
- [ ] SQLite 'database is locked' 오류 0건
- [ ] History 이력 append 데이터 손실 0건
- [ ] Windows 재부팅 후 임시 파일 미소실
- [ ] FTP path traversal 테스트 403 반환
- [ ] 로그 패스워드 노출 0건

### Phase 3 (품질)

**필수**:
- [ ] BE 커버리지 ≥ 60%, FE ≥ 40%
- [ ] E2E 시나리오 (로드 → 편집 → 저장 → 이력) 통과
- [ ] RecipeTestPage.vue < 1000줄
- [ ] 피처 간 순환 의존성 0건

---

## 롤백 전략

각 Phase별 롤백 프로세스:

**Phase 1 (코드 변경만)**:
```bash
git revert HEAD~5..HEAD  # 최근 5커밋 되돌리기
systemctl restart recipe-rms
curl http://localhost:8000/api/recipe-test/eqp-options  # 404 확인
# 예상 복구 시간: 15분
```

**Phase 2 (데이터 포함)**:
```bash
# SQLite 백업 복원
cp C:\Backup\RecipeRMS\20260518\*.sqlite3 C:\ProgramData\RecipeRMS\
# .env 복원
cp C:\Backup\RecipeRMS\20260518\.env backend\.env
git revert HEAD~N..HEAD
# 예상 복구 시간: 30분
```

**Phase 3 (아키텍처)**:
```bash
git revert HEAD~M..HEAD
npm run build
# 예상 복구 시간: 10분
```

---

## 파일별 수정 대상

### BackEnd

| 파일 | Phase | 수정 내용 | 예상 |
|------|-------|---------|------|
| app/main.py | 1 | include_router() 추가 (6개) | 2-4h |
| recipe_test_impl.py | 1-2 | 16개 함수 구현/이전 | 2-4h/1-2w |
| recipe_test_ops.py | 1 | prefix 정정 | 1h |
| recipe_file_ops.py | 1 | prefix 정정 | 1h |
| temp_file_store.py | 2 | RECIPE_DATA_DIR | 4h |
| recipe_cache_store.py | 1-2 | ensure_schema + WAL | 3-4h |
| history_service.py | 2-3 | filelock / SQLite | 2h / 3-4h |
| file_ops_service.py | 1 | path traversal 검증 | 4h |
| ftp_eqp_ip.py | 2 | 커넥션 풀 싱글톤 | 3-4h |
| ftp_credentials.py | 2 | MongoClient 싱글톤 | 2h |

### FrontEnd

| 파일 | Phase | 수정 내용 | 예상 |
|------|-------|---------|------|
| RecipeTestPage.vue | 1-3 | 오류 수정 → 분해 | 1h / 2-3w |
| index.html | 1 | font-family 추가 | 2h |
| package.json | 1 | vitest 설정 | 4h |
| recipeTestApi.ts | 1 | ApiError 클래스 | 2h |
| TopBarNav.vue | 2 | 디자인 통일 | 3d |
| Win97ConfirmDialog.vue | 2 | ARIA + 포커스 트랩 | 3d |

---

**결론**: 
1. **Phase 1 (1-2주)**: Critical 차단 해제 → API 라우팅 정상화
2. **Phase 2 (3-4주)**: High 안정화 → Windows 배포 가능
3. **Phase 3 (4-6주)**: Medium 품질 → 운영 체계 확립
4. **Phase 4 (진행 중)**: Low 개선 → 프로덕션 성숙도

각 Phase는 독립적 롤백 가능하며, 기존 기능 보존 최우선.
