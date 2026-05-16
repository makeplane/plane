#!/bin/sh
set -e

if [ -z "$MAIL_DOMAIN" ]; then
    echo "ERROR: MAIL_DOMAIN env var is not set." >&2
    exit 1
fi

# Render dovecot.conf, keeping Dovecot's own $variable refs intact.
envsubst '${MAIL_DOMAIN}' < /etc/dovecot/dovecot.conf.tmpl > /etc/dovecot/dovecot.conf

# Make sure the vmail vhost root exists with the right ownership.
mkdir -p /var/mail/vhosts
chown -R vmail:vmail /var/mail/vhosts

exec dovecot -F
