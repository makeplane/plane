#!/bin/bash
cp ./.env.example ./.env

# Export for tr error in mac
export LC_ALL=C
export LC_CTYPE=C


# Generate the NEXT_PUBLIC_API_BASE_URL with given IP
echo -e "\nNEXT_PUBLIC_API_BASE_URL=$1"  >> ./.env

# Generate the SECRET_KEY that will be used by django
echo -e "SECRET_KEY=\"$(tr -dc 'a-z0-9' < /dev/urandom | head -c50)\""  >> ./.env

# WEB_URL for email redirection and image saving
echo -e "WEB_URL=$1" >> ./.env

# Generate Prompt for taking tiptap auth key
echo -e "\n\e[1;38m Instructions for generating TipTap Pro Extensions Auth Token \e[0m \n"

echo -e "\e[1;38m 1. Head over to TipTap cloud's Pro Extensions Page, https://collab.tiptap.dev/pro-extensions \e[0m"
echo -e "\e[1;38m 2. Copy the token given to you under the first paragraph, after 'Here it is' \e[0m \n"

read -p $'\e[1;32m Please Enter Your TipTap Pro Extensions Authentication Token: \e[0m \e[1;36m' authToken

#!/bin/bash

# Create .env files in the respective directories
touch ./web/.env
touch ./apiserver/.env
touch ./space/.env

# Initialize empty strings for each .env file
webEnv=""
apiEnv=""
spaceEnv=""

# Read the .env file line by line
while IFS= read -r line
do
  # Check if the line is a comment
  if [[ $line == \#* ]]; then
    # Check which section we are in
    if [[ $line == *Frontend* ]]; then
      section="web"
    elif [[ $line == *Backend* ]]; then
      section="api"
    elif [[ $line == *Space* ]]; then
      section="space"
    fi
  else
    # Add the line to the correct string
    if [[ $section == "web" ]]; then
      webEnv+="$line\n"
    elif [[ $section == "api" ]]; then
      apiEnv+="$line\n"
    elif [[ $section == "space" ]]; then
      spaceEnv+="$line\n"
    fi
  fi
done < .env

# Write the strings to the respective .env files
echo -e $webEnv > ./web/.env
echo -e $apiEnv > ./apiserver/.env
echo -e $spaceEnv > ./space/.env


