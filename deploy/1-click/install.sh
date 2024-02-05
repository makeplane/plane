#!/bin/bash

# Check if the user has sudo access
if [ "$(sudo -n true 2>&1)" != "" ]; then
    SUDO="sudo"
else
    SUDO=""
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
$SUDO sed -i 's/export BRANCH=${BRANCH:-master}/export BRANCH='${BRANCH:-master}'/' /usr/local/bin/plane-app

$SUDO plane-app --help
