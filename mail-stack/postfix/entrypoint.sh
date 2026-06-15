#!/bin/sh
set -e

if [ -z "$MAIL_DOMAIN" ]; then
    echo "ERROR: MAIL_DOMAIN env var is not set." >&2
    exit 1
fi

: "${POSTGRES_HOST:=plane-db}"
export POSTGRES_HOST

# Resolve the TLS certificate. In production Caddy issues a Let's Encrypt cert
# for mail.${MAIL_DOMAIN} and shares it read-only via the caddy-data volume. In
# local mode (no public domain / no cert yet) we fall back to a self-signed cert
# so Postfix can still start and offer STARTTLS on localhost.
LE_DIR="/etc/letsencrypt-caddy/caddy/certificates/acme-v02.api.letsencrypt.org-directory/mail.${MAIL_DOMAIN}"
LE_CERT="${LE_DIR}/mail.${MAIL_DOMAIN}.crt"
LE_KEY="${LE_DIR}/mail.${MAIL_DOMAIN}.key"

if [ -f "$LE_CERT" ] && [ -f "$LE_KEY" ]; then
    SSL_CERT_PATH="$LE_CERT"
    SSL_KEY_PATH="$LE_KEY"
    echo "postfix: using Caddy/Let's Encrypt certificate for mail.${MAIL_DOMAIN}"
else
    SSL_CERT_PATH="/etc/postfix/ssl/mail.crt"
    SSL_KEY_PATH="/etc/postfix/ssl/mail.key"
    if [ ! -f "$SSL_CERT_PATH" ] || [ ! -f "$SSL_KEY_PATH" ]; then
        echo "postfix: no Caddy certificate found, generating self-signed cert for mail.${MAIL_DOMAIN} (local mode)"
        mkdir -p /etc/postfix/ssl
        openssl req -x509 -newkey rsa:2048 -nodes \
            -keyout "$SSL_KEY_PATH" -out "$SSL_CERT_PATH" \
            -days 3650 -subj "/CN=mail.${MAIL_DOMAIN}" >/dev/null 2>&1
        chmod 600 "$SSL_KEY_PATH"
    fi
fi

# Render main.cf/master.cf. envsubst is restricted to '${MAIL_DOMAIN}' so that
# Postfix variable references like $mydomain, $myhostname stay intact; the
# resolved certificate paths are substituted afterwards.
for f in main.cf master.cf; do
    envsubst '${MAIL_DOMAIN}' < "/etc/postfix/$f.tmpl" > "/etc/postfix/$f"
done
sed -i "s|__SSL_CERT_PATH__|${SSL_CERT_PATH}|g; s|__SSL_KEY_PATH__|${SSL_KEY_PATH}|g" /etc/postfix/main.cf

# Render the pgsql map configs (they contain the DB password) with restricted
# perms. Mailboxes/domains/aliases now live in plane-db, managed from god-mode.
for f in pgsql-virtual-mailbox-domains pgsql-virtual-mailbox-maps pgsql-virtual-alias-maps; do
    envsubst '${POSTGRES_HOST} ${POSTGRES_DB} ${POSTGRES_USER} ${POSTGRES_PASSWORD}' \
        < "/etc/postfix/$f.cf.tmpl" > "/etc/postfix/$f.cf"
    chmod 600 "/etc/postfix/$f.cf"
done

exec postfix start-fg
