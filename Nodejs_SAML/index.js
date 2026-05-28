var express    = require('express');
var fs         = require('fs');
var path       = require('path');
var https      = require('https');
var http       = require('http');
var passport   = require('passport');
var saml       = require('passport-saml').Strategy;
var bodyParser = require('body-parser');
var util       = require('util');
var jwt        = require('jsonwebtoken');

// Mock Mode (true: IDP 없이 자동 로그인 / false: 실제 SAML 인증)
var MOCK_MODE = true;

// Mock User
var mockUser = {
    LoginId:   'mock_user',
    CompId:    'MOCK_COMP',
    DeptId:    'MOCK_DEPT',
    Sabun:     '000000',
    Mail:      'mock@example.com',
    UserId:    'mock001',
    DeptName:  'Dev Team',
    GrdName:   'Engineer',
    Mobile:    '',
    Username:  'Mock User',
    Surname:   'Mock',
    Givenname: 'User',
};

// JWT
var jwtSecret      = 'change-me-please';   // backend AUTH_JWT_SECRET 과 반드시 동일한 값
var jwtExpireHours = 8;
var cookieName     = 'auth_token';
var frontendUrl    = 'http://10.173.131.184:8282/';  // 로그인 후 이동할 Vue 주소
var cookieSecure   = false;                // HTTP 환경이면 false, HTTPS 환경이면 true

// SSL Option (운영 모드에서만 사용)
var option = MOCK_MODE ? null : {
    key:  fs.readFileSync('cert/key.pem'),
    cert: fs.readFileSync('cert/cert.pem')
};

var app = express();

app.locals.pretty = true;
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use('/', express.static(path.join(__dirname, '/public')));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

// IDP Url
// Dev
//var idpUrl = '[DEV_IDP_URL]';
// Ops
var idpUrl = '[PROD_IDP_URL]';

if (!MOCK_MODE) {
    var strategy = new saml(
        {
            entryPoint:                   idpUrl,                          // IDP Url
            issuer:                       '[YOUR_ENTITY_ID]',              // Entity ID
            callbackUrl:                  '[YOUR_CALLBACK_URL]',           // ACS Url
            // Dev
            //cert: '[DEV_SAML_CERTIFICATE]',
            // Ops
            cert:                         '[PROD_SAML_CERTIFICATE]',
            identifierFormat:             'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
            disableRequestedAuthnContext: true,
            signatureAlgorithm:           'sha256',
            acceptedClockSkewMs:          -1  // SAML assertion not yet valid fix
        },
        function(profile, done){
            return done(null, {
                // Claim 설정
                LoginId:   profile['http://schemas.sec.com/2018/05/identity/claims/LoginId'],
                CompId:    profile['http://schemas.sec.com/2018/05/identity/claims/CompId'],
                DeptId:    profile['http://schemas.sec.com/2018/05/identity/claims/DeptId'],
                Sabun:     profile['http://schemas.sec.com/2018/05/identity/claims/Sabun'],
                Mail:      profile['http://schemas.sec.com/2018/05/identity/claims/Mail'],
                UserId:    profile['http://schemas.sec.com/2018/05/identity/claims/UserId'],
                DeptName:  profile['http://schemas.sec.com/2018/05/identity/claims/DeptName'],
                GrdName:   profile['http://schemas.sec.com/2018/05/identity/claims/GrdName'],
                Mobile:    profile['http://schemas.sec.com/2018/05/identity/claims/Mobile'],
                Username:  profile['http://schemas.sec.com/2018/05/identity/claims/Username'],
                Surname:   profile['http://schemas.sec.com/2018/05/identity/claims/Surname'],
                Givenname: profile['http://schemas.sec.com/2018/05/identity/claims/Givenname']
            });
        }
    );

    passport.use(strategy);
}

passport.serializeUser(function(user, done){
    console.log("Serializing user");
    done(null, user);
});

passport.deserializeUser(function(user, done){
    console.log("deserialize User");
    done(null, user);
});

// SSO Request
app.get('/',
    function(req, res, next){
        if (MOCK_MODE) { req.user = mockUser; return next(); }
        passport.authenticate('saml', { failureRedirect:'/', failureFlash: true })(req, res, next);
    },
    function(req, res){
        console.log("response");
        res.redirect('/samlconsume');
    }
);

// SSO Callback
app.post('/samlconsume',
    function(req, res, next){
        if (MOCK_MODE) { req.user = mockUser; return next(); }
        passport.authenticate('saml', { failureRedirect:'/', failureFlash: true })(req, res, next);
    },
    function(req, res){
        console.log("User : " + util.inspect(req.user));
        var token = jwt.sign(req.user, jwtSecret, { expiresIn: jwtExpireHours + 'h' });
        res.cookie(cookieName, token, {
            httpOnly: true,
            secure:   cookieSecure,
            sameSite: 'lax',
            maxAge:   jwtExpireHours * 3600 * 1000
        });
        res.redirect(frontendUrl);
    }
);

// Mock: GET /samlconsume
if (MOCK_MODE) {
    app.get('/samlconsume', function(req, res){
        var token = jwt.sign(mockUser, jwtSecret, { expiresIn: jwtExpireHours + 'h' });
        res.cookie(cookieName, token, { httpOnly:true, secure:false, sameSite:'lax', maxAge: jwtExpireHours * 3600 * 1000 });
        console.log("[MOCK] Auto-login → " + frontendUrl);
        res.redirect(frontendUrl);
    });
}

// Sign out
app.get('/Signout',
    function(req, res){
        res.clearCookie(cookieName);
        if (MOCK_MODE) return res.redirect(frontendUrl);
        res.redirect(idpUrl + '?wa=wsignoutcleanup1.0');
    }
);

// Server
if (MOCK_MODE) {
    http.createServer(app).listen(44364, function(){
        console.log("[MOCK] Server Running on port 44364...");
    });
} else {
    https.createServer(option, app).listen('[PORT]', function(){
        console.log("Server Running on port [PORT]...");
    });
}
