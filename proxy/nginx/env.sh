#!/bin/sh

export dollar="$"
export http_upgrade="http_upgrade"
export scheme="scheme"
envsubst < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
exec nginx -g 'daemon off;'
