#!/bin/sh
set -e

if [ -z "$MAIL_DOMAIN" ]; then
    echo "ERROR: MAIL_DOMAIN env var is not set." >&2
    exit 1
fi

: "${POSTGRES_HOST:=plane-db}"
: "${MAIL_MASTER_USER:=master}"
export POSTGRES_HOST

# Resolve the TLS certificate. In production Caddy issues a Let's Encrypt cert
# for mail.${MAIL_DOMAIN} and shares it read-only via the caddy-data volume. In
# local mode (no public domain / no cert yet) we fall back to a self-signed cert
# so Dovecot can still start and serve IMAPS on localhost.
LE_DIR="/etc/letsencrypt-caddy/caddy/certificates/acme-v02.api.letsencrypt.org-directory/mail.${MAIL_DOMAIN}"
LE_CERT="${LE_DIR}/mail.${MAIL_DOMAIN}.crt"
LE_KEY="${LE_DIR}/mail.${MAIL_DOMAIN}.key"

if [ -f "$LE_CERT" ] && [ -f "$LE_KEY" ]; then
    SSL_CERT_PATH="$LE_CERT"
    SSL_KEY_PATH="$LE_KEY"
    echo "dovecot: using Caddy/Let's Encrypt certificate for mail.${MAIL_DOMAIN}"
else
    SSL_CERT_PATH="/etc/dovecot/ssl/mail.crt"
    SSL_KEY_PATH="/etc/dovecot/ssl/mail.key"
    if [ ! -f "$SSL_CERT_PATH" ] || [ ! -f "$SSL_KEY_PATH" ]; then
        echo "dovecot: no Caddy certificate found, generating self-signed cert for mail.${MAIL_DOMAIN} (local mode)"
        mkdir -p /etc/dovecot/ssl
        openssl req -x509 -newkey rsa:2048 -nodes \
            -keyout "$SSL_KEY_PATH" -out "$SSL_CERT_PATH" \
            -days 3650 -subj "/CN=mail.${MAIL_DOMAIN}" >/dev/null 2>&1
        chmod 600 "$SSL_KEY_PATH"
    fi
fi

# Render dovecot.conf (keeping Dovecot's own $variable refs intact), then
# substitute the resolved certificate paths.
envsubst '${MAIL_DOMAIN}' < /etc/dovecot/dovecot.conf.tmpl > /etc/dovecot/dovecot.conf
sed -i "s|__SSL_CERT_PATH__|${SSL_CERT_PATH}|g; s|__SSL_KEY_PATH__|${SSL_KEY_PATH}|g" /etc/dovecot/dovecot.conf

# Render the SQL passdb config (contains the DB password) with restricted perms.
envsubst '${POSTGRES_HOST} ${POSTGRES_DB} ${POSTGRES_USER} ${POSTGRES_PASSWORD}' \
    < /etc/dovecot/dovecot-sql.conf.ext.tmpl > /etc/dovecot/dovecot-sql.conf.ext
chmod 600 /etc/dovecot/dovecot-sql.conf.ext

# Render optional Dovecot master-user credentials. The API logs in as
# "<mailbox>*<MAIL_MASTER_USER>" and never accepts arbitrary mailbox names from
# the client. If MAIL_MASTER_PASSWORD is empty, keep an empty passwd-file so the
# normal mailbox SQL passdb continues to work.
if [ -n "$MAIL_MASTER_PASSWORD" ]; then
    MASTER_HASH="$(doveadm pw -s SHA512-CRYPT -p "$MAIL_MASTER_PASSWORD")"
    printf '%s:%s\n' "$MAIL_MASTER_USER" "$MASTER_HASH" > /etc/dovecot/dovecot-master.passwd
else
    : > /etc/dovecot/dovecot-master.passwd
    echo "dovecot: MAIL_MASTER_PASSWORD is not set; master-user login is disabled"
fi
chmod 600 /etc/dovecot/dovecot-master.passwd

# Make sure the vmail vhost root exists with the right ownership.
mkdir -p /var/mail/vhosts
chown -R vmail:vmail /var/mail/vhosts

exec dovecot -F
