# Recipe Front-End / Backend 코드 검토 요약

## 목적

이 프로젝트는 CMP 양산 설비의 CAS → JOB → Recipe 파일 흐름을 웹에서 보여주고 일부 파일을 편집·복사·삭제·전송하기 위한 UI/API입니다. CAS/JOB/Recipe 영역은 양산 설비와 유사한 Win97 스타일 UX를 제공하고, 나머지 네비게이션·History·Cart·애니메이션은 최신 Vue 방식으로 구성하는 구조입니다.

## 주요 동작

- 설비 선택 후 FTP에서 CAS/JOB/Recipe 목록 조회
- CAS 파일의 Slot별 Job Name 파싱 및 편집/저장
- JOB 파일의 Pre/Post Metrology, Polisher, Cleaner section 파싱 및 편집/저장
- Recipe 파일 preview 표시
  - `.pol`, `.con`: binary Little Endian decoder 기반 preview
  - `.meg`, `.br`, `.dryr/.drpr`: text recipe parser 기반 preview
  - `.alg`, `.seg`, `.scx`: preview not available 처리
- 파일 Rename / Save As / Delete / Transfer
- History JSONL 기록 및 조회
- RMS CSV 기반 Cloud Protected recipe registry
- SQLite 기반 inventory/cache + VM mirror 저장

## 구조 요약

- `backend/app/api/routes`: FastAPI route
- `backend/app/services`: FTP, DB credential, parser, decoder, cache, history service
- `backend/tools`: local debug 및 inventory worker
- `backend/app/RMS`: RMS에서 cloud protected recipe 목록 내려받기
- `frontend/src/features/recipe_test`: Recipe Test page, API client, Win97-style components
- `frontend/src/features/history`: action history UI

## 불필요하거나 중복 가능성이 있는 파일

- `backend/app/api/routes/recipe_test.py`와 `recipe_test_impl.py`: 기능 중복. 하나의 라우팅 방식으로 정리 권장.
- `backend/app/api/routes/recipe_file_ops.py`와 `recipe_test_ops.py`: 같은 endpoint를 중복 등록할 수 있음. 하나만 include 권장.
- `frontend/src/components/Sidebar.vue`: 현재 App.vue는 TopBarNav를 쓰므로 사이드바는 미사용 가능성이 큼.
- `frontend/src/features/recipe_test/api/recipeFileOpsApi.example.ts`: 샘플/이전 API client 성격. 실제 사용은 `recipeTestApi.ts`.
- `backend/tools/debug_pol_con_decoder.py`: 개발/디버그 전용.
- `backend/app/services/pol_con_encoder.py`: 역인코딩 skeleton이며 현재 NotImplemented 상태.

## 구동 전 수정이 필요한 핵심 이슈

1. `backend/app/main.py`가 실제 router를 include하지 않습니다. `/api/recipe-test/*`, `/api/recipe-inventory/*`를 쓰려면 router include가 필요합니다.
2. Frontend는 `/api/recipe-inventory/snapshot`, `/api/recipe-test/invalidate-runtime-cache`를 호출하지만 backend에 endpoint가 없습니다.
3. `cloud_protected_registry.is_cloud_protected_file()`는 1개 인자만 받는데 `recipe_inventory_sync.py`는 3~4개 인자로 호출합니다.
4. SQLite cache는 worker/backend 동시 접근 시 `database is locked` 가능성이 있으므로 WAL/busy_timeout 적용 권장.
5. `frontend/package.json`의 `vue-router: ^5.0.3`은 Vue 3 일반 구성에서는 `^4.x`가 더 안정적입니다.
6. `tsconfig.app.json`의 `noUnusedLocals`, `noUnusedParameters`가 true라면 큰 Vue 파일에서 build 실패 가능성이 있습니다.
7. `backend/app/RMS/run_RMS.sh`는 현재 `cd backend/app/RMS` 후 `python app/RMS/RMS_down.py`를 호출하여 경로가 중복될 수 있습니다.
8. DB/Mongo 접속 정보와 계정 정보가 코드에 하드코딩되어 있습니다. `.env`로 분리 권장.

## 이 ZIP의 복원 상태

이 ZIP은 사용자가 제공한 파일 구조와 대부분의 서비스/컴포넌트 코드를 기반으로 구성했습니다. 실제 비공개 CSV 데이터는 포함하지 않고 `rcp_id` 헤더와 예시 1행만 넣었습니다.

주의: 대화에서 매우 길게 제공된 다음 파일은 이 ZIP 안에서 완전본이 아니라 구조 보존용 placeholder/축약본으로 들어 있습니다. 실제 실행용으로는 대화에서 제공한 전체본으로 교체해야 합니다.

- `backend/app/api/routes/recipe_test.py`
- `backend/app/api/routes/recipe_test_impl.py`
- `frontend/src/features/recipe_test/pages/RecipeTestPage.vue`
- 일부 대형 Vue component는 축약 skeleton 형태입니다.

