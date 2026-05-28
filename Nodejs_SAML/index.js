require('dotenv').config();

const express    = require('express');
const fs         = require('fs');
const path       = require('path');
const https      = require('https');
const http       = require('http');
const bodyParser = require('body-parser');
const jwt        = require('jsonwebtoken');

const MOCK_MODE         = process.env.MOCK_MODE === 'true';
const PORT              = parseInt(process.env.PORT || '44364');
const JWT_SECRET        = process.env.AUTH_JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRE_HOURS  = parseInt(process.env.AUTH_JWT_EXPIRE_HOURS || '8');
const FRONTEND_URL      = process.env.SAML_REDIRECT_AFTER_LOGIN || 'http://localhost:5174/';
const COOKIE_NAME       = 'auth_token';
const NS                = 'http://schemas.sec.com/2018/05/identity/claims/';

const MOCK_USER = {
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
};

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

function createToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: `${JWT_EXPIRE_HOURS}h` });
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   !MOCK_MODE,   // HTTP 허용 (mockup), HTTPS 필수 (운영)
    sameSite: 'lax',
    maxAge:   JWT_EXPIRE_HOURS * 3600 * 1000,
  });
}

// ── MOCK MODE ─────────────────────────────────────────────────────────────────
if (MOCK_MODE) {

  app.get('/', (req, res) => {
    const token = createToken(MOCK_USER);
    setAuthCookie(res, token);
    console.log(`[MOCK] auto-login as ${MOCK_USER.username} → ${FRONTEND_URL}`);
    res.redirect(FRONTEND_URL);
  });

  app.get('/samlconsume', (req, res) => res.redirect('/'));
  app.get('/signout',     (req, res) => {
    res.clearCookie(COOKIE_NAME);
    res.redirect(FRONTEND_URL);
  });

  http.createServer(app).listen(PORT, () => {
    console.log(`[MOCK] SAML server: http://localhost:${PORT}/`);
    console.log(`[MOCK] → ${FRONTEND_URL} 로 자동 로그인됩니다.`);
  });

// ── PRODUCTION MODE ───────────────────────────────────────────────────────────
} else {
  const passport      = require('passport');
  const SamlStrategy  = require('passport-saml').Strategy;
  const session       = require('express-session');

  const IDP_URL     = process.env.SAML_IDP_URL;
  const ENTITY_ID   = process.env.SAML_ENTITY_ID   || `https://localhost:${PORT}`;
  const ACS_URL     = process.env.SAML_ACS_URL      || `https://localhost:${PORT}/samlconsume`;
  const IDP_CERT    = process.env.SAML_IDP_CERT;
  const SIGNOUT_URL = process.env.SAML_SIGNOUT_URL  || IDP_URL;

  if (!IDP_URL || !IDP_CERT) {
    console.error('ERROR: SAML_IDP_URL 과 SAML_IDP_CERT 가 .env에 설정되어야 합니다.');
    process.exit(1);
  }

  app.use(session({
    secret:            JWT_SECRET,
    resave:            false,
    saveUninitialized: false,
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new SamlStrategy(
    {
      entryPoint:                  IDP_URL,
      issuer:                      ENTITY_ID,
      callbackUrl:                 ACS_URL,
      cert:                        IDP_CERT,
      identifierFormat:            'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
      disableRequestedAuthnContext: true,
      signatureAlgorithm:          'sha256',
      acceptedClockSkewMs:         -1,
    },
    (profile, done) => {
      return done(null, {
        loginId:   profile[`${NS}LoginId`]   || '',
        compId:    profile[`${NS}CompId`]    || '',
        deptId:    profile[`${NS}DeptId`]    || '',
        sabun:     profile[`${NS}Sabun`]     || '',
        mail:      profile[`${NS}Mail`]      || '',
        userId:    profile[`${NS}UserId`]    || '',
        deptName:  profile[`${NS}DeptName`]  || '',
        grdName:   profile[`${NS}GrdName`]   || '',
        mobile:    profile[`${NS}Mobile`]    || '',
        username:  profile[`${NS}Username`]  || '',
        surname:   profile[`${NS}Surname`]   || '',
        givenname: profile[`${NS}Givenname`] || '',
      });
    }
  ));

  passport.serializeUser((user, done)   => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  // SSO Request
  app.get('/',
    passport.authenticate('saml', { failureRedirect: '/', failureFlash: false }),
    (req, res) => res.redirect('/')
  );

  // SSO Callback
  app.post('/samlconsume',
    passport.authenticate('saml', { failureRedirect: '/', failureFlash: false }),
    (req, res) => {
      const token = createToken(req.user);
      setAuthCookie(res, token);
      console.log(`Login: ${req.user.username} (${req.user.userId})`);
      res.redirect(FRONTEND_URL);
    }
  );

  // Sign out
  app.get('/signout', (req, res) => {
    res.clearCookie(COOKIE_NAME);
    res.redirect(`${SIGNOUT_URL}?wa=wsignoutcleanup1.0`);
  });

  const sslOptions = {
    key:  fs.readFileSync(path.join(__dirname, 'cert/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert/cert.pem')),
  };

  https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`SAML server: https://localhost:${PORT}/`);
  });
}
