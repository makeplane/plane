#!/bin/bash

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

function restoreSingleVolume() {
    selectedVolume=$1
    backupFolder=$2
    restoreFile=$3

    docker volume rm "$selectedVolume" > /dev/null 2>&1
    docker volume create "$selectedVolume" > /dev/null 2>&1

    docker run --rm \
        -e TAR_NAME="$restoreFile" \
        -v "$selectedVolume":"/vol" \
        -v "$backupFolder":/backup \
        busybox sh -c 'mkdir -p /restore && tar -xzf "/backup/${TAR_NAME}.tar.gz" -C /restore && mv /restore/${TAR_NAME}/* /vol'
}

function restoreData() {
    print_header
    local BACKUP_FOLDER=${1:-$PWD}

    local dockerServiceStatus=$($COMPOSE_CMD ls --filter name=plane-app --format=json | jq -r .[0].Status)
    local dockerServicePrefix="running"

    if [[ $dockerServiceStatus == $dockerServicePrefix* ]]; then
        echo "Plane App is running. Please STOP the Plane App before restoring data."
        exit 1
    fi

    local volumes=$(docker volume ls -f "name=plane-app" --format "{{.Name}}" | grep -E "_pgdata|_redisdata|_uploads")
    # Check if there are any matching volumes
    if [ -z "$volumes" ]; then
        echo ".....No volumes found starting with 'plane-app'"
        exit 1
    fi

    for BACKUP_FILE in $BACKUP_FOLDER/*.tar.gz; do
        if [ -e "$BACKUP_FILE" ]; then
            
            local restoreFileName=$(basename "$BACKUP_FILE")
            restoreFileName="${restoreFileName%.tar.gz}"

            local restoreVolName="plane-app_${restoreFileName}"
            echo "Found $BACKUP_FILE"

            local docVol=$(docker volume ls -f "name=$restoreVolName" --format "{{.Name}}" | grep -E "_pgdata|_redisdata|_uploads")

            if [ -z "$docVol" ]; then
                echo "Skipping: No volume found with name $restoreVolName"
            else
                echo ".....Restoring $docVol"
                restoreSingleVolume "$docVol" "$BACKUP_FOLDER" "$restoreFileName"
            fi
        else
            echo "No .tar.gz files found in the current directory."
            echo ""
            echo "Please provide the path to the backup file."
            echo ""
            echo "Usage: ./restore.sh /path/to/backup"
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

restoreData $@