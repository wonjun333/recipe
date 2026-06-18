# Ubuntu Deployment Guide

Last updated: 2026-06-18

## 1. 목적

사내 Ubuntu 환경에서 Recipe Management System을 build, 실행, 검증, rollback하기 위한 기준 문서다.

## 2. 전제

- OS: 사내 Ubuntu
- Frontend: Node.js 18+ 권장
- Backend: Python 3.10+ 권장
- 실제 PostgreSQL / MongoDB / FTP 접근 가능
- SAML JWT cookie 검증용 인증서 파일 존재

## 3. 필수 env

`backend/.env`

```env
POSTGRES_URL=postgresql+psycopg://<user>:<password>@<host>:<port>/<dbname>
MONGO_URL=mongodb://<host>:<port>/
CORS_ORIGINS=http://<server-host>:8282
AUTH_COOKIE_NAME=auth_token
JWT_CERT_PATH=/opt/recipe/Nodejs_SAML/cert/cert.pem
RECIPE_DATA_DIR=/opt/recipe-rms/data
# 선택: RECIPE_CACHE_DB_URL=postgresql://<user>:<password>@<host>:<port>/recipe_db
```

## 4. Build

```bash
cd /opt/recipe
npm --prefix frontend ci
npm --prefix frontend run build

cd /opt/recipe/backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
PYTHONDONTWRITEBYTECODE=1 python -m py_compile app/main.py
```

## 5. Smoke Test

```bash
cd /opt/recipe/backend
. .venv/bin/activate
PYTHONPATH=. python - <<'PY'
import app.main
print('app import ok')
PY
```

실제 환경 API 확인:

```bash
curl -k -i http://127.0.0.1:8000/
curl -k -i http://127.0.0.1:8000/api/recipe-test/eqp-options
curl -k -i "http://127.0.0.1:8000/api/recipe-inventory/snapshot?eqpId=<EQP_ID>"
```

인증 cookie가 필요한 API는 사내 SAML login 후 브라우저 또는 인증 cookie를 포함한 요청으로 확인한다.

## 6. Runtime

개발 확인:

```bash
cd /opt/recipe/backend
. .venv/bin/activate
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000
```

운영에서는 systemd 또는 사내 표준 process manager를 사용한다.

## 7. Inventory Worker

```bash
cd /opt/recipe/backend
. .venv/bin/activate
PYTHONPATH=. python tools/recipe_inventory_worker.py \
  --offline-cooldown-min 60 \
  --concurrency 20 \
  --quiet \
  --log-file logs/inventory.log \
  --log-max-mb 10 \
  --log-backup 3
```

## 8. Backup 대상

- `backend/.env`
- SAML certificate/private key files
- `RECIPE_DATA_DIR`
- SQLite cache/history DB를 사용할 경우 해당 DB 파일
- 배포 전 frontend `dist`
- 현재 git commit hash

## 9. Rollback

1. 서비스 중지
2. 현재 commit/hash 기록
3. 이전 commit checkout 또는 이전 release directory로 symlink 변경
4. 필요 시 DB/cache 파일 복원
5. backend service 재시작
6. `/api/recipe-test/eqp-options`, `/api/recipe-test/history` smoke test

## 10. Go/No-Go Checklist

- [ ] frontend build 성공
- [ ] backend import/compile 성공
- [ ] PostgreSQL 연결 성공
- [ ] MongoDB FTP credential 조회 성공
- [ ] FTP 파일 목록 조회 성공
- [ ] SAML login 및 `/api/auth/me` 성공
- [ ] CAS/JOB/Recipe load 성공
- [ ] My History 조회 성공
- [ ] inventory worker 실행 및 log 확인
