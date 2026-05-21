# PRD: CMP Recipe Management System

> 코드 기반 분석 — 2026-05-19

---

## 1. 프로젝트 개요

반도체 CMP(Chemical Mechanical Planarization) 공정 설비의 레시피 파일을 웹 브라우저에서 조회·편집·전송할 수 있는 사내 운영 도구.  
설비 FTP에 직접 접근해 CAS → JOB → Recipe 계층 구조를 탐색하고, 편집 결과를 다시 FTP에 저장하며, 모든 파일 조작 이력을 기록한다.

---

## 2. 목표

- 설비 FTP 파일(CAS·JOB·Recipe)을 브라우저에서 직접 조회·편집
- 설비 간 레시피 복사(Transfer) 작업을 UI에서 처리
- 파일 조작 이력(Rename, Save As, Edit, Delete, Transfer) 추적
- 레시피 파일 인벤토리를 로컬 SQLite에 캐싱하여 오프라인 조회 지원

---

## 3. 핵심 사용자

- **CMP 공정 엔지니어**: 설비 레시피를 조회하고 수정
- **분임조(Team) 담당자**: 담당 Line/Team 설비의 레시피 관리
- **공정 관리자** (추정): 이력 조회 및 이상 감지

---

## 4. 주요 기능

### 4.1 설비 선택 및 Load
- Line / 분임조 / 설비 ID 드롭다운 필터 (PostgreSQL `eqp_info`·`sdwt_info` 테이블에서 조회)
- Load 버튼 → 선택 설비 FTP 접속 → CAS 목록·JOB 목록 반환

### 4.2 CAS → JOB → Recipe 계층 탐색
- CAS 선택 시 슬롯별 JOB 매핑 표시
- JOB 선택 시 파싱된 구조 표시:
  - Pre/Post Metrology (활성화 여부, 레시피명)
  - Polisher (Platen 1/2/3 × Polish/Condition/ISRM/RTPC 등 레시피)
  - Cleaner (단계별 Station ID + 레시피명)

### 4.3 레시피 편집 (RecipePickerDialog)
- JOB 내 각 Platen/Cleaner 항목의 레시피를 다이얼로그에서 선택·변경
- 레시피 소스 종류(sourceKind): `polishRecipe`, `conditionRecipe`, `exSituCondition`, `specialExSitu`, `isrmAlgorithm`, `rtpcRecipe`, `hcluPostLoad`, `hcluPreUnload`, `megasonics`, `brush1`, `brush2`, `vaporDryer`, `metrologyRecipe`

### 4.4 파일 조작
| 작업 | 설명 |
|------|------|
| Save As (Persist) | CAS·JOB를 다른 이름으로 FTP 저장 |
| Rename | CAS·JOB·Recipe 파일명 변경 |
| Delete | CAS·JOB·Recipe 파일 삭제 |
| Clone | Recipe 파일 복사 |
| Transfer | 선택한 파일을 다른 설비 FTP로 전송 (Transfer Cart 사용) |

### 4.5 Transfer Cart
- 다수의 CAS·JOB·Recipe를 장바구니에 담고 복수 설비에 동시 전송
- 헤더의 Cart 버튼(뱃지 표시, 흔들림 애니메이션)으로 접근

### 4.6 인벤토리 캐시
- 설비별 레시피 파일 목록을 로컬 SQLite에 캐싱
- 파일 버전 이력 보관 (`file_versions` 테이블)
- 클라우드 보호 파일 플래그(`cloud_protected`) 지원 (추정: 특정 레시피는 읽기 전용 보호)

### 4.7 이력 조회 (MyHistoryPage)
- Rename / Save As / Edit / Delete / Transfer 이력 목록
- 다중 필터 (이름·분임조·설비·Action·Recipe명·날짜 범위)
- 동일 요청을 그룹핑하여 표시, 실패 항목 경고 표시

---

## 5. 화면 구성

### `/recipe-test` (RecipeTestPage)
```
[헤더: Line / 분임조 / 설비ID / Load / Cart]
[CAS 목록 패널] | [JOB 목록 패널] | [Content 패널 (JSON)]
[RecipePickerDialog (모달)] — 레시피 선택 시 팝업
```

### `/history` (MyHistoryPage)
```
[헤더: 타이틀 + 필터 카드 + Refresh]
[통계 행: 전체/Rename/Save As/Edit/Delete/Transfer]
[이력 테이블: 이름·분임조·From설비·Action·To설비·시간·RecipeName·Detail]
```

---

## 6. Backend API 구조

### Prefix: `/api/recipe-test`

| Method | Path | 설명 |
|--------|------|------|
| GET | `/eqp-options` | 설비 목록 조회 (PostgreSQL) |
| POST | `/load` | 설비 FTP 접속 → CAS·JOB 목록 반환 |
| GET | `/cas-content` | CAS 파일 파싱 (슬롯 목록) |
| GET | `/job-content` | JOB 파일 파싱 (Polisher·Cleaner·Metrology) |
| GET | `/recipe-content` | 레시피 파일 내용 조회 |
| GET | `/recipe-source-list` | sourceKind별 레시피 파일 목록 |
| POST | `/cas/persist` | CAS 파일 저장 |
| POST | `/job/persist` | JOB 파일 저장 |
| POST | `/file/rename` | 파일 이름 변경 |
| POST | `/file/delete` | 파일 삭제 |
| POST | `/recipe/clone` | 레시피 파일 복사 |
| POST | `/transfer` | 복수 파일 → 복수 설비 전송 |
| POST | `/invalidate-runtime-cache` | 설비 런타임 캐시 무효화 |
| GET | `/history` | 파일 조작 이력 조회 |

### Prefix: `/api/recipe-inventory`

| Method | Path | 설명 |
|--------|------|------|
| GET | `/snapshot` | 설비 전체 레시피 인벤토리 스냅샷 |
| GET | `/entries` | 설비 인벤토리 항목 목록 |
| GET | `/latest-version` | 특정 파일 최신 캐시 버전 |
| GET | `/failures` | 인벤토리 수집 실패 목록 |

### Prefix: `/api`

| Method | Path | 설명 |
|--------|------|------|
| GET | `/recipe-units` | 설비별 레시피 유닛 목록 (PostgreSQL `core.recipe_unit`) |

---

## 7. 데이터 흐름

```
브라우저
  └─ Fetch API (recipeTestApi.ts)
       └─ FastAPI Backend
            ├─ PostgreSQL (eqp_info, sdwt_info) → 설비 마스터
            ├─ MongoDB (ADDCMP.FTP_STATUS) → FTP 자격증명
            ├─ FTP (각 설비) → CAS·JOB·Recipe 파일 읽기/쓰기
            ├─ SQLite (로컬) → 인벤토리 캐시·파일 버전
            └─ JSONL 파일 (로컬) → 이력 로그
```

**캐시 전략**: `BOOTSTRAP_CACHE`, `CAS_CACHE`, `JOB_CACHE`, `RECIPE_CACHE` (in-memory dict) + SQLite 영속 캐시  
**임시 파일**: `LOCAL_EDIT_BASE` (환경변수 설정, 기본 `/tmp/recipe_test_staging`)

---

## 8. 비기능 요구사항

| 항목 | 내용 |
|------|------|
| 배포 환경 | Windows 서버 (사내) |
| 인코딩 | UTF-8, 경로 길이 ≤ 260자 |
| FTP 타임아웃 | API 요청 제한 60초 (프론트엔드) |
| Mock 모드 | `RECIPE_USE_MOCK=true` 환경변수로 DB 없이 동작 |
| 자격증명 | 환경변수로 분리 (`POSTGRES_URL`, `MONGO_URL`) |
| 네트워크 | 사내망 전용 — 외부 접근 불가 |

---

## 9. 향후 개선사항 (추정)

- RecipePickerDialog 실제 구현 (현재 stub 상태로 추정)
- TransferCartPanel 실제 전송 UI 연동
- Win97ConfirmDialog / Win97ContextMenu 우클릭 컨텍스트 메뉴 기능 연동
- 레시피 diff 뷰 (이전 버전과 비교)
- 인벤토리 워커 자동 스케줄링 (`backend/tools/recipe_inventory_worker.py`)
- 클라우드 보호 레시피 읽기 전용 UI 처리

---

## 10. 현재 코드 기준 개발 우선순위

1. **[필수]** Backend 정상 기동 — `main.py` import 경로 정리
2. **[필수]** FTP 연결 — `ftp_eqp_ip.py` 환경변수 기반 재구성
3. **[필수]** Frontend 빌드 — tsconfig·vite 설정 수정
4. **[필수]** RecipeTestPage 렌더링 — 미구현 컴포넌트 stub 추가
5. **[중요]** RecipePickerDialog 실제 동작 구현
6. **[중요]** TransferCart 전송 플로우 연동
7. **[선택]** 인벤토리 워커 스케줄러 운영 자동화
