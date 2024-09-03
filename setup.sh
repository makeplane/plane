#!/bin/bash
cp ./.env.example ./.env

# Export for tr error in mac
export LC_ALL=C
export LC_CTYPE=C

cp ./web/.env.example ./web/.env
cp ./apiserver/.env.example ./apiserver/.env
cp ./space/.env.example ./space/.env
cp ./admin/.env.example ./admin/.env
cp ./live/.env.example ./live/.env

# Generate the SECRET_KEY that will be used by django
echo -e "\nSECRET_KEY=\"$(tr -dc 'a-z0-9' < /dev/urandom | head -c50)\"" >> ./apiserver/.env
