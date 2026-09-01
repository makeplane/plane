#!/bin/bash
set -euo pipefail

function print_header() {
clear

cat <<"EOF"
##+.    ##+    .##-
 ######+.######-.######.
 #######.   -###    +#####+.
 #######.      +       +######.
 #######.              .#######
 #######.              .#######
  #######       +      .#######
    .+#####+    ###-   .#######
        .######.-#####+.+######
            -##.    -##    .+##
EOF
}

# Replace $2 (dest) with $1 (src), keeping the old dest recoverable until the
# swap succeeds. Rolls the old data back if the move fails.
function replaceDir() {
    local src="$1" dest="$2" label="$3"
    local old="${dest}.old.$$"

    if [ -d "$dest" ]; then
        mv "$dest" "$old"
        # Restore the old data if we are interrupted mid-swap
        trap "mv \"$old\" \"$dest\" 2>/dev/null || true; exit 1" INT TERM HUP
    fi

    if mv "$src" "$dest"; then
        trap - INT TERM HUP
        rm -rf "$old"
        echo "Renamed $label"
    else
        trap - INT TERM HUP
        echo "Error: Failed to install $label; restoring previous data"
        if [ -d "$old" ]; then
            mv "$old" "$dest"
        fi
        exit 1
    fi
}

function restoreData() {

    echo ""
    echo "****************************************************"
    echo "We are about to restore your data from the backup files."
    echo "****************************************************"
    echo ""

    # set the backup folder path
    BACKUP_FOLDER="${1:-}"

    if [ -z "$BACKUP_FOLDER" ]; then
        BACKUP_FOLDER="$PWD/backup"
        read -p "Enter the backup folder path [$BACKUP_FOLDER]: " BACKUP_FOLDER
        if [ -z "$BACKUP_FOLDER" ]; then
            BACKUP_FOLDER="$PWD/backup"
        fi
    fi

    # check if the backup folder exists
    if [ ! -d "$BACKUP_FOLDER" ]; then
        echo "Error: Backup folder not found at $BACKUP_FOLDER"
        exit 1
    fi

    # check if there are any .tar.gz files in the backup folder
    if ! ls "$BACKUP_FOLDER"/*.tar.gz 1> /dev/null 2>&1; then
        echo "Error: Backup folder does not contain .tar.gz files"
        echo ""
        echo "Usage: $0 /path/to/backup"
        exit 1
    fi

    echo ""
    echo "Using backup folder: $BACKUP_FOLDER"
    echo ""

    # ask for current install path
    AIRGAPPED_INSTALL_PATH="$HOME/planeairgapped"
    read -p "Enter the airgapped instance install path [$AIRGAPPED_INSTALL_PATH]: " AIRGAPPED_INSTALL_PATH
    if [ -z "$AIRGAPPED_INSTALL_PATH" ]; then
        AIRGAPPED_INSTALL_PATH="$HOME/planeairgapped"
    fi

    # check if the airgapped instance install path exists
    if [ ! -d "$AIRGAPPED_INSTALL_PATH" ]; then
        echo "Error: Airgapped instance install path not found at $AIRGAPPED_INSTALL_PATH"
        exit 1
    fi

    echo ""
    echo "Using airgapped instance install path: $AIRGAPPED_INSTALL_PATH"
    echo ""

    # check if the docker-compose.yaml exists
    if [ ! -f "$AIRGAPPED_INSTALL_PATH/docker-compose.yml" ]; then
        echo "Error: docker-compose.yml not found at $AIRGAPPED_INSTALL_PATH/docker-compose.yml"
        exit 1
    fi

    local dockerServiceStatus compose_output
    if command -v jq &> /dev/null; then
        if ! compose_output=$($COMPOSE_CMD ls --filter name=plane-airgapped --format=json); then
            echo "Error: Failed to query Docker Compose services"
            exit 1
        fi
        dockerServiceStatus=$(printf '%s\n' "$compose_output" | jq -r '.[0].Status // empty')
    else
        if ! compose_output=$($COMPOSE_CMD ls --filter name=plane-airgapped); then
            echo "Error: Failed to query Docker Compose services"
            exit 1
        fi
        dockerServiceStatus=$(printf '%s\n' "$compose_output" | grep -o "running" | head -n 1 || true)
    fi

    if [[ "$dockerServiceStatus" == running* ]]; then
        echo "Plane Airgapped is running. Please STOP the Plane Airgapped before restoring data."
        exit 1
    fi

    CURRENT_USER_ID=$(id -u)
    CURRENT_GROUP_ID=$(id -g)

    DATA_DIR="$AIRGAPPED_INSTALL_PATH/data"

    # if the data folder not exists, create it
    if [ ! -d "$DATA_DIR" ]; then
        mkdir -p "$DATA_DIR"
        chown -R $CURRENT_USER_ID:$CURRENT_GROUP_ID "$DATA_DIR"
    fi

    # Remove stale extracted source directories from a previous run so tar
    # does not merge new files into old data
    rm -rf "$DATA_DIR/pgdata" "$DATA_DIR/redisdata" "$DATA_DIR/uploads" "$DATA_DIR/rabbitmq_data"

    # Extract all backup tar files
    for BACKUP_FILE in "$BACKUP_FOLDER"/*.tar.gz; do
        BASE_FILE_NAME=$(basename "$BACKUP_FILE" ".tar.gz")
        echo "Extracting $BASE_FILE_NAME"
        if ! tar -xzvf "$BACKUP_FILE" -C "$DATA_DIR/"; then
            echo "Error: Failed to extract $BACKUP_FILE"
            exit 1
        fi
    done

    # Rename extracted directories to match docker-compose volume paths
    # Backup tars: pgdata, redisdata, uploads, rabbitmq_data
    # Docker-compose expects: db, redis, minio/uploads, mq

    if [ -d "$DATA_DIR/pgdata" ]; then
        replaceDir "$DATA_DIR/pgdata" "$DATA_DIR/db" "pgdata -> db"
    fi

    if [ -d "$DATA_DIR/redisdata" ]; then
        replaceDir "$DATA_DIR/redisdata" "$DATA_DIR/redis" "redisdata -> redis"
    fi

    if [ -d "$DATA_DIR/uploads" ]; then
        mkdir -p "$DATA_DIR/minio"
        replaceDir "$DATA_DIR/uploads" "$DATA_DIR/minio/uploads" "uploads -> minio/uploads"
    fi

    if [ -d "$DATA_DIR/rabbitmq_data" ]; then
        replaceDir "$DATA_DIR/rabbitmq_data" "$DATA_DIR/mq" "rabbitmq_data -> mq"
    fi

    # Fix ownership on all restored data
    chown -R $CURRENT_USER_ID:$CURRENT_GROUP_ID "$DATA_DIR"

    echo ""
    echo "Restore completed successfully."
    echo ""
}

# if docker-compose is installed
if command -v docker-compose &> /dev/null
then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

print_header
restoreData "$@"
