#!/bin/sh

# Get all environment variables that start with "NEXT_PUBLIC_"
next_public_vars=$(env | grep NEXT_PUBLIC_ | awk -F "=" '{print $1}')
echo "env=$next_public_vars"
# Iterate through each NEXT_PUBLIC environment variable
for var in $next_public_vars; do
  echo "var=$var"
  # Get the value of the NEXT_PUBLIC variable
  value=$(printenv "$var")
    echo "value=$value"   
  # Replace the NEXT_PUBLIC variable with the value in all build files
  find apps/app/.next/ -type f -exec sed -i "s@NEXT_PUBLIC_${var#NEXT_PUBLIC_}@${value}@g" {} \;
done
echo "$@"
# Start the application using the command passed in as an argument
exec "$@"