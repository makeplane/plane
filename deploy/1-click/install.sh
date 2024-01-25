#!/bin/bash

if command -v curl &> /dev/null; then
    sudo curl -sSL \
        -o /usr/local/bin/plane-app \
        https://raw.githubusercontent.com/makeplane/plane/${BRANCH:-master}/deploy/1-click/plane-app?token=$(date +%s)
else 
    sudo wget -q \
        -O /usr/local/bin/plane-app \
        https://raw.githubusercontent.com/makeplane/plane/${BRANCH:-master}/deploy/1-click/plane-app?token=$(date +%s)
fi

sudo chmod +x /usr/local/bin/plane-app
sudo sed -i 's/export BRANCH=${BRANCH:-master}/export BRANCH='${BRANCH:-master}'/' /usr/local/bin/plane-app

sudo  plane-app --help