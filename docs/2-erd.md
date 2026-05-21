# Recipe Project 구조/의도 정리

> 기준일: 2026-05-19
> 범위: `frontend/`, `backend/`
> 원칙: 코드에서 직접 확인한 내용만 `코드 근거`로 적고, 해석이 필요한 내용은 `추정`으로 분리한다.

## 1. 프로젝트 한 줄 의도

### 코드 근거
- 이 프로젝트는 CMP 설비의 `CAS`, `JOB`, `RECIPE` 파일을 설비별로 조회하고, 일부 내용을 편집하거나 `Save As / Rename / Delete / Transfer` 하는 웹 도구다.
- 프런트의 메인 진입 화면은 `Recipe Test` 한 페이지이며, 설비 선택 후 파일 목록과 내용을 동시에 다룬다. 근거: `frontend/src/router/index.ts`, `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`, `frontend/src/components/TopBarNav.vue`.
- 백엔드의 실제 핵심 라우트는 `/api/recipe-test/*`, `/api/recipe-inventory/*` 이다. 근거: `backend/app/main.py`, `backend/app/api/routes/recipe_test_impl.py`, `backend/app/api/routes/recipe_inventory.py`.

### 추정
- 실제 사용자는 설비 엔지니어 또는 공정 담당자일 가능성이 높다.
- 운영 목적은 "설비 Recipe 파일을 안전하게 조회/복제/이관하고 변경 이력을 남기는 것"에 가깝다.
- `/recipe` 와 `/recipe-test` 를 분리하려던 흔적이 있으나, 현재는 사실상 하나의 메인 작업 화면으로 수렴한 상태다.

## 2. Frontend 구조와 화면

### 코드 근거
- 라우트는 2개다.
- `/recipe-test`: 메인 작업 화면
- `/history`: 작업 이력 화면
- 근거: `frontend/src/router/index.ts`

- 메인 화면은 사실상 하나의 워크스테이션 UI다.
- 상단 헤더: `Line / 분임조 / 설비 ID / Load / Cart`
- 좌측: CAS 목록, CAS 내용
- 우측: JOB 목록, JOB 내용
- 하단/우측 확장 영역: Recipe 목록/미리보기, Recipe Picker, Cart, 컨텍스트 메뉴, 확인 모달
- 근거: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`, `frontend/src/features/recipe_test/components/*`

- 이력 화면은 `Rename / Save As / Edit / Delete / Transfer` 이력을 필터링해서 본다.
- 시간 범위 필터, 다중 조건 필터, 그룹핑된 상세 보기까지 포함한다.
- 근거: `frontend/src/features/history/pages/MyHistoryPage.vue`

## 3. 주요 사용자 흐름

### 코드 근거
1. 설비 선택 후 `Load`
- 프런트가 `/api/recipe-test/load` 호출
- 백엔드가 설비 FTP 경로를 해석하고 CAS/JOB/RECIPE 목록을 읽어 bootstrap 캐시에 적재
- 근거: `frontend/src/features/recipe_test/api/recipeTestApi.ts`, `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`, `backend/app/api/routes/recipe_test_impl.py`

2. CAS/JOB/RECIPE 상세 조회
- CAS: `/cas-content`
- JOB: `/job-content`
- RECIPE: `/recipe-content`, `/recipe-source-list`
- 근거: `frontend/src/features/recipe_test/api/recipeTestApi.ts`, `backend/app/api/routes/recipe_test_impl.py`

3. CAS/JOB 편집 후 저장
- 프런트는 편집 상태를 메모리에 보관하다가 저장 시 persist API 호출
- 백엔드는 FTP 원본을 읽고 수정본을 생성해 FTP에 다시 쓰며, shadow 파일과 history를 남김
- 근거: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`, `backend/app/api/routes/recipe_test_impl.py`, `backend/app/services/file_ops_service.py`, `backend/app/services/history_service.py`

4. RECIPE 복제/이름변경/삭제
- 복제: `/recipe/clone`
- 이름변경: `/file/rename`
- 삭제: `/file/delete`
- 근거: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`, `backend/app/api/routes/recipe_test_impl.py`

5. Cart 기반 설비 간 Transfer
- 선택한 CAS/JOB/RECIPE를 Cart에 담고 타겟 설비를 선택해 `/transfer` 호출
- 백엔드는 source/target 설비의 `maker`, `modelGroup` 호환성을 검사한 뒤 FTP 간 복사
- 근거: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`, `backend/app/api/routes/recipe_test_impl.py`

6. 이력 조회
- 프런트 `/history` 화면이 `/api/recipe-test/history` 호출
- 백엔드는 JSONL 이력 파일을 읽어 최신순으로 반환
- 근거: `frontend/src/features/history/pages/MyHistoryPage.vue`, `backend/app/services/history_service.py`

7. 인벤토리 스냅샷 감시
- 프런트가 3초마다 `/api/recipe-inventory/snapshot` 을 폴링
- 해시가 바뀌면 목록 캐시를 갱신하고 다시 로드
- 근거: `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`, `backend/app/api/routes/recipe_inventory.py`

## 4. Backend 기능 구조

### 코드 근거
- `backend/app/main.py`
- 실제 FastAPI 앱 진입점
- `recipe_test_impl`, `recipe_inventory` 라우터를 mount

- `backend/app/api/routes/recipe_test_impl.py`
- 실질적인 핵심 업무 로직
- 설비 옵션 조회, load, CAS/JOB/RECIPE 조회, 저장, 복제, 이름변경, 삭제, transfer, history 제공

- `backend/app/api/routes/recipe_inventory.py`
- 로컬 캐시 인벤토리 조회용 API

- `backend/app/services/job_parser.py`
- JOB 텍스트를 `preMetrology / polisher / cleaner / postMetrology` 구조로 파싱

- `backend/app/services/recipe_preview_service.py`
- RECIPE 파일 종류별 미리보기 생성
- `.pol/.con` 디코드, `.meg/.br/.dryr/.drpr` 텍스트 파싱, 일부 타입은 no-preview

- `backend/app/services/recipe_inventory_sync.py`
- FTP를 스캔해서 로컬 인벤토리/버전 캐시를 갱신

- `backend/app/services/recipe_cache_store.py`
- SQLite 기반 인벤토리 캐시 저장소

- `backend/app/services/history_service.py`
- JSONL 기반 작업 이력 저장소

## 5. 데이터 흐름

### 코드 근거
```text
사용자
  -> Frontend RecipeTestPage
  -> /api/recipe-test/load
  -> PostgreSQL(eq 장비 메타) + MongoDB(FTP 계정) + FTP(실파일)
  -> BOOTSTRAP/CAS/JOB/RECIPE 메모리 캐시
  -> 화면 표시

사용자 편집/복제/이름변경/삭제/전송
  -> /api/recipe-test/*
  -> FTP 읽기/쓰기
  -> shadow 파일 저장
  -> history JSONL append
  -> 프런트 재로딩 또는 로컬 상태 동기화

백그라운드 인벤토리 워커
  -> FTP 스캔
  -> SQLite inventory/file_versions 갱신
  -> VM 파일 캐시 + preview 저장
  -> /api/recipe-inventory/snapshot 으로 프런트 반영
```

## 6. 주요 엔티티/저장소

### 코드 근거
| 구분 | 위치 | 역할 |
|---|---|---|
| EquipmentMeta | PostgreSQL `eqp_info`, `sdwt_info` | `line/team/eqpId/maker/modelGroup` 제공 |
| FtpCredential | MongoDB `ADDCMP.FTP_STATUS` | 설비 FTP 접속 정보 제공 |
| Bootstrap Cache | 프로세스 메모리 | 현재 설비의 목록/경로/메타 임시 보관 |
| CAS | FTP 파일 | 25개 slot에 JOB 매핑 |
| JOB | FTP 파일 | metrology/polisher/cleaner 설정 보유 |
| RECIPE | FTP 파일 | sourceKind별 recipe 본문 및 preview 대상 |
| HistoryEntry | JSONL | 사용자 작업 이력 |
| equipment_inventory | SQLite | 설비별 recipe inventory 캐시 |
| file_versions | SQLite | 파일 버전/preview/raw 경로 캐시 |
| inventory_failures | SQLite | 인벤토리 수집 실패 기록 |
| inventory_state | SQLite | 설비별 동기화 상태 |

### 코드 근거: 관계 요약
- `EquipmentMeta 1 -> N CAS/JOB/RECIPE`
- `CAS 1 -> 25 Slot`
- `Slot N -> 0..1 JOB`
- `JOB -> 여러 Recipe 이름 참조`
- `HistoryEntry -> 작업 대상 파일(CAS/JOB/RECIPE) 기록`
- `equipment_inventory -> latest file_versions` 연결

## 7. API 요약

### 코드 근거
| 영역 | API |
|---|---|
| 설비 메타 | `GET /api/recipe-test/eqp-options` |
| 초기 로드 | `POST /api/recipe-test/load` |
| CAS 조회 | `GET /api/recipe-test/cas-content` |
| JOB 조회 | `GET /api/recipe-test/job-content` |
| RECIPE 목록/조회 | `GET /api/recipe-test/recipe-source-list`, `GET /api/recipe-test/recipe-content` |
| CAS 저장 | `POST /api/recipe-test/cas/persist` |
| JOB 저장 | `POST /api/recipe-test/job/persist` |
| RECIPE 복제 | `POST /api/recipe-test/recipe/clone` |
| 공통 파일 작업 | `POST /api/recipe-test/file/rename`, `POST /api/recipe-test/file/delete` |
| 설비 간 이동 | `POST /api/recipe-test/transfer` |
| 이력 | `GET /api/recipe-test/history` |
| 인벤토리 | `GET /api/recipe-inventory/snapshot` 외 |

## 8. 현재 구현 의도

### 코드 근거
- "설비별 recipe 자산 관리 UI" 와 "recipe inventory 캐시/preview 시스템" 이 한 프로젝트에 같이 들어 있다.
- 실시간 작업은 `recipe_test_impl.py` 가 담당하고, 장기 캐시/버전 추적은 `recipe_inventory_sync.py` + `recipe_cache_store.py` 가 담당한다.

### 추정
- 장비에서 직접 파일을 만지지 않고, 웹 UI에서 최소한의 구조화된 편집만 허용하려는 의도다.
- Recipe 파일 전체 편집기보다, CAS slot 변경과 JOB의 핵심 파라미터 변경을 우선 지원하는 방향이다.

## 9. 누락되었거나 불명확한 요구사항

### 추정
- `mock` 모드의 범위가 불명확하다.
- 설정상 `RECIPE_USE_MOCK` 가 있지만, 실제 핵심 `/api/recipe-test/*` 는 여전히 실 DB/FTP 의존성이 강하다.

- 프런트/백엔드의 런타임 캐시 무효화 계약이 불명확하다.
- 프런트는 `POST /api/recipe-test/invalidate-runtime-cache` 를 기대하지만, 현재 활성 백엔드 기준으로는 구현 정합성을 다시 확인해야 한다.

- 어떤 파일 타입까지 "완전한 preview/편집" 을 지원해야 하는지 불명확하다.
- 일반 `recipe` 는 placeholder preview가 남아 있고, 일부 sourceKind는 no-preview 처리다.

- 동시 편집 충돌 정책이 없다.
- 다른 사용자가 같은 CAS/JOB/RECIPE를 수정했을 때 overwrite 경고나 revision check가 없다.

- 이력의 사용자 정보 정책이 약하다.
- `actorName` 은 localStorage 기반이며, 인증/권한/감사 추적 규칙은 코드에서 보이지 않는다.

- 이력 action 값의 표준화 규칙이 필요하다.
- 프런트는 `Rename / Save As / Edit / Delete / Transfer` 기준으로 보여주는데, mock/레거시 데이터와 이름 체계가 완전히 같다는 보장이 없다.

- Transfer 정책의 업무 정의가 더 필요하다.
- 현재는 `maker`, `modelGroup` 기준만 검사하지만, CAS/JOB/RECIPE 종류별 세부 정책은 문서화돼 있지 않다.

- 운영 엔트리포인트 정리가 필요하다.
- `backend/app/main.py` 와 별도 `backend/main.py`, 중복/레거시성 파일들이 함께 존재한다.
