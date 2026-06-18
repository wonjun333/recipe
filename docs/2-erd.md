# System Overview / Data Model

Last updated: 2026-06-18

이 문서는 실제 ERD와 시스템 구조 요약을 함께 다룬다. 현재 기준은 실제 사내 PostgreSQL / MongoDB / FTP / SAML 연결이며, 별도 fake data provider를 전제로 하지 않는다.

## 1. 시스템 구성

- Frontend: Vue 3 + TypeScript + Vite
- Backend: FastAPI
- Auth: SAML JWT cookie
- 설비 master: PostgreSQL
- FTP credential: MongoDB `ADDCMP.FTP_STATUS`
- Recipe files: 설비 FTP
- Cache/history/inventory: SQLite 또는 `RECIPE_CACHE_DB_URL`

## 2. 주요 화면

- `/recipe-test`: CAS/JOB/Recipe 조회, 편집, 전송
- `/history`: action history 및 comment 조회/수정

## 3. 주요 사용자 흐름

1. SAML 인증된 사용자가 접속한다.
2. `/api/recipe-test/eqp-options`로 설비 목록을 조회한다.
3. 사용자가 설비를 선택하고 load한다.
4. Backend는 MongoDB에서 FTP credential을 가져온다.
5. FTP에서 CAS/JOB/Recipe 파일 목록과 내용을 읽는다.
6. 사용자가 편집/전송/삭제를 수행한다.
7. Backend가 FTP에 반영하고 history를 저장한다.
8. My History에서 작업 이력과 revision detail을 조회한다.

## 4. Backend 구조

- `backend/app/main.py`: FastAPI app 및 router 등록
- `backend/app/api/routes/recipe_test_impl.py`: Recipe Test 주요 API
- `backend/app/api/routes/recipe_inventory.py`: inventory/cache API
- `backend/app/routers/auth.py`: SAML JWT cookie 인증/profile
- `backend/app/services/ftp_credentials.py`: MongoDB 기반 FTP credential 조회
- `backend/app/services/file_ops_service.py`: FTP read/write/delete/copy
- `backend/app/services/recipe_cache_store.py`: SQLite/Postgres cache, inventory, history
- `backend/app/services/history_service.py`: history service facade
- `backend/app/services/pol_con_decoder.py`: `.pol/.con` decode
- `backend/app/services/pol_con_encoder.py`: `.pol/.con` encode

## 5. 주요 저장소/엔티티

### 사내 PostgreSQL

설비 master 조회에 사용한다. 실제 테이블/컬럼은 사내 DB 기준이며 코드에서는 `eqp_info`, `sdwt_info` 계열 조회를 사용한다.

### MongoDB

`ADDCMP.FTP_STATUS`

- `EQPID`
- `FTP_SERVER`
- `FTP_ID`
- `FTP_PW`

### FTP

설비별 CAS/JOB/Recipe 실제 파일 저장소.

- CAS file
- JOB file
- Unit Recipe file
- sourceKind별 recipe path

### Cache / Inventory DB

`recipe_cache_store.py`가 생성/관리한다.

- `equipment_inventory`
- `file_versions`
- `inventory_failures`
- `inventory_state`
- `user_preferences`
- `recipe_history`
- `recipe_history_revisions`
- `recipe_history_revision_values`
- `recipe_history_comments`

## 6. History 모델

### `recipe_history`

작업 1건의 parent event.

- actor/user/team
- from/to equipment
- action
- item kind
- source/target/recipe name
- status/reason/detail
- created_at

### `recipe_history_revisions`

Unit Recipe edit에서 변경된 UI cell 1건.

- `history_id`
- `seq_no`
- `revise_column`
- `revise_index`
- `display_before`
- `display_after`

### `recipe_history_revision_values`

UI cell을 구성하는 component 값.

- `revision_id`
- `component_key`
- `component_label`
- `unit`
- `before_value`
- `after_value`
- `before_text`
- `after_text`
- `source_param_key`

예: `Platen RPM` cell은 `platen_rpm`과 `platen_accel` component를 가진다.

## 7. API 요약

### Recipe Test

- 설비 목록
- CAS/JOB/Recipe load
- CAS/JOB persist
- Recipe clone/rename/delete/transfer
- Unit Recipe encode/save
- runtime cache invalidate
- history/comment

### Recipe Inventory

- snapshot
- latest version
- sync

## 8. 현재 명확히 유지할 원칙

- 실제 사내 데이터 연결만 runtime 기준으로 둔다.
- DB/FTP/SAML 실패를 임의 성공으로 숨기지 않는다.
- fake user/fake route/fake file list를 추가하지 않는다.
- Windows는 AI 편집 환경이고, runtime 검증은 Ubuntu 기준이다.
