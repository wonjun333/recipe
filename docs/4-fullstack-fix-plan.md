# Fullstack 수정 계획서

> 기준일: 2026-05-19
> 기준 자료:
> - `docs/999-codex-Backend-report.md`
> - `docs/999-codex-FrontEnd-report.md`
> 원칙:
> - 현재 활성 경로를 기준으로 수정한다.
> - 이미 활성인 스택은 불필요하게 갈아엎지 않는다.
> - 빌드/계약/테스트/영속성 결함을 구조 정리보다 먼저 해결한다.

---

## 0. 현재 기준 정리

### 활성 기준
- 백엔드 활성 엔트리포인트: `backend/app/main.py`
- 백엔드 활성 핵심 라우터:
  - `backend/app/api/routes/recipe_test_impl.py`
  - `backend/app/api/routes/recipe_inventory.py`
- 프런트 활성 핵심 페이지:
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
  - `frontend/src/features/history/pages/MyHistoryPage.vue`

### 현재 핵심 결함
- 프런트 빌드 실패
  - `frontend/tsconfig.json` 손상
  - `RecipeTestPage.vue` 문법 오류 다수
- 프런트-백엔드 계약 불일치
  - `POST /api/recipe-test/invalidate-runtime-cache` 미구현
- 백엔드 테스트 전략 불일치
  - `recipe-test` 가 실인프라 의존적인데 기본 테스트는 로컬 200 응답을 기대
- 운영 영속성 약함
  - history/cache/shadow/VM 저장이 tempdir 기반
- 인벤토리 경로 리스크
  - `cloud_protected` 판정 함수 시그니처 불일치

### 이번 계획에서 뒤로 미루는 것
- 레거시 엔트리포인트/래퍼 라우터 대청소
- 대형 파일 분리 리팩터링
- auth/CORS 확장
- dead code/산출물 정리

---

## 1. Phase 1 — 실행 가능 상태 복구

### F1-01 — 프런트 빌드 복구

- **우선순위**: `Critical`
- **대상 파일**:
  - `frontend/tsconfig.json`
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
- **작업 목표**:
  - `vue-tsc` 와 Vite 빌드가 통과하는 상태로 복구
- **작업 내용**:
  - `tsconfig.json` 을 정상 JSON 설정 파일로 복구
  - `RecipeTestPage.vue` 의 문법 손상/문자열 파손/잘못된 토큰 제거
- **완료 기준**:
  - `cd frontend && npm run build` 성공

```
- [ ] F1-01-a: `frontend/tsconfig.json` 복구
- [ ] F1-01-b: `RecipeTestPage.vue` 문법 오류 복구
```

---

### F1-02 — `invalidate-runtime-cache` 계약 복구

- **우선순위**: `Critical`
- **대상 파일**:
  - `backend/app/api/routes/recipe_test_impl.py`
  - `frontend/src/features/recipe_test/api/recipeTestApi.ts`
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
- **작업 목표**:
  - 프런트가 이미 기대하는 `POST /api/recipe-test/invalidate-runtime-cache` 계약을 실제 백엔드에 맞춤
- **작업 내용**:
  - 백엔드에 `eqpId` 단위 캐시 무효화 엔드포인트 추가
  - 응답 shape 정합화: `{ status, eqpId }`
  - 프런트 polling/reload 흐름이 404 없이 동작하도록 확인
- **완료 기준**:
  - 해당 API 호출 시 200 반환
  - snapshot hash 변경 시 프런트가 reload 흐름을 완료

```
- [ ] F1-02-a: 백엔드 invalidate 엔드포인트 구현
- [ ] F1-02-b: 프런트 invalidate 호출/실패 처리 확인
```

---

### F1-03 — 백엔드 테스트 전략 재정의

- **우선순위**: `Critical`
- **대상 파일**:
  - `backend/tests/test_api_routes.py`
  - `backend/tests/test_mockup_routes.py`
  - 필요 시 공통 fixture
- **작업 목표**:
  - 기본 테스트가 현재 런타임 모델과 맞게 동작하도록 재구성
- **작업 내용**:
  - `recipe-test` 테스트를 `unit/mock` 과 `integration/live` 로 분리
  - 로컬 기본 경로는 외부 인프라 없이 통과하도록 monkeypatch/mock 적용
  - `invalidate-runtime-cache` 테스트를 실제 계약에 맞게 포함
- **완료 기준**:
  - 기본 pytest 는 외부 인프라 전제 없이 안정적으로 수행
  - live 테스트는 별도 마커 또는 문서화된 실행 경로로 분리

```
- [ ] F1-03-a: `test_api_routes.py` 의 live 의존 가정 제거
- [ ] F1-03-b: mock/live 테스트 구분 도입
```

---

### F1-04 — 영속성 리스크 선제 해소

- **우선순위**: `High`
- **대상 파일**:
  - `backend/app/services/temp_file_store.py`
  - `backend/app/services/history_service.py`
  - `backend/app/services/recipe_cache_store.py`
  - `backend/app/services/recipe_vm_store.py`
  - `backend/.env.example`
- **작업 목표**:
  - tempdir 고정 저장을 운영 가능한 영속 경로 정책으로 전환
- **작업 내용**:
  - `LOCAL_EDIT_BASE` 환경변수 지원
  - history/cache/shadow/VM 저장소 하위 디렉토리 정책 정리
- **완료 기준**:
  - 환경변수 지정 시 영속 디렉토리에 저장
  - 재기동 후 history/cache 유지 확인 가능

```
- [ ] F1-04-a: `LOCAL_EDIT_BASE` 환경변수화
- [ ] F1-04-b: 저장소 하위 경로 정책 정리
```

---

### F1-05 — `cloud_protected` 계약 정리

- **우선순위**: `High`
- **대상 파일**:
  - `backend/app/services/recipe_inventory_sync.py`
  - `backend/app/services/cloud_protected_registry.py`
- **작업 목표**:
  - 인벤토리 워커/캐시 경로의 시그니처 불일치 제거
- **작업 내용**:
  - 실제 판정에 필요한 인자 집합을 확정
  - 함수 시그니처와 호출부를 일치시킴
- **완료 기준**:
  - worker/inventory 경로에서 타입 무시 없이 동작

```
- [ ] F1-05: `cloud_protected` 함수 계약 정합화
```

---

## 2. Phase 1.5 — 사용자 체감 장애 완화

### F1.5-01 — History 오류 상태 분리

- **우선순위**: `High`
- **대상 파일**:
  - `frontend/src/features/history/pages/MyHistoryPage.vue`
- **작업 목표**:
  - “조회 실패”와 “이력 없음”을 구분해서 사용자에게 표시
- **완료 기준**:
  - History API 실패 시 별도 오류 상태/재시도 UI 제공

```
- [ ] F1.5-01: History empty/error state 분리
```

---

### F1.5-02 — snapshot/worker 상태 UX 보강

- **우선순위**: `High`
- **대상 파일**:
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
- **작업 목표**:
  - snapshot polling 실패, worker 미실행, stale inventory 상황을 사용자에게 더 명확히 전달
- **작업 내용**:
  - polling 실패 시 조용한 무시 대신 상태 표시 검토
  - snapshot 빈 결과/오래된 결과의 의미를 UI에 반영
- **완료 기준**:
  - snapshot 관련 운영 제약이 사용자에게 숨겨지지 않음

```
- [ ] F1.5-02: snapshot/worker 상태 UX 보강
```

---

### F1.5-03 — actor 표시/정책 최소 정리

- **우선순위**: `Medium`
- **대상 파일**:
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
  - `frontend/src/features/recipe_test/components/RecipeTestHeader.vue`
  - `backend/app/services/history_service.py`
- **작업 목표**:
  - 현재 actor 정책의 약점을 드러내고 최소한 사용자에게 현재 actor 컨텍스트를 보여줌
- **완료 기준**:
  - 사용자가 현재 기록될 이름/팀을 인지 가능

```
- [ ] F1.5-03: 현재 actor 표시 및 정책 문서화
```

---

## 3. Phase 2 — 안정화

### F2-01 — 런타임 캐시 정책 수립

- **우선순위**: `Medium`
- **대상 파일**:
  - `backend/app/api/routes/recipe_test_impl.py`
- **작업 목표**:
  - `BOOTSTRAP_CACHE`, `CAS_CACHE`, `JOB_CACHE`, `RECIPE_CACHE`, `RECIPE_SOURCE_CACHE` 의 TTL/max-size 정책 수립
- **완료 기준**:
  - 무제한 dict 운용 탈피
  - invalidate API 와 TTL 정책이 함께 설명 가능

```
- [ ] F2-01: 런타임 캐시 TTL/max-size 정책 적용
```

---

### F2-02 — 편집 상태를 엔티티 중심으로 재구성

- **우선순위**: `Medium`
- **대상 파일**:
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
- **작업 목표**:
  - 선택 상태와 편집 상태의 혼선을 줄임
- **작업 내용**:
  - `editingJobId`, `editingCasId` 등 엔티티 결합 상태 도입
  - 편집 중 선택 전환 시 discard/save 확인 절차 강화
- **완료 기준**:
  - 편집 중 다른 항목 선택 시 저장 대상이 흔들리지 않음

```
- [ ] F2-02: CAS/JOB 편집 상태 엔티티화
```

---

### F2-03 — 프런트 알림/오류 UX 일원화

- **우선순위**: `Medium`
- **대상 파일**:
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
  - `frontend/src/features/history/pages/MyHistoryPage.vue`
- **작업 목표**:
  - `window.alert`, `console.error`, 모달 혼용을 줄이고 공통 패턴 도입
- **완료 기준**:
  - 확인/성공/실패/부분 실패에 대한 일관된 사용자 알림 체계 존재

```
- [ ] F2-03: 알림/오류 UX 일원화
```

---

### F2-04 — API 계약 검증 자동화

- **우선순위**: `Medium`
- **대상 파일**:
  - `frontend/src/features/recipe_test/api/recipeTestApi.ts`
  - `backend/app/api/routes/*.py`
  - 테스트 코드
- **작업 목표**:
  - 프런트 실사용 경로와 백엔드 실등록 경로를 자동 검증
- **완료 기준**:
  - 프런트 API 함수별 대응 경로/응답 shape 표 또는 테스트 존재

```
- [ ] F2-04: FE/BE API 계약 체크리스트 또는 자동 테스트 작성
```

---

## 4. Phase 3 — 품질 향상

### F3-01 — SQLite/파일 쓰기 일관성 개선

- **우선순위**: `Medium`
- **대상 파일**:
  - `backend/app/services/recipe_cache_store.py`
  - 필요 시 `recipe_inventory_sync.py`, `recipe_vm_store.py`
- **작업 목표**:
  - inventory/version/state 쓰기와 파일 저장의 일관성 개선
- **작업 내용**:
  - WAL 모드 검토
  - partial write 방지 패턴 검토
- **완료 기준**:
  - worker 경로의 쓰기 안정성 기준 확보

```
- [ ] F3-01-a: SQLite WAL 적용 검토/구현
- [ ] F3-01-b: inventory/version/state 쓰기 단위 정리
```

---

### F3-02 — FE 품질 게이트 추가

- **우선순위**: `Medium`
- **대상 파일**:
  - `frontend/package.json`
  - 필요 시 lint/test 설정 파일
- **작업 목표**:
  - build 외에 lint/typecheck/test 게이트 추가
- **완료 기준**:
  - 최소 `build`, `typecheck`, 필요 시 `lint`/`test` 스크립트 존재

```
- [ ] F3-02: FE lint/test/typecheck 게이트 추가
```

---

### F3-03 — Windows 운영/worker 절차 문서화

- **우선순위**: `Medium`
- **대상 파일**:
  - 운영 문서
  - 필요 시 시작 스크립트
- **작업 목표**:
  - 영속 경로, worker 운영 방식, snapshot 전제를 운영 문서로 연결

```
- [ ] F3-03-a: Windows 저장 경로/기동 절차 문서화
- [ ] F3-03-b: worker 운영 절차 문서화
```

---

## 5. Phase 4 — 후속 구조 정리

### F4-01 — 레거시 파일 정리

- **우선순위**: `Low`
- **대상 파일**:
  - `backend/main.py`
  - `backend/app/api/routes/recipe_test.py`
  - `backend/app/api/routes/recipe_file_ops.py`
  - `backend/db.py`
  - 프런트 산출물/미사용 파일
- **작업 목표**:
  - 활성 경로를 흔들지 않는 범위에서 정리

```
- [ ] F4-01-a: BE 레거시 엔트리포인트/라우터 정리
- [ ] F4-01-b: FE dead code/산출물 정리
```

---

### F4-02 — 대형 파일 분리

- **우선순위**: `Low`
- **대상 파일**:
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
- **작업 목표**:
  - 안정화 이후 composable/서브 컴포넌트 분리

```
- [ ] F4-02: `RecipeTestPage.vue` 구조 분리
```

---

## 6. 공통 검증 게이트

### Phase 1 완료 기준
- [ ] `cd frontend && npm run build` 성공
- [ ] `POST /api/recipe-test/invalidate-runtime-cache` 200 응답
- [ ] 기본 pytest 가 외부 인프라 전제 없이 안정적으로 수행
- [ ] `LOCAL_EDIT_BASE` 적용 경로에 저장 확인
- [ ] `cloud_protected` 호출 경로 예외 없음

### Phase 2 완료 기준
- [ ] History 실패와 빈 상태가 구분되어 표시됨
- [ ] snapshot/worker 상태가 사용자에게 더 명확히 드러남
- [ ] 편집 중 선택 전환 시 저장 대상이 흔들리지 않음
- [ ] FE/BE API 계약 표 또는 자동 검증 존재

### Phase 3 완료 기준
- [ ] SQLite/worker 쓰기 안정성 기준 확보
- [ ] FE 품질 게이트 도입
- [ ] Windows 운영/worker 절차 문서화

### 전체 완료 기준
- [ ] 미해결 `Critical` 이슈 0건
- [ ] 프런트 빌드 성공
- [ ] 백엔드 핵심 계약(`invalidate-runtime-cache`) 복구
- [ ] mock/live 테스트 전략 문서화 및 적용
- [ ] 영속 저장 경로 정책 적용

---

## 7. 우선순위 요약

### 지금 바로
1. `frontend/tsconfig.json` 복구
2. `RecipeTestPage.vue` 문법 복구
3. `invalidate-runtime-cache` 구현
4. `recipe-test` mock/live 테스트 분리
5. `LOCAL_EDIT_BASE` 환경변수화
6. `cloud_protected` 계약 정리

### 그 다음
1. History/snapshot/actor UX 보강
2. 런타임 캐시 정책 수립
3. 편집 상태 안정화
4. API 계약 검증 자동화

### 나중
1. SQLite/worker 원자성 개선
2. Windows 운영 문서화
3. 레거시/리팩터링 정리
