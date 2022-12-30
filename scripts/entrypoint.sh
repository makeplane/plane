#!/usr/bin/env bash

set -e

init_env_file() {
  CONF_PATH="/plane-stacks/configuration"
  ENV_PATH="$CONF_PATH/docker.env"
  SCRIPTS_PATH="/opt/plane/scripts"

  # Build an env file with current env variables. We single-quote the values, as well as escaping any single-quote characters.
  printenv | grep -E '^PLANE_|^DATABASE_|^REDIS_|^NEXT_' | sed "s/'/'\"'\"'/; s/=/='/; s/$/'/" > "$SCRIPTS_PATH/pre-define.env"

  echo "Initialize .env file"
  if ! [[ -e "$ENV_PATH" ]]; then
    # Generate new docker.env file when initializing container for first time or in Heroku which does not have persistent volume
    echo "Generating default configuration file"
    mkdir -p "$CONF_PATH"

    bash "$SCRIPTS_PATH/docker.env.sh" > "$ENV_PATH"
  fi


  echo "Load environment configuration entrypoint"
  set -o allexport
  . "$ENV_PATH"
  . "$SCRIPTS_PATH/pre-define.env"
  set +o allexport
}


# Main Section
init_env_file

if [[ "${DYNO}" ]]; then
    export HOSTNAME="heroku_dyno"
fi

# Handle CMD command
exec "$@"