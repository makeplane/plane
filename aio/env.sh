#!/bin/bash

set -o allexport
source /app/plane.env set
set +o allexport

export dollar="$"
export http_upgrade="http_upgrade"
export scheme="scheme"
envsubst < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
exec nginx -g 'daemon off;'
