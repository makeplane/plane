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
GPT_ENGINE="gpt-4o-mini" # deprecated
# Settings related to Docker
DOCKERIZED=1  # deprecated
# set to 1 If using the pre-configured minio setup
USE_MINIO=1
# Nginx Configuration
NGINX_PORT=80
```

## {PROJECT_FOLDER}/apps/server/.env

```
# Backend
# Debug value for api server use it as 0 for production use
DEBUG=0
CORS_ALLOWED_ORIGINS="http://localhost"
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
# RabbitMQ Settings
RABBITMQ_HOST="plane-mq"
RABBITMQ_PORT="5672"
RABBITMQ_USER="plane"
RABBITMQ_PASSWORD="plane"
RABBITMQ_VHOST="plane"
AMQP_URL=""
# Authentication Settings
ENABLE_SIGNUP=1
ENABLE_EMAIL_PASSWORD=1
ENABLE_MAGIC_LINK_LOGIN=0
```
