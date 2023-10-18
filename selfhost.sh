#!/bin/bash

BRANCH=${BRANCH:-master}

mkdir -p ./plane-app
cd plane-app
curl -o docker-compose.yaml  https://raw.githubusercontent.com/makeplane/plane/dev/mg-self-host/docker-compose-hub.yml
curl -o .env https://raw.githubusercontent.com/makeplane/plane/dev/mg-self-host/selfhost.env