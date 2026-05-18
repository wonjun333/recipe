# Execution Plan — Recipe Management System (RMS)

> 기준일: 2026-05-18  
> 기준 문서: `docs/1-prd.md`, `docs/2-erd.md`  
> 기준 코드: `/home/dev/project/recipe` 실제 소스코드  
> 원칙: 기존 기능 보존 최우선. 점진적 개선. 추측하지 않음. 불확실 항목은 "확인 필요"로 표기.

---

## 개요

| 단계 | 명칭 | 목표 | 예상 범위 |
|------|------|------|-----------|
| Phase 1 | 기능 동작 | 현재 동작하지 않는 API를 실제로 동작하게 함 | Critical 항목 전체 |
| Phase 2 | 안정화 | 데이터 영속성·보안 기본 수준 확보 | High 항목 전체 |
| Phase 3 | 품질 향상 | 테스트·DB 품질·Windows 배포 준비 | Medium 항목 |
| Phase 4 | 개선 | 장기적 유지보수성 향상 | Low 항목 |

---

## 진행 현황 요약

| 상태 | 항목 |
|------|------|
| ✅ 완료 | `ftp_eqp_ip.py` · `ftp_credentials.py` · `recipe_test_impl.py` DB 인증정보 환경변수화 |
| ✅ 완료 | `backend/app/config.py` 생성 (POSTGRES_URL, MONGO_URL) |
| ✅ 완료 | `backend/.env` · `backend/.env.example` · `.gitignore` 생성 |
| ❌ 미완료 | `main.py` 서브라우터 미등록 (C-01 — Critical) |
| ❌ 미완료 | 이력/캐시 저장 경로 영속화 (M-03 — High) |
| ❌ 미완료 | 그 외 모든 항목 |

---

## 1. Project Setup / Environment

### EP-01 — 백엔드 라우터 등록 (main.py 서브라우터 연결)

- **우선순위**: `Critical`
- **작업 목표**: `main.py`에 `recipe_test_*`, `recipe_inventory`, `recipe_file_ops` 라우터를 `app.include_router()`로 등록하여 실제 API가 동작하도록 한다.
- **대상 파일**: `backend/app/main.py`
- **선행 조건**: 없음
- **완료 기준**:
  - `GET /api/recipe-test/eqp-options` → HTTP 200 반환
  - `POST /api/recipe-test/load` → HTTP 200 또는 400 반환 (FTP 실패 시 400 허용)
  - `GET /api/recipe-test/history` → HTTP 200 반환
  - `/api/recipe-inventory/*`, `/api/recipe-file-ops/*` 경로 라우팅 동작
- **검증 방법**: `uvicorn` 기동 후 `curl` 또는 mockup 기반 pytest로 각 경로 응답 확인
- **위험도**: 낮음 (기존 핸들러 함수 변경 없음, 등록만 추가)

```
- [ ] EP-01: main.py에 include_router 추가
  - recipe_test_eqp.router (prefix="/api")
  - recipe_test_content.router (prefix="/api")
  - recipe_test_history.router (prefix="/api")
  - recipe_test_ops.router (prefix="/api")
  - recipe_inventory.router (prefix="/api")
  - recipe_file_ops.router (prefix="/api") ← 미사용 여부 확인 후 결정
```

---

### EP-02 — 저장 경로 환경변수화 (LOCAL_EDIT_BASE)

- **우선순위**: `High`
- **작업 목표**: `temp_file_store.py`의 `LOCAL_EDIT_BASE`를 환경변수 `LOCAL_EDIT_BASE`로 오버라이드 가능하게 변경하여 Windows 영속 디렉토리 지정을 가능하게 한다.
- **대상 파일**: `backend/app/services/temp_file_store.py`, `backend/.env`, `backend/.env.example`, `backend/app/config.py`
- **선행 조건**: `config.py` 존재 (✅ 완료)
- **완료 기준**:
  - `.env`에 `LOCAL_EDIT_BASE=C:\rms_data` 설정 시 해당 경로 사용
  - 환경변수 없을 때 기존 tempdir 동작 유지 (하위 호환)
- **검증 방법**: 환경변수 설정 후 history 기록, 캐시 파일 생성 경로 확인
- **위험도**: 낮음 (기본값 유지로 기존 동작 보존)

```
- [ ] EP-02: LOCAL_EDIT_BASE 환경변수 오버라이드 지원
```

---

### EP-03 — Windows 실행 스크립트 작성

- **우선순위**: `Medium`
- **작업 목표**: Windows 배포용 `.bat` 또는 `PowerShell` 스크립트 작성 (uvicorn 실행, 환경변수 주입).
- **대상 파일**: `backend/start.bat` (신규) 또는 `backend/start.ps1` (신규)
- **선행 조건**: EP-01, EP-02 완료
- **완료 기준**: Windows 환경에서 스크립트 한 번 실행으로 백엔드 기동
- **검증 방법**: 확인 필요 (사내 Windows 환경에서 직접 실행)
- **위험도**: 낮음

```
- [ ] EP-03: Windows 기동 스크립트 작성 (start.bat / start.ps1)
```

---

## 2. Frontend Implementation

### EF-01 — 미구현 API 호출 처리 (snapshot, invalidate-runtime-cache)

- **우선순위**: `Medium`
- **작업 목표**: `recipeTestApi.ts`에서 호출하는 `/api/recipe-inventory/snapshot`과 `/api/recipe-test/invalidate-runtime-cache`가 백엔드에 없어 404를 반환한다. 프론트에서 에러를 graceful하게 처리하거나, 백엔드 구현과 연계하여 해결한다.
- **대상 파일**: `frontend/src/features/recipe_test/api/recipeTestApi.ts`, `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
- **선행 조건**: 백엔드 EB-01 (누락 엔드포인트 구현) 또는 프론트 자체 fallback 처리 결정
- **완료 기준**: 해당 API 호출 실패 시 UI가 crash하지 않고 적절한 에러 메시지 표시
- **검증 방법**: 개발 서버 기동 후 해당 기능 트리거, 콘솔 에러 없음 확인
- **위험도**: 낮음

```
- [ ] EF-01: getInventoryRecipeSnapshot() / invalidateRuntimeCache() 에러 처리 추가
```

---

### EF-02 — Sidebar.vue 미사용 정리

- **우선순위**: `Low`
- **작업 목표**: `App.vue`에서 import·사용하지 않는 `Sidebar.vue`를 삭제하거나 향후 계획을 명시한다.
- **대상 파일**: `frontend/src/components/Sidebar.vue`
- **선행 조건**: 사용 계획 확인 필요
- **완료 기준**: 불필요 파일 삭제 또는 주석 명시
- **검증 방법**: `grep -r "Sidebar"` 결과 확인
- **위험도**: 낮음

```
- [ ] EF-02: Sidebar.vue 미사용 여부 확인 후 삭제 또는 유지 결정
```

---

### EF-03 — RecipeTestPage.vue 분리 (대형 파일 리팩터링)

- **우선순위**: `Low`
- **작업 목표**: `RecipeTestPage.vue` (~1500줄 이상)를 기능별 서브 컴포넌트 또는 Composable로 분리하여 유지보수성 향상.
- **대상 파일**: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
- **선행 조건**: 기능이 모두 안정화된 이후 (Phase 3 이후 권장)
- **완료 기준**: 단일 파일 500줄 이하 목표. 기존 동작 변경 없음.
- **검증 방법**: 전체 시나리오 수동 테스트 (설비 로드 → CAS/JOB/Recipe 조회 → 편집 → 이력 확인)
- **위험도**: 중간 (UI 동작 변화 없이 구조만 변경해야 함)

```
- [ ] EF-03: RecipeTestPage.vue 대형 파일 분리 (Phase 3 이후)
```

---

## 3. Backend Implementation

### EB-01 — 누락 엔드포인트 구현 (snapshot, invalidate-runtime-cache)

- **우선순위**: `Medium`
- **작업 목표**: 프론트가 호출하지만 백엔드에 없는 두 엔드포인트를 구현한다.
  1. `GET /api/recipe-inventory/snapshot` → `getInventoryRecipeSnapshot()` 호환
  2. `POST /api/recipe-test/invalidate-runtime-cache` → 인메모리 캐시(`BOOTSTRAP_CACHE`, `CAS_CACHE`, `JOB_CACHE`, `RECIPE_CACHE`, `RECIPE_SOURCE_CACHE`) 초기화
- **대상 파일**: `backend/app/api/routes/recipe_inventory.py`, `backend/app/api/routes/recipe_test_ops.py` 또는 신규 파일, `backend/app/api/routes/recipe_test_impl.py`
- **선행 조건**: EP-01 (라우터 등록) 완료
- **완료 기준**: 두 경로 모두 HTTP 200 반환. 캐시 무효화 후 재요청 시 신규 데이터 로드 확인.
- **검증 방법**: mockup 기반 pytest 또는 curl 테스트
- **위험도**: 낮음~중간 (캐시 무효화 시 FTP 재요청 부하 발생 가능)

```
- [ ] EB-01-a: GET /api/recipe-inventory/snapshot 구현
- [ ] EB-01-b: POST /api/recipe-test/invalidate-runtime-cache 구현 (인메모리 캐시 clear)
```

---

### EB-02 — 인메모리 캐시 안전성 개선

- **우선순위**: `Medium`
- **작업 목표**: `recipe_test_impl.py`의 `BOOTSTRAP_CACHE`, `CAS_CACHE`, `JOB_CACHE`, `RECIPE_CACHE`, `RECIPE_SOURCE_CACHE` dict 캐시에 TTL 및 최대 크기 제한을 추가한다.
- **대상 파일**: `backend/app/api/routes/recipe_test_impl.py`
- **선행 조건**: 없음 (`cachetools` 이미 의존성에 포함됨 — 확인 필요)
- **완료 기준**: TTL 초과 시 자동 무효화. 캐시 크기 상한 설정.
- **검증 방법**: TTL 만료 후 동일 요청 시 FTP 재조회 확인
- **위험도**: 낮음 (기존 dict를 TTLCache로 교체, 인터페이스 동일)

```
- [ ] EB-02: 인메모리 캐시에 TTLCache 또는 maxsize 적용 (cachetools 활용)
```

---

### EB-03 — SQLAlchemy Engine 싱글턴화

- **우선순위**: `Medium`
- **작업 목표**: `recipe_test_impl.py`와 `ftp_eqp_ip.py`에서 요청마다 `create_engine()`을 호출하는 패턴을 모듈 수준 싱글턴으로 변경하여 커넥션 풀을 재사용한다.
- **대상 파일**: `backend/app/services/ftp_eqp_ip.py`, `backend/app/api/routes/recipe_test_impl.py`
- **선행 조건**: 없음
- **완료 기준**: 앱 기동 시 Engine 1회 생성, 이후 재사용
- **검증 방법**: 로그에서 `create_engine` 호출 횟수 확인
- **위험도**: 낮음

```
- [ ] EB-03: create_engine() 모듈 수준 싱글턴으로 이동
```

---

### EB-04 — MongoDB 커넥션 싱글턴화

- **우선순위**: `Low`
- **작업 목표**: `ftp_credentials.py`와 `ftp_eqp_ip.py`에서 요청마다 `MongoClient()`를 생성·해제하는 패턴을 FastAPI lifespan 기반 싱글턴으로 변경한다.
- **대상 파일**: `backend/app/services/ftp_credentials.py`, `backend/app/services/ftp_eqp_ip.py`, `backend/app/main.py`
- **선행 조건**: EP-01 완료
- **완료 기준**: 앱 기동 시 MongoClient 1회 생성, shutdown 시 close
- **검증 방법**: 다수 동시 요청 시 MongoClient 인스턴스 수 확인
- **위험도**: 낮음~중간 (lifespan 패턴 도입 시 main.py 수정 필요)

```
- [ ] EB-04: MongoClient FastAPI lifespan 싱글턴으로 이동 (Phase 3 이후 권장)
```

---

## 4. Database / Migration

### ED-01 — 이력/캐시 저장 경로 영속화

- **우선순위**: `High`
- **작업 목표**: `history_service.py`, `recipe_cache_store.py`, `recipe_vm_store.py`의 저장 경로가 `tempdir` 기반이어서 재부팅 시 소실된다. EP-02에서 설정된 `LOCAL_EDIT_BASE` 환경변수를 통해 영속 디렉토리로 전환한다.
- **대상 파일**: `backend/app/services/history_service.py`, `backend/app/services/recipe_cache_store.py`, `backend/app/services/recipe_vm_store.py`, `backend/app/services/temp_file_store.py`
- **선행 조건**: EP-02 완료
- **완료 기준**: 서버 재기동 후 이전 이력과 캐시가 유지됨
- **검증 방법**: 이력 기록 → 서버 재기동 → `GET /api/recipe-test/history` 에서 이전 이력 확인
- **위험도**: 낮음 (경로 변경만, 기존 데이터 마이그레이션 불필요)

```
- [ ] ED-01-a: temp_file_store.py LOCAL_EDIT_BASE 환경변수 연동
- [ ] ED-01-b: 영속 경로 설정 후 기존 tempdir 데이터 이관 여부 결정 (확인 필요)
```

---

### ED-02 — SQLite WAL 모드 및 트랜잭션 원자성 개선

- **우선순위**: `Medium`
- **작업 목표**: `recipe_cache_store.py`에서 `store_file_version()`과 `touch_inventory_state()`가 별도 커넥션으로 실행되어 워커 중단 시 partial write가 발생할 수 있다. WAL 모드 활성화와 단일 트랜잭션으로 묶는다.
- **대상 파일**: `backend/app/services/recipe_cache_store.py`
- **선행 조건**: 없음
- **완료 기준**: `PRAGMA journal_mode=WAL` 적용. `store_file_version`과 `inventory_state` 갱신이 단일 커넥션에서 실행.
- **검증 방법**: 워커 실행 중 강제 종료 후 DB 일관성 확인
- **위험도**: 낮음~중간 (WAL 모드는 하위 호환)

```
- [ ] ED-02-a: SQLite WAL 모드 활성화 (ensure_schema에 PRAGMA 추가)
- [ ] ED-02-b: store_file_version + touch_inventory_state 단일 트랜잭션 묶기
```

---

### ED-03 — SQLite 스키마 버전 관리 도입

- **우선순위**: `Low`
- **작업 목표**: 현재 `ensure_schema()`가 `PRAGMA table_info`로 컬럼 존재 확인 후 ALTER로 컬럼을 추가하는 방식은 컬럼 삭제·타입 변경·인덱스 변경에 대응 불가하다. `schema_version` 테이블 도입으로 마이그레이션 관리.
- **대상 파일**: `backend/app/services/recipe_cache_store.py`
- **선행 조건**: ED-01, ED-02 완료
- **완료 기준**: 스키마 변경 시 버전 번호로 마이그레이션 실행 가능
- **검증 방법**: 버전 올려서 마이그레이션 실행 후 `schema_version` 테이블 확인
- **위험도**: 중간 (기존 ALTER 방식과 신규 방식 공존 필요)

```
- [ ] ED-03: schema_version 테이블 도입 및 순차 마이그레이션 구조 구현
```

---

### ED-04 — JSONL 이력을 SQLite로 이관 (검토)

- **우선순위**: `Low`
- **작업 목표**: `recipe_action_history.jsonl`은 파일 크기 무한 증가 및 전체 파일 스캔 문제가 있다. `recipe_cache.sqlite3`에 `action_history` 테이블 추가로 이관 검토.
- **대상 파일**: `backend/app/services/history_service.py`, `backend/app/services/recipe_cache_store.py`
- **선행 조건**: ED-01, ED-03 완료. 이관 결정 필요 (확인 필요)
- **완료 기준**: JSONL 대신 SQLite INSERT. `GET /api/recipe-test/history` 응답 동일.
- **검증 방법**: 이력 기록 후 JSONL 포맷과 동일한 응답 확인. LIMIT/필터 동작 확인.
- **위험도**: 중간 (기존 JSONL 데이터 마이그레이션 필요할 수 있음)

```
- [ ] ED-04: JSONL → SQLite 이관 여부 결정 및 구현 (Phase 4)
```

---

### ED-05 — PostgreSQL 쿼리 폴백 정리

- **우선순위**: `Low`
- **작업 목표**: `load_eqp_master_options()`에서 `eqp_model_bucket` / `eqp_model_bucker` 오타 컬럼을 4개 쿼리 폴백으로 시도하는 패턴을 실제 DB 컬럼명 확인 후 단일 쿼리로 정리.
- **대상 파일**: `backend/app/api/routes/recipe_test_impl.py`, `backend/app/services/ftp_eqp_ip.py`
- **선행 조건**: 실제 PostgreSQL `eqp_info` 컬럼명 확인 필요 (사내 환경 직접 확인)
- **완료 기준**: 단일 쿼리로 동작. 폴백 로직 제거.
- **검증 방법**: 설비 목록 조회 API 정상 동작 확인
- **위험도**: 낮음 (실제 컬럼명 확인 전까지 작업 금지)

```
- [ ] ED-05: eqp_model_bucket 컬럼명 확인 후 폴백 쿼리 단일화 (확인 필요)
```

---

## 5. API Contract

### EA-01 — API 경로 일관성 검증

- **우선순위**: `High`
- **작업 목표**: `recipeTestApi.ts`에 정의된 모든 API 경로가 백엔드 라우터에 실제로 등록되어 있는지 대조 검증한다.
- **대상 파일**: `frontend/src/features/recipe_test/api/recipeTestApi.ts`, 모든 `backend/app/api/routes/*.py`
- **선행 조건**: EP-01 완료
- **완료 기준**: 프론트가 호출하는 모든 경로가 백엔드에 존재. 404 없음.
- **검증 방법**: 프론트 API 함수 목록과 백엔드 라우터 경로 전체 대조 체크리스트 작성
- **위험도**: 낮음 (검증만)

```
- [ ] EA-01: 프론트-백엔드 API 경로 전체 대조 검증
```

---

### EA-02 — recipe_file_ops.py 엔드포인트 사용 여부 결정

- **우선순위**: `Medium`
- **작업 목표**: `/api/recipe-file-ops/*` 경로는 `recipeTestApi.ts`에서 호출하지 않는다. 별도 클라이언트용인지, 미사용 코드인지 확인하고 처리 방향을 결정한다.
- **대상 파일**: `backend/app/api/routes/recipe_file_ops.py`, `frontend/src/features/recipe_test/api/recipeFileOpsApi.example.ts`
- **선행 조건**: 사용 여부 확인 필요
- **완료 기준**: 사용 중이면 EP-01에 포함. 미사용이면 파일 삭제 또는 명시적 비활성화.
- **검증 방법**: `grep -r "recipe-file-ops"` 결과 전체 확인
- **위험도**: 낮음

```
- [ ] EA-02: recipe_file_ops.py 사용 여부 확인 및 처리 결정
```

---

### EA-03 — API 응답 타입 TypeScript 정의 완전성 확인

- **우선순위**: `Low`
- **작업 목표**: `recipeTestApi.ts`의 타입 정의와 실제 백엔드 응답 shape가 일치하는지 검증한다.
- **대상 파일**: `frontend/src/features/recipe_test/api/recipeTestApi.ts`, 각 route 파일의 응답 모델
- **선행 조건**: EP-01 완료
- **완료 기준**: TypeScript 컴파일 에러 없음. `vue-tsc` 통과.
- **검증 방법**: `npm run build` 에러 없음 확인
- **위험도**: 낮음

```
- [ ] EA-03: API 응답 타입 일치 여부 확인 (npm run build 기준)
```

---

## 6. File Processing / External Integration

### EX-01 — RMS_down.py 실행 자동화 (스케줄 설정)

- **우선순위**: `Medium`
- **작업 목표**: `cloud_protected_files.csv`는 `RMS_down.py` 수동 실행으로만 갱신된다. 자동 스케줄 여부를 확인하고, Windows 배포 환경에 맞게 Task Scheduler 또는 cron 설정 가이드를 문서화한다.
- **대상 파일**: `backend/app/RMS/run_RMS.sh`, 신규 `backend/app/RMS/run_RMS.bat` (필요 시)
- **선행 조건**: 스케줄 방식 결정 필요 (확인 필요)
- **완료 기준**: 매일 1회 자동 실행. Windows에서 `.bat` 또는 Task Scheduler로 동작.
- **검증 방법**: 스케줄 실행 후 CSV 수정일시 확인
- **위험도**: 낮음 (스크립트 수정만)

```
- [ ] EX-01-a: 현재 RMS_down.py 실행 주기·방식 확인 (확인 필요)
- [ ] EX-01-b: Windows Task Scheduler 또는 cron 설정 문서화
- [ ] EX-01-c: run_RMS.sh의 절대 경로 하드코딩 제거 (상대 경로 또는 환경변수 사용)
```

---

### EX-02 — FTP rename 원자성 개선 (RNFR/RNTO)

- **우선순위**: `Low`
- **작업 목표**: 현재 파일 이름 변경이 `copy(STOR) + delete` 패턴이어서 비원자적이다. FTP 프로토콜의 `RNFR`/`RNTO` 명령을 사용하면 FTP 서버에서 원자적으로 이름 변경 가능 여부를 설비 FTP 서버가 지원하는지 확인 후 적용한다.
- **대상 파일**: `backend/app/services/file_ops_service.py`
- **선행 조건**: 설비 FTP 서버의 RNFR/RNTO 지원 여부 확인 (확인 필요)
- **완료 기준**: 이름 변경 시 RNFR/RNTO 사용. copy+delete 패턴 제거.
- **검증 방법**: 사내 설비 FTP 실제 테스트 (사내 환경 직접 실행 필요)
- **위험도**: 중간 (FTP 서버가 RNFR/RNTO를 지원하지 않을 경우 rollback 필요)

```
- [ ] EX-02: 설비 FTP RNFR/RNTO 지원 확인 후 rename 원자성 개선 (Phase 4)
```

---

### EX-03 — 백그라운드 워커 운영 상태 확인

- **우선순위**: `Medium`
- **작업 목표**: `recipe_inventory_worker.py`의 현재 운영 여부 및 실행 방식을 확인한다. Windows 배포 시 서비스로 등록하는 방안을 검토한다.
- **대상 파일**: `tools/recipe_inventory_worker.py`
- **선행 조건**: 사내 환경 확인 필요
- **완료 기준**: 워커가 Windows 재기동 후 자동 시작되거나, 수동 실행 절차가 문서화됨.
- **검증 방법**: 워커 실행 후 SQLite `inventory_state` 갱신 확인
- **위험도**: 낮음

```
- [ ] EX-03: 워커 운영 현황 확인 및 Windows 서비스 등록 방안 검토
```

---

## 7. Error Handling / Logging

### EH-01 — 구조화 로깅 도입

- **우선순위**: `Medium`
- **작업 목표**: 현재 백엔드 코드에 `print()` 또는 로깅이 산발적으로 존재한다. FastAPI의 uvicorn 로거를 통해 최소한의 요청/에러 로그를 구조화한다.
- **대상 파일**: `backend/app/main.py`, 공통 미들웨어 (신규 가능)
- **선행 조건**: EP-01 완료
- **완료 기준**: 모든 API 요청에 대해 메서드·경로·상태코드·소요시간 로그 출력
- **검증 방법**: 서버 로그에서 요청별 로그 라인 확인
- **위험도**: 낮음

```
- [ ] EH-01: 요청/에러 구조화 로깅 미들웨어 추가
```

---

### EH-02 — FTP 연결 실패 시 에러 메시지 일관성

- **우선순위**: `Low`
- **작업 목표**: FTP 연결 실패 시 `FTP 550:` 접두사 포맷 이외의 raw 에러가 노출되는 케이스가 있는지 검토하고, 일관된 에러 포맷을 보장한다.
- **대상 파일**: `backend/app/services/file_ops_service.py`, `backend/app/api/routes/recipe_test_ops.py`
- **선행 조건**: 없음
- **완료 기준**: 모든 FTP 에러가 `format_ftp_error()` 경유. 스택 트레이스 미노출.
- **검증 방법**: 존재하지 않는 설비 FTP 연결 시도 후 응답 확인 (mockup 환경)
- **위험도**: 낮음

```
- [ ] EH-02: FTP 에러 포맷 일관성 검토 및 보완
```

---

## 8. Security / Config

### ES-01 — DB 인증정보 환경변수화 ✅ (완료)

- **우선순위**: `Critical` → **완료**
- **대상 파일**: `backend/app/services/ftp_eqp_ip.py`, `backend/app/api/routes/recipe_test_impl.py`, `backend/app/services/ftp_credentials.py`, `backend/app/config.py`
- **완료 기준**: ✅ 세 파일 모두 `from app.config import POSTGRES_URL, MONGO_URL` 사용. 소스코드에 비밀번호 없음.

```
- [x] ES-01: DB 인증정보 .env 이동 (완료)
```

---

### ES-02 — .env 파일 .gitignore 등록 ✅ (완료)

- **우선순위**: `Critical` → **완료**
- **완료 기준**: ✅ `.gitignore`에 `.env` 포함. `.env.example` 커밋 가능.

```
- [x] ES-02: .env .gitignore 등록 (완료)
```

---

### ES-03 — 인증/인가 미들웨어 도입 검토

- **우선순위**: `Low`
- **작업 목표**: 현재 모든 API 엔드포인트가 인증 없이 호출 가능하다. 사내망 전용 운영으로 현재는 허용 범위로 판단되나, 장기적으로 API 키 또는 사내 SSO 연동을 검토한다.
- **대상 파일**: `backend/app/main.py` (미들웨어 추가)
- **선행 조건**: 인증 요구사항 결정 필요 (확인 필요 — 사내망 전용이면 IP 기반 허용으로 충분할 수 있음)
- **완료 기준**: (결정 후 정의)
- **검증 방법**: (결정 후 정의)
- **위험도**: 높음 (잘못된 인증 도입 시 기존 운영 중단 가능)

```
- [ ] ES-03: 인증/인가 요구사항 확인 후 구현 결정 (Phase 4, 확인 필요)
```

---

### ES-04 — actorName 서버 검증

- **우선순위**: `Low`
- **작업 목표**: 이력의 `actorName`, `actorTeam`이 프론트 입력값 그대로 기록되어 위조 가능하다. ES-03 인증 도입 후 서버 토큰에서 추출하도록 변경.
- **대상 파일**: `backend/app/services/history_service.py`, 모든 ops 라우터
- **선행 조건**: ES-03 완료
- **완료 기준**: actorName이 인증 토큰에서 추출됨. 프론트 입력값 무시.
- **위험도**: 낮음 (ES-03 선행 필요)

```
- [ ] ES-04: actorName 서버 측 검증 (ES-03 완료 후, Phase 4)
```

---

## 9. Test / QA

### ET-01 — 핵심 API 라우터 mockup 테스트 완성

- **우선순위**: `High`
- **작업 목표**: EP-01 완료 후 등록된 모든 라우터에 대해 `mockup_data.py` 기반 pytest 테스트를 작성한다. 사내 DB/FTP 없이 동작 가능해야 한다.
- **대상 파일**: `backend/tests/test_mockup_routes.py`, `backend/tests/mockup_data.py`
- **선행 조건**: EP-01 완료
- **완료 기준**:
  - `GET /api/recipe-test/eqp-options` 테스트
  - `GET /api/recipe-test/history` 테스트
  - `POST /api/recipe-test/cas/save` 테스트
  - `POST /api/recipe-test/job/save` 테스트
  - pytest 전체 통과
- **검증 방법**: `pytest backend/tests/` 실행 → 모두 PASSED
- **위험도**: 낮음

```
- [ ] ET-01-a: eqp-options 엔드포인트 mockup 테스트
- [ ] ET-01-b: history 엔드포인트 mockup 테스트
- [ ] ET-01-c: cas/save, job/save mockup 테스트
- [ ] ET-01-d: recipe-content mockup 테스트 (pol/con 디코더 포함)
```

---

### ET-02 — Windows 호환성 검증

- **우선순위**: `High`
- **작업 목표**: Windows 환경에서 실제 백엔드 기동 및 기본 API 응답을 확인한다. 경로 구분자·인코딩·tempdir 경로 이슈를 사전 발굴한다.
- **대상 파일**: 전체 백엔드 코드 (경로 처리 관련)
- **선행 조건**: EP-03 (Windows 기동 스크립트) 완료
- **완료 기준**: Windows에서 uvicorn 기동 성공. 헬스체크 200 반환. 주요 API 에러 없음.
- **검증 방법**: 사내 Windows 환경 직접 실행 (사내 환경 필요)
- **위험도**: 중간 (발견되는 이슈에 따라 추가 수정 필요)

```
- [ ] ET-02: Windows 환경 백엔드 기동 및 기본 API 검증 (사내 환경 직접 실행)
```

---

### ET-03 — FTP 통합 테스트 (사내 환경)

- **우선순위**: `Medium`
- **작업 목표**: 실제 설비 FTP 연결 후 CAS 목록 조회·내용 파싱·이력 기록까지 엔드-투-엔드 시나리오를 검증한다.
- **대상 파일**: 없음 (사내 환경 직접 실행)
- **선행 조건**: EP-01, ES-01 완료. 사내망 접속 가능 환경.
- **완료 기준**: 시나리오 1~5 (PRD §5) 모두 정상 동작
- **검증 방법**: 사내 Windows 환경에서 실제 설비 대상 수동 테스트
- **위험도**: 높음 (실제 FTP 파일 조작 포함 — 테스트 전용 설비 사용 권장)

```
- [ ] ET-03: 사내 환경 FTP 통합 테스트 (시나리오 1~5 수동 검증)
```

---

### ET-04 — 엔드포인트 커버리지 체크리스트

- **우선순위**: `Medium`
- **작업 목표**: PRD §7.1의 전체 엔드포인트 목록을 기준으로 mockup 또는 실환경 테스트 커버리지 현황을 추적한다.

| 엔드포인트 | mockup 테스트 | 실환경 테스트 |
|-----------|-------------|-------------|
| GET /api/recipe-test/eqp-options | - [ ] | - [ ] |
| POST /api/recipe-test/load | - [ ] | - [ ] |
| GET /api/recipe-test/cas-content | - [ ] | - [ ] |
| GET /api/recipe-test/job-content | - [ ] | - [ ] |
| GET /api/recipe-test/recipe-content | - [ ] | - [ ] |
| GET /api/recipe-test/recipe-source-list | - [ ] | - [ ] |
| GET /api/recipe-test/history | - [ ] | - [ ] |
| POST /api/recipe-test/cas/save | - [ ] | - [ ] |
| POST /api/recipe-test/cas/persist | - [ ] | - [ ] |
| POST /api/recipe-test/job/save | - [ ] | - [ ] |
| POST /api/recipe-test/job/persist | - [ ] | - [ ] |
| POST /api/recipe-test/recipe/clone | - [ ] | - [ ] |
| POST /api/recipe-test/file/rename | - [ ] | - [ ] |
| POST /api/recipe-test/file/delete | - [ ] | - [ ] |
| POST /api/recipe-test/transfer | - [ ] | - [ ] |
| GET /api/recipe-inventory/entries | - [ ] | - [ ] |
| GET /api/recipe-inventory/failures | - [ ] | - [ ] |
| GET /api/recipe-inventory/latest-version | - [ ] | - [ ] |
| GET /api/recipe-inventory/state | - [ ] | - [ ] |

```
- [ ] ET-04: 엔드포인트 커버리지 체크리스트 관리
```

---

## 10. Deployment / Operation

### ED-OP-01 — 배포 절차 문서화

- **우선순위**: `High`
- **작업 목표**: Windows 환경 최초 배포 절차를 문서화한다. `.env` 설정, 의존성 설치, 서버 기동, 워커 기동 순서를 명시한다.
- **대상 파일**: 신규 운영 문서 (이 문서 범위 외 — 확인 필요)
- **선행 조건**: EP-01, EP-02, EP-03 완료
- **완료 기준**: 신규 Windows 환경에서 문서만 보고 배포 가능
- **검증 방법**: 문서 기반 실제 배포 시도
- **위험도**: 낮음

```
- [ ] ED-OP-01: Windows 배포 절차 문서화 (README 또는 별도 ops 문서)
```

---

### ED-OP-02 — 프론트엔드 빌드 및 백엔드 정적 서빙 연동

- **우선순위**: `Medium`
- **작업 목표**: 프로덕션에서 FastAPI가 프론트 `dist/`를 정적으로 서빙하는 방식으로 통합. `API_BASE = ''` (상대 URL)이므로 동일 오리진 필수.
- **대상 파일**: `backend/app/main.py`, `frontend/vite.config.ts`
- **선행 조건**: EP-01 완료. 배포 방식 결정 필요 (확인 필요).
- **완료 기준**: 단일 포트로 프론트+백엔드 서빙. CORS 이슈 없음.
- **검증 방법**: 빌드된 프론트 접속 후 API 호출 정상 동작 확인
- **위험도**: 낮음~중간

```
- [ ] ED-OP-02: 프론트 dist/ 정적 서빙 또는 리버스 프록시 설정 결정
```

---

### ED-OP-03 — 인벤토리 워커 Windows 서비스 등록

- **우선순위**: `Medium`
- **작업 목표**: `recipe_inventory_worker.py`를 Windows 서비스로 등록하여 서버 재기동 후 자동 시작.
- **대상 파일**: `tools/recipe_inventory_worker.py`
- **선행 조건**: EX-03 완료
- **완료 기준**: Windows Task Scheduler 또는 NSSM으로 서비스 등록. 서버 재기동 후 자동 실행.
- **검증 방법**: 재기동 후 SQLite 인벤토리 갱신 확인
- **위험도**: 낮음

```
- [ ] ED-OP-03: 워커 Windows 서비스 등록 절차 수립
```

---

## 11. Refactoring / Cleanup

### ER-01 — recipe_test.py 레거시 파일 처리

- **우선순위**: `High`
- **작업 목표**: `backend/app/api/routes/recipe_test.py`는 구 모놀리식 라우터 파일로, 현재 `main.py`에 등록되지 않은 상태다. `PROCESS_EQP_SNAPSHOT_HASH` 등 신 파일들과 중복되는 로직을 확인하고 삭제하거나 명시적으로 비활성화한다.
- **대상 파일**: `backend/app/api/routes/recipe_test.py`
- **선행 조건**: `PROCESS_EQP_SNAPSHOT_HASH` 동등 기능이 신 파일에 구현되었는지 확인
- **완료 기준**: `recipe_test.py` 삭제 또는 명시적 deprecation 주석 추가. 신 파일들이 모든 기능을 포함.
- **검증 방법**: 삭제 후 전체 pytest 통과. 신 파일에 누락 기능 없음 확인.
- **위험도**: 중간 (`PROCESS_EQP_SNAPSHOT_HASH` 기능 누락 가능성 — 먼저 검토 필요)

```
- [ ] ER-01-a: recipe_test.py의 PROCESS_EQP_SNAPSHOT_HASH 기능 신 파일 포함 여부 확인
- [ ] ER-01-b: recipe_test.py 삭제 또는 비활성화
```

---

### ER-02 — db.py 레거시 처리

- **우선순위**: `Low`
- **작업 목표**: `backend/db.py`는 `main.py`의 `GET /api/recipe-units`에서만 사용하는 레거시 PostgreSQL 직접 연결 모듈이다. `GET /api/recipe-units`의 실제 사용 여부 확인 후 처리.
- **대상 파일**: `backend/db.py`, `backend/app/main.py`
- **선행 조건**: `core.recipe_unit` 테이블 실제 존재 여부 확인 (확인 필요)
- **완료 기준**: 미사용이면 `GET /api/recipe-units` 및 `db.py` 삭제. 사용 중이면 `config.py` 기반으로 리팩터링.
- **검증 방법**: 삭제 후 나머지 기능 정상 동작 확인
- **위험도**: 낮음

```
- [ ] ER-02: db.py 및 GET /api/recipe-units 레거시 여부 확인 후 처리
```

---

### ER-03 — recipe_history.sqlite3 용도 확인 및 정리

- **우선순위**: `Low`
- **작업 목표**: `backend/app/data/recipe_history.sqlite3`가 코드에서 참조되지 않는다. 레거시 파일이면 삭제.
- **대상 파일**: `backend/app/data/recipe_history.sqlite3`
- **선행 조건**: 없음
- **완료 기준**: 파일 삭제 또는 용도 명시
- **검증 방법**: `grep -r "recipe_history.sqlite3" backend/` 결과 없음 확인
- **위험도**: 낮음

```
- [ ] ER-03: recipe_history.sqlite3 용도 확인 및 필요 시 삭제
```

---

### ER-04 — pol_con_encoder.py 역할 확인

- **우선순위**: `Low`
- **작업 목표**: `pol_con_encoder.py`가 현재 코드에서 import되는지 확인한다. 미사용이면 문서화, 사용 중이면 현황 파악.
- **대상 파일**: `backend/app/services/pol_con_encoder.py`
- **선행 조건**: 없음 (`pol_con_decoder.py`, `pol_con_maps.py`는 수정 금지)
- **완료 기준**: 사용 여부 및 역할 명확화
- **검증 방법**: `grep -r "pol_con_encoder"` 결과 확인
- **위험도**: 낮음

```
- [ ] ER-04: pol_con_encoder.py import 여부 확인 및 역할 문서화
```

---

## 12. Documentation

### EDoc-01 — Open Questions 해소 추적

- **우선순위**: `High`
- **작업 목표**: PRD §13의 Open Questions를 우선순위별로 해소하고 결과를 PRD에 반영한다.

| QID | 질문 | 우선순위 | 상태 |
|-----|------|----------|------|
| Q-01 | `core.recipe_unit` 테이블 실제 존재 여부 | 높음 | - [ ] 확인 필요 |
| Q-02 | `recipe_test.py` 실제 사용 여부 | 높음 | - [ ] 확인 필요 |
| Q-03 | `recipe_history.sqlite3` 용도 | 중간 | - [ ] 확인 필요 |
| Q-04 | `recipe_file_ops.py` 사용 시나리오 | 중간 | - [ ] 확인 필요 |
| Q-05 | 이력/캐시 영속성 요구사항 | 높음 | - [ ] 확인 필요 |
| Q-06 | 인증/인가 요구사항 | 중간 | - [ ] 확인 필요 |
| Q-07 | `pol_con_encoder.py` 실제 사용 여부 | 중간 | - [ ] 확인 필요 |
| Q-08 | RMS_down.py 실행 주기·방식 | 중간 | - [ ] 확인 필요 |
| Q-09 | Transfer 호환성 서버 검증 필요 여부 | 중간 | - [ ] 확인 필요 |
| Q-10 | metrologyRecipe 경로가 파일인지 디렉토리인지 | 낮음 | - [ ] 확인 필요 |
| Q-11 | 백그라운드 워커 현재 운영 여부 | 낮음 | - [ ] 확인 필요 |
| Q-12 | Sidebar.vue 향후 사용 계획 | 낮음 | - [ ] 확인 필요 |

```
- [ ] EDoc-01: Open Questions Q-01, Q-02, Q-05 해소 (사내 환경 확인 필요)
- [ ] EDoc-01: PRD 갱신 (확인된 항목 반영)
```

---

### EDoc-02 — ERD 확인 필요 항목 해소

- **우선순위**: `Medium`
- **작업 목표**: ERD §10의 "확인 필요" 항목들을 실제 DB 확인으로 해소하고 ERD를 갱신한다.

```
- [ ] EDoc-02: eqp_info.eqp_id = FTP_STATUS.EQPID 1:1 관계 실제 확인
- [ ] EDoc-02: eqp_model_bucket vs eqp_model_bucker 실제 컬럼명 확인
- [ ] EDoc-02: inventory_failures.resolved 자동 해제 시점 UI 동작 확인
- [ ] EDoc-02: ERD 갱신 (확인된 항목 반영)
```

---

## 전체 우선순위 요약

### Critical (즉시 — Phase 1)

| ID | 항목 | 상태 |
|----|------|------|
| ES-01 | DB 인증정보 .env 이동 | ✅ 완료 |
| ES-02 | .env .gitignore 등록 | ✅ 완료 |
| EP-01 | main.py 서브라우터 등록 | ❌ 미완료 |

### High (Phase 1~2)

| ID | 항목 | 상태 |
|----|------|------|
| EP-02 | LOCAL_EDIT_BASE 환경변수화 | ❌ 미완료 |
| ED-01 | 이력/캐시 저장 경로 영속화 | ❌ 미완료 |
| EA-01 | 프론트-백엔드 API 경로 대조 검증 | ❌ 미완료 |
| ER-01 | recipe_test.py 레거시 처리 | ❌ 미완료 |
| ET-01 | 핵심 API mockup 테스트 완성 | ❌ 미완료 |
| ET-02 | Windows 호환성 검증 | ❌ 미완료 |
| ED-OP-01 | 배포 절차 문서화 | ❌ 미완료 |
| EDoc-01 | Open Questions Q-01·Q-02·Q-05 해소 | ❌ 미완료 |

### Medium (Phase 2~3)

| ID | 항목 | 상태 |
|----|------|------|
| EP-03 | Windows 기동 스크립트 | ❌ 미완료 |
| EB-01 | 누락 엔드포인트 구현 | ❌ 미완료 |
| EB-02 | 인메모리 캐시 TTLCache 적용 | ❌ 미완료 |
| EB-03 | SQLAlchemy Engine 싱글턴화 | ❌ 미완료 |
| ED-02 | SQLite WAL 모드·트랜잭션 개선 | ❌ 미완료 |
| EA-02 | recipe_file_ops.py 사용 여부 결정 | ❌ 미완료 |
| EF-01 | 미구현 API 호출 에러 처리 | ❌ 미완료 |
| EH-01 | 구조화 로깅 미들웨어 | ❌ 미완료 |
| ET-03 | FTP 통합 테스트 (사내) | ❌ 미완료 |
| ET-04 | 엔드포인트 커버리지 체크리스트 | ❌ 미완료 |
| EX-01 | RMS_down.py 자동화 | ❌ 미완료 |
| EX-03 | 워커 운영 현황 확인 | ❌ 미완료 |
| ED-OP-02 | 프론트 정적 서빙 연동 | ❌ 미완료 |
| ED-OP-03 | 워커 Windows 서비스 등록 | ❌ 미완료 |
| EDoc-02 | ERD 확인 필요 항목 해소 | ❌ 미완료 |

### Low (Phase 3~4)

| ID | 항목 | 상태 |
|----|------|------|
| EB-04 | MongoDB 커넥션 싱글턴화 | ❌ 미완료 |
| ED-03 | SQLite 스키마 버전 관리 | ❌ 미완료 |
| ED-04 | JSONL → SQLite 이관 검토 | ❌ 미완료 |
| ED-05 | PG 쿼리 폴백 정리 | ❌ 미완료 |
| EA-03 | API 응답 타입 TypeScript 정의 검증 | ❌ 미완료 |
| EX-02 | FTP RNFR/RNTO 원자성 개선 | ❌ 미완료 |
| EH-02 | FTP 에러 포맷 일관성 | ❌ 미완료 |
| ES-03 | 인증/인가 미들웨어 도입 검토 | ❌ 미완료 |
| ES-04 | actorName 서버 검증 | ❌ 미완료 |
| EF-02 | Sidebar.vue 미사용 정리 | ❌ 미완료 |
| EF-03 | RecipeTestPage.vue 파일 분리 | ❌ 미완료 |
| ER-02 | db.py 레거시 처리 | ❌ 미완료 |
| ER-03 | recipe_history.sqlite3 정리 | ❌ 미완료 |
| ER-04 | pol_con_encoder.py 역할 확인 | ❌ 미완료 |

---

## 13. Windows 배포 및 운영 환경 검증 (WD)

> 목표: Mac→Ubuntu 개발 환경에서 Windows 최종 배포 환경으로 전환 시 발생할 수 있는 호환성 이슈를 사전 발굴하고, 안정적인 운영 모니터링·롤백 계획을 수립한다. Phase 3에서 본격 추진하되, 코드 호환성은 Phase 2부터 점검.

### WD-01 — Windows 경로·인코딩 호환성 검증

- **우선순위**: `High`
- **작업 목표**: Windows 환경의 경로 구분자(역슬래시 vs 슬래시), 경로 길이 제한(260자), 인코딩(UTF-8 vs CP949), 줄바꿈(LF vs CRLF) 문제를 코드 리뷰로 사전 발굴한다.
- **대상 파일**: 
  - `backend/app/services/temp_file_store.py` (경로 처리)
  - `backend/app/services/recipe_cache_store.py` (SQLite 경로, JSONL 파일)
  - `backend/app/services/file_ops_service.py` (FTP 경로 정규화)
  - `backend/tools/recipe_inventory_worker.py` (로그 경로)
- **선행 조건**: EP-02 (LOCAL_EDIT_BASE 환경변수화) 완료
- **완료 기준**:
  - `os.path.join()` 또는 `pathlib.Path` 사용 확인 (경로 분리자 자동 처리)
  - 경로 길이 260자 초과 케이스 처리 (예: 긴 설비명 + 깊은 폴더 구조)
  - 파일 인코딩 명시 (open(..., encoding='utf-8'))
  - JSONL 파일 CRLF 처리 (splitlines() 사용 확인)
  - FTP 경로 정규화 (역슬래시 → 슬래시 통일)
- **검증 방법**: 
  - 코드 리뷰: `grep -n "os.path" / "Path(" / "open(" 패턴 확인
  - 정적 분석: hardcoded 슬래시 (`"/tmp"`, `"C:\\"` 등) 탐지
- **위험도**: 중간 (경로 처리 미흡 시 파일 생성 실패 또는 이력 손실)

```
- [ ] WD-01-a: temp_file_store.py 경로 처리 pathlib 또는 os.path.join 사용 여부 검증
- [ ] WD-01-b: recipe_cache_store.py SQLite/JSONL 파일 경로 길이 260자 제한 영향도 검토
- [ ] WD-01-c: JSONL 줄 파싱에서 CRLF 처리 (splitlines() 사용 여부 확인)
- [ ] WD-01-d: file_ops_service.py FTP 경로 정규화 (pathlib.PurePath.as_posix() 또는 normpath 사용)
- [ ] WD-01-e: 파일 읽기/쓰기 시 encoding='utf-8' 명시 여부 확인 및 보완
```

---

### WD-02 — 배포 전 자동 호환성 검사 스크립트

- **우선순위**: `Medium`
- **작업 목표**: Windows 배포 전 자동 검사 스크립트를 작성하여 코드상 경로 이슈, 인코딩 선언 누락, hardcoded 절대 경로 등을 사전 발굴한다.
- **대상 파일**: `backend/scripts/windows-compatibility-check.py` (신규)
- **선행 조건**: 없음
- **완료 기준**:
  - 스크립트 실행 후 자동 검사:
    1. hardcoded 슬래시 탐지 (`/tmp`, `/home` 등)
    2. 파일 open() 시 encoding 명시 여부 (UTF-8 강제)
    3. JSONL 파싱 시 `splitlines()` 사용 확인
    4. FTP 경로 역슬래시 사용 탐지
    5. `tempfile.gettempdir()` 사용 여부 (Windows temp 지원)
  - 결과: CSV 또는 JSON 레포트로 고위험·중위험·저위험 분류
- **검증 방법**: 스크립트 실행 후 발견된 이슈 목록 생성
- **위험도**: 낮음

```
- [ ] WD-02: Windows 호환성 자동 검사 스크립트 작성 (경로, 인코딩, hardcoding)
```

---

### WD-03 — Windows 배포 체크리스트 (초기 배포)

- **우선순위**: `High`
- **작업 목표**: 신규 Windows 환경에서 최초 배포 시 필요한 사전 준비 및 배포 단계를 마크다운 체크리스트로 정의한다.
- **대상 파일**: `docs/deployment-windows.md` (신규)
- **선행 조건**: EP-03 (Windows 기동 스크립트) 완료
- **완료 기준**: 체크리스트 문서 작성. 신규 Windows 담당자가 문서만으로 배포 가능.
- **체크리스트 샘플** (상세 내용은 문서에 포함):

```markdown
## Windows 초기 배포 체크리스트

### Phase 1: 환경 준비 (선행 설치)
- [ ] Python 3.10+ 설치 (python --version)
- [ ] Node.js 18+ 설치 (node --version)
- [ ] PostgreSQL 클라이언트 설치 (psql.exe 테스트)
- [ ] Git 설치 (선택사항)

### Phase 2: 디렉토리 구성
- [ ] C:\ProgramData\RecipeRMS\ 생성 (데이터 디렉토리)
- [ ] C:\ProgramData\RecipeRMS\logs\ 생성
- [ ] C:\ProgramData\RecipeRMS\data\ 생성
- [ ] C:\app\recipe\ 소스코드 배포

### Phase 3: 백엔드 배포
- [ ] python -m venv venv
- [ ] venv\Scripts\pip.exe install -r requirements.txt
- [ ] .env 파일 생성 및 사내 DB 자격증명 입력
- [ ] netstat -an | findstr :8000 (포트 미사용 확인)
- [ ] start.bat 실행 → http://localhost:8000/api/recipe-test/eqp-options 200 응답 확인

### Phase 4: 프론트엔드 빌드
- [ ] npm install
- [ ] npm run build (dist 생성)
- [ ] 정적 파일 배포 (FastAPI 또는 Nginx로 서빙)

### Phase 5: 기능 검증
- [ ] 설비 로드 (드롭다운 100+ 표시)
- [ ] CAS/JOB/Recipe 조회 (FTP 성공)
- [ ] 파일 편집 및 저장
- [ ] 이력 조회
- [ ] 캐시 히트 (2회 조회 시 응답 시간 비교)

### Phase 6: Windows 서비스 등록 (선택)
- [ ] NSSM 또는 Task Scheduler로 자동 시작 설정
- [ ] 재부팅 후 서비스 자동 시작 확인

### Phase 7: 모니터링 설정
- [ ] Python logging config 활성화 (C:\ProgramData\RecipeRMS\logs\)
- [ ] 에러 알림 설정 (선택)
```

- **위험도**: 낮음

```
- [ ] WD-03: Windows 배포 체크리스트 문서 작성 (docs/deployment-windows.md)
```

---

### WD-04 — 성능 기준선 (Baseline) 설정

- **우선순위**: `Medium`
- **작업 목표**: Windows 배포 후 정상 운영 기준을 정량적으로 정의한다. 향후 성능 저하 감지 시 비교 대상.
- **대상 파일**: 없음 (측정 및 문서화)
- **선행 조건**: WD-03 (배포 완료)
- **완료 기준**:
  - 초기 배포 후 다음 메트릭 측정 및 기록:
    1. **API 응답 시간**: 설비 100개 로드 시 `GET /api/recipe-test/eqp-options` < 2초
    2. **캐시 효율**: 동일 설비 CAS 2회 연속 조회 시 2배 이상 빠름
    3. **메모리**: 기동 후 기본값 (예: 100MB). 24시간 후 < 105MB (5% 증가 허용)
    4. **FTP 동시 접근**: 사용자 5명 동시 조회 시 락 에러 0건
    5. **워커 처리**: 인벤토리 동기화 1시간 내 완료

```
- [ ] WD-04: 초기 배포 후 성능 기준선 측정 및 기록
```

---

### WD-05 — 운영 환경 모니터링·로깅 설정

- **우선순위**: `High`
- **작업 목표**: Windows 배포 후 지속적인 모니터링을 위해 로그 수집·로테이션을 정의한다.
- **대상 파일**: 
  - `backend/app/main.py` (logging 미들웨어 추가)
  - `docs/monitoring-windows.md` (신규)
- **선행 조건**: WD-03 (배포 완료), EH-01 (구조화 로깅) 완료 시 강화
- **완료 기준**:
  1. **로그 파일**: C:\ProgramData\RecipeRMS\logs\ 에 app.log, error.log 생성
  2. **로테이션**: 14일 이상 로그 자동 삭제 (또는 아카이브)
  3. **에러 분리**: ERROR 이상은 error.log에 별도 기록
  4. **응답 시간**: 10초 이상 요청을 WARN 레벨로 기록

```
- [ ] WD-05: Python logging 구성 (파일 기반, 일일 로테이션, 에러 분리)
```

---

### WD-06 — 데이터 백업 및 롤백 계획

- **우선순위**: `High`
- **작업 목표**: 배포 실패 또는 데이터 손상 시 빠른 복구를 위해 백업·롤백 절차를 정의한다.
- **대상 파일**: 
  - `docs/backup-restore-windows.md` (신규)
  - `backend/scripts/backup.bat` (신규 — 자동화 선택)
- **선행 조건**: WD-03 (배포 완료)
- **완료 기준**:

```markdown
## Windows 백업 전략

### 백업 대상
1. **소스코드**: 배포 전 이전 버전 사본 유지 (C:\app\recipe-v1.0\, C:\app\recipe-v1.1\ 등)
2. **SQLite 캐시**: daily snapshot (C:\ProgramData\RecipeRMS\backup\recipe_cache.sqlite3.2026-05-18)
3. **JSONL 이력**: 월별 아카이브 (recipe_action_history.202605.jsonl)
4. **.env 파일**: 암호화된 위치에 복사

### 롤백 절차
1. 서비스 중지 (start.bat 콘솔 종료 또는 작업 관리자)
2. 이전 버전으로 변경 (C:\app\recipe-v1.0\으로 이동 또는 git checkout)
3. 데이터 복구 (필요 시 SQLite/JSONL 백업에서 복사)
4. 서비스 재시작

### 자동화 (선택)
- Task Scheduler로 daily 백업 스크립트 실행
- 소요 시간: ~ 1분 (네트워크 드라이브에 저장 시 5분)
```

```
- [ ] WD-06-a: 백업 전략 문서화 (소스, 데이터, 설정)
- [ ] WD-06-b: 롤백 절차 정의 및 테스트 환경에서 연습
- [ ] WD-06-c: 자동화 스크립트 작성 (backup.bat)
```

---

### WD-07 — 사전 배포 최종 체크 (배포 게이트)

- **우선순위**: `Medium`
- **작업 목표**: 실제 Windows 배포 전 최종 점검을 통해 배포 리스크를 최소화한다.
- **대상 파일**: 없음 (체크리스트)
- **선행 조건**: ET-02 (Windows 호환성), WD-02 (자동 검사)
- **완료 기준**:

```markdown
## 배포 전 최종 체크 (Go/No-Go Decision)

### 코드 품질 (No-Go 기준)
- [ ] WD-02 스크립트 실행 → 고위험 이슈 0건
- [ ] 경로 hardcoding 0건
- [ ] encoding 미지정 파일 I/O 0건

### 테스트 완료
- [ ] pytest mockup 전체 통과
- [ ] Windows 환경에서 start.bat 기동 성공
- [ ] GET /api/recipe-test/eqp-options → 200 응답
- [ ] npm run build 성공

### 배포 준비
- [ ] .env.prod 파일 사내 DB 자격증명으로 작성
- [ ] 백업 전략 수립 및 첫 백업 수행
- [ ] 롤백 절차 테스트 완료 (테스트 환경)
- [ ] 성능 기준선 기록 (WD-04)

### 운영 준비
- [ ] 로그 디렉토리 C:\ProgramData\RecipeRMS\logs\ 사전 생성 및 권한 설정
- [ ] 에러 알림 채널 확인 (슬랙/이메일)
- [ ] 운영 담당자 ON-CALL 연락처 확인
```

```
- [ ] WD-07: 배포 전 최종 체크리스트 작성 및 확인
```

---

### WD-08 — 배포 후 정기 리뷰 (Post-Deployment Review)

- **우선순위**: `Medium`
- **작업 목표**: 배포 후 1주, 1개월 시점에 정기적으로 시스템 상태를 검토하고 개선사항을 기록한다.
- **대상 파일**: 없음 (정기 리뷰)
- **선행 조건**: WD-03 (배포 완료) + 실제 운영 기간
- **완료 기준**:

```markdown
## 배포 후 1주 점검 (Day 7)
- [ ] 에러 로그 검토 (발생한 이슈 분류 및 우선순위)
- [ ] 성능 메트릭 재측정 (응답 시간, 메모리 사용량)
- [ ] 사용자 피드백 수집 (속도, UI 문제 등)
- [ ] 긴급 버그 패치 판단

## 배포 후 1개월 점검 (Day 30)
- [ ] 전체 기능 재검증 (모든 시나리오 수동 테스트)
- [ ] 데이터 일관성 확인 (SQLite, JSONL)
- [ ] 캐시 효율 분석 (히트율 > 70% 목표)
- [ ] FTP 연결 안정성 (실패율 < 1% 목표)
- [ ] 백업 복구 테스트 (1회 실행)
- [ ] 성능 기준선과 비교 (응답 시간 +20% 이상이면 최적화 필요)
- [ ] 향후 개선사항 제안 (캐시 정책, 워커 주기 등)
```

```
- [ ] WD-08: 배포 후 정기 리뷰 프로세스 정의 (1주, 1개월)
```

---

## 전체 우선순위 요약 (WD 섹션 추가)

| ID | 항목 | 우선순위 | Phase |
|----|------|---------|-------|
| WD-01 | Windows 경로·인코딩 호환성 검증 | High | Phase 2 |
| WD-02 | 자동 호환성 검사 스크립트 | Medium | Phase 2 |
| WD-03 | Windows 배포 체크리스트 | High | Phase 3 |
| WD-04 | 성능 기준선 설정 | Medium | Phase 3 |
| WD-05 | 모니터링·로깅 설정 | High | Phase 3 |
| WD-06 | 백업 및 롤백 계획 | High | Phase 3 |
| WD-07 | 배포 전 최종 체크 | Medium | Phase 3 |
| WD-08 | 배포 후 정기 리뷰 | Medium | Phase 3+ |

---

## 진행 금지 제약

- `pol_con_decoder.py`, `pol_con_maps.py` 수정 절대 금지 (CLAUDE.md 명시)
- 실제 사내 DB / FTP 직접 연결 불가 (사외 환경) → mockup 기반 검증
- 소스코드 수정은 이 문서에 명시된 대상 파일만 허용
- 대규모 재작성 금지 — 점진적 개선 원칙 준수

---

# 보충: 환경 전략 & 배포 계획

## 개요

RMS(Recipe Management System)는 **사내 Windows 환경에서 운영**되는 시스템이지만, 현재 개발은 **Mac → Ubuntu 서버(SSH)**로 진행 중이다. 따라서 사외 환경에서는 **mockup data 기반 검증**만 가능하고, 실제 사내 DB/FTP 연결은 **Windows 환경 배포 시점에만 가능**하다.

본 섹션은 다음을 정의한다:
1. **사외 개발 환경(Mockup 모드)**: Mac + Ubuntu 서버에서 동작하는 검증 전략
2. **사내 운영 환경(Real 모드)**: Windows에서 실제 DB/FTP 연결 구성
3. **환경 간 호환성**: Windows 경로·인코딩·파일 권한 처리
4. **배포 체크리스트**: 최초 배포 및 유지보수 절차

---

## 1. 사외 개발 환경 — Mockup Data 기반 검증 (Phase 1~2)

### 1.1 Mockup 데이터 구조

| 항목 | 위치 | 역할 | 현황 |
|------|------|------|------|
| 설비 마스터 데이터 | `backend/tests/mockup_data.py` | PostgreSQL `eqp_info` 대체 | ❌ 미작성 |
| FTP 인증 정보 | `backend/tests/mockup_data.py` | MongoDB `FTP_STATUS` 대체 | ❌ 미작성 |
| CAS/JOB 파일 | `backend/tests/mockup_data.py` | 설비 FTP 파일 대체 | ❌ 미작성 |
| 이력/캐시 DB | `backend/app/data/*.sqlite3` | 로컬 SQLite 사용 (임시 디렉토리) | ✅ 기존 |

### 1.2 Mockup 데이터 작성 계획

```python
# backend/tests/mockup_data.py (신규 작성 필요)

# (1) 설비 마스터 (PostgreSQL eqp_info 대체)
MOCK_EQP_INFO = [
    {
        'eqp_id': 'PR-001',
        'eqp_name': 'Polisher-001',
        'eqp_model_bucket': 'MOD-A',  # 또는 eqp_model_bucker (확인 필요)
        'ftp_ip': '192.168.1.10',     # 나중에 실환경에서는 MongoDB에서 조회
        'ftp_user': 'user1',
        'ftp_passwd': 'pass1',
    },
    ...
]

# (2) FTP 인증 정보 (MongoDB FTP_STATUS 대체)
MOCK_FTP_STATUS = [
    {
        'EQPID': 'PR-001',
        'IP': '192.168.1.10',
        'USER': 'user1',
        'PASSWD': 'pass1',
        'PORT': 21,
    },
    ...
]

# (3) CAS 파일 내용 (FTP에서 조회하는 .cas 파일 대체)
MOCK_CAS_CONTENT = {
    ('PR-001', 'CAS_001.cas'): b'[CasConfig]\nversion=1.0\nslots=12\n...',
    ...
}

# (4) JOB 파일 내용 (FTP에서 조회하는 .job 파일 대체)
MOCK_JOB_CONTENT = {
    ('PR-001', 'JOB_001.job'): b'[JobConfig]\npreMetrology.enabled=true\n...',
    ...
}

# (5) Recipe 파일 내용
MOCK_RECIPE_CONTENT = {
    ('PR-001', 'polishRecipe', 'RECIPE_001.pol'): b'[Recipe]\n...',
    ...
}
```

### 1.3 환경변수 기반 Mock/Real 전환

```bash
# backend/.env (개발 환경)
MOCK_MODE=true                   # mockup 모드 활성화 (사외)
MOCK_DB_PATH=/tmp/recipe_mock.sqlite3

# 아래는 무시됨 (MOCK_MODE=true일 때)
POSTGRES_URL=...
MONGO_URL=...

# ---

# backend/.env (실환경 — 사내 Windows)
MOCK_MODE=false                  # real 모드 활성화 (사내)
POSTGRES_URL=postgresql://user:pass@pg-host:5432/recipe_db
MONGO_URL=mongodb://mongo-host:27017/
LOCAL_EDIT_BASE=C:\rms_data      # Windows 영속 저장소
```

### 1.4 코드 수정 (환경 전환 로직)

**`backend/app/config.py`** 수정:
```python
MOCK_MODE: bool = os.getenv('MOCK_MODE', 'true').lower() in ('true', '1', 'yes')
POSTGRES_URL: str = os.getenv('POSTGRES_URL', '')
MONGO_URL: str = os.getenv('MONGO_URL', 'mongodb://127.0.0.1:27017/')
LOCAL_EDIT_BASE: str = os.getenv('LOCAL_EDIT_BASE', '')
```

**`backend/app/services/ftp_eqp_ip.py`** 수정:
```python
from app.config import MOCK_MODE

if MOCK_MODE:
    from tests.mockup_data import MOCK_FTP_STATUS
    # FTP 정보 조회 시 MOCK_FTP_STATUS 사용
else:
    # 실제 MongoDB에서 조회
```

**`backend/app/services/ftp_credentials.py`** 수정:
```python
if MOCK_MODE:
    # Mock 데이터로 응답
else:
    # 실제 MongoDB 연결
```

### 1.5 검증 범위 (Mockup 모드)

```
- [ ] EP-01: main.py 라우터 등록 (mockup 환경에서 라우팅 확인)
- [ ] ET-01: 핵심 API mockup 테스트 완성
  - [ ] GET /api/recipe-test/eqp-options → mockup 설비 목록 반환
  - [ ] POST /api/recipe-test/load → mockup FTP 데이터 파싱 확인
  - [ ] GET /api/recipe-test/cas-content → mockup CAS 파일 내용 반환
  - [ ] GET /api/recipe-test/job-content → mockup JOB 파일 내용 반환
  - [ ] GET /api/recipe-test/history → SQLite 이력 조회
  - [ ] POST /api/recipe-test/cas/save → 로컬 임시 디렉토리 저장
  - [ ] POST /api/recipe-test/recipe/clone → 로컬 캐시 복제
- [ ] 프론트엔드 mockup 테스트 (npm run dev + 프론트엔드 수동 테스트)
- [ ] Windows 경로 호환성 사전 검토 (코드 리뷰)
- [ ] 인코딩 처리 사전 검토 (코드 리뷰)
```

---

## 2. 사내 운영 환경 — Real Data 연결 (사내 Windows, Phase 3)

### 2.1 필수 사전 확인 사항 (사내 담당자)

실제 배포 전에 사내 네트워크 담당자가 다음을 확인해야 한다:

| 항목 | 확인 내용 | 담당 |
|------|---------|------|
| PostgreSQL 연결 | `eqp_info` / `sdwt_info` 테이블 존재 확인 | DB 담당자 |
| PostgreSQL 컬럼명 | `eqp_model_bucket` vs `eqp_model_bucker` 정확한 컬럼명 | DB 담당자 |
| MongoDB 연결 | `ADDCMP.FTP_STATUS` 컬렉션 구조 확인 | DB 담당자 |
| FTP 서버 | 각 설비별 FTP IP/PORT/계정 확인 | 네트워크 담당자 |
| Windows 경로 | `C:\rms_data` 또는 지정 경로 쓰기 권한 확인 | 시스템 담당자 |
| 방화벽 | PostgreSQL/MongoDB/각 설비 FTP 포트 개방 확인 | 네트워크 담당자 |

### 2.2 Real 모드 환경 구성

**`backend/.env.prod`** (사내 Windows용, Git 커밋 금지):
```bash
# 배포 환경 설정
MOCK_MODE=false

# PostgreSQL (사내 데이터베이스)
POSTGRES_URL=postgresql://rms_user:${DB_PASSWORD}@pg-server.company.local:5432/recipe_db

# MongoDB (사내 데이터베이스)
MONGO_URL=mongodb://mongo-server.company.local:27017/

# 로컬 저장소 (Windows 경로)
LOCAL_EDIT_BASE=C:\rms_data

# Logging
LOG_LEVEL=INFO
```

**`backend/.env.prod.example`** (Git 커밋 가능, 시크릿 마스킹):
```bash
MOCK_MODE=false
POSTGRES_URL=postgresql://rms_user:<password>@pg-server.company.local:5432/recipe_db
MONGO_URL=mongodb://mongo-server.company.local:27017/
LOCAL_EDIT_BASE=C:\rms_data
LOG_LEVEL=INFO
```

### 2.3 RECIPE_SOURCE_CONFIG 동적 구성

현재 `recipe_test_impl.py:173`의 `RECIPE_SOURCE_CONFIG`는 하드코딩된 경로를 사용한다.

```python
RECIPE_SOURCE_CONFIG: dict[str, dict[str, Any]] = {
    "recipe": {
        "path": r"\CMPDB\Lcmp\Recipes",  # ← 설비별로 다를 수 있음
        "exts": [],
        "titleBase": "Recipe",
    },
    ...
}
```

**사내 배포 시 구성 방법**:

1. **옵션 A: 각 설비별 config 파일 사용** (권장)
   ```
   backend/config/eqp_recipe_sources.json:
   {
     "PR-001": {
       "recipe": { "path": "\\CMPDB\Lcmp\Recipes", ... },
       "polishRecipe": { "path": "\\CMPDB\Lcmp\Recipes", ... },
       ...
     },
     "PR-002": { ... },
   }
   ```

2. **옵션 B: PostgreSQL 또는 MongoDB에서 동적 로드**
   - 각 설비의 recipe source 경로를 DB에 저장
   - 설비 로드 시 함께 조회

3. **옵션 C: 환경변수로 기본 경로 지정**
   ```bash
   RECIPE_BASE_PATH=\\CMPDB\Lcmp\Recipes
   ```

---

## 3. 환경 간 호환성 (Windows 경로·인코딩·파일 권한)

### 3.1 경로 정규화 (Path Handling)

| 이슈 | Linux/Mac | Windows | 해결책 |
|------|----------|---------|--------|
| 경로 구분자 | `/` | `\` | `pathlib.Path` 사용 (자동 변환) |
| 절대/상대 경로 | `/home/...` | `C:\...` | 환경변수 기반 (LOCAL_EDIT_BASE) |
| UNC 경로 | N/A | `\\server\share` | Windows 감지 후 UNC 경로 사용 |
| 경로 길이 제한 | 255 chars/컴포넌트 | 260 chars (MAX_PATH) | 긴 경로는 `\\?\` prefix 사용 |

**필수 수정 대상**:
- `backend/app/services/temp_file_store.py`: `LOCAL_EDIT_BASE` 환경변수화 (EP-02)
- `backend/app/services/history_service.py`: 파일 경로 정규화
- `backend/app/services/recipe_cache_store.py`: SQLite DB 경로 정규화

**코드 예시**:
```python
from pathlib import Path, PureWindowsPath, PurePosixPath

def normalize_path(path_str: str) -> Path:
    """Windows/Linux 모두 호환하는 경로 정규화"""
    # 백슬래시를 슬래시로 변환 (cross-platform)
    normalized = path_str.replace('\\', '/')
    return Path(normalized)

# Windows 환경에서는
base = Path(os.getenv('LOCAL_EDIT_BASE', 'C:\\rms_data'))
file_path = base / 'history' / 'entry_001.jsonl'
# → C:\rms_data\history\entry_001.jsonl (자동 변환)
```

### 3.2 인코딩 처리

| 환경 | 기본 인코딩 | RMS 대응 |
|------|----------|---------|
| Linux (UTF-8) | UTF-8 | ✓ 문제 없음 |
| Windows (CP949) | CP949 (한글) 또는 UTF-8 | ⚠ Fallback 필요 |
| FTP 파일 | 설비마다 상이 (CP949, EUC-KR, etc.) | ⚠ Fallback 필요 |

**필수 수정**:

1. **파일 읽기 시 Fallback 인코딩**:
   ```python
   def read_file_with_fallback(path: str, primary='utf-8', fallbacks=None):
       if fallbacks is None:
           fallbacks = ['cp949', 'euc-kr', 'latin-1']
       
       for enc in [primary] + fallbacks:
           try:
               with open(path, 'r', encoding=enc) as f:
                   return f.read()
           except (UnicodeDecodeError, LookupError):
               continue
       
       # 마지막 수단: binary read + ignore errors
       with open(path, 'rb') as f:
           return f.read().decode(primary, errors='ignore')
   ```

2. **FTP 파일 다운로드 시**:
   ```python
   # file_ops_service.py
   data = ftp.read_bytes_at_path(...)  # binary
   
   # CP949 또는 UTF-8로 디코딩 시도
   try:
       text = data.decode('utf-8')
   except UnicodeDecodeError:
       text = data.decode('cp949', errors='replace')
   ```

### 3.3 파일 권한 & Windows 시스템 제약

| 제약 | 영향 | 대응 |
|------|------|------|
| 파일명 금지 문자 | `< > : " / \ \| ? *` | 이미 `validate_ascii_target_name()` 검증 중 |
| 예약어 | `CON, PRN, AUX, NUL, COM1-9, LPT1-9` | 추가 검증 필요 |
| 경로 길이 제한 | MAX_PATH = 260 chars | 긴 경로는 UNC prefix 사용 |
| 소유권/권한 | Windows ACL | 배포 시 설정 (관리자 권한) |

**필수 검증 추가**:
```python
WINDOWS_RESERVED_NAMES = {'CON', 'PRN', 'AUX', 'NUL'} | {f'COM{i}' for i in range(1, 10)} | {f'LPT{i}' for i in range(1, 10)}

def validate_windows_filename(name: str) -> str:
    # 기존 검증
    validate_ascii_target_name(name)
    
    # Windows 예약어 검증
    if name.upper() in WINDOWS_RESERVED_NAMES:
        raise ValueError(f'"{name}"은 Windows 시스템 예약어입니다.')
    
    # 경로 길이 검증 (MAX_PATH = 260)
    max_length = 32767 if os.name == 'nt' and os.path.exists(name) else 260
    if len(name) > max_length:
        raise ValueError(f'파일명이 너무 깁니다 (최대 {max_length} 자).')
    
    return name
```

---

## 4. 배포 체크리스트 및 운영 절차

### 4.1 사전 준비 (배포 담당자)

```
□ 1. Windows 환경 확인
  □ Windows 10/11 또는 Windows Server 2019+ 설치 확인
  □ Python 3.10+ 설치 확인 (C:\Python310\)
  □ 관리자 권한 확인

□ 2. 네트워크 구성 확인
  □ PostgreSQL 호스트 IP/포트 확인
  □ MongoDB 호스트 IP/포트 확인
  □ 각 설비별 FTP 정보 확인 (IP, 포트, 계정)
  □ 방화벽 규칙 확인 (PostgreSQL/MongoDB/FTP 포트 개방)

□ 3. 파일시스템 준비
  □ C:\rms_data 디렉토리 생성 (또는 지정 경로)
  □ C:\rms_data\history 디렉토리 생성
  □ C:\rms_data\cache 디렉토리 생성
  □ C:\rms_data\vm_store 디렉토리 생성
  □ 쓰기 권한 확인 (현재 사용자 또는 서비스 계정)

□ 4. 환경변수 설정
  □ POSTGRES_URL 확인
  □ MONGO_URL 확인
  □ LOCAL_EDIT_BASE 확인
  □ MOCK_MODE=false 설정
```

### 4.2 배포 단계 (Windows에서 실행)

```batch
REM backend/deploy.bat (신규 작성)

@echo off
setlocal enabledelayedexpansion

REM 1. 의존성 설치
echo [1/5] Installing dependencies...
cd /d "C:\rms_project\backend"
python -m pip install --upgrade pip
pip install -r requirements.txt

REM 2. 환경변수 설정
echo [2/5] Setting up environment...
copy .env.example .env
REM 사용자가 .env 파일을 수동으로 편집해야 함
echo Please edit backend\.env with actual database credentials
pause

REM 3. 데이터베이스 연결 확인
echo [3/5] Testing database connections...
python -c "from app.services.ftp_eqp_ip import load_eqp_ip; load_eqp_ip()"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Database connection failed
    exit /b 1
)

REM 4. SQLite 스키마 초기화
echo [4/5] Initializing local SQLite databases...
python -c "from app.services.recipe_cache_store import ensure_schema; ensure_schema()"

REM 5. 서버 기동
echo [5/5] Starting backend server...
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

endlocal
```

### 4.3 워커 서비스 등록 (백그라운드 인벤토리 동기화)

```batch
REM backend/install_worker_service.bat (신규 작성, 관리자 권한 필요)

@echo off
setlocal

REM NSSM (Non-Sucking Service Manager) 사용
REM 미리 설치: choco install nssm

set SERVICE_NAME=RMS_InventoryWorker
set PYTHON_PATH=C:\Python310\python.exe
set SCRIPT_PATH=C:\rms_project\backend\tools\recipe_inventory_worker.py
set WORK_DIR=C:\rms_project\backend

REM 기존 서비스 제거
nssm remove %SERVICE_NAME% confirm

REM 새 서비스 설치
nssm install %SERVICE_NAME% %PYTHON_PATH% %SCRIPT_PATH%
nssm set %SERVICE_NAME% AppDirectory %WORK_DIR%
nssm set %SERVICE_NAME% AppStdout %WORK_DIR%\logs\worker_stdout.log
nssm set %SERVICE_NAME% AppStderr %WORK_DIR%\logs\worker_stderr.log
nssm set %SERVICE_NAME% Start SERVICE_AUTO_START

REM 서비스 시작
nssm start %SERVICE_NAME%

echo Service installed and started: %SERVICE_NAME%
endlocal
```

### 4.4 프론트엔드 빌드 및 배포

```batch
REM frontend/build.bat

@echo off
cd /d "C:\rms_project\frontend"

echo Building frontend...
npm install
npm run build

REM dist 디렉토리를 백엔드 정적 서빙 경로로 복사
echo Copying dist to backend...
xcopy dist ..\backend\app\static\ /Y /I

echo Frontend build complete!
```

### 4.5 초기 검증 (배포 후)

```
□ 1. API 헬스체크
  □ GET http://localhost:8000/ → 200 응답 확인
  □ GET http://localhost:8000/api/recipe-test/eqp-options → 설비 목록 반환 확인

□ 2. 데이터베이스 연결 확인
  □ PostgreSQL 쿼리 실행 확인 (설비 마스터 조회)
  □ MongoDB 쿼리 실행 확인 (FTP 인증 정보 조회)

□ 3. 기본 시나리오 테스트 (사내 테스트 설비 사용)
  □ 시나리오 1: 설비 로드 (PR-001 선택)
  □ 시나리오 2: CAS 조회 및 파싱
  □ 시나리오 3: CAS 수정 및 저장 (로컬 임시)
  □ 시나리오 4: 이력 조회
  □ 시나리오 5: 설정값 변경

□ 4. 프론트엔드 접속 확인
  □ 브라우저 열기: http://localhost:8000
  □ UI 렌더링 확인
  □ API 호출 응답 확인 (브라우저 개발 도구)

□ 5. 로그 확인
  □ backend/logs/app.log 확인 (에러 없음)
  □ C:\rms_data\history\*.jsonl 생성 확인
  □ C:\rms_data\*.sqlite3 생성 확인

□ 6. 워커 실행 확인
  □ Windows Services에서 RMS_InventoryWorker 상태 확인
  □ C:\rms_data\cache\inventory_state.sqlite3 갱신 확인
```

---

## 5. 롤백 계획 (이전 버전으로 복구)

### 5.1 배포 전 백업

```batch
REM deploy_backup.bat

@echo off
setlocal

set BACKUP_DIR=C:\rms_backups\backup_%date:~-4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%
mkdir %BACKUP_DIR%

REM 데이터 백업
xcopy C:\rms_data %BACKUP_DIR%\rms_data\ /E /I
xcopy C:\rms_project\backend\app\config.py %BACKUP_DIR%\ /Y
copy C:\rms_project\backend\.env %BACKUP_DIR%\.env.bak

echo Backup completed at: %BACKUP_DIR%
endlocal
```

### 5.2 자동 롤백 절차

```batch
REM deploy_rollback.bat (배포 실패 시 수동 실행)

@echo off
setlocal

set BACKUP_DIR=C:\rms_backups\backup_YYYYMMDD_HHMM
REM (최신 백업 디렉토리 지정)

if not exist %BACKUP_DIR% (
    echo [ERROR] Backup directory not found: %BACKUP_DIR%
    exit /b 1
)

echo Stopping services...
nssm stop RMS_InventoryWorker
nssm stop RMS_API  (if exists)

echo Restoring data...
rmdir C:\rms_data /s /q
xcopy %BACKUP_DIR%\rms_data C:\rms_data\ /E /I /Y

echo Restoring configuration...
copy %BACKUP_DIR%\.env.bak C:\rms_project\backend\.env /Y
copy %BACKUP_DIR%\config.py C:\rms_project\backend\app\ /Y

echo Restarting services...
nssm start RMS_InventoryWorker
nssm start RMS_API

echo Rollback completed!
endlocal
```

### 5.3 배포 이력 관리

```
C:\rms_backups\
├── backup_20260518_1030/
│   ├── rms_data/
│   ├── .env.bak
│   ├── config.py
│   └── DEPLOY_INFO.txt (배포 시간, 담당자, 변경사항)
├── backup_20260512_1400/
│   └── ...
└── DEPLOYMENT_LOG.csv (배포 이력 기록)
```

**DEPLOYMENT_LOG.csv**:
```
Date,Time,Deployed_By,Version,Status,Notes
2026-05-18,10:30,Admin,v1.0.0,SUCCESS,"Initial production deployment"
2026-05-12,14:00,Admin,v0.9.1,SUCCESS,"Hotfix for Windows path handling"
```

---

## 6. 필수 파일 구성 (환경별)

### 6.1 사외 개발 환경 (Mac + Ubuntu)

```
backend/
├── .env                          # MOCK_MODE=true (Git 커밋 금지)
├── .env.example                  # MOCK_MODE=true (Git 커밋 가능)
├── backend/app/config.py         # MOCK_MODE 로직 포함
├── backend/tests/mockup_data.py  # Mock DB 데이터 (신규)
└── backend/tests/test_mockup_routes.py  # Mock 기반 pytest
```

### 6.2 사내 운영 환경 (Windows)

```
C:\rms_project\backend\
├── .env.prod                     # MOCK_MODE=false (Git 커밋 금지)
├── .env.prod.example             # MOCK_MODE=false (Git 커밋 가능)
├── config/
│   └── eqp_recipe_sources.json   # 설비별 recipe path 구성 (신규)
├── deploy.bat                    # 배포 스크립트 (신규)
├── deploy_backup.bat             # 백업 스크립트 (신규)
├── deploy_rollback.bat           # 롤백 스크립트 (신규)
├── install_worker_service.bat    # 워커 서비스 등록 (신규)
├── logs/                         # 배포 및 실행 로그
│   ├── app.log
│   ├── worker_stdout.log
│   └── worker_stderr.log
└── app/
    └── static/                   # 프론트 dist 복사 위치

C:\rms_data\                      # LOCAL_EDIT_BASE 영속 저장소
├── history/
│   └── recipe_action_history.jsonl
├── cache/
│   └── recipe_cache.sqlite3
├── vm_store/
│   └── *.tmp 임시 파일
└── *.sqlite3                     # 각종 DB 파일
```

---

## 7. 검증 및 테스트 계획

### 7.1 Mockup 모드 검증 (사외, Phase 1~2)

```
- [ ] EP-01.1: main.py 라우터 등록 (mockup 환경 검증)
- [ ] ET-01.1: GET /api/recipe-test/eqp-options (mockup 설비 반환)
- [ ] ET-01.2: POST /api/recipe-test/load (mockup CAS/JOB 파싱)
- [ ] ET-01.3: GET /api/recipe-test/cas-content (mockup 파일 반환)
- [ ] ET-01.4: GET /api/recipe-test/history (SQLite 조회)
- [ ] ET-01.5: POST /api/recipe-test/cas/save (로컬 임시 저장)
- [ ] Frontend: npm run dev + 수동 테스트
- [ ] Windows 경로 호환성 코드 리뷰
- [ ] 인코딩 처리 코드 리뷰
```

예상 기간: **2~3주**

### 7.2 Real 모드 검증 (사내, Phase 3)

```
- [ ] 사전 확인: PostgreSQL/MongoDB 연결 가능 여부
- [ ] 사전 확인: FTP 각 설비 접속 가능 여부
- [ ] ET-02: Windows 환경에서 백엔드 기동
- [ ] ET-03: FTP 통합 테스트 (설비 1대 테스트)
- [ ] 시나리오 1~5 수동 검증 (테스트 설비 사용)
- [ ] 이력/캐시 영속성 확인 (재기동 후 데이터 유지)
- [ ] 로그 및 에러 핸들링 확인
```

예상 기간: **1~2주**

### 7.3 환경 간 호환성 검증 (Phase 3)

```
- [ ] Windows 경로 정규화 테스트 (UNC, MAX_PATH, 한글 경로)
- [ ] 인코딩 Fallback 테스트 (UTF-8, CP949, EUC-KR)
- [ ] Windows 예약어 검증 테스트
- [ ] 파일 권한 및 소유권 테스트 (관리자 권한 필요)
```

예상 기간: **3~5일**

---

## 8. 예상 일정 (요약)

| Phase | 기간 | 주요 작업 | 검증 환경 |
|-------|------|---------|---------|
| 1 | 1주 | EP-01, ES-01/02 완료 | Mockup (Ubuntu) |
| 2 | 2~3주 | EP-02, ED-01, EB-01/02, ET-01 완료 | Mockup (Ubuntu) |
| 3 | 2~3주 | EP-03, ED-OP-01/02, ET-02/03, 환경 호환성 | Real (Windows) |
| 4 | 지속 | EB-03/04, ED-02/03, ER-01~04, 등 | 운영 (Windows) |

**전체 예상 기간**: 6~8주

---

## 9. 기술 부채 및 위험요소

### 고위험 (해소 필수)

| 항목 | 원인 | 영향 | 대응 |
|------|------|------|------|
| PostgreSQL 컬럼명 불확실 | `eqp_model_bucket` vs `eqp_model_bucker` | 설비 목록 조회 실패 | 사내 확인 (ED-05) |
| 경로 길이 제한 | Windows MAX_PATH = 260 chars | 긴 파일명 저장 불가 | 코드 추가 검증 |
| 인코딩 불일치 | 설비 FTP 파일 인코딩 다양함 | 파일 파싱 실패 | Fallback 인코딩 (3.2 참조) |

### 중위험 (권장 해소)

| 항목 | 원인 | 영향 | 대응 |
|------|------|------|------|
| UNC 경로 미지원 | FTP 경로가 `\\server\share` 형식일 수 있음 | Windows 특정 경로 접근 불가 | UNC 경로 지원 추가 |
| 동시성 문제 | 여러 사용자가 동일 파일 수정 | 데이터 손상 가능성 | 파일 잠금 메커니즘 (ED-02) |

### 저위험 (선택적)

| 항목 | 원인 | 영향 | 대응 |
|------|------|------|------|
| FTP RNFR/RNTO 미지원 | 일부 설비 FTP 서버 미지원 | 파일명 변경 시 원자성 부족 | Fallback: copy + delete (EX-02) |
| 인증/인가 미지원 | 현재 모든 API 공개 | 보안 취약점 | 사내망 운영이므로 낮은 우선순위 (ES-03) |

---

## 10. 의사결정 포인트 (확인 필요)

사내 담당자가 **배포 전** 다음 항목을 명확히 해야 한다:

1. **PostgreSQL 컬럼명** → ED-05 작업 방향 결정
2. **Recipe source path 관리 방식** → 옵션 A/B/C 중 선택 (2.3 참조)
3. **Local 저장소 경로** → C:\rms_data 또는 다른 경로 확정
4. **서비스 계정 vs 현재 사용자** → 워커 서비스 등록 방식 결정
5. **프론트엔드 배포 방식** → 정적 서빙 vs 별도 웹 서버 결정 (ED-OP-02)
6. **로깅 레벨 및 보관 기간** → 운영 정책 수립 (EH-01)
