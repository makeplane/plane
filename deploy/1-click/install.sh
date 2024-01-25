#!/bin/bash

curl -sSL \
    -o /usr/local/bin/plane-app \
    https://raw.githubusercontent.com/makeplane/plane/${BRANCH:-master}/deploy/1-click/plane-app?token=$(date +%s) \
    && chmod +x /usr/local/bin/plane-app \
    && sed -i 's/export BRANCH=${BRANCH:-master}/export BRANCH='${BRANCH:-master}'/' /usr/local/bin/plane-app

plane-app --help