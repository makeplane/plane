#!/bin/bash

BRANCH=${BRANCH:-master}

mkdir -p ./plane-app/archive
cd plane-app

TS=$(date +%s)
if [ -e docker-compose.yaml ]
then
    mv docker-compose.yaml ./archive/$TS.docker-compose.yaml
fi
if [ -e .env ]
then
    cp .env previous.env
    mv .env ./archive/$TS.env
fi

curl -s -o docker-compose.yaml  https://raw.githubusercontent.com/makeplane/plane/$BRANCH/docker-compose-hub.yml
curl -s -o .env https://raw.githubusercontent.com/makeplane/plane/$BRANCH/selfhost.env

# docker compose up -d