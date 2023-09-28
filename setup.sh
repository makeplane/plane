#!/bin/bash
cp ./.env.example ./.env

# Export for tr error in mac
export LC_ALL=C
export LC_CTYPE=C

cp ./web/.env.example ./web/.env
cp ./space/.env.example ./space/.env
cp ./apiserver/.env.example ./apiserver/.env

# copy locales
cp -r ./locales ./web/public/
cp -r ./locales ./space/public/

# Generate the SECRET_KEY that will be used by django
echo -e "SECRET_KEY=\"$(tr -dc 'a-z0-9' < /dev/urandom | head -c50)\""  >> ./apiserver/.env