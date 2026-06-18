# PRD: CMP Recipe Management System

Last updated: 2026-06-18

## 1. 프로젝트 개요

CMP 양산 설비의 CAS -> JOB -> Unit Recipe 파일 흐름을 웹에서 조회하고, 필요한 파일 편집/복사/삭제/전송 이력을 관리하는 내부 운영 도구다.

현재 기준은 실제 사내 환경 전용이다.

- 개발 편집: Windows에서 Codex/Claude Code 사용 가능
- 구현/검증 기준: Linux
- 최종 빌드/배포: 사내 Ubuntu
- 사용자 접속: 사내 Windows 브라우저
- 데이터 연결: 실제 PostgreSQL / MongoDB / FTP / SAML

## 2. 목표

- 설비별 CAS/JOB/Recipe 파일을 빠르게 탐색한다.
- CAS/JOB/Unit Recipe 편집 결과를 실제 FTP에 저장한다.
- 파일 Rename / Save As / Delete / Transfer를 지원한다.
- My History에서 사용자, 설비, action, recipe, 상세 변경 이력을 조회한다.
- Unit Recipe edit 이력은 step 번호, column, component, 단위, before/after 값을 구조적으로 저장한다.

## 3. 핵심 사용자

- CMP 공정/설비 엔지니어
- 사내 운영/배포 담당자
- Recipe 변경 이력을 추적해야 하는 관리자

## 4. 주요 기능

### 4.1 설비 선택 및 Load

- PostgreSQL 설비 master에서 line/team/eqp 목록 조회
- 선택한 설비의 FTP 인증 정보를 MongoDB에서 조회
- FTP에서 CAS/JOB/Recipe 파일 목록 및 내용을 로드

### 4.2 CAS -> JOB -> Recipe 탐색

- CAS slot별 Job Name 표시
- JOB 내부 section 파싱
- JOB의 Polisher/Cleaner/Metrology recipe 참조 표시
- Unit Recipe preview 표시

### 4.3 파일 편집

- CAS slot job 변경 저장
- JOB parsed content 변경 저장
- `.pol`, `.con` Unit Recipe inline edit/save
- Unit Recipe 변경 이력은 structured revision table에 저장

### 4.4 파일 조작

- Rename
- Save As
- Delete
- Transfer
- 작업 실패 시 reason을 history에 기록

### 4.5 My History

- action history 조회
- 사용자/설비/action/recipe/date 필터
- comment 저장
- Unit Recipe edit 상세 변경 목록 표시

### 4.6 Inventory/Cache

- FTP inventory snapshot 제공
- RMS Cloud Protected registry 반영
- SQLite 또는 `RECIPE_CACHE_DB_URL` 기반 DB에 inventory/cache/history 저장
- runtime cache invalidate API 제공

## 5. 화면 구성

### `/recipe-test`

메인 작업 화면.

- 설비 선택
- CAS/JOB/Recipe list
- CAS/JOB parsed content
- Recipe preview/edit
- Transfer cart

### `/history`

작업 이력 조회 화면.

- grouped history row
- detail/revision popover
- comment

## 6. Backend API 구조

### Prefix: `/api/recipe-test`

- `GET /eqp-options`
- `POST /load`
- `GET /cas-content`
- `GET /job-content`
- `GET /recipe-content`
- `GET /recipe-source-list`
- `POST /cas/persist`
- `POST /job/persist`
- `POST /recipe/clone`
- `POST /file/rename`
- `POST /file/delete`
- `POST /transfer`
- `POST /invalidate-runtime-cache`
- `GET /history`
- `GET /history-comments`
- `PUT /history-comment`
- `POST /pol-con-encode`
- `POST /pol-con-save`

### Prefix: `/api/recipe-inventory`

- `GET /snapshot`
- `GET /latest-version`
- `POST /sync`

### Auth/Profile

- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/user/profile`

## 7. 데이터 흐름

1. 사용자가 사내 Windows 브라우저에서 접속한다.
2. SAML JWT cookie로 사용자를 식별한다.
3. PostgreSQL에서 설비 master를 조회한다.
4. MongoDB에서 FTP 접속 정보를 조회한다.
5. FTP에서 CAS/JOB/Recipe 파일을 읽는다.
6. 편집/전송 결과는 FTP에 반영한다.
7. cache/inventory/history는 로컬 SQLite 또는 지정 DB에 저장한다.
8. My History는 parent history + revision child tables를 조회한다.

## 8. 비기능 요구사항

- Ubuntu에서 build/run 가능해야 한다.
- Windows 편집 환경 차이가 runtime 코드에 들어가면 안 된다.
- path/encoding/line ending 처리는 Linux 기준으로 검증한다.
- 사내 DB/FTP/SAML 연결 실패는 명확한 오류로 노출한다.
- fake data, fake user, fake route를 추가하지 않는다.
- 주요 작업은 history에 남긴다.

## 9. 현재 개발 우선순위

1. Unit Recipe edit revision UI 표시 완성
2. Ubuntu 배포 절차 문서화
3. 실제 사내 DB/Mongo/FTP smoke test 자동화
4. 레거시 route/file 정리
5. 대형 Vue/Python 파일 구조 개선
