#!/bin/bash

BRANCH=master
SCRIPT_DIR=$PWD
PLANE_INSTALL_DIR=$PWD/plane-app
export APP_RELEASE=$BRANCH
export DOCKERHUB_USER=makeplane
export PULL_POLICY=always
USE_GLOBAL_IMAGES=1

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

function buildLocalImage() {
    if [ "$1" == "--force-build" ]; then
        DO_BUILD="1"
    elif [ "$1" == "--skip-build" ]; then
        DO_BUILD="2"
    else 
        printf "\n" >&2
        printf "${YELLOW}You are on ${ARCH} cpu architecture. ${NC}\n" >&2
        printf "${YELLOW}Since the prebuilt ${ARCH} compatible docker images are not available for, we will be running the docker build on this system. ${NC} \n" >&2
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
            APP_RELEASE=latest
        fi

        docker compose -f build.yml build --no-cache  >&2
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

    if [ -f "$PLANE_INSTALL_DIR/.env" ];
    then
        cp $PLANE_INSTALL_DIR/.env $PLANE_INSTALL_DIR/archive/$TS.env
    else
        mv $PLANE_INSTALL_DIR/variables-upgrade.env $PLANE_INSTALL_DIR/.env
    fi

    if [ "$BRANCH" != "master" ];
    then
        cp $PLANE_INSTALL_DIR/docker-compose.yaml $PLANE_INSTALL_DIR/temp.yaml 
        sed -e 's@${APP_RELEASE:-latest}@'"$BRANCH"'@g' \
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
        docker compose -f $PLANE_INSTALL_DIR/docker-compose.yaml pull
    fi
    
    echo ""
    echo "Latest version is now available for you to use"
    echo ""
    echo "In case of Upgrade, your new setting file is availabe as 'variables-upgrade.env'. Please compare and set the required values in '.env 'file."
    echo ""

}
function startServices() {
    cd $PLANE_INSTALL_DIR
    docker compose up -d --quiet-pull
    cd $SCRIPT_DIR
}
function stopServices() {
    cd $PLANE_INSTALL_DIR
    docker compose down
    cd $SCRIPT_DIR
}
function restartServices() {
    cd $PLANE_INSTALL_DIR
    docker compose restart
    cd $SCRIPT_DIR
}
function upgrade() {
    echo "***** STOPPING SERVICES ****"
    stopServices

    echo
    echo "***** DOWNLOADING LATEST VERSION ****"
    download

    echo "***** PLEASE VALIDATE AND START SERVICES ****"

}
function askForAction() {
    echo
    echo "Select a Action you want to perform:"
    echo "   1) Install (${ARCH})"
    echo "   2) Start"
    echo "   3) Stop"
    echo "   4) Restart"
    echo "   5) Upgrade"
    echo "   6) Exit"
    echo 
    read -p "Action [2]: " ACTION
    until [[ -z "$ACTION" || "$ACTION" =~ ^[1-6]$ ]]; do
        echo "$ACTION: invalid selection."
        read -p "Action [2]: " ACTION
    done
    echo


    if [ "$ACTION" == "1" ]
    then
        install
        askForAction
    elif [ "$ACTION" == "2" ] || [ "$ACTION" == "" ]
    then
        startServices
        askForAction
    elif [ "$ACTION" == "3" ] 
    then
        stopServices
        askForAction
    elif [ "$ACTION" == "4" ] 
    then
        restartServices
        askForAction
    elif [ "$ACTION" == "5" ] 
    then
        upgrade
        askForAction
    elif [ "$ACTION" == "6" ] 
    then
        exit 0
    else
        echo "INVALID ACTION SUPPLIED"
    fi
}

# CPU ARCHITECHTURE BASED SETTINGS
ARCH=$(uname -m)
if [ $ARCH == "amd64" ] || [ $ARCH == "x86_64" ];
then
    USE_GLOBAL_IMAGES=1
    DOCKERHUB_USER=makeplane
    PULL_POLICY=always
else
    USE_GLOBAL_IMAGES=0
    DOCKERHUB_USER=myplane
    PULL_POLICY=never
fi

# REMOVE SPECIAL CHARACTERS FROM BRANCH NAME
if [ "$BRANCH" != "master" ];
then
    PLANE_INSTALL_DIR=$PWD/plane-app-$(echo $BRANCH | sed -r 's@(\/|" "|\.)@-@g')
fi
mkdir -p $PLANE_INSTALL_DIR/archive

askForAction
