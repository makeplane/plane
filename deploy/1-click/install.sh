#!/bin/bash

# Check if the user has sudo access
if [ "$(id -u)" -eq 0 ]; then
    SUDO=""
else
    SUDO="sudo"
fi


if command -v curl &> /dev/null; then
    $SUDO curl -sSL \
        -o /usr/local/bin/plane-app \
        https://raw.githubusercontent.com/makeplane/plane/${BRANCH:-master}/deploy/1-click/plane-app?token=$(date +%s)
else 
    $SUDO wget -q \
        -O /usr/local/bin/plane-app \
        https://raw.githubusercontent.com/makeplane/plane/${BRANCH:-master}/deploy/1-click/plane-app?token=$(date +%s)
fi

$SUDO chmod +x /usr/local/bin/plane-app
$SUDO sed -i 's/export DEPLOY_BRANCH=${BRANCH:-master}/export DEPLOY_BRANCH='${BRANCH:-master}'/' /usr/local/bin/plane-app

$SUDO plane-app --help
