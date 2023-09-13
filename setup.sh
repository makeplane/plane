#!/bin/bash
cp ./.env.example ./.env

# Export for tr error in mac
export LC_ALL=C
export LC_CTYPE=C

cp ./web/.env.example ./web/.env
cp ./space/.env.example ./space/.env
cp ./apiserver/.env.example ./apiserver/.env

# Generate the SECRET_KEY that will be used by django
echo -e "SECRET_KEY=\"$(tr -dc 'a-z0-9' < /dev/urandom | head -c50)\""  >> ./apiserver/.env

# Generate Prompt for taking tiptap auth key
echo -e "\n\e[1;38m Instructions for generating TipTap Pro Extensions Auth Token \e[0m \n"

echo -e "\e[1;38m 1. Head over to TipTap cloud's Pro Extensions Page, https://collab.tiptap.dev/pro-extensions \e[0m"
echo -e "\e[1;38m 2. Copy the token given to you under the first paragraph, after 'Here it is' \e[0m \n"

read -p $'\e[1;32m Please Enter Your TipTap Pro Extensions Authentication Token: \e[0m \e[1;36m'  authToken

echo "@tiptap-pro:registry=https://registry.tiptap.dev/
//registry.tiptap.dev/:_authToken=${authToken}" > .npmrc