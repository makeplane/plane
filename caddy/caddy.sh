#!/bin/sh

if [ "$APP_DOMAIN" == "localhost" ]; then
    export SITE_ADDRESS=":${LISTEN_HTTP_PORT}"
elif [ "$SSL" == "true" ]; then
    export SITE_ADDRESS="${APP_DOMAIN}:${LISTEN_HTTPS_PORT}"
else
    export SITE_ADDRESS="http://${APP_DOMAIN}:${LISTEN_HTTP_PORT}"
fi

# Note: SITE_ADDRESS is set for the Caddy process but won't persist in new shell sessions
# when you exec into the container later. This is normal Docker behavior.

exec caddy run --config /etc/caddy/Caddyfile