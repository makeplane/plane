"""Self hosted settings and globals."""
from urllib.parse import urlparse

import dj_database_url
from urllib.parse import urlparse


from .common import *  # noqa

# Database
DEBUG = int(os.environ.get("DEBUG", 0)) == 1

# Docker configurations
DOCKERIZED = 1
USE_MINIO = 1

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "plane",
        "USER": os.environ.get("PGUSER", ""),
        "PASSWORD": os.environ.get("PGPASSWORD", ""),
        "HOST": os.environ.get("PGHOST", ""),
    }
}

# Parse database configuration from $DATABASE_URL
DATABASES["default"] = dj_database_url.config()
SITE_ID = 1

# File size limit
FILE_SIZE_LIMIT = int(os.environ.get("FILE_SIZE_LIMIT", 5242880))

CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = True

STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

INSTALLED_APPS += ("storages",)
STORAGES["default"] = {"BACKEND": "storages.backends.s3boto3.S3Boto3Storage"}
# The AWS access key to use.
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "access-key")
# The AWS secret access key to use.
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "secret-key")
# The name of the bucket to store files in.
AWS_STORAGE_BUCKET_NAME = os.environ.get("AWS_S3_BUCKET_NAME", "uploads")
# The full URL to the S3 endpoint. Leave blank to use the default region URL.
AWS_S3_ENDPOINT_URL = os.environ.get(
    "AWS_S3_ENDPOINT_URL", "http://plane-minio:9000"
)
# Default permissions
AWS_DEFAULT_ACL = "public-read"
AWS_QUERYSTRING_AUTH = False
AWS_S3_FILE_OVERWRITE = False

# Custom Domain settings
parsed_url = urlparse(os.environ.get("WEB_URL", "http://localhost"))
AWS_S3_CUSTOM_DOMAIN = f"{parsed_url.netloc}/{AWS_STORAGE_BUCKET_NAME}"
AWS_S3_URL_PROTOCOL = f"{parsed_url.scheme}:"

# Honor the 'X-Forwarded-Proto' header for request.is_secure()
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Allow all host headers
ALLOWED_HOSTS = [
    "*",
]

# Security settings
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Redis URL
REDIS_URL = os.environ.get("REDIS_URL")

# Caches 
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
    }
}

# URL used for email redirects
WEB_URL = os.environ.get("WEB_URL", "http://localhost")

# Celery settings
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL

# Enable or Disable signups
ENABLE_SIGNUP = os.environ.get("ENABLE_SIGNUP", "1") == "1"

# Analytics
ANALYTICS_BASE_API = False

# OPEN AI Settings
OPENAI_API_BASE = os.environ.get("OPENAI_API_BASE", "https://api.openai.com/v1")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", False)
GPT_ENGINE = os.environ.get("GPT_ENGINE", "gpt-3.5-turbo")

