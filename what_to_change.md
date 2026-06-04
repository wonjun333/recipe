# 실제 AD 사용자 표시를 위한 변경 항목

목표는 AD SAML 인증 후 TopBar에 `개발자(mockdata)`가 아니라 실제 사내 사용자 claims가 보이게 하는 것이다.

현재 코드 흐름:

```text
GET  https://10.173.131.184:8282/login
  -> reverse proxy
  -> Nodejs_SAML:9000/login
  -> AD 로그인 요청

POST https://10.173.131.184:8282/
  -> reverse proxy
  -> Nodejs_SAML:9000/
  -> SAMLResponse 검증
  -> req.user를 auth_token JWT 쿠키로 저장
  -> https://10.173.131.184:8282/ 로 redirect

GET /api/auth/me
  -> FastAPI가 auth_token 쿠키 검증
  -> 실제 AD 사용자 claims 반환
```

---

## 1. `Nodejs_SAML/.env` 생성/수정

`Nodejs_SAML/.env.example`을 복사해서 `Nodejs_SAML/.env`를 만든다.

```env
SAML_ENTRY_POINT=https://ad-idp.example.com/adfs/ls/
SAML_ISSUER=https://10.173.131.184:8282/
SAML_CALLBACK_URL=https://10.173.131.184:8282/

SAML_IDP_CERT="-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----"
# 또는 파일 사용:
# SAML_IDP_CERT_FILE=cert/idp_cert.txt

SAML_SSL_KEY_PATH=cert/key.pem
SAML_SSL_CERT_PATH=cert/cert.pem
JWT_SIGNING_KEY_PATH=cert/key.pem

AUTH_COOKIE_NAME=auth_token
AUTH_COOKIE_SECURE=true
JWT_EXPIRE_HOURS=8
FRONTEND_URL=https://10.173.131.184:8282/

SAML_PORT=9000
SAML_IDENTIFIER_FORMAT=urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified
SAML_SIGNATURE_ALGORITHM=sha256
SAML_ACCEPTED_CLOCK_SKEW_MS=-1
```

반드시 실제 값으로 바꿀 항목:

| 변수 | 값 |
|---|---|
| `SAML_ENTRY_POINT` | AD/IdP 로그인 URL |
| `SAML_ISSUER` | AD에 등록된 Entity ID, 현재 `https://10.173.131.184:8282/` |
| `SAML_CALLBACK_URL` | AD에 등록된 callback/ACS URL, 현재 `https://10.173.131.184:8282/` |
| `SAML_IDP_CERT` 또는 `SAML_IDP_CERT_FILE` | AD SAML 응답 서명 검증용 공개 인증서 |

주의:

- `SAML_PORT=9000`이어도 `SAML_ISSUER`, `SAML_CALLBACK_URL`, `FRONTEND_URL`은 외부 URL인 `https://10.173.131.184:8282/` 그대로 둔다.
- `SAML_IDP_CERT`는 기존 `passport-saml` strategy의 `cert` 값이다.
- `SAML_IDP_CERT`는 AD 응답 검증용이고, `cert/key.pem`, `cert/cert.pem`은 우리 서버 HTTPS/JWT 서명용이다.

---

## 2. 인증서 교체

현재 `Nodejs_SAML/cert/key.pem`, `Nodejs_SAML/cert/cert.pem`이 placeholder면 실제 PEM으로 교체해야 한다.

```text
Nodejs_SAML/cert/key.pem   -> private key
Nodejs_SAML/cert/cert.pem  -> public certificate
```

조건:

- `key.pem`은 `-----BEGIN PRIVATE KEY-----` 또는 `-----BEGIN RSA PRIVATE KEY-----`로 시작
- `cert.pem`은 `-----BEGIN CERTIFICATE-----`로 시작
- `JWT_SIGNING_KEY_PATH=cert/key.pem`
- `backend/.env`의 `JWT_CERT_PATH=../Nodejs_SAML/cert/cert.pem`

---

## 3. `backend/.env` 수정

FastAPI가 mock user 대신 SAML 쿠키를 검증하도록 바꾼다.

```env
AUTH_MODE=saml
AUTH_COOKIE_NAME=auth_token
JWT_CERT_PATH=../Nodejs_SAML/cert/cert.pem
```

상대경로는 uvicorn CWD(`backend/`) 기준이다. `restart.sh`가 `cd backend/` 후 uvicorn을 실행하므로 `../Nodejs_SAML/cert/cert.pem` → `backend/../Nodejs_SAML/cert/cert.pem`으로 올바르게 resolve된다.

기존 DB mock 여부는 별도다.

```env
MOCK_MODE=true
```

`MOCK_MODE=true`여도 `AUTH_MODE=saml`이면 `/api/auth/me`는 실제 SAML 쿠키를 검증한다.

---

## 4. 8282 reverse proxy 설정

프론트가 이미 `8282`를 사용하므로 `Nodejs_SAML`은 내부 `9000`에서 실행한다.
외부 AD 등록 URL은 계속 `https://10.173.131.184:8282/`다.

필수 라우팅:

```text
GET  /login -> https://127.0.0.1:9000/login
POST /      -> https://127.0.0.1:9000/
GET  /      -> 기존 frontend
GET  /api   -> 기존 backend proxy
```

Nginx 개념 예시:

```nginx
server {
    listen 8282 ssl;
    server_name 10.173.131.184;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location = /login {
        proxy_pass https://127.0.0.1:9000/login;
        proxy_ssl_verify off;
        proxy_set_header Host $host:8282;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port 8282;
    }

    location = / {
        if ($request_method = POST) {
            return 418;
        }

        proxy_pass http://127.0.0.1:<FRONTEND_INTERNAL_PORT>;
        proxy_set_header Host $host:8282;
        proxy_set_header X-Forwarded-Proto https;
    }

    error_page 418 = @saml_callback;

    location @saml_callback {
        proxy_pass https://127.0.0.1:9000/;
        proxy_ssl_verify off;
        proxy_set_header Host $host:8282;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port 8282;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host:8282;
        proxy_set_header X-Forwarded-Proto https;
    }

    location / {
        proxy_pass http://127.0.0.1:<FRONTEND_INTERNAL_PORT>;
        proxy_set_header Host $host:8282;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

---

## 5. 실행

```bash
# Node 의존성 (최초 1회 또는 package.json 변경 시)
cd ~/project/recipe/Nodejs_SAML && npm install --omit=dev && cd ..

# Python 의존성 (requirements.txt 변경 시)
pip install -r ~/project/recipe/backend/requirements.txt

# 전체 서비스 시작 (8000 backend + 9000 SAML + worker)
cd ~/project/recipe
./restart.sh
systemctl start nginx
```

`restart.sh`는 `8000`, `9000`, worker를 백그라운드로 올린다. nginx(8282)는 별도 `systemctl`로 관리한다.

---

## 6. 서비스 시작 및 테스트 절차

### 6-1. 포트 확인 및 해제

nginx가 뜨지 않으면 8282 포트를 다른 프로세스가 점유한 것이다.

```bash
ss -tlnp | grep -E '8000|8282|9000'   # 각 포트 점유 확인
fuser -k 8282/tcp                       # 8282 강제 해제
```

### 6-2. 시작 순서

```bash
cd ~/project/recipe

# 1. backend(8000) + SAML(9000) + worker 시작
./restart.sh

# 2. nginx(8282) 시작
systemctl start nginx
systemctl status nginx    # active (running) 확인
```

### 6-3. 로그 확인

```bash
tail -f ~/project/recipe/backend/logs/backend.log   # FastAPI
tail -f ~/project/recipe/backend/logs/saml.log      # Node.js SAML
tail -f ~/project/recipe/backend/logs/worker.log    # 워커
```

### 6-4. 브라우저 테스트 순서

1. **F12 → Console** 탭에서 이전 세션 데이터 초기화:
   ```js
   sessionStorage.clear()
   document.cookie = 'auth_token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
   ```
2. `https://10.173.131.184:8282` 접속 → 자동으로 SAML 로그인 페이지로 이동
3. AD 로그인 완료 → TopBar에 실제 이름/부서 표시 확인
4. **F12 → Network** 탭에서 `/api/auth/me` 응답이 200이고 `Username`, `DeptName` 포함 확인

### 6-5. 코드 변경 후 재배포

```bash
cd ~/project/recipe
git pull
pip install -r backend/requirements.txt          # 의존성 변경 시
cd frontend && npm install && npm run build && cd ..  # 프론트 변경 시
fuser -k 8282/tcp 2>/dev/null; true
./restart.sh
systemctl restart nginx
```

### 6-6. 트러블슈팅 빠른 참조

| 증상 | 확인 명령 |
|---|---|
| nginx 시작 실패 | `nginx 2>&1` → 포트 충돌이면 `fuser -k 8282/tcp` |
| TopBar가 `개발자` | `backend/.env`에 `AUTH_MODE=saml` 확인, FastAPI 재시작 |
| `/api/auth/me` 401 | `saml.log` 확인, `python -c "from cryptography.x509 import load_pem_x509_certificate"` |
| SAML 서버 미시작 | `tail saml.log`, `jsonwebtoken` 없으면 `cd Nodejs_SAML && npm install --omit=dev` |
| 인증 후 루프 | 브라우저 콘솔에서 `sessionStorage.clear()` 실행 |

---

## 7. 터미널 구성

`./restart.sh`는 모든 서비스를 백그라운드(`&`)로 실행하므로 터미널 1개로 충분하다.
로그를 동시에 보려면 터미널 2개를 권장한다.

| 터미널 | 역할 | 명령 예시 |
|---|---|---|
| 터미널 1 | 시작 / 배포 / 명령 | `./restart.sh`, `systemctl start nginx`, `git pull` |
| 터미널 2 | 로그 모니터링 | `tail -f backend/logs/backend.log backend/logs/saml.log` |

`./restart.sh`가 멈춰 보이면 터미널 2에서 `ss -tlnp | grep -E '8000|9000'` 확인.
포트가 올라왔으면 정상이며 내부적으로 SAML `npm install` 대기 중인 것이다. 60초 후 완료된다.

---

## 8. 요약

| 단계 | 명령 | 시점 |
|---|---|---|
| 코드 동기화 | `git pull` | 항상 |
| Python 의존성 | `pip install -r backend/requirements.txt` | `requirements.txt` 변경 시 |
| 프론트 빌드 | `cd frontend && npm run build && cd ..` | 프론트 코드 변경 시 |
| 서비스 시작 | `./restart.sh` → `systemctl start nginx` | 항상 |
| 포트 충돌 해제 | `fuser -k 8282/tcp` | nginx 시작 실패 시 |
| 브라우저 초기화 | F12 콘솔 → `sessionStorage.clear()` | 인증 루프 문제 시 |
