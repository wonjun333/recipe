var express = require('express');

var fs = require('fs');

var path = require('path');

var https = require('https');

var passport = require('passport');

var saml = require('passport-saml').Strategy;

var bodyParser = require('body-parser');

var util = require('util');

var jwt = require('jsonwebtoken');

// SSL Option

var option = {

key: fs.readFileSync('cert/key.pem'), // 실제 운영 환경에서는 환경 변수나 보안 저장소 사용 권장

cert: fs.readFileSync('cert/cert.pem')

};

// 로그인 후 이동할 Vue 앱 주소
var frontendUrl    = process.env.FRONTEND_URL || 'http://10.173.131.184:8282';
var jwtExpireHours = 8;
var cookieName     = 'auth_token';
var cookieSecure   = frontendUrl.toLowerCase().startsWith('https://');

var app = express();

app.locals.pretty = true;

app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'jade');

app.use('/', express.static(path.join(__dirname, '/public')))

app.use(passport.initialize());

app.use(passport.session());

app.use(bodyParser.urlencoded({extended:true}));

app.use(bodyParser.json());

// IDP Url

// Dev

//var idpUrl = '[DEV_IDP_URL]';

// Ops

var idpUrl = '[PROD_IDP_URL]';

var strategy = new saml(

{

	entryPoint: idpUrl,											// IDP Url

    issuer: 'https://localhost:44364',							// Entity ID

    callbackUrl: 'https://localhost:44364/samlconsume',			// ACS Url

	// Dev

    //cert: '[DEV_SAML_CERTIFICATE]',

	// Ops

    cert: '[PROD_SAML_CERTIFICATE]',

    identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',

    disableRequestedAuthnContext: true,

    signatureAlgorithm: 'sha256',

	acceptedClockSkewMs: -1 // SAML assertion not yet valid fix

},

function (profile, done){

	return done(null, {

		// Claim 설정

		LoginId: profile['http://schemas.sec.com/2018/05/identity/claims/LoginId'],

		CompId: profile['http://schemas.sec.com/2018/05/identity/claims/CompId'],

		DeptId: profile['http://schemas.sec.com/2018/05/identity/claims/DeptId'],

		Sabun: profile['http://schemas.sec.com/2018/05/identity/claims/Sabun'],

		Mail: profile['http://schemas.sec.com/2018/05/identity/claims/Mail'],

		UserId: profile['http://schemas.sec.com/2018/05/identity/claims/UserId'],

		DeptName: profile['http://schemas.sec.com/2018/05/identity/claims/DeptName'],

		GrdName: profile['http://schemas.sec.com/2018/05/identity/claims/GrdName'],

		Mobile: profile['http://schemas.sec.com/2018/05/identity/claims/Mobile'],

		Username: profile['http://schemas.sec.com/2018/05/identity/claims/Username'],

		Surname: profile['http://schemas.sec.com/2018/05/identity/claims/Surname'],

		Givenname: profile['http://schemas.sec.com/2018/05/identity/claims/Givenname']

	});

}

);

passport.use(strategy);

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

passport.authenticate('saml', { failureRedirect:'/', faulureFlash: true }),

function(req, res)

{

	console.log("resoponse");

	res.redirect('/');

}

);

// SSO Callback — JWT 쿠키 발급 후 Vue 앱으로 이동

app.post('/samlconsume',

passport.authenticate('saml', { failureRedirect:'/', faulureFlash: true }),

function(req, res)

{

	console.log("User : " + util.inspect(req.user));

	var token = jwt.sign(req.user, option.key, { algorithm: 'RS256', expiresIn: jwtExpireHours + 'h' });
	res.cookie(cookieName, token, {
		httpOnly: true,
		secure:   cookieSecure,
		sameSite: 'lax',
		maxAge:   jwtExpireHours * 3600 * 1000
	});
	res.redirect(frontendUrl);

}

);

// Sign out

app.get('/Signout',

function(req, res)

{

	res.clearCookie(cookieName);
	res.redirect(idpUrl + '?wa=wsignoutcleanup1.0')

}

);

// Server

https.createServer(option, app).listen(44364, function(){

console.log("Server Running on port 44364...");

});
