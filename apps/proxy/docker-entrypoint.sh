#!/bin/sh
set -e

mkdir -p /etc/caddy/conf.d

# Clean any previously enabled add-on snippets so this is idempotent across
# restarts.
rm -f /etc/caddy/conf.d/mail.caddy /etc/caddy/conf.d/git.caddy

# Enable mail stack only when MAIL_DOMAIN is provided; otherwise Caddy would
# parse subjects like "mail." and "webmail." and reject the config.
if [ -n "${MAIL_DOMAIN}" ]; then
    cp /etc/caddy/Caddyfile.mail /etc/caddy/conf.d/mail.caddy
fi

# Enable forgejo git hosting only when GIT_DOMAIN is provided.
if [ -n "${GIT_DOMAIN}" ]; then
    cp /etc/caddy/Caddyfile.git /etc/caddy/conf.d/git.caddy
fi

# Hand off to the upstream caddy entrypoint with the standard args.
exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
