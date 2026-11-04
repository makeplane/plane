#!/bin/sh
export FILE_SIZE_LIMIT="${FILE_SIZE_LIMIT:-5242880}"
exec /usr/local/bin/supervisord -c /etc/supervisor/conf.d/supervisor.conf
