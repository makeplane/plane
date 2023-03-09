#!/bin/bash
cp ./apiserver/.env.example ./apiserver/.env
# Generating App environmental variables
cp ./apps/app/.env.example ./apps/app/.env

echo NEXT_PUBLIC_API_BASE_URL = http://$1  >> ./apps/app/.env
