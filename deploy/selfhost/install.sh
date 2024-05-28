#!/bin/bash

BRANCH=master
SCRIPT_DIR=$PWD
SERVICE_FOLDER=plane-app
PLANE_INSTALL_DIR=$PWD/$SERVICE_FOLDER
export APP_RELEASE=$BRANCH
export DOCKERHUB_USER=makeplane
export PULL_POLICY=always
USE_GLOBAL_IMAGES=1

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

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

function buildLocalImage() {
    if [ "$1" == "--force-build" ]; then
        DO_BUILD="1"
    elif [ "$1" == "--skip-build" ]; then
        DO_BUILD="2"
    else 
        printf "\n" >&2
        printf "${YELLOW}You are on ${CPU_ARCH} cpu architecture. ${NC}\n" >&2
        printf "${YELLOW}Since the prebuilt ${CPU_ARCH} compatible docker images are not available for, we will be running the docker build on this system. ${NC} \n" >&2
        printf "${YELLOW}This might take ${YELLOW}5-30 min based on your system's hardware configuration. \n ${NC} \n" >&2
        printf "\n" >&2
        printf "${GREEN}Select an option to proceed: ${NC}\n" >&2
        printf "   1) Build Fresh Images \n" >&2
        printf "   2) Skip Building Images \n" >&2
        printf "   3) Exit \n" >&2
        printf "\n" >&2
        read -p "Select Option [1]: " DO_BUILD
        until [[ -z "$DO_BUILD" || "$DO_BUILD" =~ ^[1-3]$ ]]; do
            echo "$DO_BUILD: invalid selection." >&2
            read -p "Select Option [1]: " DO_BUILD
        done
        echo "" >&2
    fi

    if [ "$DO_BUILD" == "1" ] || [ "$DO_BUILD" == "" ];
    then
        REPO=https://github.com/makeplane/plane.git
        CURR_DIR=$PWD
        PLANE_TEMP_CODE_DIR=$(mktemp -d)
        git clone $REPO $PLANE_TEMP_CODE_DIR  --branch $BRANCH --single-branch

        cp $PLANE_TEMP_CODE_DIR/deploy/selfhost/build.yml $PLANE_TEMP_CODE_DIR/build.yml

        cd $PLANE_TEMP_CODE_DIR
        if [ "$BRANCH" == "master" ];
        then
            export APP_RELEASE=stable
        fi

        /bin/bash -c "$COMPOSE_CMD -f build.yml build --no-cache"  >&2
        # cd $CURR_DIR
        # rm -rf $PLANE_TEMP_CODE_DIR
        echo "build_completed"
    elif [ "$DO_BUILD" == "2" ];
    then
        printf "${YELLOW}Build action skipped by you in lieu of using existing images. ${NC} \n" >&2
        echo "build_skipped"
    elif [ "$DO_BUILD" == "3" ];
    then
        echo "build_exited"
    else
        printf "INVALID OPTION SUPPLIED" >&2
    fi
}
function install() {
    echo "Installing Plane.........."
    download
}
function download() {
    cd $SCRIPT_DIR
    TS=$(date +%s)
    if [ -f "$PLANE_INSTALL_DIR/docker-compose.yaml" ]
    then
        mv $PLANE_INSTALL_DIR/docker-compose.yaml $PLANE_INSTALL_DIR/archive/$TS.docker-compose.yaml
    fi

    curl -H 'Cache-Control: no-cache, no-store' -s -o $PLANE_INSTALL_DIR/docker-compose.yaml  https://raw.githubusercontent.com/makeplane/plane/$BRANCH/deploy/selfhost/docker-compose.yml?$(date +%s)
    curl -H 'Cache-Control: no-cache, no-store' -s -o $PLANE_INSTALL_DIR/variables-upgrade.env https://raw.githubusercontent.com/makeplane/plane/$BRANCH/deploy/selfhost/variables.env?$(date +%s)

    if [ -f "$DOCKER_ENV_PATH" ];
    then
        cp $DOCKER_ENV_PATH $PLANE_INSTALL_DIR/archive/$TS.env
    else
        mv $PLANE_INSTALL_DIR/variables-upgrade.env $DOCKER_ENV_PATH
    fi

    if [ "$BRANCH" != "master" ];
    then
        cp $PLANE_INSTALL_DIR/docker-compose.yaml $PLANE_INSTALL_DIR/temp.yaml 
        sed -e 's@${APP_RELEASE:-stable}@'"$BRANCH"'@g' \
            $PLANE_INSTALL_DIR/temp.yaml > $PLANE_INSTALL_DIR/docker-compose.yaml

        rm $PLANE_INSTALL_DIR/temp.yaml
    fi

    if [ $USE_GLOBAL_IMAGES == 0 ]; then
        local res=$(buildLocalImage)
        # echo $res

        if [ "$res" == "build_exited" ];
        then
            echo
            echo "Install action cancelled by you. Exiting now."
            echo
            exit 0
        fi
    else
        /bin/bash -c "$COMPOSE_CMD -f $DOCKER_FILE_PATH --env-file=$DOCKER_ENV_PATH pull"
    fi
    
    echo ""
    echo "Most recent Stable version is now available for you to use"
    echo ""
    echo "In case of Upgrade, your new setting file is availabe as 'variables-upgrade.env'. Please compare and set the required values in 'plane.env 'file."
    echo ""

}
function startServices() {
    /bin/bash -c "$COMPOSE_CMD -f $DOCKER_FILE_PATH --env-file=$DOCKER_ENV_PATH up -d --quiet-pull"

    local migrator_container_id=$(docker container ls -aq -f "name=$SERVICE_FOLDER-migrator")
    if [ -n "$migrator_container_id" ]; then
        local idx=0
        while docker inspect --format='{{.State.Status}}' $migrator_container_id | grep -q "running"; do
            local message=">> Waiting for Data Migration to finish"
            local dots=$(printf '%*s' $idx | tr ' ' '.')
            echo -ne "\r$message$dots"
            ((idx++))
            sleep 1
        done
    fi
    printf "\r\033[K"
    echo ""
    echo "   Data Migration completed successfully ✅"

    # if migrator exit status is not 0, show error message and exit
    if [ -n "$migrator_container_id" ]; then
        local migrator_exit_code=$(docker inspect --format='{{.State.ExitCode}}' $migrator_container_id)
        if [ $migrator_exit_code -ne 0 ]; then
            echo "Plane Server failed to start ❌"
            # stopServices
            echo
            echo "Please check the logs for the 'migrator' service and resolve the issue(s)."
            echo "Stop the services by running the command: ./setup.sh stop"
            exit 1
        fi
    fi

    local api_container_id=$(docker container ls -q -f "name=$SERVICE_FOLDER-api")
    local idx2=0
    while ! docker logs $api_container_id 2>&1 | grep -m 1 -i "Application startup complete" | grep -q ".";
    do
        local message=">> Waiting for API Service to Start"
        local dots=$(printf '%*s' $idx2 | tr ' ' '.')    
        echo -ne "\r$message$dots"
        ((idx2++))
        sleep 1
    done
    printf "\r\033[K"
    echo "   API Service started successfully ✅"
    source "${DOCKER_ENV_PATH}"
    echo "   Plane Server started successfully ✅"
    echo ""
    echo "   You can access the application at $WEB_URL"
    echo ""

}
function stopServices() {
    /bin/bash -c "$COMPOSE_CMD -f $DOCKER_FILE_PATH --env-file=$DOCKER_ENV_PATH down"
}
function restartServices() {
    stopServices
    startServices
}
function upgrade() {
    echo "***** STOPPING SERVICES ****"
    stopServices

    echo
    echo "***** DOWNLOADING STABLE VERSION ****"
    download

    echo "***** PLEASE VALIDATE AND START SERVICES ****"
}
function viewSpecificLogs(){
    local SERVICE_NAME=$1

    if /bin/bash -c "$COMPOSE_CMD -f $DOCKER_FILE_PATH ps | grep -q '$SERVICE_NAME'"; then
        echo "Service '$SERVICE_NAME' is running."
    else
        echo "Service '$SERVICE_NAME' is not running."
    fi

    /bin/bash -c "$COMPOSE_CMD -f $DOCKER_FILE_PATH logs -f $SERVICE_NAME"
}
function viewLogs(){
    
    ARG_SERVICE_NAME=$2

    if [ -z "$ARG_SERVICE_NAME" ];
    then
        echo
        echo "Select a Service you want to view the logs for:"
        echo "   1) Web"
        echo "   2) Space"
        echo "   3) API"
        echo "   4) Worker"
        echo "   5) Beat-Worker"
        echo "   6) Migrator"
        echo "   7) Proxy"
        echo "   8) Redis"
        echo "   9) Postgres"
        echo "   10) Minio"
        echo "   0) Back to Main Menu"
        echo 
        read -p "Service: " DOCKER_SERVICE_NAME

        until (( DOCKER_SERVICE_NAME >= 0 && DOCKER_SERVICE_NAME <= 10 )); do
            echo "Invalid selection. Please enter a number between 1 and 11."
            read -p "Service: " DOCKER_SERVICE_NAME
        done

        if [ -z "$DOCKER_SERVICE_NAME" ];
        then
            echo "INVALID SERVICE NAME SUPPLIED"
        else
            case $DOCKER_SERVICE_NAME in
                1) viewSpecificLogs "web";;
                2) viewSpecificLogs "space";;
                3) viewSpecificLogs "api";;
                4) viewSpecificLogs "worker";;
                5) viewSpecificLogs "beat-worker";;
                6) viewSpecificLogs "migrator";;
                7) viewSpecificLogs "proxy";;
                8) viewSpecificLogs "plane-redis";;
                9) viewSpecificLogs "plane-db";;
                10) viewSpecificLogs "plane-minio";;
                0) askForAction;;
                *) echo "INVALID SERVICE NAME SUPPLIED";;
            esac
        fi
    elif [ -n "$ARG_SERVICE_NAME" ];
    then
        ARG_SERVICE_NAME=$(echo "$ARG_SERVICE_NAME" | tr '[:upper:]' '[:lower:]')
        case $ARG_SERVICE_NAME in
            web) viewSpecificLogs "web";;
            space) viewSpecificLogs "space";;
            api) viewSpecificLogs "api";;
            worker) viewSpecificLogs "worker";;
            beat-worker) viewSpecificLogs "beat-worker";;
            migrator) viewSpecificLogs "migrator";;
            proxy) viewSpecificLogs "proxy";;
            redis) viewSpecificLogs "plane-redis";;
            postgres) viewSpecificLogs "plane-db";;
            minio) viewSpecificLogs "plane-minio";;
            *) echo "INVALID SERVICE NAME SUPPLIED";;
        esac
    else
        echo "INVALID SERVICE NAME SUPPLIED"
    fi
}

function backupSingleVolume() {
    backupFolder=$1
    selectedVolume=$2
    # Backup data from Docker volume to the backup folder
    # docker run --rm -v "$selectedVolume":/source -v "$backupFolder":/backup busybox sh -c 'cp -r /source/* /backup/'
    local tobereplaced="plane-app_"
    local replacewith=""

    local svcName="${selectedVolume//$tobereplaced/$replacewith}"

    docker run --rm \
        -e TAR_NAME="$svcName" \
        -v "$selectedVolume":/"$svcName" \
        -v "$backupFolder":/backup \
        busybox sh -c 'tar -czf "/backup/${TAR_NAME}.tar.gz" /${TAR_NAME}'
}

function backupData() {
    local datetime=$(date +"%Y%m%d-%H%M")
    local BACKUP_FOLDER=$PLANE_INSTALL_DIR/backup/$datetime
    mkdir -p "$BACKUP_FOLDER"

    volumes=$(docker volume ls -f "name=plane-app" --format "{{.Name}}" | grep -E "_pgdata|_redisdata|_uploads")
    # Check if there are any matching volumes
    if [ -z "$volumes" ]; then
        echo "No volumes found starting with 'plane-app'"
        exit 1
    fi

    for vol in $volumes; do
        echo "Backing Up $vol"
        backupSingleVolume "$BACKUP_FOLDER" "$vol"
    done

    echo ""
    echo "Backup completed successfully. Backup files are stored in $BACKUP_FOLDER"
    echo ""

}
function askForAction() {
    local DEFAULT_ACTION=$1

    if [ -z "$DEFAULT_ACTION" ];
    then
        echo
        echo "Select a Action you want to perform:"
        echo "   1) Install (${CPU_ARCH})"
        echo "   2) Start"
        echo "   3) Stop"
        echo "   4) Restart"
        echo "   5) Upgrade"
        echo "   6) View Logs"
        echo "   7) Backup Data"
        echo "   8) Exit"
        echo 
        read -p "Action [2]: " ACTION
        until [[ -z "$ACTION" || "$ACTION" =~ ^[1-8]$ ]]; do
            echo "$ACTION: invalid selection."
            read -p "Action [2]: " ACTION
        done

        if [ -z "$ACTION" ];
        then
            ACTION=2
        fi
        echo
    fi

    if [ "$ACTION" == "1" ] || [ "$DEFAULT_ACTION" == "install" ]
    then
        install
        askForAction
    elif [ "$ACTION" == "2" ] || [ "$DEFAULT_ACTION" == "start" ]
    then
        startServices
        # askForAction
    elif [ "$ACTION" == "3" ] || [ "$DEFAULT_ACTION" == "stop" ]
    then
        stopServices
        # askForAction
    elif [ "$ACTION" == "4" ] || [ "$DEFAULT_ACTION" == "restart" ]
    then
        restartServices
        # askForAction
    elif [ "$ACTION" == "5" ]  || [ "$DEFAULT_ACTION" == "upgrade" ]
    then
        upgrade
        askForAction
    elif [ "$ACTION" == "6" ]  || [ "$DEFAULT_ACTION" == "logs" ]
    then
        viewLogs $@
        askForAction
    elif [ "$ACTION" == "7" ]  || [ "$DEFAULT_ACTION" == "backup" ]
    then
        backupData
    elif [ "$ACTION" == "8" ]
    then
        exit 0
    else
        echo "INVALID ACTION SUPPLIED"
    fi
}

# if docker-compose is installed
if command -v docker-compose &> /dev/null
then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

# CPU ARCHITECHTURE BASED SETTINGS
CPU_ARCH=$(uname -m)
if [[ $FORCE_CPU == "amd64" || $CPU_ARCH == "amd64" || $CPU_ARCH == "x86_64" || ( $BRANCH == "master" && ( $CPU_ARCH == "arm64" || $CPU_ARCH == "aarch64" ) ) ]]; 
then
    USE_GLOBAL_IMAGES=1
    DOCKERHUB_USER=makeplane
    PULL_POLICY=always
else
    USE_GLOBAL_IMAGES=0
    DOCKERHUB_USER=myplane
    PULL_POLICY=never
fi

if [ "$BRANCH" == "master" ];
then
    export APP_RELEASE=stable
fi

# REMOVE SPECIAL CHARACTERS FROM BRANCH NAME
if [ "$BRANCH" != "master" ];
then
    SERVICE_FOLDER=plane-app-$(echo $BRANCH | sed -r 's@(\/|" "|\.)@-@g')
    PLANE_INSTALL_DIR=$PWD/$SERVICE_FOLDER
fi
mkdir -p $PLANE_INSTALL_DIR/archive

DOCKER_FILE_PATH=$PLANE_INSTALL_DIR/docker-compose.yaml
DOCKER_ENV_PATH=$PLANE_INSTALL_DIR/plane.env

# BACKWARD COMPATIBILITY
OLD_DOCKER_ENV_PATH=$PLANE_INSTALL_DIR/.env
if [ -f "$OLD_DOCKER_ENV_PATH" ];
then
    mv "$OLD_DOCKER_ENV_PATH" "$DOCKER_ENV_PATH"
    OS_NAME=$(uname)
    if [ "$OS_NAME" == "Darwin" ];
    then
        sed -i '' -e 's@APP_RELEASE=latest@APP_RELEASE=stable@' "$DOCKER_ENV_PATH" 
    else
        sed -i -e 's@APP_RELEASE=latest@APP_RELEASE=stable@' "$DOCKER_ENV_PATH" 
    fi
fi

print_header
askForAction $@
