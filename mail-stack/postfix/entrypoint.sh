#!/bin/sh
set -e

if [ -z "$MAIL_DOMAIN" ]; then
    echo "ERROR: MAIL_DOMAIN env var is not set." >&2
    exit 1
fi

# Render templates. envsubst is restricted to '${MAIL_DOMAIN}' so that Postfix
# variable references like $mydomain, $myhostname stay intact.
for f in main.cf master.cf virtual-mailbox-domains virtual-mailbox-users virtual-aliases; do
    envsubst '${MAIL_DOMAIN}' < "/etc/postfix/$f.tmpl" > "/etc/postfix/$f"
done

postmap /etc/postfix/virtual-mailbox-domains
postmap /etc/postfix/virtual-mailbox-users
postmap /etc/postfix/virtual-aliases

exec postfix start-fg
