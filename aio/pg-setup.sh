#!/bin/bash

if [ "$BUILD_TYPE" == "full" ]; then 

    export PGHOST=localhost

    sudo -u postgres "/usr/lib/postgresql/${POSTGRES_VERSION}/bin/pg_ctl" -D /var/lib/postgresql/data start
    sudo -u postgres "/usr/lib/postgresql/${POSTGRES_VERSION}/bin/psql" --command "CREATE USER $POSTGRES_USER WITH SUPERUSER PASSWORD '$POSTGRES_PASSWORD';" && \
    sudo -u postgres "/usr/lib/postgresql/${POSTGRES_VERSION}/bin/createdb" -O "$POSTGRES_USER" "$POSTGRES_DB" && \
    sudo -u postgres "/usr/lib/postgresql/${POSTGRES_VERSION}/bin/psql" --command "GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;" && \
    sudo -u postgres "/usr/lib/postgresql/${POSTGRES_VERSION}/bin/pg_ctl" -D /var/lib/postgresql/data stop

fi

