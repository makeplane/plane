#!/bin/bash
cp ./.env.example ./.env

# Export for tr error in mac
export LC_ALL=C
export LC_CTYPE=C

cp ./web/.env.example ./web/.env
cp ./space/.env.example ./space/.env
cp ./apiserver/.env.example ./apiserver/.env

web_env=$(<./web/.env)
api_env=$(<./apiserver/.env)
space_env=$(<./space/.env)

while IFS= read -r line
do
  if [[ $line == *=* ]]; then
    key=$(echo "$line" | cut -d'=' -f1)
    value=$(echo "$line" | cut -d'=' -f2-)

    if [[ $web_env == *"$key"* && $web_env != *"$value"* ]]; then
      web_env=$(echo "$web_env" | sed "s#$key=.*#$line#")
    fi

    if [[ $api_env == *"$key"* && $api_env != *"$value"* ]]; then
      api_env=$(echo "$api_env" | sed "s#$key=.*#$line#")
    fi

    if [[ $space_env == *"$key"* && $space_env != *"$value"* ]]; then
      space_env=$(echo "$space_env" | sed "s#$key=.*#$line#")
    fi
  fi
done < .env

# Write the strings to the respective .env files

echo "$web_env" > ./web/.env
echo "$api_env" > ./apiserver/.env
echo "$space_env" > ./space/.env

# Generate the SECRET_KEY that will be used by django
echo -e "SECRET_KEY=\"$(tr -dc 'a-z0-9' < /dev/urandom | head -c50)\""  >> ./apiserver/.env

echo -e "\nNEXT_PUBLIC_API_BASE_URL=$1\nWEB_URL=$1"  >> ./web/.env
echo -e "\nNEXT_PUBLIC_API_BASE_URL=$1\nWEB_URL=$1"  >> ./space/.env

# Generate Prompt for taking tiptap auth key
echo -e "\n\e[1;38m Instructions for generating TipTap Pro Extensions Auth Token \e[0m \n"

echo -e "\e[1;38m 1. Head over to TipTap cloud's Pro Extensions Page, https://collab.tiptap.dev/pro-extensions \e[0m"
echo -e "\e[1;38m 2. Copy the token given to you under the first paragraph, after 'Here it is' \e[0m \n"

read -p $'\e[1;32m Please Enter Your TipTap Pro Extensions Authentication Token: \e[0m \e[1;36m'  authToken

echo "@tiptap-pro:registry=https://registry.tiptap.dev/
//registry.tiptap.dev/:_authToken=${authToken}" > ./web/.npmrc

echo "@tiptap-pro:registry=https://registry.tiptap.dev/
//registry.tiptap.dev/:_authToken=${authToken}" > ./space/.npmrc