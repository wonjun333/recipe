# SAML 인증 흐름

```mermaid
sequenceDiagram
    participant B as Browser (Windows)
    participant S as Nodejs_SAML :8282
    participant AD as AD / SAML IdP

    B->>S: GET /login
    S->>S: AuthnRequest 생성 (issuer, callbackUrl 기반)
    S-->>B: 302 → AD 로그인 URL

    B->>AD: AD 로그인
    AD-->>B: SAMLResponse 포함 HTML form (auto-submit)

    B->>S: POST / (SAMLResponse)
    S->>S: 서명 검증 (SAML_IDP_CERT)
    S->>S: profile 추출 → console.log
    S-->>B: JSON 화면 출력
```

## env 필수값

| 변수 | 설명 |
|------|------|
| `SAML_ENTRY_POINT` | AD 로그인 URL |
| `SAML_ISSUER` | AD에 등록된 Entity ID (`https://10.173.131.184:8282/`) |
| `SAML_CALLBACK_URL` | ACS URL (`https://10.173.131.184:8282/`) |
| `SAML_IDP_CERT` | AD 서명 인증서 (줄바꿈 `\n`으로 한 줄 저장) |
