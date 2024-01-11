#!/bin/bash

BRANCH=master
SCRIPT_DIR=$PWD
PLANE_INSTALL_DIR=$PWD/plane-app
ARCH=$(uname -m)
export DOCKERHUB_USER=makeplane
export APP_RELEASE=$BRANCH
export PULL_POLICY=always
NON_AMD_DOCKERHUB_USER=myplane

function buildNonAMD64(){
    DOCKERHUB_USER=$NON_AMD_DOCKERHUB_USER

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

    docker compose -f build.yml build --no-cache 
    # cd $CURR_DIR
    # rm -rf $PLANE_TEMP_CODE_DIR
}
function install(){
    echo 
    echo "Installing Plane.........."

    if [ $ARCH == "amd64" ];
    then
        download
    else
        echo 
	    echo "You are on '${ARCH}' cpu architecture. "
        echo "Since the prebuilt ${ARCH} compatible docker images are not available for, we will be running the docker build on this system. This might take 5-30 min based on your system's hardware configuration. "
        echo 
        echo "Select an option 1 to prceed:"
        echo "   1) Proceed"
        echo "   2) Exit"
        echo 
        read -p "Select Option [1]: " DO_BUILD
        until [[ -z "$DO_BUILD" || "$DO_BUILD" =~ ^[1-2]$ ]]; do
            echo "$DO_BUILD: invalid selection."
            read -p "Select Option [1]: " DO_BUILD
        done
        echo

        if [ "$DO_BUILD" == "1" ] 
        then
            buildNonAMD64
            echo
            echo "Build Completed"
            echo
            download
        elif [ "$DO_BUILD" == "2" ] 
        then
            echo "Install Action cancelled by you."
        else
            echo "INVALID ACTION SUPPLIED"
        fi
    fi
}
function download(){
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
    
    echo ""
    echo "Latest version is now available for you to use"
    echo ""
    echo "In case of Upgrade, your new setting file is available as 'variables-upgrade.env'. Please compare and set the required values in '.env 'file."
    echo ""

}
function startServices(){
    cd $PLANE_INSTALL_DIR
    if [ $ARCH == "amd64" ];
    then
        PULL_POLICY=always
        docker compose up -d --quiet-pull
    else 
        DOCKERHUB_USER=$NON_AMD_DOCKERHUB_USER
        PULL_POLICY=never
        docker compose up -d --quiet-pull
    fi
    cd $SCRIPT_DIR
}
function stopServices(){
    cd $PLANE_INSTALL_DIR

    if [ $ARCH != "amd64" ];
    then
        DOCKERHUB_USER=$NON_AMD_DOCKERHUB_USER
    fi
    docker compose down
    cd $SCRIPT_DIR
}
function restartServices(){
    cd $PLANE_INSTALL_DIR
    if [ $ARCH != "amd64" ];
    then
        DOCKERHUB_USER=$NON_AMD_DOCKERHUB_USER
    fi
    docker compose restart
    cd $SCRIPT_DIR
}
function upgrade(){
    echo "***** STOPPING SERVICES ****"
    stopServices

    echo
    echo "***** DOWNLOADING LATEST VERSION ****"
    download

    echo "***** PLEASE VALIDATE AND START SERVICES ****"

}
function askForAction(){
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

if [ "$BRANCH" != "master" ];
then
    PLANE_INSTALL_DIR=$PWD/plane-app-$(echo $BRANCH | sed -r 's@(\/|" "|\.)@-@g')
fi
mkdir -p $PLANE_INSTALL_DIR/archive

askForAction
