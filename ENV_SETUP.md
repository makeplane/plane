# Environment Variables

Environment variables are distributed in various files. Please refer them carefully.

## {PROJECT_FOLDER}/.env

File is available in the project root folder​

```
# Database Settings
POSTGRES_USER="plane"
POSTGRES_PASSWORD="plane"
POSTGRES_DB="plane"
PGDATA="/var/lib/postgresql/data"
# Redis Settings
REDIS_HOST="plane-redis"
REDIS_PORT="6379"
# AWS Settings
AWS_REGION=""
AWS_ACCESS_KEY_ID="access-key"
AWS_SECRET_ACCESS_KEY="secret-key"
AWS_S3_ENDPOINT_URL="http://plane-minio:9000"
# Changing this requires change in the nginx.conf for uploads if using minio setup
AWS_S3_BUCKET_NAME="uploads"
# Maximum file upload limit
FILE_SIZE_LIMIT=5242880
# GPT settings
OPENAI_API_BASE="https://api.openai.com/v1" # deprecated
OPENAI_API_KEY="sk-" # deprecated
GPT_ENGINE="gpt-3.5-turbo" # deprecated
# Settings related to Docker
DOCKERIZED=1  # deprecated
# set to 1 If using the pre-configured minio setup
USE_MINIO=1
# Nginx Configuration
NGINX_PORT=80
```

## {PROJECT_FOLDER}/apiserver/.env

```
# Backend
# Debug value for api server use it as 0 for production use
DEBUG=0
CORS_ALLOWED_ORIGINS="http://localhost"
# Error logs
SENTRY_DSN=""
SENTRY_ENVIRONMENT="development"
# Database Settings
POSTGRES_USER="plane"
POSTGRES_PASSWORD="plane"
POSTGRES_HOST="plane-db"
POSTGRES_DB="plane"
POSTGRES_PORT=5432
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
# Redis Settings
REDIS_HOST="plane-redis"
REDIS_PORT="6379"
REDIS_URL="redis://${REDIS_HOST}:6379/"
# AWS Settings
AWS_REGION=""
AWS_ACCESS_KEY_ID="access-key"
AWS_SECRET_ACCESS_KEY="secret-key"
AWS_S3_ENDPOINT_URL="http://plane-minio:9000"
# Changing this requires change in the nginx.conf for uploads if using minio setup
AWS_S3_BUCKET_NAME="uploads"
# Maximum file upload limit
FILE_SIZE_LIMIT=5242880
# Settings related to Docker
DOCKERIZED=1 # deprecated
# set to 1 If using the pre-configured minio setup
USE_MINIO=1
# Nginx Configuration
NGINX_PORT=80
# Email redirections and minio domain settings
WEB_URL="http://localhost"
# Gunicorn Workers
GUNICORN_WORKERS=2
# Base URLs
ADMIN_BASE_URL=
SPACE_BASE_URL=
APP_BASE_URL=
SECRET_KEY="gxoytl7dmnc1y37zahah820z5iq3iozu38cnfjtu3yaau9cd9z"
```

## Updates​

- The naming convention for containers and images has been updated.
- The plane-worker image will no longer be maintained, as it has been merged with plane-backend.
- The Tiptap pro-extension dependency has been removed, eliminating the need for Tiptap API keys.
- The image name for Plane deployment has been changed to plane-space.
