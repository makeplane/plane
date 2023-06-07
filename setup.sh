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
