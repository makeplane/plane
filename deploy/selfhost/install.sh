#!/bin/bash

BRANCH=master
SCRIPT_DIR=$PWD
PLANE_INSTALL_DIR=$PWD/plane-app

function install(){
    echo 
    echo "Installing on $PLANE_INSTALL_DIR"
    download
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

        sed -e 's@plane-frontend:@plane-frontend-private:@g' \
            -e 's@plane-space:@plane-space-private:@g' \
            -e 's@plane-backend:@plane-backend-private:@g' \
            -e 's@plane-proxy:@plane-proxy-private:@g' \
            -e 's@${APP_RELEASE:-latest}@'"$BRANCH"'@g' \
            $PLANE_INSTALL_DIR/temp.yaml > $PLANE_INSTALL_DIR/docker-compose.yaml

        rm $PLANE_INSTALL_DIR/temp.yaml
    fi
    
    echo ""
    echo "Latest version is now available for you to use"
    echo ""
    echo "In case of Upgrade, your new setting file is availabe as 'variables-upgrade.env'. Please compare and set the required values in '.env 'file."
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
    stopServices

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
