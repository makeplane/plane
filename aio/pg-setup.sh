#!/bin/bash


# Variables
set -o allexport
source plane.env set
set +o allexport

export PGHOST=localhost

sudo -u postgres "/usr/lib/postgresql/${POSTGRES_VERSION}/bin/pg_ctl" -D /var/lib/postgresql/data start
sudo -u postgres "/usr/lib/postgresql/${POSTGRES_VERSION}/bin/psql" --command "CREATE USER $POSTGRES_USER WITH SUPERUSER PASSWORD '$POSTGRES_PASSWORD';" && \
sudo -u postgres "/usr/lib/postgresql/${POSTGRES_VERSION}/bin/createdb" -O "$POSTGRES_USER" "$POSTGRES_DB" && \
sudo -u postgres "/usr/lib/postgresql/${POSTGRES_VERSION}/bin/pg_ctl" -D /var/lib/postgresql/data stop
