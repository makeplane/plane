#!/bin/bash
cp ./.env.example ./.env

echo -e "\nNEXT_PUBLIC_API_BASE_URL=http://$1"  >> ./.env
export LC_ALL=C
export LC_CTYPE=C
echo -e "SECRET_KEY=\"$(tr -dc 'a-f0-9' < /dev/urandom | head -c50)\"" >> ./.env
