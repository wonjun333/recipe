# 최상위 지침

- 오버엔지니어링 금지
- 요청된 기능만 정확히 구현
- `pol_con_decoder.py`, `pol_con_maps.py` 절대 수정 금지
- 기존 기능 제거/변형 금지
- 하드코딩 금지, 반드시 env/config 기반 사용
- 실제 사내 PostgreSQL / MongoDB / FTP / SAML 연결을 기준으로 개발

---

# 개발/검증 기준

현재 기준은 다음과 같다.

- AI 실행/편집 환경: 사내 Windows에서 Codex 또는 Claude Code 사용
- 구현 기준: Linux에서 동작하는 코드
- 최종 검증/빌드/배포: 사내 Ubuntu
- 실제 사용자 접속 환경: 사내 Windows 브라우저

Windows는 AI 도구를 실행하고 파일을 편집하는 환경일 뿐이다. 코드, shell script, build, service 실행, 배포 절차는 Linux/Ubuntu 기준으로 작성하고 검증한다.

---

# 기술 스택

- Frontend: Vue 3 + TypeScript + Vite
- Backend: Python + FastAPI
- DB: PostgreSQL
- FTP 인증 정보: MongoDB
- 설비 파일: FTP
- Cache/history/inventory: SQLite 또는 env로 지정된 DB
- Auth: SAML JWT cookie

---

# 환경 규칙

## Windows AI 작업 환경

- Codex/Claude Code는 Windows에서 호출할 수 있다.
- Windows 전용 동작을 기준으로 코드를 작성하지 않는다.
- Windows에서 실행한 명령 결과가 최종 판단 기준이 아니다.
- Windows path separator, CRLF, file lock 때문에 생긴 차이는 Linux 기준으로 재검증한다.

## Linux/Ubuntu 구현 및 검증 환경

- 모든 runtime path, shell command, service, build script는 Ubuntu 기준으로 작성한다.
- Python path 처리는 `pathlib.Path`를 우선 사용한다.
- text file read/write 시 encoding을 명시한다.
- parser는 CRLF/LF 모두 처리할 수 있게 작성하되, 최종 검증은 Linux에서 한다.
- 배포 전 실제 사내 PostgreSQL / MongoDB / FTP / SAML 설정으로 smoke test를 수행한다.

---

# 실제 데이터 연결 규칙

이 프로젝트는 실제 사내 데이터 연결만 지원한다.

- 설비 마스터: PostgreSQL
- FTP 인증 정보: MongoDB
- CAS/JOB/Recipe 파일: FTP
- 사용자 인증: SAML JWT cookie

테스트용 가짜 provider, sample credential, 개발용 fake user, fake route를 추가하지 않는다. 사내 리소스 접근이 실패하면 실패 원인을 드러내고, 임의 데이터로 성공처럼 처리하지 않는다.

---

# 구현 규칙

반드시 env/config 기반으로 아래 항목을 분리 가능하게 구현한다.

- DB URL
- MongoDB URL
- FTP host/user/password
- SAML cookie/cert path
- build path
- cache/data path
- OS dependency
- file path
- encoding

Linux 기준 필수:

- Ubuntu에서 frontend build 통과
- Ubuntu에서 backend import/compile 통과
- Ubuntu에서 service 실행 경로 검증
- `.env` 누락 시 명확한 오류 제공
- shell script는 bash 기준으로 작성
- Windows용 `.bat`/`.ps1`는 필요할 때만 별도 보조 문서로 분리

---

# AI Agent 작업 규칙

- 작업 전 관련 파일을 먼저 읽고 기존 구조를 따른다
- 사용자 변경사항을 되돌리지 않는다
- 코드 변경 시 직접 관련된 파일만 수정한다
- 사내 리소스 접근 실패를 임의 성공 처리하지 않는다
- 배포 또는 환경 변경을 수반하면 문서도 같이 갱신한다
- `CLAUDE.md`와 `PROJECT_REVIEW.md` 내용이 충돌하면 `CLAUDE.md`를 우선한다

---

# 문서화 규칙

환경별 설정 차이 또는 추가 작업이 필요하면 반드시 `HowToBuild.md` 또는 관련 docs 파일을 업데이트한다.

특히 아래 내용을 기록한다.

- Windows에서 Codex/Claude Code를 호출하는 방식
- Linux/Ubuntu 기준 build 방법
- Linux/Ubuntu 기준 실행 방법
- 실제 PostgreSQL / MongoDB / FTP / SAML 설정 방법
- OS별 주의사항
- package 설치 차이
- 검증 절차
- 배포 절차
- 문제 가능성 및 대응 방법

기능 추가/수정 시:

1. 변경된 env/config 설명
2. Ubuntu 최종 빌드/배포 검증 방법 설명
3. 실제 사내 DB/FTP/SAML 연결 영향 설명
4. `HowToBuild.md` 또는 관련 docs 업데이트 여부 확인

---

# 배포 안정성

배포 전:

- Ubuntu용 backup/rollback 절차 확인
- DB/cache/history 파일 backup 경로 확인
- `.env`와 인증서 경로 확인
- frontend build 산출물 배포 경로 확인
- backend service 재시작 절차 확인

참고 문서:

- `HowToBuild.md`
- `docs/windows-deployment-guide.md`는 과거 Windows 운영 참고 문서일 수 있으므로, 최종 Ubuntu 배포 기준과 다르면 Ubuntu 기준 문서를 우선 작성/수정한다.
