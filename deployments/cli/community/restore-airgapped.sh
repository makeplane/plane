#!/bin/bash
+set -euo pipefail

function print_header() {
clear

cat <<"EOF"
--------------------------------------------
 ____  _                          ///////// 
|  _ \| | __ _ _ __   ___         ///////// 
| |_) | |/ _` | '_ \ / _ \   /////    ///// 
|  __/| | (_| | | | |  __/   /////    ///// 
|_|   |_|\__,_|_| |_|\___|        ////      
                                  ////      
--------------------------------------------
Project management tool from the future
--------------------------------------------
EOF
}

function restoreData() {

    echo ""
    echo "****************************************************"
    echo "We are about to restore your data from the backup files."
    echo "****************************************************"
    echo ""

    # set the backup folder path
    BACKUP_FOLDER=${1}

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
        dockerServiceStatus=$($COMPOSE_CMD ls --filter name=plane-airgapped --format=json | jq -r .[0].Status)
    else
        dockerServiceStatus=$($COMPOSE_CMD ls --filter name=plane-airgapped | grep -o "running" | head -n 1)
    fi

    if [[ $dockerServiceStatus == "running" ]]; then
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

    for BACKUP_FILE in "$BACKUP_FOLDER/*.tar.gz"; do
        if [ -e "$BACKUP_FILE" ]; then

            # get the basefilename without the extension
            BASE_FILE_NAME=$(basename "$BACKUP_FILE" ".tar.gz")

            # extract the restoreFile to the airgapped instance install path
            echo "Restoring $BASE_FILE_NAME"
            rm -rf "$AIRGAPPED_INSTALL_PATH/data/$BASE_FILE_NAME" || true
            
            tar -xvzf "$BACKUP_FILE" -C "$AIRGAPPED_INSTALL_PATH/data/"
            if [ $? -ne 0 ]; then
                echo "Error: Failed to extract $BACKUP_FILE"
                exit 1
            fi
            chown -R $CURRENT_USER_ID:$CURRENT_GROUP_ID "$AIRGAPPED_INSTALL_PATH/data/$BASE_FILE_NAME"
            if [ $? -ne 0 ]; then
                echo "Error: Failed to change ownership of $AIRGAPPED_INSTALL_PATH/data/$BASE_FILE_NAME"
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
