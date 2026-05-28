var express    = require('express');
var path       = require('path');
var bodyParser = require('body-parser');
var passport   = require('passport');
var session    = require('express-session');
var jwt        = require('jsonwebtoken');
var config     = require('./config');

var app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret:            config.JWT_SECRET,
  resave:            false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// ── SAML Strategy (운영 모드에서만 설정) ──────────────────────────────────────
if (!config.MOCK_MODE) {
  var SamlStrategy = require('passport-saml').Strategy;
  var NS = 'http://schemas.sec.com/2018/05/identity/claims/';

  passport.use(new SamlStrategy(
    {
      entryPoint:                   config.SAML.IDP_URL,
      issuer:                       config.SAML.ENTITY_ID,
      callbackUrl:                  config.SAML.ACS_URL,
      cert:                         config.SAML.IDP_CERT,
      identifierFormat:             'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
      disableRequestedAuthnContext: true,
      signatureAlgorithm:           'sha256',
      acceptedClockSkewMs:          -1,
    },
    function(profile, done) {
      return done(null, {
        loginId:   profile[NS + 'LoginId']   || '',
        compId:    profile[NS + 'CompId']    || '',
        deptId:    profile[NS + 'DeptId']    || '',
        sabun:     profile[NS + 'Sabun']     || '',
        mail:      profile[NS + 'Mail']      || '',
        userId:    profile[NS + 'UserId']    || '',
        deptName:  profile[NS + 'DeptName']  || '',
        grdName:   profile[NS + 'GrdName']   || '',
        mobile:    profile[NS + 'Mobile']    || '',
        username:  profile[NS + 'Username']  || '',
        surname:   profile[NS + 'Surname']   || '',
        givenname: profile[NS + 'Givenname'] || '',
      });
    }
  ));
}

passport.serializeUser(function(user, done)   { done(null, user); });
passport.deserializeUser(function(user, done) { done(null, user); });

// ── Routes ────────────────────────────────────────────────────────────────────
var indexRouter = require('./routes/index');
app.use('/', indexRouter);

module.exports = app;
