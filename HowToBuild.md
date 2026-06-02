# HowToBuild

## 환경 구성 요약

| 항목 | 개발 (code-server) | 사내 운영 (Ubuntu) |
|---|---|---|
| MOCK_MODE | true | false |
| DB | mockup | PostgreSQL / MongoDB |
| FTP | mockup | 실제 설비 FTP |
| HTTPS | 불필요 | 선택 (cert 파일 필요) |

---

## 1. 기본 빌드 및 실행

### Frontend 빌드

```bash
cd frontend
npm install
npm run build
npm run preview
```

> **주의**: code-server 환경에서는 `npm run dev` 불가. 반드시 `build → preview` 순서로 실행.

### 사내 Ubuntu 8282 배포

사내 Ubuntu 운영 테스트에서는 `npm run preview`로 8282를 직접 열지 않는다.
`frontend/dist`를 빌드한 뒤 nginx가 8282에서 정적 파일, API, SAML 경로를 함께 라우팅한다.

```bash
cd /root/project/recipe
cd frontend
npm install
npm run build

cd ..
sudo bash scripts/install_ubuntu_nginx.sh
./restart.sh
```

기본 라우팅:

```text
GET  /login -> Nodejs_SAML :9000/login
POST /      -> Nodejs_SAML :9000/
/api/*      -> FastAPI :8000/api/*
/*          -> /var/www/recipe/index.html
```

확인:

```bash
curl -k -i https://10.173.131.184:8282/
curl -k -i https://10.173.131.184:8282/login
curl -k -i "https://10.173.131.184:8282/api/recipe-inventory/snapshot?eqpId=CACP701"
```

`/login`과 `/api`는 정상인데 `/`만 404이면 nginx의 `root` 또는 정적 파일 배포 문제다.
`scripts/install_ubuntu_nginx.sh`는 빌드 결과를 `/var/www/recipe`로 복사하고 nginx 설정을 다시 생성한다.

### Backend 실행

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 2. 환경 변수 (backend/.env)

```env
MOCK_MODE=false                          # 사내: false, 개발: true

POSTGRES_URL=postgresql+psycopg://...    # 사내 PostgreSQL
MONGO_URL=mongodb://...                  # 사내 MongoDB
RECIPE_CACHE_DB_URL=postgresql://...     # 로컬 recipe DB

CORS_ORIGINS=http://10.173.131.184:8282,https://10.173.131.184:8282
```

---

## 3. HTTPS 설정

### 3-1. 인증서 변환 (.pfx → .pem)

사내에서 발급받은 `.pfx` 파일을 Python 스크립트로 변환:

```python
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.serialization.pkcs12 import load_key_and_certificates
from cryptography.hazmat.backends import default_backend

pfx_path = '발급받은인증서.pfx'
pfx_password = '발급받은비밀번호'.encode()

with open(pfx_path, 'rb') as f:
    pfx_data = f.read()

private_key, certificate, _ = load_key_and_certificates(pfx_data, pfx_password, default_backend())

with open('private_key.pem', 'wb') as f:
    f.write(private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    ))

with open('certificate.pem', 'wb') as f:
    f.write(certificate.public_bytes(serialization.Encoding.PEM))
```

### 3-2. 인증서 파일 배치

```
project/recipe/
└── certs/               ← 이 폴더 생성 (gitignore 추가)
    ├── private_key.pem
    └── certificate.pem
```

### 3-3. frontend/.env.local 생성

`frontend/.env.local.example`을 복사해서 `frontend/.env.local` 생성:

```env
SSL_KEY_PATH=../certs/private_key.pem
SSL_CERT_PATH=../certs/certificate.pem
```

> 경로는 `vite.config.ts` 기준 상대경로 (= `frontend/` 기준).

### 3-4. HTTPS로 빌드 및 실행

```bash
cd frontend
npm run build
npm run preview
```

Vite가 `.env.local`에서 `SSL_KEY_PATH`, `SSL_CERT_PATH`를 읽어 HTTPS로 자동 전환.
인증서 파일이 없으면 HTTP로 폴백.

### 3-5. backend CORS 확인

`backend/.env` 또는 사내 서버 `.env`에 HTTPS URL 포함 확인:

```env
CORS_ORIGINS=http://10.173.131.184:8282,https://10.173.131.184:8282
```

---

## 4. mockup → 실제 DB/FTP 전환

`backend/.env`에서:

```env
MOCK_MODE=false
```

나머지 DB URL, FTP는 각 설비 환경에 맞게 설정.

---

## 5. 워커 실행

```bash
cd backend
PYTHONPATH=. python tools/recipe_inventory_worker.py \
  --offline-cooldown-min 60 \
  --concurrency 10 \
  --quiet \
  --log-file logs/inventory.log
```

> `--concurrency`를 10 이하로 유지 권장 (FTP 서버 부하 방지).

---

## 6. 주의사항

- `certs/` 폴더는 반드시 `.gitignore`에 추가
- `frontend/.env.local`은 `.gitignore` 대상 (기본 포함)
- 경로 길이 260자 이하 유지 (Windows 호환)
