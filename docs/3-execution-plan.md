# Execution Plan — Recipe Management System

Last updated: 2026-06-18

## 0. 현재 기준

- 실제 사내 PostgreSQL / MongoDB / FTP / SAML만 runtime 기준으로 사용한다.
- Windows는 Codex/Claude Code 실행 및 편집 환경이다.
- 최종 검증/빌드/배포는 사내 Ubuntu 기준이다.
- test-only runtime switch, fake user, fake route, fake data provider는 제거 대상이며 새로 추가하지 않는다.
- `POST /api/recipe-test/invalidate-runtime-cache`는 현재 구현되어 있다.

## 1. Phase 1 — 실제 운영 기준 정합성

### P1-01 — Ubuntu smoke test 절차 확정

목표:

- Ubuntu에서 frontend build, backend import, FastAPI app import를 검증한다.
- 실제 `.env`로 PostgreSQL / MongoDB / FTP / SAML 연결을 확인한다.

작업:

- [ ] `docs/ubuntu-deployment-guide.md` 작성/유지
- [ ] smoke test command 정리
- [ ] API별 최소 확인 curl 정리

### P1-02 — 실제 데이터 연결 실패 정책 정리

목표:

- 사내 DB/FTP/SAML 접근 실패를 임의 데이터로 대체하지 않는다.
- 사용자에게 명확한 오류를 제공한다.

작업:

- [ ] DB 연결 실패 메시지 정리
- [ ] Mongo FTP credential 미존재 메시지 정리
- [ ] FTP 파일 미존재/권한 오류 메시지 정리
- [ ] SAML cookie 미존재/만료 응답 확인

### P1-03 — 삭제된 fake 경로 후속 정리

목표:

- fake route/data 제거 이후 참조가 남지 않게 한다.

작업:

- [ ] test-only runtime switch, fake route, fake data file 참조 정기 확인
- [ ] package dependency 이름처럼 불가피한 문자열은 별도 기록
- [ ] docs에서 과거 fake 환경 전제 제거

## 2. Phase 2 — Unit Recipe 이력 완성

### P2-01 — revision diff 생성

목표:

- `/pol-con-save`에서 원본 paramValues와 요청 paramValues를 비교한다.
- UI column 기준 revision과 component 기준 value rows를 생성한다.

작업:

- [ ] End By diff 생성
- [ ] Platen RPM / Head RPM 복합 cell diff 생성
- [ ] slurry/pressure/rpm/time 단위 mapping 정리
- [ ] `recipe_history_revisions`, `recipe_history_revision_values` 저장 연결

### P2-02 — My History 표시

목표:

- 기존 `detail` 문자열 fallback을 유지하면서 structured revisions를 우선 표시한다.

작업:

- [ ] revision list UI
- [ ] component별 unit 표시
- [ ] 복합 cell summary 표시
- [ ] 기존 history row와 호환성 확인

## 3. Phase 3 — 운영 안정화

### P3-01 — cache/history 저장 경로

목표:

- Ubuntu 운영에서 재부팅/정리 정책으로 데이터가 사라지지 않게 한다.

작업:

- [ ] `RECIPE_DATA_DIR` 또는 운영 경로 정책 확인
- [ ] SQLite/Postgres 선택 기준 정리
- [ ] backup 대상 파일 정리

### P3-02 — inventory worker 운영

목표:

- worker가 Ubuntu에서 안정적으로 동작하게 한다.

작업:

- [ ] worker 실행 command 정리
- [ ] log rotate 설정
- [ ] offline cooldown/concurrency 기준 확정
- [ ] 장애 시 재시작 절차 정리

### P3-03 — API 계약 검증

목표:

- 프런트가 사용하는 API와 백엔드 계약이 드리프트되지 않게 한다.

작업:

- [ ] `recipeTestApi.ts` endpoint 목록과 FastAPI route 비교
- [ ] 주요 API smoke test 추가
- [ ] 실제 환경 통합 테스트 절차 정리

## 4. Phase 4 — 구조 정리

### P4-01 — 레거시 파일 정리

대상 후보:

- `backend/app/api/routes/recipe_test.py`
- thin wrapper route 파일들
- 사용되지 않는 frontend component/API example

작업 전 반드시 실제 import/router 등록 여부를 확인한다.

### P4-02 — 대형 파일 분리

대상:

- `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
- `backend/app/api/routes/recipe_test_impl.py`

목표:

- 기능별 module/component로 나누되 동작 변경을 최소화한다.

## 5. 우선순위 요약

### 즉시

1. Ubuntu deployment guide 작성
2. 실제 DB/Mongo/FTP/SAML smoke test 정리
3. Unit Recipe structured revision 저장 연결

### 다음

1. My History revision UI
2. inventory worker 운영 절차
3. API 계약 검증 자동화

### 이후

1. 레거시 route 정리
2. 대형 파일 분리
3. 운영 모니터링/로그 정책 강화
