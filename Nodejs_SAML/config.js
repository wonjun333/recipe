// ─────────────────────────────────────────────────────────────────────────────
// 설정값은 시스템 환경변수에서 읽습니다.
// 운영(Windows) 환경에서는 시스템 환경변수로 설정하거나
// 배포 스크립트에서 SET 명령어로 지정하세요.
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  // true: IDP 없이 자동 로그인 (개발/테스트)
  // false: 실제 SAML 인증 (운영)
  MOCK_MODE: process.env.MOCK_MODE === 'true',

  PORT: parseInt(process.env.PORT || '44364'),

  // FastAPI backend 의 AUTH_JWT_SECRET 과 반드시 동일해야 함
  JWT_SECRET:       process.env.AUTH_JWT_SECRET       || 'change-me-in-production',
  JWT_EXPIRE_HOURS: parseInt(process.env.AUTH_JWT_EXPIRE_HOURS || '8'),

  COOKIE_NAME: 'auth_token',

  // 로그인 성공 후 이동할 Vue 프론트엔드 주소
  FRONTEND_URL: process.env.SAML_REDIRECT_AFTER_LOGIN || 'http://localhost:5174/',

  // SAML 설정 (MOCK_MODE=false 시 필수)
  SAML: {
    IDP_URL:     process.env.SAML_IDP_URL     || '',
    ENTITY_ID:   process.env.SAML_ENTITY_ID   || 'https://localhost:44364',
    ACS_URL:     process.env.SAML_ACS_URL     || 'https://localhost:44364/samlconsume',
    IDP_CERT:    process.env.SAML_IDP_CERT    || '',
    SIGNOUT_URL: process.env.SAML_SIGNOUT_URL || '',
  },

  // mockup 시 사용하는 가상 사용자
  MOCK_USER: {
    loginId:   'mock_user',
    compId:    'MOCK_COMP',
    deptId:    'MOCK_DEPT',
    sabun:     '000000',
    mail:      'mock@example.com',
    userId:    'mock001',
    deptName:  'Dev Team',
    grdName:   'Engineer',
    mobile:    '',
    username:  'Mock User',
    surname:   'Mock',
    givenname: 'User',
  },
};
