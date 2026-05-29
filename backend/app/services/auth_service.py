from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parents[2] / '.env')
except Exception:
    pass

SAML_IDP_URL: str = os.environ.get('SAML_IDP_URL', '')
SAML_ENTITY_ID: str = os.environ.get('SAML_ENTITY_ID', '')
SAML_ACS_URL: str = os.environ.get('SAML_ACS_URL', '')
SAML_IDP_CERT: str = os.environ.get('SAML_IDP_CERT', '')
SAML_SIGNOUT_URL: str = os.environ.get('SAML_SIGNOUT_URL', SAML_IDP_URL)
SAML_REDIRECT_AFTER_LOGIN: str = os.environ.get('SAML_REDIRECT_AFTER_LOGIN', '/')

JWT_SECRET: str = os.environ.get('AUTH_JWT_SECRET', 'change-me-in-production')
JWT_PUBLIC_CERT_PATH: str = os.environ.get('JWT_PUBLIC_CERT_PATH', '')
JWT_EXPIRE_HOURS: int = int(os.environ.get('AUTH_JWT_EXPIRE_HOURS', '8'))
COOKIE_NAME = 'auth_token'
COOKIE_SECURE: bool = os.environ.get('AUTH_COOKIE_SECURE', 'false').lower() == 'true'

_CLAIM_NS = 'http://schemas.sec.com/2018/05/identity/claims/'

CLAIM_KEYS = [
    'LoginId', 'CompId', 'DeptId', 'Sabun', 'Mail',
    'UserId', 'DeptName', 'GrdName', 'Mobile',
    'Username', 'Surname', 'Givenname',
]


def _saml_settings() -> dict:
    return {
        'strict': True,
        'debug': False,
        'sp': {
            'entityId': SAML_ENTITY_ID,
            'assertionConsumerService': {
                'url': SAML_ACS_URL,
                'binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
            },
            'NameIDFormat': 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
        },
        'idp': {
            'entityId': SAML_IDP_URL,
            'singleSignOnService': {
                'url': SAML_IDP_URL,
                'binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            },
            'singleLogoutService': {
                'url': SAML_SIGNOUT_URL,
                'binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            },
            'x509cert': SAML_IDP_CERT,
        },
        'security': {
            'authnRequestsSigned': False,
            'wantAssertionsSigned': True,
            'wantMessagesSigned': False,
            'signatureAlgorithm': 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
            'digestAlgorithm': 'http://www.w3.org/2001/04/xmlenc#sha256',
            'requestedAuthnContext': False,   # disableRequestedAuthnContext
            'rejectUnsolicitedResponsesWithInResponseTo': False,
        },
    }


async def build_saml_request_data(request) -> dict:
    form: dict = {}
    if request.method == 'POST':
        form_data = await request.form()
        form = dict(form_data)
    return {
        'https': 'on' if request.url.scheme == 'https' else 'off',
        'http_host': request.headers.get('host', ''),
        'script_name': request.url.path,
        'get_data': dict(request.query_params),
        'post_data': form,
    }


def get_saml_login_url(request_data: dict) -> str:
    from onelogin.saml2.auth import OneLogin_Saml2_Auth
    auth = OneLogin_Saml2_Auth(request_data, _saml_settings())
    return auth.login()


def process_saml_response(request_data: dict) -> dict:
    from onelogin.saml2.auth import OneLogin_Saml2_Auth
    auth = OneLogin_Saml2_Auth(request_data, _saml_settings())
    auth.process_response()
    errors = auth.get_errors()
    if errors:
        raise ValueError(f'SAML errors: {errors} / {auth.get_last_error_reason()}')

    attrs = auth.get_attributes()

    def claim(key: str) -> str:
        val = attrs.get(f'{_CLAIM_NS}{key}', [''])
        return str(val[0]) if val else ''

    return {k[0].lower() + k[1:]: claim(k) for k in CLAIM_KEYS}


def create_jwt(user: dict) -> str:
    import jwt
    payload = {
        **{k: v for k, v in user.items() if k != 'exp'},
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')


def _normalize_user(payload: dict) -> dict:
    """Node.js JWT(대문자 키) → 소문자 camelCase 정규화."""
    result = {}
    for k, v in payload.items():
        if k == 'exp':
            continue
        normalized = k[0].lower() + k[1:] if k[0].isupper() else k
        result[normalized] = v
    return result


def verify_jwt(token: str) -> dict:
    import jwt
    if JWT_PUBLIC_CERT_PATH:
        pub_key = Path(JWT_PUBLIC_CERT_PATH).read_text(encoding='utf-8')
        payload = jwt.decode(token, pub_key, algorithms=['RS256'])
    else:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    return _normalize_user(payload)
