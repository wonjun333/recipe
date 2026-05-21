# 최상위 지침

- 오버엔지니어링 금지
- 요청된 기능만 정확히 구현
- `pol_con_decoder.py`, `pol_con_maps.py` 절대 수정 금지
- 기존 기능 제거/변형 금지
- 하드코딩 금지 (env/config 기반 사용)

---

# 개발 환경
현재 개발은 Mac + UTM Ubuntu + code-server + SSH 환경에서 진행한다.
AI(Claude/Codex)와 code-server 내부에서 대화하며 개발 중이다.
하지만 최종 검증/배포 환경은 사내 Windows 환경이다.
따라서 코드는 반드시 Windows 호환성을 고려해서 작성할 것.
Linux 전용 코드, shell command, path 처리 사용 최소화.

---

# 기술 스택
- Frontend: Vue3 + TypeScript + Vite
- Backend: Python + FastAPI

---

# 환경 분리 규칙

## 개발 환경 (code-server)
- 사내 DB/FTP 접근이 제한됨
- 반드시 mockup data 기반으로 개발/검증
- FTP parsing 및 DB 조회도 mockup 기반 지원
- Claude는 실제 사내 네트워크 접근 불가

## 사내 검증/운영 환경
- Windows 환경에서 검증 및 운영
- 실제 PostgreSQL / MongoDB / FTP 연결 사용
- git pull 후 build 및 실행

---

# 매우 중요한 규칙
mockup data와 실제 DB 연결 구조를 분리하지 말 것.
반드시 config/env 변경만으로 아래 전환이 가능하게 구현할 것.
- mockup ↔ 실제 PostgreSQL
- mockup ↔ 실제 MongoDB
- mockup ↔ 실제 FTP

비즈니스 로직은 공통 유지하고, 데이터 소스만 교체 가능하게 구현.
개발 완료 후 실제 배포 단계에서는 mockup data 제거 예정임을 고려해서 구조 설계.

---

# 사내 DB 정보

| 용도 | 종류 |
|---|---|
| 설비 마스터 | PostgreSQL |
| FTP 인증 정보 | MongoDB |
| 설비 파일 | FTP |

---

# 구현 규칙
반드시 env/config 기반으로 아래 항목 분리 가능하게 구현할 것.
- DB
- FTP
- ip
- port
- mockup 여부
- build path
- OS dependency
- file path
- encoding

Windows 호환 필수:
- `pathlib.Path` 사용
- `encoding='utf-8'`
- 경로 길이 260 이하 고려
- path separator 주의

---

# 문서화 규칙

환경별 설정 차이 또는 추가 작업이 필요하면 반드시 `@HowToBuild.md` 업데이트.

특히 아래 내용 반드시 기록:
- Windows에서 수정해야 하는 env/config
- mockup → 실제 DB/FTP 전환 방법
- build 방법
- 실행 방법
- OS별 주의사항
- package 설치 차이
- 검증 절차
- 배포 절차
- 문제 가능성 및 대응 방법

기능 추가/수정 시:
1. 변경된 env/config 설명
2. Windows 검증 방법 설명
3. mockup → 실제 연결 전환 방법 설명
4. `@HowToBuild.md` 업데이트 여부 확인

---

# 배포 안정성

배포 전:
- `backup.bat` 준비
- rollback 절차 확인

자세한 내용:
- `docs/windows-deployment-guide.md`