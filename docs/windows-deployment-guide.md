# Windows 배포 및 운영 환경 검증 가이드

> 기준: Execution Plan §13 (WD-01 ~ WD-08)  
> 대상: Mac→Ubuntu 개발에서 Windows 최종 배포로 전환하는 팀  
> 작성일: 2026-05-18

---

## 1. 개요

Recipe Management System(RMS)은 **사내 Windows 환경에서 운영**되지만, 현재 개발은 **Mac + Ubuntu 서버(SSH)**로 진행 중이다. 따라서 다음을 보장해야 한다:

1. **사외 개발(Mockup)**: 경로, 인코딩, 파일 권한을 Windows와 호환하도록 작성
2. **사내 배포(Real)**: Windows 최초 배포 시 호환성 문제 사전 발굴
3. **운영 안정성**: 성능 메트릭, 로깅, 롤백 계획을 미리 수립

본 문서는 **단계별 체크리스트**와 **검증 방법**을 정의한다.

---

## 2. Phase 2 (안정화) — 코드 호환성 검증

### 2.1 WD-01: 경로·인코딩 호환성 검증

#### 검증 항목

| 항목 | Windows 특성 | 검증 방법 | 담당 파일 |
|------|------------|---------|---------|
| **경로 구분자** | 역슬래시 `\` (또는 슬래시 `/` 호환) | `os.path.join()` / `pathlib.Path` 사용 확인 | temp_file_store.py, file_ops_service.py |
| **경로 길이** | MAX 260자 (레지스트리 수정 없이) | 긴 설비명 테스트 (예: 설비명 50자 + 폴더 10단계) | recipe_cache_store.py |
| **파일 인코딩** | UTF-8 권장 (기본값: ANSI/CP949) | `open(..., encoding='utf-8')` 명시 | 모든 파일 I/O |
| **줄바꿈** | CRLF (`\r\n`) 기본 | JSONL 파싱 시 `splitlines()` 사용 | history_service.py |
| **파일명** | 예약 문자 금지: `< > : " \| ? *` | FTP 파일명 sanitize 확인 | file_ops_service.py |

#### 검증 방법

```bash
# 1. hardcoded 슬래시 탐지 (예: /tmp, /home)
grep -r "\"\/tmp" backend/app backend/tools --include="*.py"
grep -r "'/tmp'" backend/app backend/tools --include="*.py"

# 2. encoding 미지정 open() 찾기
grep -r "open(" backend/app backend/tools --include="*.py" | grep -v "encoding"

# 3. os.path 사용 확인
grep -r "os.path.join\|pathlib.Path" backend/app backend/tools --include="*.py"

# 4. JSONL 파싱에서 splitlines() 사용 확인
grep -r "splitlines\|split('\\n')" backend/app --include="*.py"
```

#### 수정 예시

```python
# ❌ Linux 스타일 (미호환)
cache_dir = "/tmp/recipe_test_edit/cache"
with open(cache_path) as f:
    for line in f.split('\n'):
        ...

# ✅ Windows 호환
from pathlib import Path
cache_dir = Path.home() / "AppData" / "Local" / "Temp" / "recipe_test_edit" / "cache"
cache_dir.mkdir(parents=True, exist_ok=True)

with open(cache_path, encoding='utf-8') as f:
    for line in f.splitlines():
        ...

# ✅ 또는 환경변수 사용 (권장 — EP-02)
import os
LOCAL_EDIT_BASE = os.getenv('LOCAL_EDIT_BASE', tempfile.gettempdir())
cache_dir = Path(LOCAL_EDIT_BASE) / "recipe_test_edit" / "cache"
```

---

### 2.2 WD-02: 자동 호환성 검사 스크립트

#### 목표

코드상 경로 이슈, 인코딩 누락, hardcoded 절대 경로를 자동 탐지.

#### 스크립트 샘플

```python
#!/usr/bin/env python3
# backend/scripts/windows-compatibility-check.py

import os
import re
from pathlib import Path
from typing import List, Tuple

class CompatibilityChecker:
    """Windows 호환성 자동 검사"""
    
    HIGH_RISK = []
    MEDIUM_RISK = []
    LOW_RISK = []
    
    # hardcoded 절대 경로 패턴
    HARDCODED_PATHS = [
        r'"\/tmp',
        r"'/tmp",
        r'"\/home',
        r"'/home",
        r'"\/root',
        r'C:\\',  # Windows 절대 경로 (상대 경로 권장)
    ]
    
    # 파일 open() 패턴 (encoding 없음)
    OPEN_NO_ENCODING = r'open\([^)]*\)(?!\s*#.*encoding)'
    
    def check_file(self, filepath: str) -> Tuple[List, List, List]:
        """파일 호환성 검사"""
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            lines = content.split('\n')
        
        for i, line in enumerate(lines, start=1):
            # 1. hardcoded 경로 탐지
            for pattern in self.HARDCODED_PATHS:
                if re.search(pattern, line):
                    self.HIGH_RISK.append({
                        'file': filepath,
                        'line': i,
                        'pattern': pattern,
                        'content': line.strip(),
                        'message': 'Hardcoded absolute path detected'
                    })
            
            # 2. encoding 미지정 open() 탐지
            if re.search(r'open\(', line) and 'encoding' not in line:
                self.MEDIUM_RISK.append({
                    'file': filepath,
                    'line': i,
                    'content': line.strip(),
                    'message': 'open() without encoding specification'
                })
            
            # 3. splitlines() 사용 확인 (JSONL CRLF 처리)
            if 'split(' in line and "'\n'" in line:
                self.LOW_RISK.append({
                    'file': filepath,
                    'line': i,
                    'content': line.strip(),
                    'message': 'split(\'\\n\') detected — consider splitlines() for CRLF compatibility'
                })
    
    def run(self, backend_path: str = 'backend'):
        """전체 백엔드 코드 검사"""
        for root, dirs, files in os.walk(backend_path):
            # __pycache__, .venv 제외
            dirs[:] = [d for d in dirs if d not in ('__pycache__', '.venv', '.pytest_cache')]
            
            for file in files:
                if file.endswith('.py'):
                    filepath = os.path.join(root, file)
                    self.check_file(filepath)
    
    def report(self):
        """결과 리포트"""
        print("=== Windows Compatibility Check Report ===\n")
        
        print(f"HIGH RISK ({len(self.HIGH_RISK)}):")
        for issue in self.HIGH_RISK:
            print(f"  {issue['file']}:{issue['line']}: {issue['message']}")
            print(f"    > {issue['content'][:80]}\n")
        
        print(f"MEDIUM RISK ({len(self.MEDIUM_RISK)}):")
        for issue in self.MEDIUM_RISK[:5]:  # 최대 5개
            print(f"  {issue['file']}:{issue['line']}: {issue['message']}")
        if len(self.MEDIUM_RISK) > 5:
            print(f"  ... and {len(self.MEDIUM_RISK) - 5} more\n")
        
        print(f"LOW RISK ({len(self.LOW_RISK)}):")
        print(f"  (Details omitted — check manually if needed)\n")
        
        # 배포 결정
        print("Deployment Gate:")
        if len(self.HIGH_RISK) == 0:
            print("  ✅ READY FOR DEPLOYMENT (no high-risk issues)")
        else:
            print(f"  ❌ NOT READY (resolve {len(self.HIGH_RISK)} high-risk issues first)")

if __name__ == '__main__':
    checker = CompatibilityChecker()
    checker.run('backend')
    checker.report()
```

#### 실행 방법

```bash
python backend/scripts/windows-compatibility-check.py
```

---

## 3. Phase 3 (배포) — 배포 준비 및 검증

### 3.1 WD-03: Windows 배포 체크리스트

#### Phase 1: 환경 준비 (사전 설치)

```bash
# Windows PowerShell (관리자 권한)

# 1. Python 3.10+ 확인
python --version

# 2. Node.js 18+ 확인
node --version

# 3. PostgreSQL 클라이언트 설치 (공식 MSI)
# → https://www.postgresql.org/download/windows/
psql --version

# 4. MongoDB Compass (선택) — FTP 인증 정보 조회 시 필요
# → https://www.mongodb.com/products/compass

# 5. 방화벽 포트 개방
netsh advfirewall firewall add rule name="RecipeRMS Backend" dir=in action=allow protocol=tcp localport=8000
netsh advfirewall firewall add rule name="RecipeRMS Frontend" dir=in action=allow protocol=tcp localport=3000
```

#### Phase 2: 디렉토리 구성

```bash
# PowerShell

# 디렉토리 생성
mkdir C:\ProgramData\RecipeRMS\
mkdir C:\ProgramData\RecipeRMS\logs
mkdir C:\ProgramData\RecipeRMS\data
mkdir C:\ProgramData\RecipeRMS\backup

# 소스코드 배포 (Git 또는 ZIP)
# git clone <repo> C:\app\recipe
# 또는
# unzip recipe-main.zip -d C:\app\recipe

cd C:\app\recipe
```

#### Phase 3: 백엔드 배포

```bash
# PowerShell

# 1. 가상환경 생성
python -m venv venv

# 2. 활성화
venv\Scripts\Activate.ps1

# 3. 의존성 설치
pip install -r requirements.txt

# 4. .env 파일 작성
# Copy .env.example to .env 및 보안 채널로 받은 자격증명 입력
# POSTGRES_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>
# MONGO_URL=mongodb://<host>:<port>/
# SECRET_KEY=<random-secret>
# LOCAL_EDIT_BASE=C:\ProgramData\RecipeRMS\data

copy .env.example .env
# (이메일 또는 보안 채널로 .env 수신 후 입력)

# 5. 포트 사용 여부 확인
netstat -an | findstr :8000

# 6. 헬스체크
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
# → GET http://localhost:8000/api/recipe-test/eqp-options
```

#### Phase 4: 프론트엔드 빌드

```bash
cd frontend

npm install
npm run build  # dist/ 폴더 생성

# 정적 파일 배포 (선택)
# 옵션 1: FastAPI에서 dist 서빙
copy dist\* ..\backend\app\static\

# 옵션 2: Nginx 리버스 프록시
# (별도 config 참고)
```

#### Phase 5: 기능 검증

```
- [ ] 설비 목록 로드: 드롭다운에 100+ 설비 표시
- [ ] CAS/JOB/Recipe 조회: FTP 접근 성공
- [ ] 파일 편집 및 저장: DB 및 FTP 반영 확인
- [ ] 이력 조회: 최근 10개 항목 시간순 정렬
- [ ] 캐시 테스트: 동일 설비 2회 조회 시 응답 시간 비교 (2배 이상 빨라야 정상)
```

#### Phase 6: Windows 서비스 등록 (선택)

```bash
# NSSM (Non-Sucking Service Manager) 사용
# 다운로드: https://nssm.cc/download

nssm install RecipeRMS "C:\app\recipe\venv\Scripts\python.exe" "-m uvicorn app.main:app --host 0.0.0.0 --port 8000"
nssm set RecipeRMS AppDirectory "C:\app\recipe\backend"
nssm set RecipeRMS AppEnvironmentExtra LOCAL_EDIT_BASE=C:\ProgramData\RecipeRMS\data

# 또는 Task Scheduler (권장)
# Windows Task Scheduler → 새 작업 생성
# → 트리거: 시스템 시작 시
# → 작업: C:\app\recipe\start.bat
```

#### Phase 7: 모니터링 설정

```bash
# 로그 파일 위치 확인
dir C:\ProgramData\RecipeRMS\logs\

# 실시간 로그 모니터링 (PowerShell)
Get-Content C:\ProgramData\RecipeRMS\logs\app.log -Tail 20 -Wait
```

---

### 3.2 WD-04: 성능 기준선 측정

배포 후 즉시 다음을 측정하여 기록:

```markdown
## 성능 기준선 (Baseline) — 2026-05-18 초기 배포

### 1. API 응답 시간
- 설비 100개 로드 시 `/api/recipe-test/eqp-options` 응답:
  - 측정값: ____ ms
  - 목표: < 2000ms
  - 상태: ✅ / ❌

### 2. 캐시 효율
- 동일 설비 CAS 2회 연속 조회:
  - 1차 조회: ____ ms
  - 2차 조회: ____ ms
  - 개선율: (1차 - 2차) / 1차 = ____ %
  - 목표: > 50%
  - 상태: ✅ / ❌

### 3. 메모리 사용량
- 기동 후 기본: ____ MB
- 1시간 후: ____ MB
- 24시간 후: ____ MB
- 증가율: (24h - baseline) / baseline = ____ %
- 목표: < 5%
- 상태: ✅ / ❌

### 4. FTP 동시 접근 안정성
- 사용자 5명 동시 조회 시:
  - 파일 조회 성공: ____ / 5
  - FTP 락 에러: ____ 건
  - 목표: 0 에러
  - 상태: ✅ / ❌

### 5. 워커 처리 시간
- 인벤토리 동기화 주기: 1시간
- 실제 처리 시간: ____ 분
- 목표: < 60분
- 상태: ✅ / ❌
```

---

### 3.3 WD-06: 백업 및 롤백 계획

#### 백업 전략

```bash
# 자동 백업 스크립트 (backup.bat)
@echo off

REM Daily backup at 23:00 (Task Scheduler)
setlocal enabledelayedexpansion

set BACKUP_DIR=C:\ProgramData\RecipeRMS\backup
set TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%

REM 1. SQLite 백업
copy "C:\ProgramData\RecipeRMS\data\recipe_cache.sqlite3" "%BACKUP_DIR%\recipe_cache.sqlite3.%TIMESTAMP%"

REM 2. JSONL 백업 (월별)
for /f "tokens=1-2" %%a in ('date /t') do (
    set TODAY=%%a
)
copy "C:\ProgramData\RecipeRMS\data\recipe_action_history.jsonl" "%BACKUP_DIR%\recipe_action_history.%date:~10,4%%date:~4,2%.jsonl"

REM 3. .env 백업 (암호화 권장)
copy "C:\app\recipe\backend\.env" "%BACKUP_DIR%\.env.backup.%TIMESTAMP%"

REM 4. 14일 이상 된 백업 삭제
forfiles /S /D +14 /P "%BACKUP_DIR%" /C "cmd /c del @file"

echo Backup completed at %timestamp%
```

#### 롤백 절차

```markdown
### 긴급 롤백 (Rollback) 절차

**상황**: 배포 후 심각한 버그 발생 (예: API 500 에러, 데이터 손상)

#### Step 1: 즉시 조치 (소요: 2~5분)
```bash
# 1. 서비스 중지
taskkill /PID <python.exe PID> /F
# 또는 Task Scheduler에서 서비스 중지

# 2. 백업 상태 확인
dir C:\ProgramData\RecipeRMS\backup\

# 3. 이전 버전 확인
dir C:\app\recipe-v*\
```

#### Step 2: 데이터 복구 (소요: 1~2분)
```bash
# 1. 손상된 SQLite 백업 (복구 안 할 수 있으므로 먼저 백업)
copy "C:\ProgramData\RecipeRMS\data\recipe_cache.sqlite3" "C:\ProgramData\RecipeRMS\data\recipe_cache.sqlite3.corrupted.%date%"

# 2. 최근 백업에서 복구
copy "C:\ProgramData\RecipeRMS\backup\recipe_cache.sqlite3.20260518_230000" "C:\ProgramData\RecipeRMS\data\recipe_cache.sqlite3"
```

#### Step 3: 이전 버전으로 변경 (소요: 1분)
```bash
# 옵션 1: 버전 폴더 변경
move C:\app\recipe C:\app\recipe-v1.1.corrupted
copy C:\app\recipe-v1.0 C:\app\recipe

# 옵션 2: Git 사용
cd C:\app\recipe
git checkout v1.0
git clean -fd
```

#### Step 4: 서비스 재시작 (소요: 1분)
```bash
# 백엔드 수동 시작
cd C:\app\recipe\backend
venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# 또는 Task Scheduler에서 자동 시작
```

#### Step 5: 검증 (소요: 2~5분)
```bash
# 헬스체크
curl http://localhost:8000/api/recipe-test/eqp-options

# 이력 확인
curl http://localhost:8000/api/recipe-test/history

# UI 확인
# 브라우저에서 http://localhost:8000 접속
```

**예상 총 소요 시간: 10~15분**
```

---

### 3.4 WD-07: 배포 전 최종 체크 (Go/No-Go)

배포 담당자 필수 확인 체크리스트:

```
배포 전 최종 체크 (2026-05-20)

[Code Quality]
- [ ] WD-02 자동 검사 실행 → 고위험 이슈 0건
- [ ] hardcoded 경로 0건
- [ ] encoding 미지정 파일 I/O 0건
- [ ] Windows 경로 호환성 코드 리뷰 완료

[Testing]
- [ ] pytest mockup 전체 통과
- [ ] Windows 환경에서 start.bat 기동 성공
- [ ] GET /api/recipe-test/eqp-options → HTTP 200
- [ ] npm run build 성공 (dist 폴더 생성)

[Configuration]
- [ ] .env.prod 파일 사내 DB 자격증명으로 작성
- [ ] LOCAL_EDIT_BASE=C:\ProgramData\RecipeRMS\data 설정
- [ ] SECRET_KEY 생성 및 설정
- [ ] 백업 전략 수립 및 첫 백업 수행

[Operations]
- [ ] 로그 디렉토리 생성 및 권한 설정
- [ ] 에러 알림 채널 확인 (슬랙/이메일)
- [ ] 운영 담당자 ON-CALL 연락처 확인
- [ ] 롤백 절차 테스트 완료 (테스트 환경)

[Decision]
- [ ] GO: 모든 항목 확인 → 배포 진행
- [ ] NO-GO: 하나 이상 미완료 → 배포 연기 (사유 기록)

서명: ________________  날짜: ________
```

---

### 3.5 WD-08: 배포 후 정기 리뷰

#### 1주 점검 (Day 7)

```markdown
### 배포 후 1주 점검 리포트

**점검일**: 2026-05-25  
**담당자**: ________

#### 1. 에러 로그 검토
- 에러 건수: ____ 건
- 주요 이슈: _______
  - 우선순위: 높음 / 중간 / 낮음
  - 상태: 패치 완료 / 진행 중 / 대기
  
#### 2. 성능 메트릭
- API 응답 시간: ____ ms (기준선 대비 +____ %)
- 메모리: ____ MB (기준선 대비 +____ %)
- FTP 연결 실패율: ____ %

#### 3. 사용자 피드백
- 보고된 이슈: ______
- UI 개선 제안: ______

#### 4. 의사결정
- [ ] 정상 운영 중 → 1개월 리뷰로 진행
- [ ] 경미한 버그 → 패치 후 모니터링
- [ ] 심각한 버그 → 긴급 롤백 고려
```

#### 1개월 점검 (Day 30)

```markdown
### 배포 후 1개월 점검 리포트

**점검일**: 2026-06-18  
**담당자**: ________

#### 1. 기능 검증
- [ ] 모든 시나리오 정상 동작 (설비 로드 → CAS/JOB/Recipe → 편집 → 이력)
- [ ] 데이터 일관성 (SQLite, JSONL)
- [ ] 사용자 인가 (이력의 actorName, actorTeam 정상 기록)

#### 2. 성능 최적화
- 캐시 히트율: ____ % (목표: > 70%)
  - 조정 방안: TTL 변경? 캐시 전략 개선?
- FTP 연결 안정성: ____ % (목표: > 99%)
  - 실패 원인: ______
- 워커 처리 시간: ____ 분 (목표: < 60분)
  - 조정 방안: 주기 단축? 동시성 증대?

#### 3. 백업·복구 검증
- [ ] 백업 정상 수행 (daily snapshot 확인)
- [ ] 복구 테스트 완료 (SQLite, JSONL 복구 성공)
- [ ] 소요 시간: ____ 분

#### 4. 향후 개선사항
- 단기 (다음 2주): ______
- 중기 (1개월): ______
- 장기 (3개월+): ______

#### 5. 기준선 재설정 (필요 시)
- API 응답 시간: ____ ms (→ 새 기준선)
- 메모리: ____ MB (→ 새 기준선)
- 처리량: ____ req/min (→ 새 기준선)
```

---

## 4. 주요 팁 및 주의사항

### 4.1 경로 처리

```python
# ❌ 피해야 할 패턴
import os
tempdir = '/tmp/recipe'
ftp_path = 'C:\\ftp\\cas.pol'

# ✅ 권장 패턴
from pathlib import Path
import tempfile
import os

# 방법 1: pathlib (모던 권장)
tempdir = Path(tempfile.gettempdir()) / 'recipe'
tempdir.mkdir(parents=True, exist_ok=True)

# 방법 2: os.path.join (레거시 호환)
tempdir = os.path.join(tempfile.gettempdir(), 'recipe')
os.makedirs(tempdir, exist_ok=True)

# 방법 3: 환경변수 (Windows 배포 권장)
tempdir = Path(os.getenv('LOCAL_EDIT_BASE', tempfile.gettempdir()))

# FTP 경로 (항상 슬래시)
ftp_path = Path('ftp/cas/cas_001.pol').as_posix()  # → 'ftp/cas/cas_001.pol'
```

### 4.2 파일 인코딩

```python
# ✅ 권장: 항상 명시
with open(filename, 'r', encoding='utf-8') as f:
    content = f.read()

# JSONL 파싱
with open(jsonl_path, 'r', encoding='utf-8') as f:
    for line in f.splitlines():  # CRLF 호환
        data = json.loads(line)

# CSV 읽기 (Windows 기본: CP949)
import csv
with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        ...
```

### 4.3 에러 처리

```python
# FTP 에러 처리
try:
    ftp.cwd('/cas')
except ftplib.error_perm as e:
    # 550 Permission denied → Windows 권한 문제일 수 있음
    logger.error(f"FTP error: {e}", extra={'equipment_id': eqp_id})
    raise HTTPException(status_code=400, detail=f"FTP 550: {str(e)}")

# 경로 길이 검증
if len(str(cache_path)) > 260:
    logger.warning(f"Path length exceeds 260 chars: {cache_path}")
    # 경로 단축 또는 대체 경로 사용
```

---

## 5. 트러블슈팅

| 증상 | 원인 | 해결 방법 |
|------|------|---------|
| `FileNotFoundError: recipe_cache.sqlite3` | LOCAL_EDIT_BASE 미설정 또는 경로 오류 | `.env` 확인, `C:\ProgramData\RecipeRMS\data\` 생성 |
| `UnicodeDecodeError: 'utf-8'` | 파일 인코딩 불일치 (CP949 등) | `open(..., encoding='utf-8')` 명시 또는 변환 |
| `OSError: [WinError 123]` | 경로에 예약 문자 (`<>:"\|\?*`) 포함 | 파일명 sanitize 함수 추가 |
| FTP `550 Access denied` | Windows 파일 권한 또는 FTP 인증 오류 | 설비 FTP 관리자 확인, 네트워크 경로 확인 |
| 메모리 증가 (> 5%) | 캐시 미해제 또는 DB 커넥션 누수 | TTL 설정, 커넥션 풀 재검토 |

---

## 6. 담당자 체크리스트

| 역할 | 책임 | Phase |
|------|------|-------|
| **개발팀** | WD-01 경로 호환성 수정, WD-02 자동 검사 스크립트 작성 | Phase 2 |
| **QA팀** | WD-03 배포 체크리스트 검증, WD-07 최종 체크 | Phase 3 |
| **운영팀** | WD-04 기준선 측정, WD-05 모니터링 설정, WD-08 정기 리뷰 | Phase 3+ |
| **보안팀** | .env 파일 암호화, 로그 접근 제어 검토 (선택) | Phase 3 |

---

## 참고 자료

- [Execution Plan §13 — Windows Deployment & Operational Validation](./3-execution-plan.md#13-windows-배포-및-운영-환경-검증-wd)
- [Python pathlib documentation](https://docs.python.org/3/library/pathlib.html)
- [PEP 514 — Python Registry Entries (Windows)](https://www.python.org/dev/peps/pep-0514/)
- [NSSM — Non-Sucking Service Manager](https://nssm.cc/)
