#!/bin/sh

if [ "$APP_DOMAIN" == "localhost" ]; then
    export SITE_ADDRESS=":${LISTEN_HTTP_PORT}"
elif [ "$SSL" == "true" ]; then
    export SITE_ADDRESS="${APP_DOMAIN}:${LISTEN_HTTPS_PORT}"
else
    export SITE_ADDRESS="http://${APP_DOMAIN}:${LISTEN_HTTP_PORT}"
fi

exec caddy run --config /etc/caddy/Caddyfile