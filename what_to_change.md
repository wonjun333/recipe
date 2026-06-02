# SAML 인증 테스트 전 변경 항목

현재 목표는 실제 로그인 세션/JWT 발급이 아니라 AD SAML 연결 확인이다.

동작 방식:

```text
GET  https://10.173.131.184:8282/login  -> AD 로그인 요청
POST https://10.173.131.184:8282/       -> AD callback, SAMLResponse 수신
```

`8282` 포트는 프론트엔드 preview가 아니라 `Nodejs_SAML` 서버가 직접 사용해야 한다.

---

## 1. `Nodejs_SAML/.env` 생성

`Nodejs_SAML/.env.example`을 기준으로 `Nodejs_SAML/.env`를 만든다.

```env
SAML_ENTRY_POINT=https://ad-idp.example.com/adfs/ls/
SAML_ISSUER=https://10.173.131.184:8282/
SAML_CALLBACK_URL=https://10.173.131.184:8282/

SAML_IDP_CERT="-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----"
# 또는 파일로 관리:
# SAML_IDP_CERT_FILE=cert/idp_cert.txt

SAML_SSL_KEY_PATH=cert/key.pem
SAML_SSL_CERT_PATH=cert/cert.pem

SAML_PORT=8282
SAML_IDENTIFIER_FORMAT=urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified
SAML_SIGNATURE_ALGORITHM=sha256
SAML_ACCEPTED_CLOCK_SKEW_MS=-1
```

반드시 실제 값으로 바꿔야 하는 항목:

| 변수 | 넣을 값 |
|---|---|
| `SAML_ENTRY_POINT` | AD/IdP 로그인 URL |
| `SAML_ISSUER` | AD에 등록된 Entity ID. 현재는 `https://10.173.131.184:8282/` |
| `SAML_CALLBACK_URL` | AD에 등록된 callback/ACS URL. 현재는 `https://10.173.131.184:8282/` |
| `SAML_IDP_CERT` 또는 `SAML_IDP_CERT_FILE` | AD/IdP SAML 응답 서명 검증용 공개 인증서 |

주의:

- `SAML_IDP_CERT`는 HTTPS 서버 인증서가 아니다.
- env에 직접 넣을 때는 줄바꿈을 실제 줄바꿈이 아니라 `\n` 리터럴로 한 줄에 저장한다.
- `SAML_IDP_CERT_FILE`을 쓰면 `Nodejs_SAML` 기준 상대 경로로 둔다. 예: `cert/idp_cert.txt`

---

## 2. HTTPS 서버 인증서 교체

현재 `Nodejs_SAML/cert/key.pem`, `Nodejs_SAML/cert/cert.pem`은 placeholder라 실제 HTTPS 서버 실행에 사용할 수 없다.

교체 대상:

```text
Nodejs_SAML/cert/key.pem
Nodejs_SAML/cert/cert.pem
```

필요 조건:

- `key.pem`: private key PEM
- `cert.pem`: certificate PEM
- `cert.pem`은 `-----BEGIN CERTIFICATE-----`로 시작해야 한다.
- `key.pem`은 보통 `-----BEGIN PRIVATE KEY-----` 또는 `-----BEGIN RSA PRIVATE KEY-----`로 시작해야 한다.

이 인증서는 `https://10.173.131.184:8282` 서버를 띄우기 위한 인증서다.
AD의 SAML 응답 검증용 `SAML_IDP_CERT`와는 별개다.

---

## 3. 8282 포트 충돌 제거

SAML 테스트 중에는 프론트엔드 preview를 8282에서 띄우면 안 된다.

중지 대상:

```bash
pkill -f "vite preview"
```

포트 확인:

```bash
lsof -ti :8282
```

`restart.sh`는 이제 프론트 preview 대신 `Nodejs_SAML` 서버를 시작하도록 변경되어 있다.

---

## 4. 실행

패키지 설치:

```bash
cd Nodejs_SAML
npm install
```

SAML 서버 단독 실행:

```bash
cd Nodejs_SAML
npm start
```

전체 재시작 스크립트 사용:

```bash
./restart.sh
```

로그 확인:

```bash
tail -f backend/logs/saml.log
```

---

## 5. 브라우저 테스트

접속 URL:

```text
https://10.173.131.184:8282/login
```

예상 흐름:

1. `/login` 접속
2. AD 로그인 화면으로 redirect
3. 로그인 완료
4. AD가 `POST https://10.173.131.184:8282/`로 `SAMLResponse` 전달
5. 서버 콘솔에 callback body 요약과 `req.user` 출력
6. 브라우저 화면에 추출된 claim JSON 출력

---

## 6. 문제 발생 시 우선 확인

### `SAML_ENTRY_POINT is required`

`Nodejs_SAML/.env`가 없거나 `SAML_ENTRY_POINT`가 비어 있다.

### `PEM routines::no start line`

`SAML_SSL_CERT_PATH` 또는 `SAML_SSL_KEY_PATH`가 가리키는 파일이 올바른 PEM 형식이 아니다.

### AD 로그인 후 callback 실패

확인 항목:

- AD 등록 callback URL이 정확히 `https://10.173.131.184:8282/`인지
- AD가 HTTP-POST Binding으로 `SAMLResponse`를 보내는지
- `SAML_IDP_CERT`가 AD SAML 응답 서명 인증서와 일치하는지
- `SAML_ISSUER`가 AD에 등록된 Entity ID와 완전히 일치하는지
- URL 끝의 `/` 포함 여부가 AD 등록값과 일치하는지

### 8282 포트 시작 실패

```bash
lsof -ti :8282
```

기존 프로세스가 있으면 종료한다.

