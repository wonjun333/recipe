# Recipe Frontend / Backend 프로젝트 리뷰

Last reviewed: 2026-06-18

## 리뷰 범위

이 문서는 현재 저장소 기준의 구조 요약과 작업 지침을 정리한다. 과거 개발 환경이나 임시 복원 상태 설명은 현재 기준에서 사용하지 않는다.

현재 개발 흐름은 다음을 기준으로 한다.

- AI 실행/편집 환경: 사내 Windows에서 Codex 또는 Claude Code 사용
- 구현 기준: Linux
- 최종 검증/빌드/배포: 사내 Ubuntu
- 사용자 접속 환경: 사내 Windows 브라우저

Windows는 개발 도구 실행 환경일 뿐이며, 최종 동작 판단은 Ubuntu build/run 결과를 기준으로 한다.

## 목적

이 프로젝트는 CMP 양산 설비의 CAS -> JOB -> Recipe 파일 흐름을 웹에서 보여주고 일부 파일을 편집, 복사, 삭제, 전송하기 위한 UI/API이다. CAS/JOB/Recipe 영역은 양산 설비와 유사한 Win97 스타일 UX를 제공하고, History/Cart/Navigation은 Vue 기반 웹 UI로 구성한다.

## 주요 동작

- 설비 선택 후 FTP에서 CAS/JOB/Recipe 목록 조회
- CAS 파일의 slot별 Job Name 파싱 및 편집/저장
- JOB 파일의 Pre/Post Metrology, Polisher, Cleaner section 파싱 및 편집/저장
- Recipe 파일 preview 표시
  - `.pol`, `.con`: binary Little Endian decoder 기반 preview
  - `.meg`, `.br`, `.dryr/.drpr`: text recipe parser 기반 preview
  - `.alg`, `.seg`, `.scx`: preview unavailable 처리
- 파일 Rename / Save As / Delete / Transfer
- My History 조회 및 comment 관리
- RMS CSV 기반 Cloud Protected recipe registry
- SQLite 또는 env 기반 cache/inventory 저장
- Unit recipe edit history 확장을 위한 structured revision table 지원

## 실제 데이터 연결

현재 기준에서 개발/검증 대상은 실제 사내 데이터 연결이다.

- 설비 마스터: PostgreSQL
- FTP 인증 정보: MongoDB
- CAS/JOB/Recipe 파일: FTP
- 사용자 인증: SAML JWT cookie

가짜 데이터 provider, sample credential, fake user, fake route는 유지 대상이 아니다. 사내 리소스 접근이 실패하면 API는 명확히 실패해야 하며 임의 데이터로 성공처럼 처리하면 안 된다.

## 구조 요약

- `backend/app/main.py`: FastAPI app entrypoint 및 router 등록
- `backend/app/api/routes`: FastAPI route
- `backend/app/services`: FTP, DB credential, parser, decoder, cache, history service
- `backend/tools`: local debug 및 inventory worker
- `backend/app/RMS`: RMS에서 cloud protected recipe 목록 내려받기
- `frontend/src/features/recipe_test`: Recipe Test page, API client, Win97-style components
- `frontend/src/features/history`: My History UI

## Linux 기준 작업 지침

- shell script, service 실행, build command는 Ubuntu 기준으로 작성한다.
- Windows에서 Codex/Claude Code로 파일을 편집하더라도 Windows 실행 결과만으로 완료 판단하지 않는다.
- Python path는 `pathlib.Path`를 우선 사용한다.
- text parser는 CRLF/LF 모두 처리하되, 최종 검증은 Ubuntu에서 한다.
- `.env`는 실제 PostgreSQL / MongoDB / FTP / SAML 값을 요구해야 한다.
- 배포 관련 변경은 Ubuntu 기준 문서와 함께 갱신한다.

## AI Agent 작업 지침

- `CLAUDE.md`를 우선 지침으로 사용한다.
- `pol_con_decoder.py`, `pol_con_maps.py`는 수정 금지 파일이다.
- 사내 DB/FTP 직접 접근이 안 되면 그 사실을 숨기지 말고 검증 한계를 기록한다.
- 기존 사용자 변경사항을 되돌리지 않는다.
- 빌드 산출물, cache, `__pycache__`, `node_modules` 하위 파일은 의도 없이 커밋하지 않는다.

## 재검증이 필요한 항목

아래 항목은 과거 리뷰에서 반복적으로 나온 내용이며, 현재 코드 기준으로 재검증 후 유지/삭제를 결정해야 한다. 과거 상세 리뷰 문서는 제거하고 핵심만 여기에 남긴다.

1. `backend/app/api/routes/recipe_test.py`와 `recipe_test_impl.py`의 중복 여부
2. `backend/app/api/routes/recipe_file_ops.py`, `recipe_test_ops.py`의 실제 router 등록 여부
3. `frontend/src/components/Sidebar.vue` 미사용 여부
4. `frontend/src/features/recipe_test/api/recipeFileOpsApi.example.ts` 유지 필요성
5. `backend/tools/debug_pol_con_decoder.py`의 개발 전용 유지 여부
6. `frontend/package.json`의 `vue-router` 버전과 실제 build 호환성
7. `backend/app/RMS/run_RMS.sh` 실행 경로
8. DB/Mongo/FTP/SAML 설정이 모두 `.env`로 분리되어 있는지
9. `docs/windows-deployment-guide.md`와 최종 Ubuntu 배포 절차의 차이

## 과거 리뷰에서 승계한 핵심 리스크

- API 계약 드리프트: `recipeTestApi.ts`와 FastAPI route 목록을 정기적으로 비교해야 한다.
- 대형 파일 리스크: `RecipeTestPage.vue`와 `recipe_test_impl.py`는 기능 변경 시 영향 범위가 크다.
- 저장소 리스크: SQLite cache/history를 여러 process가 동시에 쓸 때 lock 정책과 backup 범위를 확인해야 한다.
- 운영 경로 리스크: `RECIPE_DATA_DIR`, raw file cache, inventory worker log 경로는 Ubuntu 배포 기준으로 고정해야 한다.
- 인증/actor 리스크: SAML payload에서 history actor/knoxid가 일관되게 들어오는지 확인해야 한다.
- 보안 리스크: FTP path 입력, 에러 원문 노출, credential logging 여부를 코드 리뷰 때마다 확인해야 한다.
- 프런트 UX 리스크: History 오류 상태와 빈 결과 상태를 구분하고, edit 중 selection 변경 같은 상태 전이를 계속 점검해야 한다.

## 현재 주의할 리스크

- Windows 편집 환경에서 path/encoding 문제가 감춰질 수 있다.
- 사내 DB/FTP 접근 권한은 agent 실행 위치마다 달라질 수 있다.
- 실제 데이터 연결만 남긴 뒤에는 local-only 테스트가 줄어들 수 있으므로 Ubuntu smoke test 절차가 필요하다.
- My History schema가 확장되었으므로, 기존 history UI와 신규 structured revision 표시 정책을 함께 관리해야 한다.
- SQLite cache/history를 여러 process가 동시에 사용할 경우 lock 정책과 저장 경로를 확인해야 한다.

## 권장 검증 순서

1. Ubuntu 환경에서 frontend build
2. Ubuntu 환경에서 backend import/compile
3. 실제 PostgreSQL / MongoDB / FTP / SAML env 확인
4. 주요 API smoke test
5. 실제 설비 기준 CAS/JOB/Recipe load, edit, transfer, history 저장 확인
6. backend service 재시작 및 frontend 정적 파일 배포 확인

## 문서 유지 규칙

- 환경 전제가 바뀌면 `CLAUDE.md`, `PROJECT_REVIEW.md`를 같이 확인한다.
- 과거 환경이나 임시 복원 상태 설명은 현재 기준 문서에 남기지 않는다.
- 검증하지 않은 내용은 단정하지 말고 `검증 필요`로 표시한다.
- 배포 절차는 Ubuntu 최종 배포 절차를 기준으로 적는다.
