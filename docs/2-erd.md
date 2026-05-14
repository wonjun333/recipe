# Storage Model + Logical Data Model

## 1. Document Purpose

이 문서는 현재 저장소 기준의 실제 데이터 구조를 설명한다.

중요:
- 이 문서는 "정규화된 관계형 ERD"만을 설명하지 않는다.
- 현재 시스템은 hybrid persistence 구조다.
- FTP가 business file의 canonical source이고,
  SQLite / filesystem / JSONL은 local operational persistence 역할을 한다.

따라서 본 문서는 다음 두 층을 함께 다룬다.

1. Physical persistence model
2. Logical domain model

---

## 2. Persistence Overview

현재 코드베이스의 저장 계층은 다음과 같이 구성된다.

### 2.1 External Systems

- PostgreSQL
  - 설비 메타데이터 조회
- MongoDB
  - 설비별 FTP 자격증명 조회
- FTP
  - 설비의 실제 CAS/JOB/RECIPE 파일 원본 저장소

### 2.2 Local Operational Stores

- SQLite
  - inventory, version, failure, state 저장
- Local filesystem VM store
  - 설비/경로별 mirrored file bytes + `.meta.json`
- Local shadow file store
  - destructive FTP 작업 전 백업
- JSONL history
  - append-only audit log

---

## 3. Physical Persistence Model

## 3.1 SQLite: `equipment_inventory`

목적:
- 설비별 source path 내 파일의 "마지막으로 알려진 상태"를 저장
- live presence, 삭제 여부, cloud protected 여부, latest version 연결 정보 유지

Primary Key:
- `(eqp_id, source_path, name)`

### Fields

| Column | Type / Meaning | Notes |
|---|---|---|
| `eqp_id` | 설비 ID | PK 일부 |
| `source_path` | FTP source directory | PK 일부, normalized path |
| `name` | 파일명 | PK 일부 |
| `ext` | 확장자 | inferred 가능 |
| `modified_at` | 현재 inventory 상 modified time | live 또는 cache 기준 |
| `size` | 현재 inventory 상 size | string 저장 |
| `last_live_modified_at` | 마지막 live FTP 기준 modified time | live 비교용 |
| `last_live_size` | 마지막 live FTP 기준 size | live 비교용 |
| `last_cache_refresh_at` | 마지막 cache refresh 시각 | cache freshness |
| `live_present` | 현재 live FTP에 존재 여부 | 1/0 |
| `first_seen_at` | 처음 발견된 시각 | audit용 |
| `last_seen_at` | 마지막으로 확인된 시각 | inventory scan 기준 |
| `deleted_at` | live에서 사라진 시각 | nullable |
| `latest_version_id` | `file_versions.version_id` 참조 성격 | FK 제약은 없음 |
| `cloud_protected` | 보호 대상 여부 | retained 정책과 연계 |
| `retain_cached` | live에서 없어도 cache 유지 여부 | bool 성격 |

### 의미

이 테이블은 "파일 원본"을 저장하지 않는다.
이 테이블은 inventory index다.

---

## 3.2 SQLite: `file_versions`

목적:
- 파일 version capture 저장
- raw bytes 저장 경로, hash, preview JSON, metadata JSON 기록

Primary Key:
- `version_id`

### Fields

| Column | Type / Meaning | Notes |
|---|---|---|
| `version_id` | version PK | autoincrement |
| `eqp_id` | 설비 ID | logical ownership |
| `source_path` | FTP source path | logical ownership |
| `name` | 파일명 | logical ownership |
| `ext` | 확장자 | |
| `modified_at` | source modified time | live 기준 가능 |
| `size` | source size | string |
| `captured_at` | local capture 시각 | |
| `capture_reason` | capture 이유 | ex: `worker` |
| `storage_path` | raw bytes 저장 파일 경로 | filesystem pointer |
| `file_hash` | content hash | SHA1 |
| `preview_json` | 미리보기 payload | nullable |
| `metadata_json` | 기타 메타데이터 | sourceKind, cloudProtected 등 |

### 관계

- 하나의 logical file key `(eqp_id, source_path, name)` 는 여러 version을 가질 수 있다.
- DB 레벨 FK는 없지만 logical 1:N 관계다.

---

## 3.3 SQLite: `inventory_failures`

목적:
- inventory sync 중 발생한 오류 기록

Primary Key:
- `failure_id`

### Fields

| Column | Meaning |
|---|---|
| `failure_id` | PK |
| `eqp_id` | 설비 ID |
| `source_path` | 대상 path |
| `stage` | failure stage |
| `reason` | 오류 내용 |
| `created_at` | 기록 시각 |
| `resolved` | 해결 여부 |

---

## 3.4 SQLite: `inventory_state`

목적:
- 설비별 inventory revision과 요약 상태 관리

Primary Key:
- `eqp_id`

### Fields

| Column | Meaning |
|---|---|
| `eqp_id` | 설비 ID |
| `revision` | inventory revision counter |
| `inventory_hash` | snapshot hash |
| `file_count` | 스냅샷 기준 파일 수 |
| `last_sync_at` | 마지막 sync 시각 |
| `last_changed_at` | 마지막 변경 감지 시각 |
| `last_error` | 마지막 오류 메시지 |

---

## 3.5 Filesystem: VM Store

구현 위치:
- `backend/app/services/recipe_vm_store.py`

목적:
- 설비/경로/파일별 local mirror 저장
- raw bytes와 sidecar meta를 filesystem에 저장

### 구성

- 본문 파일
  - `{base}/{eqp_id}/{source_path_parts}/{file_name}`
- 메타 파일
  - `{file_name}.meta.json`

### Meta Fields

| Field | Meaning |
|---|---|
| `eqpId` | 설비 ID |
| `sourcePath` | source path |
| `name` | 파일명 |
| `modifiedAt` | source modified time |
| `size` | source size |
| `sourceKind` | recipe source kind |
| `cloudProtected` | 보호 여부 |
| `capturedAt` | VM 저장 시각 |

### 역할

- 빠른 재조회
- preview 재활용 전 local byte source
- live FTP 미접속 시 fallback 후보

---

## 3.6 Filesystem: Shadow Store

구현 위치:
- `backend/app/services/temp_file_store.py`

목적:
- delete / rename / copy 전 shadow backup 생성

주의:
- 현재 구현은 `file_name`만으로 shadow 경로를 만들기 때문에
  서로 다른 설비/경로의 동명 파일이 충돌할 수 있다.

---

## 3.7 JSONL: History Store

구현 위치:
- `backend/app/services/history_service.py`

파일 형식:
- append-only JSON Lines

목적:
- write-path 작업 audit trail 저장

### History Fields

| Field | Meaning |
|---|---|
| `actorName` | 작업자 |
| `actorTeam` | 작업자 팀 |
| `fromEqpId` | source equipment |
| `action` | 작업 유형 |
| `toEqpId` | target equipment |
| `createdAt` | 시각 |
| `itemKind` | cas/job/recipe |
| `sourceName` | 원본 이름 |
| `targetName` | 대상 이름 |
| `recipeName` | 관련 recipe 이름 |
| `requestId` | 요청 식별자 |
| `status` | 성공/실패 상태 |
| `reason` | 실패 이유 |
| `detail` | 상세 정보 |

이 저장소는 관계형 테이블이 아니다.

---

## 4. External Read-Only Sources

## 4.1 PostgreSQL

현재 코드상 Postgres는 두 가지 역할로 등장한다.

### A. `core.recipe_unit` 조회

- 파일: `backend/app/main.py`
- mock/legacy 성격의 `/api/recipe-units` 조회

### B. 설비 메타데이터 조회

- 파일: `backend/app/services/ftp_eqp_ip.py`
- `eqp_info`, `sdwt_info` 기반
- line/team/eqp/model/maker/model_group 조회

### Conceptual Entity: Equipment Reference

| Field | Meaning |
|---|---|
| `eqp_id` | 설비 ID |
| `line` | 라인 |
| `team` | 분임조 |
| `model` | 설비 모델 |
| `maker` | 제조사 |
| `model_group` | 모델 그룹 |

---

## 4.2 MongoDB

파일:
- `backend/app/services/ftp_credentials.py`
- `backend/app/services/ftp_eqp_ip.py`

역할:
- `ADDCMP.FTP_STATUS` 에서 설비별 FTP 자격증명 조회

### Conceptual Entity: FTP Credential

| Field | Meaning |
|---|---|
| `EQPID` | 설비 ID |
| `FTP_SERVER` | FTP host |
| `FTP_ID` | FTP user |
| `FTP_PW` | FTP password |

---

## 4.3 FTP

실제 business file 원본 위치다.

주요 monitored path:

| Source Kind | FTP Path | Extensions |
|---|---|---|
| polishRecipe | `\CMPDB\Lcmp\Recipes` | `.pol` |
| conditionRecipe | `\CMPDB\Lcmp\Recipes` | `.con` |
| exSituCondition | `\CMPDB\Lcmp\Recipes` | `.con` |
| specialExSitu | `\CMPDB\Lcmp\Recipes` | `.con` |
| megasonics | `\CMPDB\Lcmp\Recipes\CLEANER` | `.meg` |
| brush1 | `\CMPDB\Lcmp\Recipes\CLEANER` | `.br` |
| brush2 | `\CMPDB\Lcmp\Recipes\CLEANER` | `.br` |
| vaporDryer | `\CMPDB\Lcmp\Recipes\CLEANER` | `.drpr`, `.dryr`, `.dypr` |

참고:
- CAS/JOB 파일 경로와 파싱 로직의 완전한 구현은 현재 저장소에서 복원되지 않았다.

---

## 5. Logical Domain Model

이 섹션은 "현재 코드가 의도하는 도메인 개념"을 설명한다.
아래 항목은 모두 현재 physical table로 존재하는 것은 아니다.

## 5.1 Equipment

설비 작업의 최상위 컨텍스트.

Attributes:
- eqpId
- line
- team
- maker
- model
- modelGroup

## 5.2 RecipeFile

설비 FTP 아래 존재하는 일반화된 파일 개념.

Attributes:
- eqpId
- sourcePath
- name
- ext
- modifiedAt
- size
- livePresent
- sourceKind
- cloudProtected

Subtypes 또는 역할:
- CAS file
- JOB file
- RECIPE file

## 5.3 CAS Document

의도된 의미:
- slot별 JOB 매핑을 담는 설비 파일

Logical fields:
- casId
- eqpId
- slots[]
- raw text

## 5.4 CAS Slot

Logical child entity.

Fields:
- slotNumber
- jobId 또는 jobName
- recipeName 가능성

## 5.5 JOB Document

의도된 의미:
- process stage별 동작과 recipe 참조를 담는 파일

Logical fields:
- jobId
- jobName
- baseRecipeName
- raw text
- parsed projection

## 5.6 JOB Parsed Projection

`job_parser.py` 가 생성하는 derived structure.

Fields:
- `preMetrology`
- `polisher`
- `cleaner`
- `postMetrology`
- 이후 확장 가능 필드
  - `useHeads`
  - `hcluRecipes`

## 5.7 Recipe Preview

원본 recipe 파일로부터 생성되는 derived read model.

Fields:
- id
- name
- sourceKind
- columns
- rows
- meta

## 5.8 History Entry

작업 이력의 logical record.

실제 저장은 JSONL이지만,
도메인 관점에서는 write-path audit entity로 본다.

---

## 6. Relationships

## 6.1 Persisted Relationships

현재 코드상 실제로 유지되는 durable 관계는 다음과 같다.

1. `equipment_inventory` 1 : N `file_versions`
   - 관계 키: `(eqp_id, source_path, name)`
   - DB FK는 없지만 logical version chain

2. `inventory_state` 1 : 1 `eqp_id`

3. `inventory_failures` N : 1 `eqp_id`

## 6.2 Derived Relationships

다음 관계는 현재 런타임 또는 파일 파싱 결과로만 유도된다.

1. `Equipment` 1 : N `RecipeFile`
2. `CAS Document` 1 : N `CAS Slot`
3. `CAS Slot` N : 1 `JOB Document` reference
4. `JOB Document` 1 : N `Recipe reference`
5. `RecipeFile(logical)` 1 : N `FileVersion`
6. `RecipeFile` 1 : 0..1 `Recipe Preview`

## 6.3 Not Enforced In Current Storage

아래는 현재 관계형 제약으로 enforce되지 않는다.

- Equipment to RecipeFile
- CAS to JOB mapping
- JOB to Recipe mapping
- History to file/version linkage

---

## 7. Data Lifecycle

## 7.1 Inventory Sync Lifecycle

1. equipment 목록 조회
2. FTP credential 조회
3. FTP directory listing
4. extension filtering
5. `equipment_inventory` reconcile
6. 변경 파일 download
7. preview 생성
8. VM store 저장
9. `file_versions` 저장
10. `inventory_state` 갱신

## 7.2 Read Lifecycle

1. UI가 설비 선택
2. API가 CAS/JOB/RECIPE 목록 및 content 요청
3. 이상적 구현에서는 VM store 또는 live FTP에서 파일 읽기
4. JOB parser / recipe preview 생성기 사용
5. 구조화된 payload 반환

## 7.3 Write Lifecycle

의도된 흐름:

1. 기존 파일 읽기
2. 사용자 수정 적용
3. shadow backup
4. FTP write/delete/copy
5. VM store/cache 갱신
6. history 기록

현재 저장소에서는 이 흐름의 핵심 구현이 대부분 placeholder다.

---

## 8. Current Gaps

- 정규화된 `CAS`, `JOB`, `Recipe`, `TransferHistory` 테이블 없음
- edit session persistence 없음
- optimistic locking 없음
- relational migration framework 없음
- `.pol/.con` reverse encode 미완성
- history와 version 사이의 강한 링크 없음
- 일부 cache/inventory 동작은 runtime bug 가능성 존재

---

## 9. Suggested Future Physical Model

향후 시스템을 더 강하게 정규화하려면 다음 테이블들이 추가될 수 있다.

- `cas_documents`
- `cas_slots`
- `job_documents`
- `job_parsed_snapshots`
- `recipe_previews`
- `history_entries`
- `transfer_batches`
- `edit_sessions`

하지만 이는 현재 구현 상태가 아니라 future design이다.

따라서 현재 문서에서는 actual storage와 logical entities를 분리하는 것이 맞다.
