#!/bin/bash
cp ./apiserver/.env.example ./apiserver/.env
# Generating App environmental variables
cp ./apps/app/.env.example ./apps/app/.env

echo -e "\nNEXT_PUBLIC_API_BASE_URL=http://$1"  >> ./apps/app/.env
export LC_ALL=C
export LC_CTYPE=C
echo -e "\nSECRET_KEY=\"$(tr -dc 'a-z0-9!@#$%^&*(-_=+)' < /dev/urandom | head -c50)\""  >> ./apiserver/.env
