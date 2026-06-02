#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
PUBLIC_HOST="${PUBLIC_HOST:-10.173.131.184}"
PUBLIC_PORT="${PUBLIC_PORT:-8282}"
WEB_ROOT="${WEB_ROOT:-/var/www/recipe}"
SSL_CERT_PATH="${SSL_CERT_PATH:-$PROJECT_DIR/Nodejs_SAML/cert/cert.pem}"
SSL_KEY_PATH="${SSL_KEY_PATH:-$PROJECT_DIR/Nodejs_SAML/cert/key.pem}"
NGINX_SITE_NAME="${NGINX_SITE_NAME:-recipe-8282}"
NGINX_AVAILABLE="/etc/nginx/sites-available/$NGINX_SITE_NAME"
NGINX_ENABLED="/etc/nginx/sites-enabled/$NGINX_SITE_NAME"

if [ "$(id -u)" -eq 0 ]; then
    SUDO=""
else
    SUDO="sudo"
fi

echo "[1/5] frontend build 확인"
if [ ! -f "$PROJECT_DIR/frontend/dist/index.html" ]; then
    echo "  frontend/dist/index.html 없음. 빌드 실행..."
    (cd "$PROJECT_DIR/frontend" && npm install && npm run build)
fi

if [ ! -f "$PROJECT_DIR/frontend/dist/index.html" ]; then
    echo "ERROR: frontend/dist/index.html 생성 실패"
    exit 1
fi

echo "[2/5] 정적 파일 배포: $WEB_ROOT"
$SUDO mkdir -p "$WEB_ROOT"
if command -v rsync >/dev/null 2>&1; then
    $SUDO rsync -a --delete "$PROJECT_DIR/frontend/dist/" "$WEB_ROOT/"
else
    $SUDO rm -rf "$WEB_ROOT"/*
    $SUDO cp -a "$PROJECT_DIR/frontend/dist/." "$WEB_ROOT/"
fi
$SUDO chown -R www-data:www-data "$WEB_ROOT"
$SUDO chmod -R u=rwX,g=rX,o=rX "$WEB_ROOT"

echo "[3/5] nginx 8282 설정 생성: $NGINX_AVAILABLE"
$SUDO tee "$NGINX_AVAILABLE" >/dev/null <<EOF
server {
    listen ${PUBLIC_PORT} ssl;
    server_name ${PUBLIC_HOST};

    ssl_certificate     ${SSL_CERT_PATH};
    ssl_certificate_key ${SSL_KEY_PATH};

    client_max_body_size 20m;

    root ${WEB_ROOT};
    index index.html;

    location = /login {
        proxy_pass https://127.0.0.1:9000/login;
        proxy_ssl_verify off;
        proxy_set_header Host \$host:${PUBLIC_PORT};
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port ${PUBLIC_PORT};
    }

    location = /Signout {
        proxy_pass https://127.0.0.1:9000/Signout;
        proxy_ssl_verify off;
        proxy_set_header Host \$host:${PUBLIC_PORT};
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port ${PUBLIC_PORT};
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host:${PUBLIC_PORT};
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location = / {
        if (\$request_method = POST) {
            return 418;
        }
        try_files /index.html =404;
    }

    error_page 418 = @saml_callback;

    location @saml_callback {
        proxy_pass https://127.0.0.1:9000;
        proxy_ssl_verify off;
        proxy_set_header Host \$host:${PUBLIC_PORT};
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port ${PUBLIC_PORT};
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

echo "[4/5] nginx site 활성화"
if [ -d /etc/nginx/sites-enabled ]; then
    for enabled_site in /etc/nginx/sites-enabled/*; do
        [ -e "$enabled_site" ] || continue
        [ "$enabled_site" = "$NGINX_ENABLED" ] && continue

        if $SUDO grep -Eq "listen[[:space:]]+${PUBLIC_PORT}([[:space:];]|[[:space:]]+ssl)" "$enabled_site"; then
            echo "  기존 ${PUBLIC_PORT} site 비활성화: $enabled_site"
            $SUDO rm -f "$enabled_site"
        fi
    done
fi
$SUDO ln -sf "$NGINX_AVAILABLE" "$NGINX_ENABLED"

echo "[5/5] nginx 검증 및 reload"
$SUDO nginx -t
$SUDO systemctl reload nginx

echo ""
echo "완료. 다음 명령으로 확인:"
echo "  curl -k -i https://${PUBLIC_HOST}:${PUBLIC_PORT}/"
echo "  curl -k -i https://${PUBLIC_HOST}:${PUBLIC_PORT}/login"
echo "  curl -k -i \"https://${PUBLIC_HOST}:${PUBLIC_PORT}/api/recipe-inventory/snapshot?eqpId=CACP701\""
