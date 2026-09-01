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

    local dockerServiceStatus
    if command -v jq &> /dev/null; then
        dockerServiceStatus=$($COMPOSE_CMD ls --filter name=plane-airgapped --format=json | jq -r '.[0].Status // empty')
    else
        dockerServiceStatus=$($COMPOSE_CMD ls --filter name=plane-airgapped | grep -o "running" | head -n 1 || true)
    fi

    if [[ "$dockerServiceStatus" == running* ]]; then
        echo "Plane Airgapped is running. Please STOP the Plane Airgapped before restoring data."
        exit 1
    fi

    CURRENT_USER_ID=$(id -u)
    CURRENT_GROUP_ID=$(id -g)

    # if the data folder not exists, create it
    if [ ! -d "$AIRGAPPED_INSTALL_PATH/data" ]; then
        mkdir -p "$AIRGAPPED_INSTALL_PATH/data"
        chown -R $CURRENT_USER_ID:$CURRENT_GROUP_ID "$AIRGAPPED_INSTALL_PATH/data"
    fi

    # Extract all backup tar files
    for BACKUP_FILE in "$BACKUP_FOLDER"/*.tar.gz; do
        if [ -e "$BACKUP_FILE" ]; then
            BASE_FILE_NAME=$(basename "$BACKUP_FILE" ".tar.gz")
            echo "Extracting $BASE_FILE_NAME"
            tar -xzvf "$BACKUP_FILE" -C "$AIRGAPPED_INSTALL_PATH/data/"
            if [ $? -ne 0 ]; then
                echo "Error: Failed to extract $BACKUP_FILE"
                exit 1
            fi
        else
            echo "No .tar.gz files found in the current directory."
            echo ""
            echo "Please provide the path to the backup file."
            echo ""
            echo "Usage: $0 /path/to/backup"
            exit 1
        fi
    done

    DATA_DIR="$AIRGAPPED_INSTALL_PATH/data"

    # Rename extracted directories to match docker-compose volume paths
    # Backup tars: pgdata, redisdata, uploads, rabbitmq_data
    # Docker-compose expects: db, redis, minio/uploads, mq

    if [ -d "$DATA_DIR/pgdata" ]; then
        rm -rf "$DATA_DIR/db"
        mv "$DATA_DIR/pgdata" "$DATA_DIR/db"
        echo "Renamed pgdata -> db"
    fi

    if [ -d "$DATA_DIR/redisdata" ]; then
        rm -rf "$DATA_DIR/redis"
        mv "$DATA_DIR/redisdata" "$DATA_DIR/redis"
        echo "Renamed redisdata -> redis"
    fi

    if [ -d "$DATA_DIR/uploads" ]; then
        mkdir -p "$DATA_DIR/minio"
        rm -rf "$DATA_DIR/minio/uploads"
        mv "$DATA_DIR/uploads" "$DATA_DIR/minio/uploads"
        echo "Renamed uploads -> minio/uploads"
    fi

    if [ -d "$DATA_DIR/rabbitmq_data" ]; then
        rm -rf "$DATA_DIR/mq"
        mv "$DATA_DIR/rabbitmq_data" "$DATA_DIR/mq"
        echo "Renamed rabbitmq_data -> mq"
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
