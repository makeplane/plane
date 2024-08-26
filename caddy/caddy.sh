#!/bin/sh

export SITE_ADDRESS=$(if [ "$SSL" = "true" ]; then echo "${APP_DOMAIN}"; else echo "http://${APP_DOMAIN}"; fi)
exec caddy run --config /etc/caddy/Caddyfile
