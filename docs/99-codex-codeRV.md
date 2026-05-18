# Codex Code Review

## Findings

### 1. Critical: 프론트엔드가 현재 빌드 불가능한 상태입니다
- [frontend/tsconfig.json](/home/dev/project/recipe/frontend/tsconfig.json:1) 파일이 TypeScript 설정 JSON이 아니라 Vite 설정 코드로 덮여 있습니다. `npm run build`가 `tsconfig.json(1,1): error TS1005: '{' expected.`로 바로 실패합니다.
- [frontend/src/features/recipe_test/pages/RecipeTestPage.vue](/home/dev/project/recipe/frontend/src/features/recipe_test/pages/RecipeTestPage.vue:626)에 `Pel백엔드 포맷 유지` 같은 비코드 텍스트가 들어가 있고, [1333](/home/dev/project/recipe/frontend/src/features/recipe_test/pages/RecipeTestPage.vue:1333)의 `compress_output_matrix`, [3224](/home/dev/project/recipe/frontend/src/features/recipe_test/pages/RecipeTestPage.vue:3224)의 `else` 등 문법 파손이 있습니다.
- 결과적으로 현재 저장소 기준 프론트는 배포 이전 단계에서 막힙니다. 이 상태에서는 나머지 API 정합성 문제를 고쳐도 UI는 올라오지 않습니다.

### 2. High: 백엔드 메인 앱에 서브라우터가 등록되지 않아 대부분의 API가 열리지 않습니다
- [backend/app/main.py](/home/dev/project/recipe/backend/app/main.py:1) 와 [backend/main.py](/home/dev/project/recipe/backend/main.py:1) 모두 `FastAPI` 앱과 `/`, `/api/recipe-units`만 정의하고 있고 `include_router(...)`가 전혀 없습니다.
- 반면 실제 기능성 라우터는 [backend/app/api/routes/recipe_test_eqp.py](/home/dev/project/recipe/backend/app/api/routes/recipe_test_eqp.py:1), [recipe_test_content.py](/home/dev/project/recipe/backend/app/api/routes/recipe_test_content.py:1), [recipe_test_history.py](/home/dev/project/recipe/backend/app/api/routes/recipe_test_history.py:1), [recipe_file_ops.py](/home/dev/project/recipe/backend/app/api/routes/recipe_file_ops.py:1), [recipe_inventory.py](/home/dev/project/recipe/backend/app/api/routes/recipe_inventory.py:1)에 분리되어 있습니다.
- 따라서 현재 구조에서는 프론트가 호출하는 `/api/recipe-test/*`, `/api/recipe-inventory/*`가 404가 될 가능성이 매우 높습니다. 엔트리포인트를 하나로 정하고, 그 파일에서 모든 라우터를 등록해야 합니다.

### 3. High: 프론트가 호출하는 API와 백엔드가 제공하는 API가 맞지 않습니다
- 프론트는 [frontend/src/features/recipe_test/api/recipeTestApi.ts](/home/dev/project/recipe/frontend/src/features/recipe_test/api/recipeTestApi.ts:460)에서 `/api/recipe-inventory/snapshot`을 호출합니다.
- 하지만 백엔드는 [backend/app/api/routes/recipe_inventory.py](/home/dev/project/recipe/backend/app/api/routes/recipe_inventory.py:13)~[39](/home/dev/project/recipe/backend/app/api/routes/recipe_inventory.py:39) 기준 `/failures`, `/entries`, `/latest-version`, `/state`만 제공합니다. `/snapshot` 엔드포인트는 없습니다.
- 같은 파일에서 프론트는 [465](/home/dev/project/recipe/frontend/src/features/recipe_test/api/recipeTestApi.ts:465)~[469](/home/dev/project/recipe/frontend/src/features/recipe_test/api/recipeTestApi.ts:469)로 `/api/recipe-test/invalidate-runtime-cache`도 호출하지만, 백엔드 라우터에는 해당 엔드포인트가 없습니다.
- 이건 단순 개선 포인트가 아니라, 라우터를 등록하더라도 특정 기능이 계속 실패하는 계약 불일치입니다.

### 4. High: `recipe_test.py`와 `recipe_test_impl.py`가 중복 진화하면서 코드베이스가 분기됐습니다
- [backend/app/api/routes/recipe_test.py](/home/dev/project/recipe/backend/app/api/routes/recipe_test.py:1)는 2011줄, [backend/app/api/routes/recipe_test_impl.py](/home/dev/project/recipe/backend/app/api/routes/recipe_test_impl.py:1)는 845줄입니다.
- 두 파일은 같은 책임을 상당 부분 공유하지만 완전히 같지 않습니다. 실제 `diff` 결과, `recipe_test.py`에는 inventory snapshot hash, runtime cache invalidation, cached recipe union 등 추가 로직이 있고 `recipe_test_impl.py`에는 없습니다.
- 분리 라우터들은 대부분 `recipe_test_impl`만 참조하고 있습니다. 즉 일부 기능은 오래된 구현을 타고, 일부는 신규 구현에만 존재하는 상태입니다.
- 이 구조는 버그 수정 시 한쪽만 고치고 다른 쪽은 놓치는 전형적인 split-brain 상태입니다. `recipe_test.py`를 단일 소스로 삼거나, 서비스 계층으로 로직을 내리고 라우터는 얇게 유지해야 합니다.

### 5. Medium: 로컬 shadow 파일 저장 방식이 파일명 충돌과 데이터 덮어쓰기를 유발합니다
- [backend/app/services/temp_file_store.py](/home/dev/project/recipe/backend/app/services/temp_file_store.py:9)~[13](/home/dev/project/recipe/backend/app/services/temp_file_store.py:13)는 shadow 파일을 `LOCAL_EDIT_BASE / file_name` 하나로만 저장합니다.
- 이를 사용하는 [backend/app/services/file_ops_service.py](/home/dev/project/recipe/backend/app/services/file_ops_service.py:90)~[118](/home/dev/project/recipe/backend/app/services/file_ops_service.py:118)는 설비 ID, 원본 경로, 타임스탬프 없이 단순 파일명만 전달합니다.
- 서로 다른 설비나 디렉토리에서 같은 이름의 파일을 rename/delete/save-as 하면 shadow 백업이 서로 덮어써질 수 있습니다. 복구용 데이터 보존이라는 목적에 맞지 않습니다.

### 6. Medium: API 표면이 이중화돼 있어 팀이 어느 경로를 표준으로 써야 하는지 불명확합니다
- 예제 프런트 클라이언트는 [frontend/src/features/recipe_test/api/recipeFileOpsApi.example.ts](/home/dev/project/recipe/frontend/src/features/recipe_test/api/recipeFileOpsApi.example.ts:44)~[68](/home/dev/project/recipe/frontend/src/features/recipe_test/api/recipeFileOpsApi.example.ts:68)에서 `/api/recipe-file-ops/*`를 사용합니다.
- 실제 라우터는 [backend/app/api/routes/recipe_test_ops.py](/home/dev/project/recipe/backend/app/api/routes/recipe_test_ops.py:12)에 `/recipe-file-ops`가 있고, 별도로 [backend/app/api/routes/recipe_file_ops.py](/home/dev/project/recipe/backend/app/api/routes/recipe_file_ops.py:6)는 `/recipe-test` 아래에 file ops를 둡니다.
- 실제 프론트는 다시 [frontend/src/features/recipe_test/api/recipeTestApi.ts](/home/dev/project/recipe/frontend/src/features/recipe_test/api/recipeTestApi.ts:439)~[457](/home/dev/project/recipe/frontend/src/features/recipe_test/api/recipeTestApi.ts:457)에서 `/api/recipe-test/file/*`와 `/api/recipe-test/transfer`를 사용합니다.
- 같은 기능에 대해 경로 체계가 세 갈래라서 유지보수자 입장에서 어떤 API가 살아있는 표준인지 판단하기 어렵습니다. 폐기할 경로와 유지할 경로를 명확히 정리해야 합니다.

### 7. Medium: 현재 테스트는 제품 동작을 보장하지 못합니다
- `pytest`는 통과했지만, [backend/tests/test_mockup_routes.py](/home/dev/project/recipe/backend/tests/test_mockup_routes.py:1)~[80](/home/dev/project/recipe/backend/tests/test_mockup_routes.py:80) 기준 정적 mock 데이터 shape 검증이 중심입니다.
- 실제 FastAPI 앱에 라우터가 연결되는지, 프론트가 빌드되는지, 프론트-백엔드 계약이 맞는지, FTP/DB 예외 처리 흐름이 유지되는지는 테스트하지 않습니다.
- 현재처럼 `43 passed`인데도 실제 프론트 빌드가 깨지고 주요 API가 미연결인 상태가 가능한 이유가 여기 있습니다. 최소한 route smoke test와 frontend build check를 CI에 넣어야 합니다.

### 8. Low: 디버그 로그와 미정리 타입 사용이 운영 품질을 떨어뜨립니다
- [frontend/src/main.ts](/home/dev/project/recipe/frontend/src/main.ts:6)~[7](/home/dev/project/recipe/frontend/src/main.ts:7)에 개발용 `console.log`가 남아 있습니다.
- [frontend/src/features/history/pages/MyHistoryPage.vue](/home/dev/project/recipe/frontend/src/features/history/pages/MyHistoryPage.vue:190), [frontend/src/features/recipe_test/pages/RecipeTestPage.vue](/home/dev/project/recipe/frontend/src/features/recipe_test/pages/RecipeTestPage.vue:548) 등에서 `any` 사용이 많아 타입 안정성이 크게 떨어집니다.
- 지금 당장 장애를 만들 수준은 아니지만, 이미 규모가 큰 단일 컴포넌트와 결합되면 회귀를 더 빨리 키우는 요인이 됩니다.

## Open Questions

- 실제 배포 엔트리포인트가 `backend/main.py:app`인지, `backend/app/main.py:app`인지 불명확합니다. 둘 다 살아 있으면 수정 누락이 반복됩니다.
- `recipe_test.py`와 `recipe_test_impl.py` 중 어느 쪽을 정본으로 유지할지 결정이 필요합니다. 지금 상태로는 둘 다 유지할 이유보다 위험이 더 큽니다.

## Verification

- `pytest -q backend/tests` 실행 결과: `43 passed`
- `npm run build` 실행 결과: 실패
  - `frontend/tsconfig.json` 파손
  - `frontend/src/features/recipe_test/pages/RecipeTestPage.vue` 문법 오류 다수

## Recommended Next Steps

1. `frontend/tsconfig.json`과 `RecipeTestPage.vue`의 문법 파손을 먼저 복구해 프론트 빌드부터 정상화합니다.
2. 백엔드 엔트리포인트를 하나로 통일하고 `include_router(...)`를 통해 실제 라우터를 등록합니다.
3. 프론트 API 호출 목록과 백엔드 제공 엔드포인트를 표로 맞춰서 `/snapshot`, `/invalidate-runtime-cache` 같은 누락 경로를 정리합니다.
4. `recipe_test.py`와 `recipe_test_impl.py`를 단일 구현으로 수렴시킵니다.
5. CI에 `pytest`, FastAPI route smoke test, `npm run build`를 모두 추가합니다.
