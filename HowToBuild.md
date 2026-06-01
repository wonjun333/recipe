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
JWT_CERT_PATH=../Nodejs_SAML/cert/cert.pem

POSTGRES_URL=postgresql+psycopg://...    # 사내 PostgreSQL
MONGO_URL=mongodb://...                  # 사내 MongoDB
RECIPE_CACHE_DB_URL=postgresql://...     # 로컬 recipe DB

CORS_ORIGINS=http://10.173.131.184:8282,https://10.173.131.184:8282
```

---

## 2-1. SAML 인증 서버 (Nodejs_SAML)

`Nodejs_SAML/index.js`는 SAML 인증 성공 후 사용자 claim을 RS256 JWT로 서명해 `auth_token` 쿠키에 저장하고 Vue 앱으로 이동합니다.

```bash
cd Nodejs_SAML
npm install

FRONTEND_URL='http://10.173.131.184:8282' \
node index.js
```

`index.js` 안의 `idpUrl`, `issuer`, `callbackUrl`, `cert`는 샘플 코드 구조를 유지하므로 사내 값으로 치환해서 사용합니다.
프론트가 HTTPS로 동작하면 `FRONTEND_URL`을 `https://...`로 바꾸면 `auth_token` 쿠키도 Secure로 발급됩니다.

`frontend/.env.local`:

```env
VITE_SAML_URL=https://10.173.131.184:44364/
VITE_SAML_LOGOUT_URL=https://10.173.131.184:44364/Signout
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
- SSL 인증서(HTTPS용)와 SAML JWT 서명 인증서(`Nodejs_SAML/cert/cert.pem`)는 별개
- 경로 길이 260자 이하 유지 (Windows 호환)
