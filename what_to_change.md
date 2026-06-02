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

Node 패키지:

```bash
cd Nodejs_SAML
npm install
```

Python 패키지:

```bash
cd backend
pip install -r requirements.txt
```

SAML 서버:

```bash
cd Nodejs_SAML
npm start
```

전체 스크립트:

```bash
./restart.sh
```

`restart.sh`는 이제 `8000`, `9000`만 관리한다.
`8282` 프론트/reverse proxy는 별도 관리한다.

---

## 6. 테스트

1. 브라우저에서 접속

```text
https://10.173.131.184:8282/login
```

2. AD 로그인 완료
3. 브라우저 개발자 도구에서 `auth_token` 쿠키 생성 확인
4. 프론트 메인 화면 접속
5. TopBar 사용자 이름이 `개발자`가 아니라 AD claim의 `Username` 또는 `LoginId`인지 확인
6. `/api/auth/me` 응답이 실제 AD 사용자 payload인지 확인

---

## 7. 문제 확인

### TopBar가 계속 `개발자`로 보임

확인:

- `backend/.env`에 `AUTH_MODE=saml`인지
- FastAPI를 재시작했는지
- `/api/auth/me` 응답이 200인지
- `auth_token` 쿠키가 요청에 포함되는지

### `/api/auth/me`가 401

확인:

- `auth_token` 쿠키가 있는지
- `AUTH_COOKIE_NAME`이 Nodejs_SAML과 backend에서 같은지
- `JWT_CERT_PATH`가 `JWT_SIGNING_KEY_PATH`와 짝이 맞는 public cert인지
- JWT가 만료되지 않았는지

### AD 로그인 후 프론트로 돌아오지 않음

확인:

- `POST /`가 `9000/`으로 전달되는지
- `FRONTEND_URL=https://10.173.131.184:8282/`인지
- SAML 서버 로그 `backend/logs/saml.log`에 `SAML user:`가 찍히는지

### SAML 서버가 시작하지 않음

확인:

```bash
lsof -ti :9000
tail -f backend/logs/saml.log
```

