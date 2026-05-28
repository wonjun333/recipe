var express  = require('express');
var passport = require('passport');
var jwt      = require('jsonwebtoken');
var config   = require('../config');

var router = express.Router();

function createToken(user) {
  return jwt.sign(user, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRE_HOURS + 'h' });
}

function setAuthCookie(res, token) {
  res.cookie(config.COOKIE_NAME, token, {
    httpOnly: true,
    secure:   !config.MOCK_MODE,
    sameSite: 'lax',
    maxAge:   config.JWT_EXPIRE_HOURS * 3600 * 1000,
  });
}

// ── SSO Request ───────────────────────────────────────────────────────────────
router.get('/', function(req, res, next) {
  if (config.MOCK_MODE) {
    var token = createToken(config.MOCK_USER);
    setAuthCookie(res, token);
    console.log('[MOCK] Auto-login as ' + config.MOCK_USER.username);
    return res.redirect(config.FRONTEND_URL);
  }
  passport.authenticate('saml', { failureRedirect: '/', failureFlash: false })(req, res, next);
});

// ── SSO Callback ──────────────────────────────────────────────────────────────
router.post('/samlconsume',
  passport.authenticate('saml', { failureRedirect: '/', failureFlash: false }),
  function(req, res) {
    var token = createToken(req.user);
    setAuthCookie(res, token);
    console.log('Login: ' + req.user.username + ' (' + req.user.userId + ')');
    res.redirect(config.FRONTEND_URL);
  }
);

// ── Sign out ──────────────────────────────────────────────────────────────────
router.get('/signout', function(req, res) {
  res.clearCookie(config.COOKIE_NAME);
  if (config.MOCK_MODE) {
    return res.redirect(config.FRONTEND_URL);
  }
  var signoutUrl = config.SAML.SIGNOUT_URL || config.SAML.IDP_URL;
  res.redirect(signoutUrl + '?wa=wsignoutcleanup1.0');
});

module.exports = router;
