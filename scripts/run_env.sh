#!/bin/bash

ENV_PATH="/plane-stacks/configuration/docker.env"
PRE_DEFINED_ENV_PATH="/opt/plane/scripts/pre-define.env"
echo 'Loading environment variables'
set -o allexport
. "$ENV_PATH"
. "$PRE_DEFINED_ENV_PATH"
set +o allexport


exec "$@"