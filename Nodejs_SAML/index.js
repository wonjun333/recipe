var express = require('express');
var fs = require('fs');
var path = require('path');
var https = require('https');
var passport = require('passport');
var SamlStrategy = require('passport-saml').Strategy;
var bodyParser = require('body-parser');
var util = require('util');
var jwt = require('jsonwebtoken');

loadDotEnv(path.join(__dirname, '.env'));

var app = express();

app.locals.pretty = true;
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(passport.initialize());
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));

var port = Number(process.env.SAML_PORT || 9000);
var sslKeyPath = resolveLocalPath(process.env.SAML_SSL_KEY_PATH || 'cert/key.pem');
var sslCertPath = resolveLocalPath(process.env.SAML_SSL_CERT_PATH || 'cert/cert.pem');
var frontendUrl = process.env.FRONTEND_URL || process.env.SAML_SERVICE_URL || 'https://10.173.131.184:8282/';
var cookieName = process.env.AUTH_COOKIE_NAME || 'auth_token';
var cookieSecure = parseBool(process.env.AUTH_COOKIE_SECURE, true);
var jwtExpireHours = Number(process.env.JWT_EXPIRE_HOURS || 8);
var jwtSigningKeyPath = resolveLocalPath(process.env.JWT_SIGNING_KEY_PATH || process.env.SAML_SSL_KEY_PATH || 'cert/key.pem');
var jwtSigningKey = fs.readFileSync(jwtSigningKeyPath, 'utf8');

var samlEntryPoint = requiredEnv('SAML_ENTRY_POINT');
var samlIssuer = requiredEnv('SAML_ISSUER');
var samlCallbackUrl = requiredEnv('SAML_CALLBACK_URL');
var samlIdpCert = loadSamlIdpCert();

var strategy = new SamlStrategy(
  {
    entryPoint: samlEntryPoint,
    issuer: samlIssuer,
    callbackUrl: samlCallbackUrl,
    cert: samlIdpCert,
    identifierFormat:
      process.env.SAML_IDENTIFIER_FORMAT ||
      'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
    disableRequestedAuthnContext: true,
    signatureAlgorithm: process.env.SAML_SIGNATURE_ALGORITHM || 'sha256',
    acceptedClockSkewMs: Number(process.env.SAML_ACCEPTED_CLOCK_SKEW_MS || -1),
  },
  function (profile, done) {
    return done(null, buildUserClaims(profile));
  }
);

passport.use(strategy);

app.get('/login', function (_req, res, next) {
  noStore(res);
  passport.authenticate('saml', {
    failureRedirect: '/login',
    session: false,
  })(_req, res, next);
});

app.post(
  '/',
  function (_req, res, next) {
    noStore(res);
    next();
  },
  passport.authenticate('saml', {
    failureRedirect: '/login',
    session: false,
  }),
  function (req, res) {
    console.log('SAML callback body:', util.inspect(summarizeCallbackFields(req.body || {}), { depth: 5 }));
    console.log('SAML user:', util.inspect(req.user, { depth: 3 }));

    try {
      var token = jwt.sign(req.user, jwtSigningKey, {
        algorithm: 'RS256',
        expiresIn: jwtExpireHours + 'h',
      });

      res.cookie(cookieName, token, {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: 'lax',
        maxAge: jwtExpireHours * 3600 * 1000,
        path: '/',
      });

      console.log('SAML token issued:', {
        loginId: req.user && req.user.LoginId,
        username: req.user && req.user.Username,
        tokenLength: token.length,
      });
      res.redirect(frontendUrl);
    } catch (error) {
      console.error('SAML token issue failed:', error && error.stack ? error.stack : error);
      res.status(500).type('text').send('SAML token issue failed');
    }
  }
);

app.get('/', function (_req, res) {
  noStore(res);
  res.type('html').send(
    '<!doctype html><html><head><meta charset="utf-8"><title>SAML Debug</title></head>' +
      '<body><h1>SAML Debug</h1><p><a href="/login">Login with AD</a></p></body></html>'
  );
});

app.get('/Signout', function (_req, res) {
  noStore(res);
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: 'lax',
    path: '/',
  });
  res.redirect(samlEntryPoint + (samlEntryPoint.indexOf('?') >= 0 ? '&' : '?') + 'wa=wsignoutcleanup1.0');
});

app.use('/', express.static(path.join(__dirname, 'public')));

var httpsOptions = {
  key: fs.readFileSync(sslKeyPath),
  cert: fs.readFileSync(sslCertPath),
};

https.createServer(httpsOptions, app).listen(port, function () {
  console.log('SAML auth server running at https://0.0.0.0:' + port + '/');
  console.log('Login URL: https://0.0.0.0:' + port + '/login');
  console.log('Callback URL: ' + samlCallbackUrl);
});

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
}

function loadSamlIdpCert() {
  if (process.env.SAML_IDP_CERT) {
    return process.env.SAML_IDP_CERT.replace(/\\n/g, '\n');
  }

  if (process.env.SAML_IDP_CERT_FILE) {
    return fs.readFileSync(resolveLocalPath(process.env.SAML_IDP_CERT_FILE), 'utf8').trim();
  }

  var fallback = path.join(__dirname, 'cert', 'idp_cert.txt');
  if (fs.existsSync(fallback)) {
    return fs.readFileSync(fallback, 'utf8').trim();
  }

  throw new Error('SAML_IDP_CERT or SAML_IDP_CERT_FILE is required.');
}

function summarizeCallbackFields(body) {
  var result = {};
  Object.keys(body).forEach(function (key) {
    var value = body[key];
    if (key === 'SAMLResponse' || key === 'RelayState') {
      var text = typeof value === 'string' ? value : String(value || '');
      result[key] = {
        present: text.length > 0,
        length: text.length,
      };
      return;
    }
    result[key] = value;
  });
  return result;
}

function buildUserClaims(profile) {
  return {
    LoginId: claim(profile, 'LoginId'),
    CompId: claim(profile, 'CompId'),
    DeptId: claim(profile, 'DeptId'),
    Sabun: claim(profile, 'Sabun'),
    Mail: claim(profile, 'Mail'),
    UserId: claim(profile, 'UserId'),
    DeptName: claim(profile, 'DeptName'),
    GrdName: claim(profile, 'GrdName'),
    Mobile: claim(profile, 'Mobile'),
    Username: claim(profile, 'Username'),
    Surname: claim(profile, 'Surname'),
    Givenname: claim(profile, 'Givenname'),
  };
}

function claim(profile, name) {
  var value = profile['http://schemas.sec.com/2018/05/identity/claims/' + name];
  if (Array.isArray(value)) return value.length ? String(value[0]) : '';
  if (value === undefined || value === null) return '';
  return String(value);
}

function parseBool(value, defaultValue) {
  if (value === undefined || value === null || value === '') return defaultValue;
  return ['1', 'true', 'yes', 'y', 'on'].indexOf(String(value).toLowerCase()) >= 0;
}

function requiredEnv(name) {
  var value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(name + ' is required.');
  }
  return String(value).trim();
}

function resolveLocalPath(value) {
  if (path.isAbsolute(value)) return value;
  return path.join(__dirname, value);
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .forEach(function (line) {
      var trimmed = line.trim();
      if (!trimmed || trimmed[0] === '#') return;

      var index = trimmed.indexOf('=');
      if (index < 0) return;

      var key = trimmed.slice(0, index).trim();
      var value = trimmed.slice(index + 1).trim();

      if (
        (value[0] === '"' && value[value.length - 1] === '"') ||
        (value[0] === "'" && value[value.length - 1] === "'")
      ) {
        value = value.slice(1, -1);
      }

      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
}
