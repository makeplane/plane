#!/bin/bash

# Check if the user has sudo access
if command -v curl &> /dev/null; then
    curl -sSL \
        -o /usr/local/bin/plane-app \
        https://raw.githubusercontent.com/makeplane/plane/${BRANCH:-master}/deploy/1-click/plane-app?token=$(date +%s)
else 
    wget -q \
        -O /usr/local/bin/plane-app \
        https://raw.githubusercontent.com/makeplane/plane/${BRANCH:-master}/deploy/1-click/plane-app?token=$(date +%s)
fi

chmod +x /usr/local/bin/plane-app
sed -i 's/export DEPLOY_BRANCH=${BRANCH:-master}/export DEPLOY_BRANCH='${BRANCH:-master}'/' /usr/local/bin/plane-app

plane-app --help
