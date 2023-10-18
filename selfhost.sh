#!/bin/bash

BRANCH=${BRANCH:-master}
SCRIPT_DIR=$PWD
PLANE_INSTALL_DIR=$PWD/plane-app
mkdir -p $PLANE_INSTALL_DIR/archive

function install(){
    echo 
    echo "Installing on $PLANE_INSTALL_DIR"
    download
}
function download(){
    cd $SCRIPT_DIR
    TS=$(date +%s)
    if [ -e docker-compose.yaml ]
    then
        mv $PLANE_INSTALL_DIR/docker-compose.yaml $PLANE_INSTALL_DIR/archive/$TS.docker-compose.yaml
    fi
    if [ -e .env ]
    then
        cp $PLANE_INSTALL_DIR/.env previous.env
        mv $PLANE_INSTALL_DIR/.env $PLANE_INSTALL_DIR/archive/$TS.env
    fi

    curl -s -o $PLANE_INSTALL_DIR/docker-compose.yaml  https://raw.githubusercontent.com/makeplane/plane/$BRANCH/docker-compose-hub.yml
    curl -s -o $PLANE_INSTALL_DIR/.env https://raw.githubusercontent.com/makeplane/plane/$BRANCH/selfhost.env

    echo ""
    echo "Latest version is now available for you to use"
    echo "With the latest version, latest environment setting file also is available."
    echo "In case of Upgrade, your previous setting file is availabe as 'previous.env'. Please compare and set the correct values to the new file."

    echo ""

}
function startServices(){
    cd $PLANE_INSTALL_DIR
    docker compose up -d
    cd $SCRIPT_DIR
}
function stopServices(){
    cd $PLANE_INSTALL_DIR
    docker compose down
    cd $SCRIPT_DIR
}
function restartServices(){
    cd $PLANE_INSTALL_DIR
    docker compose restart
    cd $SCRIPT_DIR
}
function upgrade(){
    echo "***** STOPPING SERVICES ****"
    stop

    echo
    echo "***** DOWNLOADING LATEST VERSION ****"
    download

    echo "***** PLEASE VALIDATE AND START SERVICES ****"

}
function askForAction(){
    echo
    echo "Select a Action you want to perform:"
    echo "   1) Install"
    echo "   2) Start"
    echo "   3) Stop"
    echo "   4) Restart"
    echo "   5) Upgrade"
    echo 
    read -p "Action [2]: " ACTION
    until [[ -z "$ACTION" || "$ACTION" =~ ^[1-5]$ ]]; do
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
    elif [ "$ACTION" == "3" ] 
    then
        stopServices
    elif [ "$ACTION" == "4" ] 
    then
        restartServices
    elif [ "$ACTION" == "5" ] 
    then
        upgrade
        askForAction
    else
        echo "INVALID ACTION SUPPLIED"
    fi
}

askForAction
