# Fullstack 수정 계획서

기준일: 2026-05-18  
기준 자료:
- `docs/999-codex-FrontEnd-report.md`
- `docs/999-codex-Backend-report.md`
- `docs/3-execution-plan.md`
- 현재 코드베이스

적용 원칙:
- 실제 코드와 `docs/3-execution-plan.md`를 우선한다.
- 기존 기능 보존과 점진적 개선을 최우선으로 한다.
- 실제 코드와 문서에 없는 내용은 추측하지 않는다.
- 불확실한 내용은 `확인 필요`로 표시한다.
- 본 문서는 수정 계획서이며, 소스코드 수정 범위는 포함하지 않는다.

## 1. 통합 수정 방향 요약

- [ ] `Critical` Phase 1의 최우선 목표를 “실행 가능 상태 복구”로 재정의한다.
- [ ] `Critical` 프론트 빌드 차단 이슈를 먼저 해소한다.
  - 대상: `frontend/tsconfig.json`, `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
- [ ] `Critical` 백엔드 테스트/컴파일 차단 이슈를 먼저 해소한다.
  - 대상: `backend/app/api/routes/recipe_test.py`
- [ ] `Critical` 백엔드 정본 엔트리포인트와 정본 라우터를 먼저 확정한 뒤 `EP-01`을 수행한다.
- [ ] `Critical` FrontEnd가 실제 호출하는 `/api/recipe-test/*`, `/api/recipe-inventory/*` 계약을 실제 Backend 노출 경로와 일치시킨다.
- [ ] `High` 실행 가능 상태 복구 후에는 FE prop/state 정합성, BE 저장 경로 영속성, 오류 처리, 이력 신뢰성을 안정화한다.
- [ ] `Medium` 그 다음 단계에서 테스트 자동화, Windows 운영 검증, DB 원자성, 캐시 전략을 강화한다.
- [ ] `Low` 마지막 단계에서 대형 파일 분리, dead code 정리, 중복 엔트리포인트 정리, 구조 개선을 진행한다.

## 2. FrontEnd/BackEnd 공통 이슈

- [ ] `Critical` FE/BE 모두 정본이 불명확하다.
  - FE: `RecipeTestPage.vue`에 상태/계약/편집/폴링이 집중됨
  - BE: `recipe_test.py`와 `recipe_test_impl.py` 및 wrapper 라우터가 병존함
- [ ] `Critical` FE/BE 모두 검증 파이프라인이 깨져 있다.
  - FE: `npm run build` 실패
  - BE: `python3 -m py_compile backend/app/api/routes/recipe_test.py` 실패, `pytest -q` 수집 실패
- [ ] `Critical` 실제 실행 계약이 끊겨 있다.
  - FE는 `/api/recipe-test/*`, `/api/recipe-inventory/snapshot`, `/api/recipe-test/invalidate-runtime-cache` 호출
  - BE 엔트리포인트는 `/`, `/api/recipe-units`만 노출
- [ ] `High` 운영 추적성과 데이터 신뢰성이 약하다.
  - FE: `actorName` 입력 UI 부재
  - BE: history/cache/shadow가 tempdir 기반
- [ ] `High` 오류 가시성이 낮다.
  - FE: `window.alert`, `console.error`, 빈 상태 처리가 혼재
  - BE: `HTTPException(detail=str(e))` 중심으로 내부 예외를 그대로 노출
- [ ] `Medium` 생성 산출물과 dead code가 소스 트리에 혼재한다.
  - FE: `*.vue.js`, `main.js`, `router/index.js`, `vite.config.js`, `tsbuildinfo`
  - BE: 레거시/미완성 라우터 파일과 문법 오류 파일 공존

## 3. API 계약 불일치 수정 계획

- [ ] `Critical` 백엔드 앱 엔트리포인트를 `backend/app/main.py` 기준으로 단일화한다.
- [ ] `Critical` `backend/main.py`는 제거하거나 `backend/app/main.py:app` 재-export 전용 얇은 호환 파일로 제한한다.
- [ ] `Critical` `EP-01` 수행 전 `recipe_test.py`와 `recipe_test_impl.py` 중 API 정본 구현 파일을 확정한다.
- [ ] `Critical` `backend/app/api/routes/recipe_test.py` 문법 오류를 복구한 뒤 정본 후보로 재검토한다.
- [ ] `Critical` `recipe_test_eqp.py`, `recipe_test_content.py`, `recipe_test_history.py`, `recipe_file_ops.py`를 wrapper-only 라우터로 분류하고 운영 등록 대상 여부를 재판단한다.
- [ ] `Critical` FrontEnd 실사용 경로 기준 계약 표를 작성한다.
  - 컬럼: `프론트 호출 경로 / 백엔드 정본 경로 / 구현 파일 / 응답 shape / 에러 shape / mockup 지원 여부`
- [ ] `Critical` 실제 앱에 `include_router()`를 등록할 때 정본 라우터만 등록한다.
- [ ] `Critical` `/api` prefix 부여 위치를 `main.py` 한 곳으로 고정한다.
- [ ] `Critical` `/api/recipe-test/eqp-options`, `/api/recipe-test/load`, `/api/recipe-test/history` 라우팅을 실제 응답 가능한 상태로 복구한다.
- [ ] `Critical` FrontEnd가 이미 사용하는 누락 엔드포인트를 우선 구현 또는 임시 비활성화한다.
  - `/api/recipe-inventory/snapshot`
  - `/api/recipe-test/invalidate-runtime-cache`
- [ ] `High` 구현 부재가 확인된 write/read 엔드포인트를 정리한다.
  - `/api/recipe-test/recipe-content`
  - `/api/recipe-test/cas/save`
  - `/api/recipe-test/cas/persist`
  - `/api/recipe-test/job/save`
  - `/api/recipe-test/job/persist`
  - `/api/recipe-test/recipe/clone`
  - `/api/recipe-test/file/rename`
  - `/api/recipe-test/file/delete`
  - `/api/recipe-test/transfer`
- [ ] `High` `/recipe-file-ops` 경로는 하위호환 alias가 필요한 경우에만 유지한다.
- [ ] `High` 성공 응답 shape를 object JSON으로 통일한다.
- [ ] `High` 빈 목록도 key 생략 없이 명시적으로 반환한다.
- [ ] `High` `sourceKind`, `kind`, `id`, 날짜 필드 포맷 규칙을 mockup/real 모두 동일하게 고정한다.
- [ ] `High` 표준 에러 응답 shape를 정의한다.
  - 권장: `{"error":{"code":"...","message":"...","details":...,"requestId":"..."}}`
- [ ] `Medium` FrontEnd `http()`가 FastAPI 표준/커스텀 에러 body를 파싱하도록 후속 계획에 포함한다.
- [ ] `Medium` `backend/tests/test_mockup_routes.py` 수준의 shape 검증을 실제 FastAPI TestClient 응답에도 복제한다.

## 4. DB/데이터 흐름 수정 계획

- [ ] `High` `EP-02`, `ED-01`을 Phase 2 초반으로 당긴다.
- [ ] `High` `LOCAL_EDIT_BASE`를 tempdir 기본값에서 환경변수 기반 영속 루트로 승격한다.
- [ ] `High` 저장 경로 하위 디렉터리를 명시적으로 분리한다.
  - `history/`
  - `recipe_cache/`
  - `recipe_vm_store/`
  - `shadow/`
  - `tmp/`
- [ ] `High` SQLite/JSONL/VM/shadow의 책임 경계를 문서화한다.
  - SQLite: inventory/file_versions/failures/state 메타 저장소
  - JSONL: 감사 로그 append-only
  - VM: 캐시 바이너리 + 메타
  - shadow: 복구 전용 보관소
- [ ] `High` FTP 작업 후 history 기록, cache invalidate/refresh, inventory 반영이 한 흐름에서 처리되도록 통합한다.
- [ ] `High` `shadow` 파일명이 파일명만 키로 충돌하는 문제를 해소한다.
  - `eqp_id + normalized path hash + original name + timestamp/request_id` 포함
- [ ] `High` snapshot hash는 persisted state 기준으로 정의한다.
  - 권장 정본: `inventory_state.revision` 또는 `inventory_hash`
- [ ] `Medium` `ED-02`를 수행해 SQLite WAL과 원자적 쓰기 패턴을 도입한다.
- [ ] `Medium` raw/meta/shadow 파일 쓰기에 temp file + atomic rename 패턴을 적용한다.
- [ ] `Medium` `save_vm_file() -> store_file_version() -> touch_inventory_state()` 흐름을 단일 작업 단위로 재구성한다.
- [ ] `Medium` `schema_version` 테이블 도입을 포함한 `ED-03` 계획을 유지한다.
- [ ] `Low` JSONL → SQLite 이관(`ED-04`)은 운영 요구가 확인된 뒤 결정한다.
- [ ] `Low` PostgreSQL 컬럼명 폴백 정리(`ED-05`)는 사내 DB 실확인 후 수행한다.

## 5. 환경 설정/Mockup/Real Data 대응 계획

- [ ] `Critical` 개발/운영 엔트리포인트를 먼저 하나로 통일한다.
- [ ] `High` `MOCK_MODE=true`와 real mode의 저장 경계를 분리한다.
  - mockup 저장소: `LOCAL_EDIT_BASE/mock/`
  - real 저장소: `LOCAL_EDIT_BASE/real/`
- [ ] `High` mockup 모드에서는 외부 PostgreSQL/MongoDB/FTP를 절대 접근하지 않도록 강제한다.
- [ ] `High` real mode에서는 사내 Windows 경로와 인코딩 제약을 기준으로 저장소 위치를 검증한다.
- [ ] `High` mockup 응답과 real 응답의 top-level key, optional field 처리 규칙, 날짜 포맷을 동일하게 유지한다.
- [ ] `Medium` `docs/3-execution-plan.md`의 mockup/real 환경 전략을 실제 코드 진입점과 맞게 재정렬한다.
- [ ] `Medium` Windows 실행 스크립트(`EP-03`)는 엔트리포인트 단일화 이후 Phase 3 후반에 수행한다.
- [ ] `Medium` 프론트 정적 서빙 방식(`ED-OP-02`)은 엔트리포인트/배포 구조 확정 후 결정한다.
- [ ] `Low` `windows-deployment-guide.md`와 새 계획서 간 용어/경로 불일치를 정리한다.

## 6. 보안/에러 처리/로깅 수정 계획

- [ ] `High` 보안 적용 전 실제 실행 앱 1개를 확정한다.
- [ ] `High` 인증/인가 도입 검토를 계획에 포함한다.
  - `AuthN`: SSO/JWT/사내 프록시 헤더 검증 방식 `확인 필요`
  - `AuthZ`: read/write/admin 및 설비별 접근 제어
- [ ] `High` `actorName`, `actorTeam`를 클라이언트 입력 신뢰 대상에서 제거한다.
- [ ] `High` 서버가 확정한 `actor_id`, `actor_name`, `actor_team`만 감사 로그에 기록하도록 설계한다.
- [ ] `High` `CORSMiddleware`를 도입하고 allowlist 정책을 명시한다.
- [ ] `High` `allow_origins=["*"]`와 인증정보 동시 허용은 금지 정책으로 명시한다.
- [ ] `High` FastAPI 전역 예외 핸들러를 도입해 에러 응답 shape를 표준화한다.
- [ ] `High` 내부 예외 문자열, FTP 서버 주소, 내부 경로, `raw` 파일 전문의 기본 노출을 축소한다.
- [ ] `Medium` request-id 미들웨어를 도입한다.
- [ ] `Medium` 응답 헤더/에러 body/감사 로그/애플리케이션 로그에 동일한 `request_id`를 전파한다.
- [ ] `Medium` 구조화 로그(JSON) 표준 필드를 정의한다.
  - `request_id`, `actor_id`, `eqp_id`, `action`, `resource_kind`, `resource_name`, `outcome`, `error_code`, `latency_ms`
- [ ] `Medium` 감사 로그 필드를 확장한다.
  - `actor_id`, `client_ip`, `user_agent`, `auth_source`, `before_hash`, `after_hash`, `approval_id`, `failure_code`
- [ ] `Medium` FE는 사용자용 메시지와 내부 진단 메시지를 분리해 표시하도록 개선 계획에 포함한다.
- [ ] `Medium` Pydantic 요청 모델에 enum, 길이 제한, regex, 최대 개수 제한을 강화한다.
- [ ] `Low` 감사 로그 저장소를 JSONL 유지 vs DB 이관으로 구분해 후속 결정한다.

## 7. 테스트/검증 계획

- [ ] `Critical` FE 빌드 게이트를 최우선 차단 조건으로 둔다.
  - `cd frontend && npm run build`
- [ ] `Critical` BE 문법/수집 게이트를 최우선 차단 조건으로 둔다.
  - `python3 -m py_compile backend/app/api/routes/recipe_test.py`
  - `pytest -q --collect-only`
- [ ] `Critical` `pytest -q` 전체 수집이 성공할 때까지 배포/구조 개선 작업을 후순위로 둔다.
- [ ] `High` `backend/tests/test_mockup_routes.py` 43개 테스트를 회귀 기준선으로 유지한다.
- [ ] `High` mockup 기준으로 등록된 모든 API 라우터의 HTTP status와 response schema 테스트를 추가한다.
- [ ] `High` FE smoke 테스트 최소 시나리오를 정의한다.
  - 앱 최초 진입
  - `/recipe-test` 진입
  - 설비 옵션 로드
  - CAS/JOB/Recipe 목록 노출
  - 단일 선택 시 content panel 표시
  - `/history` 진입
- [ ] `High` FE lint/test/typecheck 스크립트를 추가한 뒤 게이트화한다.
- [ ] `High` 핵심 회귀 포인트를 별도 체크리스트로 운영한다.
  - CAS/JOB 단일 선택 표시 조건 역전 없음
  - `snapshot`/`invalidate-runtime-cache` 실패 시 UI crash 없음
  - 삭제/전송/Save As 이후 상태 갱신 정상
  - History 실패와 빈 상태 구분
- [ ] `Medium` Windows 호환성 검증을 수행한다.
  - 경로 정규화
  - 인코딩
  - CRLF
  - PowerShell/`start.bat` 기동
- [ ] `Medium` FTP 실환경 검증은 사내 환경에서 별도 수행한다.
  - 설비 선택
  - 목록 조회
  - preview
  - Save As / Rename / Delete / Transfer
  - history 기록
- [ ] `Medium` mockup 통과만으로 배포 승인하지 않는다는 조건을 명시한다.
- [ ] `High` 최종 배포 게이트를 정의한다.
  - FE build 성공
  - BE 문법 검증 성공
  - `pytest -q --collect-only` 성공
  - `pytest -q` 성공
  - mockup API 테스트 통과
  - 프론트 smoke/build/lint/test 통과
  - Windows 검증 통과
  - FTP 실환경 검증 통과

## 8. Phase별 수정 체크리스트

### Phase 1 — 기능 동작 복구 (`Critical`)

- [ ] `Critical` FE 빌드 복구
  - `frontend/tsconfig.json` 복구
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue` 문법 손상 복구
- [ ] `Critical` BE 문법/테스트 수집 복구
  - `backend/app/api/routes/recipe_test.py` 문법 오류 제거 또는 격리
- [ ] `Critical` BE 정본 확정
  - `backend/app/main.py` vs `backend/main.py` 실제 엔트리포인트 확정
  - `recipe_test.py` vs `recipe_test_impl.py` 정본 구현 경계 확정
- [ ] `Critical` `EP-01` 재정의
  - 정본 라우터만 `include_router()` 등록
  - wrapper-only 라우터 운영 등록 여부 결정
- [ ] `Critical` FE/BE API 계약 정합화
  - `/api/recipe-test/*` 실노출
  - `/api/recipe-inventory/*` 실노출
- [ ] `Critical` 누락 엔드포인트 처리
  - `/api/recipe-inventory/snapshot`
  - `/api/recipe-test/invalidate-runtime-cache`
- [ ] `Critical` 기본 검증 완료
  - FE `npm run build`
  - BE `py_compile`, `pytest --collect-only`
  - 실제 엔트리포인트에서 주요 API 404 제거

### Phase 2 — 안정화 (`High`)

- [ ] `High` `EP-02`, `ED-01` 수행
  - `LOCAL_EDIT_BASE` 환경변수화
  - history/cache/vm/shadow 영속화
- [ ] `High` 프론트 prop 계약 복구
  - `cas-cols`/`job-cols`/`preview-id` 전달 정리
- [ ] `High` 프론트 선택/편집 상태 복구
  - CAS/JOB 단일 선택 표시 조건 복구
  - `editingJobId`, `editingCasId` 중심 편집 대상 고정
- [ ] `High` History UX 안정화
  - `actorName` 수집/표시 경로 정리
  - 빈 상태와 오류 상태 분리
- [ ] `High` 에러 처리 표준화
  - FE 에러 표시 체계 통합
  - BE 표준 에러 body 적용
- [ ] `High` 보안 기초 정리
  - 인증/인가 도입 검토
  - `actorName` 신뢰 제거
  - CORS 정책 명시
- [ ] `High` 계약 테스트 및 mockup 테스트 확장

### Phase 3 — 품질 향상 (`Medium`)

- [ ] `Medium` `ED-02` 수행
  - SQLite WAL
  - 단일 트랜잭션/원자성 개선
- [ ] `Medium` request-id/구조화 로그 도입
- [ ] `Medium` FE lint/test/typecheck 게이트 추가
- [ ] `Medium` Windows 기동/호환성 검증
- [ ] `Medium` `EB-03` SQLAlchemy Engine 싱글턴화
- [ ] `Medium` `ED-OP-01`, `ED-OP-02`, `WD-*` 운영/배포 검증 수행
- [ ] `Medium` FTP 실환경 통합 검증 완료
- [ ] `Medium` `RecipeTestPage.vue` 분리 착수 가능 여부 판단

### Phase 4 — 개선 (`Low`)

- [ ] `Low` `EF-03` `RecipeTestPage.vue` 구조 분리
- [ ] `Low` `EB-04` MongoClient lifespan 싱글턴화
- [ ] `Low` `ED-03` schema version 도입
- [ ] `Low` `ED-04` JSONL → SQLite 이관 여부 결정
- [ ] `Low` `ED-05` PostgreSQL 컬럼명 폴백 정리
- [ ] `Low` dead code/산출물 정리
  - `Sidebar.vue`
  - `*.vue.js`, `main.js`, `router/index.js`, `vite.config.js`, `tsbuildinfo`
- [ ] `Low` `/recipe-file-ops` alias 유지 여부 최종 정리
- [ ] `Low` 정본 문서/구조/운영 가이드 정리

## 9. 파일별 수정 대상과 수정 목적

- [ ] `backend/app/main.py`: 실제 운영 엔트리포인트 단일화, 라우터/CORS/예외 핸들러/미들웨어 등록
- [ ] `backend/main.py`: 호환용 유지 또는 제거, 엔트리포인트 중복 해소
- [ ] `backend/app/api/routes/recipe_test.py`: 문법 복구, 정본 라우터/핸들러 후보 재구성
- [ ] `backend/app/api/routes/recipe_test_impl.py`: 정본 보조 모듈 또는 폐기 대상 판단, wrapper 의존 제거
- [ ] `backend/app/api/routes/recipe_test_eqp.py`: wrapper-only 라우터 여부 결정
- [ ] `backend/app/api/routes/recipe_test_content.py`: wrapper-only 라우터 여부 결정
- [ ] `backend/app/api/routes/recipe_test_history.py`: wrapper-only 라우터 여부 결정
- [ ] `backend/app/api/routes/recipe_file_ops.py`: `/recipe-file-ops` alias 또는 폐기 여부 결정
- [ ] `backend/app/api/routes/recipe_test_ops.py`: 파일명/prefix 책임 불일치 해소 여부 판단
- [ ] `backend/app/api/routes/recipe_inventory.py`: `/snapshot` 포함 inventory API 계약 정리
- [ ] `backend/app/services/temp_file_store.py`: `LOCAL_EDIT_BASE` 환경변수화, 디렉터리 경계 분리
- [ ] `backend/app/services/history_service.py`: 감사 로그 신뢰성, 영속성, 필드 확장 검토
- [ ] `backend/app/services/recipe_cache_store.py`: WAL/원자성/schema version 도입
- [ ] `backend/app/services/recipe_vm_store.py`: VM 파일/메타 저장 경계 정리
- [ ] `backend/app/services/file_ops_service.py`: shadow 경로 충돌 방지, 후속 처리 통합
- [ ] `frontend/tsconfig.json`: 빌드 가능한 TS 설정 복구
- [ ] `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`: 문법 복구, API/state/prop 계약 정합화, 편집/선택 로직 안정화
- [ ] `frontend/src/features/recipe_test/api/recipeTestApi.ts`: 실제 API 경로/응답 타입/에러 처리 정합화
- [ ] `frontend/src/features/recipe_test/components/CasFileListPanel.vue`: `columns` 계약 정리
- [ ] `frontend/src/features/recipe_test/components/JobFileListPanel.vue`: `columns` 계약 정리
- [ ] `frontend/src/features/recipe_test/components/RecipePickerDialog.vue`: `previewId`/`previewRecipe` 계약 정리
- [ ] `frontend/src/features/recipe_test/components/RecipeTestHeader.vue`: 사용자 식별 정보 입력/표시 경로 반영 여부 검토
- [ ] `frontend/src/features/history/pages/MyHistoryPage.vue`: 오류 상태와 빈 상태 분리
- [ ] `frontend/package.json`: build/lint/test/typecheck 게이트 추가
- [ ] `frontend/vite.config.ts`: 프록시/CORS 연동과 운영 분리 전략 확인

## 10. 우선순위와 위험도

- [ ] `Critical` 빌드/컴파일 차단 해소 실패 시 어떤 기능 수정도 검증할 수 없다.
- [ ] `Critical` 엔트리포인트 정본 확정 실패 시 라우터 등록은 404를 500으로 바꾸는 수준에 그칠 수 있다.
- [ ] `Critical` API 계약 정합화 실패 시 FrontEnd는 계속 존재하지 않는 경로를 호출한다.
- [ ] `High` `LOCAL_EDIT_BASE` 및 영속성 미해결 시 재기동 후 history/cache/shadow 유실 위험이 크다.
- [ ] `High` prop/state 로직 미해결 시 단일 선택/편집/삭제/preview 흐름이 계속 불안정하다.
- [ ] `High` `actorName` 신뢰와 감사 로그 구조 미해결 시 운영 추적성이 약하다.
- [ ] `Medium` WAL/원자성 미적용 시 캐시와 inventory 상태 불일치가 남을 수 있다.
- [ ] `Medium` Windows 검증 미완료 시 배포 후 경로/인코딩 문제 가능성이 있다.
- [ ] `Low` 리팩터링과 dead code 정리는 실행 가능 상태 복구 이후에 수행해도 된다.

## 11. 롤백 전략

- [ ] `Critical` 롤백은 “작은 커밋 단위 분리”를 전제로 한다.
- [ ] `Critical` 1차 롤백 단위는 프론트 빌드 복구와 백엔드 문법 복구를 분리한다.
- [ ] `Critical` 2차 롤백 단위는 엔트리포인트 정리와 라우터 등록을 분리한다.
- [ ] `High` 3차 롤백 단위는 신규 계약(`/snapshot`, `/invalidate-runtime-cache`) 추가를 분리한다.
- [ ] `High` write API 활성화는 read API 복구 후 후행 활성화 전략을 사용한다.
- [ ] `High` 저장 경로 변경(`LOCAL_EDIT_BASE`)은 별도 커밋으로 분리하고, 적용 전 tempdir 데이터 백업 절차를 마련한다.
- [ ] `High` 운영 롤백 전 실제 기동점이 `backend/app/main.py`인지 `backend/main.py`인지 확인한다.
- [ ] `Medium` shadow 기반 복구는 현재 충돌 위험이 있어 Phase 2 이전의 주 롤백 수단으로 사용하지 않는다.
- [ ] `Medium` 배포 전 백업 범위를 명시한다.
  - 코드
  - `.env`
  - `recipe_cache.sqlite3`
  - `history/*.jsonl`
  - `shadow/`
- [ ] `Medium` 롤백 후 최소 검증 시나리오를 준비한다.
  - 백엔드 기동
  - 주요 API 3건 응답
  - 프론트 진입
  - history 조회

## 12. 완료 기준

### Phase 1 완료 기준

- [ ] `cd frontend && npm run build` 성공
- [ ] `python3 -m py_compile backend/app/api/routes/recipe_test.py` 성공
- [ ] `pytest -q --collect-only` 성공
- [ ] 실제 엔트리포인트 하나에서 아래 경로가 404 없이 응답
  - `/api/recipe-test/eqp-options`
  - `/api/recipe-test/load`
  - `/api/recipe-test/history`
  - `/api/recipe-inventory/*`
- [ ] FrontEnd의 `/api/recipe-test/*`, `/api/recipe-inventory/snapshot`, `/api/recipe-test/invalidate-runtime-cache` 호출이 현재 Backend 계약과 일치

### Phase 2 완료 기준

- [ ] `/recipe-test`에서 CAS/JOB 단일 선택 시 content panel 정상 노출
- [ ] 편집 중 선택 변경 시 저장 대상이 흔들리지 않음
- [ ] `RecipePickerDialog` preview와 리스트가 동기화됨
- [ ] History에서 사용자 식별 정보가 `Unknown`만으로 고정되지 않음
- [ ] History 조회 실패와 빈 상태가 구분되어 표시됨
- [ ] 재기동 후 history/cache가 유지됨

### Phase 3 완료 기준

- [ ] SQLite WAL/원자성 적용 후 캐시/상태 불일치 재현되지 않음
- [ ] FE lint/test/typecheck/build 게이트 통과
- [ ] Windows 기동/경로/인코딩 검증 통과
- [ ] FTP 실환경 검증 통과
- [ ] 구조화 로그와 request-id 전파 확인

### Phase 4 완료 기준

- [ ] `RecipeTestPage.vue` 구조 분리 또는 분리 보류 근거 문서화
- [ ] backend 라우팅 정본 구조가 하나로 정리됨
- [ ] dead code/산출물 정리 범위가 문서와 코드에 일치
- [ ] 운영 가이드와 수정 계획 간 불일치가 해소됨

### 전체 완료 기준

- [ ] 미해결 `Critical` 이슈 0건
- [ ] 배포 게이트 통과
- [ ] 롤백 절차 문서화 및 리허설 완료
- [ ] 실제 운영 엔트리포인트 확정
- [ ] 인증/인가 적용 범위 또는 보류 사유가 문서화됨 (`확인 필요`)
