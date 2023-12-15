# Environment Variables

​
Environment variables are distributed in various files. Please refer them carefully.

## {PROJECT_FOLDER}/.env

File is available in the project root folder​

```
# Database Settings
PGUSER="plane"
PGPASSWORD="plane"
PGHOST="plane-db"
PGDATABASE="plane"
DATABASE_URL=postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}
​
# Redis Settings
REDIS_HOST="plane-redis"
REDIS_PORT="6379"
REDIS_URL="redis://${REDIS_HOST}:6379/"
​
# AWS Settings
AWS_REGION=""
AWS_ACCESS_KEY_ID="access-key"
AWS_SECRET_ACCESS_KEY="secret-key"
AWS_S3_ENDPOINT_URL="http://plane-minio:9000"
# Changing this requires change in the nginx.conf for uploads if using minio setup
AWS_S3_BUCKET_NAME="uploads"
# Maximum file upload limit
FILE_SIZE_LIMIT=5242880
​
# GPT settings
OPENAI_API_BASE="https://api.openai.com/v1" # deprecated
OPENAI_API_KEY="sk-" # deprecated
GPT_ENGINE="gpt-3.5-turbo" # deprecated
​
# set to 1 If using the pre-configured minio setup
USE_MINIO=1
​
# Nginx Configuration
NGINX_PORT=80
```

​

## {PROJECT_FOLDER}/web/.env.example

​

```
# Public boards deploy URL
NEXT_PUBLIC_DEPLOY_URL="http://localhost/spaces"
```


## {PROJECT_FOLDER}/apiserver/.env

​

```
# Backend
# Debug value for api server use it as 0 for production use
DEBUG=0
​
# Error logs
SENTRY_DSN=""
​
# Database Settings
PGUSER="plane"
PGPASSWORD="plane"
PGHOST="plane-db"
PGDATABASE="plane"
DATABASE_URL=postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}
​
# Redis Settings
REDIS_HOST="plane-redis"
REDIS_PORT="6379"
REDIS_URL="redis://${REDIS_HOST}:6379/"
​
# Email Settings
EMAIL_HOST=""
EMAIL_HOST_USER=""
EMAIL_HOST_PASSWORD=""
EMAIL_PORT=587
EMAIL_FROM="Team Plane <team@mailer.plane.so>"
EMAIL_USE_TLS="1"
EMAIL_USE_SSL="0"
​
# AWS Settings
AWS_REGION=""
AWS_ACCESS_KEY_ID="access-key"
AWS_SECRET_ACCESS_KEY="secret-key"
AWS_S3_ENDPOINT_URL="http://plane-minio:9000"
# Changing this requires change in the nginx.conf for uploads if using minio setup
AWS_S3_BUCKET_NAME="uploads"
# Maximum file upload limit
FILE_SIZE_LIMIT=5242880
​
# GPT settings
OPENAI_API_BASE="https://api.openai.com/v1" # deprecated
OPENAI_API_KEY="sk-" # deprecated
GPT_ENGINE="gpt-3.5-turbo" # deprecated
​
# Settings related to Docker
DOCKERIZED=1  # Deprecated

# Github
GITHUB_CLIENT_SECRET="" # For fetching release notes
​
# set to 1 If using the pre-configured minio setup
USE_MINIO=1
​
# Nginx Configuration
NGINX_PORT=80
​
​
# SignUps
ENABLE_SIGNUP="1"
​
# Email Redirection URL
WEB_URL="http://localhost"
```

## Updates​

- The environment variable NEXT_PUBLIC_API_BASE_URL has been removed from both the web and space projects.
- The naming convention for containers and images has been updated.
- The plane-worker image will no longer be maintained, as it has been merged with plane-backend.
- The Tiptap pro-extension dependency has been removed, eliminating the need for Tiptap API keys.
- The image name for Plane deployment has been changed to plane-space.
