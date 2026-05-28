#!/bin/bash
# 개발용 자체서명 인증서 생성 (운영 환경에서는 공인 인증서 사용)
openssl req -x509 -newkey rsa:4096 \
  -keyout key.pem -out cert.pem \
  -days 365 -nodes \
  -subj '/CN=localhost'
echo "key.pem, cert.pem 생성 완료"
