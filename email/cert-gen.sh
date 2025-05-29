#!/bin/bash

mkdir -p keys

openssl genpkey -algorithm RSA -out keys/key.pem -pkeyopt rsa_keygen_bits:2048

openssl req -new -key keys/key.pem -out keys/csr.pem \
    -subj "/C=US/ST=Delaware/O=Plane Software Inc/CN=plane.so/emailAddress=support@plane.so"

openssl x509 -req -days 365 -in keys/csr.pem -signkey keys/key.pem -out keys/cert.pem

rm keys/csr.pem

chmod 600 keys/key.pem
chmod 644 keys/cert.pem

# ------------------------------ 
# DKIM
# openssl genpkey -algorithm RSA -out keys/dkim_private.pem -pkeyopt rsa_keygen_bits:2048
# openssl rsa -in keys/dkim_private.pem -pubout -outform der 2>/dev/null | openssl base64 -A > keys/dkim_public.pem 

# ------------------------------
# Certificate Path: /etc/letsencrypt/live/plane.email/fullchain.pem
# Private Key Path: /etc/letsencrypt/live/plane.email/privkey.pem

# openssl rsa -in /etc/letsencrypt/live/plane.email/privkey.pem -pubout -outform der 2>/dev/null | openssl base64 -A > keys/key.pub 
