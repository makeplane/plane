"""Global Settings"""

# Python imports
import os
from urllib.parse import urlparse
from urllib.parse import urljoin

# Third party imports
import dj_database_url

# Django imports
from django.core.management.utils import get_random_secret_key
from corsheaders.defaults import default_headers


# Module imports
from plane.utils.url import is_valid_url


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Secret Key
SECRET_KEY = os.environ.get("SECRET_KEY", get_random_secret_key())

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = int(os.environ.get("DEBUG", "0"))

# Self-hosted mode
IS_SELF_MANAGED = True

# Allowed Hosts
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "*").split(",")

# Application definition
INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.staticfiles",
    # Inhouse apps
    "plane.analytics",
    "plane.app",
    "plane.space",
    "plane.bgtasks",
    "plane.db",
    "plane.utils",
    "plane.web",
    "plane.middleware",
    "plane.license",
    "plane.api",
    "plane.authentication",
    # Third-party things
    "rest_framework",
    "corsheaders",
    "django_celery_beat",
]

# Middlewares
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "plane.authentication.middleware.session.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "crum.CurrentRequestUserMiddleware",
    "django.middleware.gzip.GZipMiddleware",
    "plane.middleware.request_body_size.RequestBodySizeLimitMiddleware",
    "plane.middleware.logger.APITokenLogMiddleware",
    "plane.middleware.logger.RequestLoggerMiddleware",
]

# Rest Framework settings
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework.authentication.SessionAuthentication",),
    "DEFAULT_THROTTLE_CLASSES": ("rest_framework.throttling.AnonRateThrottle",),
    "DEFAULT_THROTTLE_RATES": {
        "anon": "30/minute",
        "asset_id": "5/minute",
    },
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_RENDERER_CLASSES": ("rest_framework.renderers.JSONRenderer",),
    "DEFAULT_FILTER_BACKENDS": ("django_filters.rest_framework.DjangoFilterBackend",),
    "EXCEPTION_HANDLER": "plane.authentication.adapter.exception.auth_exception_handler",
    # Preserve original Django URL parameter names (pk) instead of converting to 'id'
    "SCHEMA_COERCE_PATH_PK": False,
}

# Django Auth Backend
AUTHENTICATION_BACKENDS = ("django.contrib.auth.backends.ModelBackend",)  # default

# Root Urls
ROOT_URLCONF = "plane.urls"

# Templates
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": ["templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]


# CORS Settings
CORS_ALLOW_CREDENTIALS = True
cors_origins_raw = os.environ.get("CORS_ALLOWED_ORIGINS", "")
# filter out empty strings
cors_allowed_origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]
if cors_allowed_origins:
    CORS_ALLOWED_ORIGINS = cors_allowed_origins
    secure_origins = False if [origin for origin in cors_allowed_origins if "http:" in origin] else True
else:
    CORS_ALLOW_ALL_ORIGINS = True
    secure_origins = False

CORS_ALLOW_HEADERS = [*default_headers, "X-API-Key"]

# Application Settings
WSGI_APPLICATION = "plane.wsgi.application"
ASGI_APPLICATION = "plane.asgi.application"

# Django Sites
SITE_ID = 1

# User Model
AUTH_USER_MODEL = "db.User"

# Database
if bool(os.environ.get("DATABASE_URL")):
    # Parse database configuration from $DATABASE_URL
    DATABASES = {"default": dj_database_url.config()}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("POSTGRES_DB"),
            "USER": os.environ.get("POSTGRES_USER"),
            "PASSWORD": os.environ.get("POSTGRES_PASSWORD"),
            "HOST": os.environ.get("POSTGRES_HOST"),
            "PORT": os.environ.get("POSTGRES_PORT", "5432"),
        }
    }


if os.environ.get("ENABLE_READ_REPLICA", "0") == "1":
    if bool(os.environ.get("DATABASE_READ_REPLICA_URL")):
        # Parse database configuration from $DATABASE_URL
        DATABASES["replica"] = dj_database_url.parse(os.environ.get("DATABASE_READ_REPLICA_URL"))
    else:
        DATABASES["replica"] = {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("POSTGRES_READ_REPLICA_DB"),
            "USER": os.environ.get("POSTGRES_READ_REPLICA_USER"),
            "PASSWORD": os.environ.get("POSTGRES_READ_REPLICA_PASSWORD"),
            "HOST": os.environ.get("POSTGRES_READ_REPLICA_HOST"),
            "PORT": os.environ.get("POSTGRES_READ_REPLICA_PORT", "5432"),
        }

    # Database Routers
    DATABASE_ROUTERS = ["plane.utils.core.dbrouters.ReadReplicaRouter"]
    # Add middleware at the end for read replica routing
    MIDDLEWARE.append("plane.middleware.db_routing.ReadReplicaRoutingMiddleware")


# Redis Config
REDIS_URL = os.environ.get("REDIS_URL")
REDIS_SSL = REDIS_URL and "rediss" in REDIS_URL

if REDIS_SSL:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
                "CONNECTION_POOL_KWARGS": {"ssl_cert_reqs": False},
            },
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
        }
    }

# Password validations
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Password reset time the number of seconds the uniquely generated uid will be valid
PASSWORD_RESET_TIMEOUT = 3600

# Static files (CSS, JavaScript, Images)
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "static-assets", "collected-static")
STATICFILES_DIRS = (os.path.join(BASE_DIR, "static"),)

# Media Settings
MEDIA_ROOT = "mediafiles"
MEDIA_URL = "/media/"

# Internationalization
LANGUAGE_CODE = "en-us"
USE_I18N = True
USE_L10N = True

# Timezones
USE_TZ = True
TIME_ZONE = "UTC"

# Default Auto Field
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Email settings
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

# Storage Settings
# Use Minio settings
USE_MINIO = int(os.environ.get("USE_MINIO", 0)) == 1

STORAGES = {"staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"}}
STORAGES["default"] = {"BACKEND": "plane.settings.storage.S3Storage"}
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "access-key")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "secret-key")
AWS_STORAGE_BUCKET_NAME = os.environ.get("AWS_S3_BUCKET_NAME", "uploads")
AWS_REGION = os.environ.get("AWS_REGION", "")
AWS_DEFAULT_ACL = "public-read"
AWS_QUERYSTRING_AUTH = False
AWS_S3_FILE_OVERWRITE = False
AWS_S3_ENDPOINT_URL = os.environ.get("AWS_S3_ENDPOINT_URL", None) or os.environ.get("MINIO_ENDPOINT_URL", None)
if AWS_S3_ENDPOINT_URL and USE_MINIO:
    parsed_url = urlparse(os.environ.get("WEB_URL", "http://localhost"))
    AWS_S3_CUSTOM_DOMAIN = f"{parsed_url.netloc}/{AWS_STORAGE_BUCKET_NAME}"
    AWS_S3_URL_PROTOCOL = f"{parsed_url.scheme}:"

# RabbitMQ connection settings
RABBITMQ_HOST = os.environ.get("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = os.environ.get("RABBITMQ_PORT", "5672")
RABBITMQ_USER = os.environ.get("RABBITMQ_USER", "guest")
RABBITMQ_PASSWORD = os.environ.get("RABBITMQ_PASSWORD", "guest")
RABBITMQ_VHOST = os.environ.get("RABBITMQ_VHOST", "/")
AMQP_URL = os.environ.get("AMQP_URL")

# Celery Configuration
if AMQP_URL:
    CELERY_BROKER_URL = AMQP_URL
else:
    CELERY_BROKER_URL = f"amqp://{RABBITMQ_USER}:{RABBITMQ_PASSWORD}@{RABBITMQ_HOST}:{RABBITMQ_PORT}/{RABBITMQ_VHOST}"

CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["application/json"]


CELERY_IMPORTS = (
    # scheduled tasks
    "plane.bgtasks.issue_automation_task",
    "plane.bgtasks.exporter_expired_task",
    "plane.bgtasks.file_asset_task",
    "plane.bgtasks.email_notification_task",
    "plane.bgtasks.cleanup_task",
    "plane.license.bgtasks.tracer",
    # management tasks
    "plane.bgtasks.dummy_data_task",
    # issue version tasks
    "plane.bgtasks.issue_version_sync",
    "plane.bgtasks.issue_description_version_sync",
)

FILE_SIZE_LIMIT = int(os.environ.get("FILE_SIZE_LIMIT", 5242880))

# Unsplash Access key
UNSPLASH_ACCESS_KEY = os.environ.get("UNSPLASH_ACCESS_KEY")
# Github Access Token
GITHUB_ACCESS_TOKEN = os.environ.get("GITHUB_ACCESS_TOKEN", False)

# Analytics
ANALYTICS_SECRET_KEY = os.environ.get("ANALYTICS_SECRET_KEY", False)
ANALYTICS_BASE_API = os.environ.get("ANALYTICS_BASE_API", False)

# Posthog settings
POSTHOG_API_KEY = os.environ.get("POSTHOG_API_KEY", False)
POSTHOG_HOST = os.environ.get("POSTHOG_HOST", False)

# Skip environment variable configuration
SKIP_ENV_VAR = os.environ.get("SKIP_ENV_VAR", "1") == "1"

DATA_UPLOAD_MAX_MEMORY_SIZE = int(os.environ.get("FILE_SIZE_LIMIT", 5242880))

# Cookie Settings
SESSION_COOKIE_SECURE = secure_origins
SESSION_COOKIE_HTTPONLY = True
SESSION_ENGINE = "plane.db.models.session"
SESSION_COOKIE_AGE = int(os.environ.get("SESSION_COOKIE_AGE", 604800))
SESSION_COOKIE_NAME = os.environ.get("SESSION_COOKIE_NAME", "session-id")
SESSION_COOKIE_DOMAIN = os.environ.get("COOKIE_DOMAIN", None)
SESSION_SAVE_EVERY_REQUEST = os.environ.get("SESSION_SAVE_EVERY_REQUEST", "0") == "1"

# Admin Cookie
ADMIN_SESSION_COOKIE_NAME = "admin-session-id"
ADMIN_SESSION_COOKIE_AGE = int(os.environ.get("ADMIN_SESSION_COOKIE_AGE", 3600))

# CSRF cookies
CSRF_COOKIE_SECURE = secure_origins
CSRF_COOKIE_HTTPONLY = True
CSRF_TRUSTED_ORIGINS = cors_allowed_origins
CSRF_COOKIE_DOMAIN = os.environ.get("COOKIE_DOMAIN", None)
CSRF_FAILURE_VIEW = "plane.authentication.views.common.csrf_failure"

######  Base URLs ######

# Admin Base URL
ADMIN_BASE_URL = os.environ.get("ADMIN_BASE_URL", None)
if ADMIN_BASE_URL and not is_valid_url(ADMIN_BASE_URL):
    ADMIN_BASE_URL = None
ADMIN_BASE_PATH = os.environ.get("ADMIN_BASE_PATH", "/god-mode/")

# Space Base URL
SPACE_BASE_URL = os.environ.get("SPACE_BASE_URL", None)
if SPACE_BASE_URL and not is_valid_url(SPACE_BASE_URL):
    SPACE_BASE_URL = None
SPACE_BASE_PATH = os.environ.get("SPACE_BASE_PATH", "/spaces/")

# App Base URL
APP_BASE_URL = os.environ.get("APP_BASE_URL", None)
if APP_BASE_URL and not is_valid_url(APP_BASE_URL):
    APP_BASE_URL = None
APP_BASE_PATH = os.environ.get("APP_BASE_PATH", "/")

# Live Base URL
LIVE_BASE_URL = os.environ.get("LIVE_BASE_URL", None)
if LIVE_BASE_URL and not is_valid_url(LIVE_BASE_URL):
    LIVE_BASE_URL = None
LIVE_BASE_PATH = os.environ.get("LIVE_BASE_PATH", "/live/")

LIVE_URL = urljoin(LIVE_BASE_URL, LIVE_BASE_PATH) if LIVE_BASE_URL else None

# WEB URL
WEB_URL = os.environ.get("WEB_URL")

HARD_DELETE_AFTER_DAYS = int(os.environ.get("HARD_DELETE_AFTER_DAYS", 60))

# Instance Changelog URL
INSTANCE_CHANGELOG_URL = os.environ.get("INSTANCE_CHANGELOG_URL", "")

ATTACHMENT_MIME_TYPES = [
    # Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/svg+xml",
    "image/webp",
    "image/tiff",
    "image/bmp",
    # Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/markdown",
    "application/rtf",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.oasis.opendocument.text",
    "application/vnd.oasis.opendocument.presentation",
    "application/vnd.oasis.opendocument.graphics",
    # Microsoft Visio
    "application/vnd.visio",
    # Netpbm format
    "image/x-portable-graymap",
    "image/x-portable-bitmap",
    "image/x-portable-pixmap",
    # Open Office Bae
    "application/vnd.oasis.opendocument.database",
    # Audio
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/midi",
    "audio/x-midi",
    "audio/aac",
    "audio/flac",
    "audio/x-m4a",
    # Video
    "video/mp4",
    "video/mpeg",
    "video/ogg",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-ms-wmv",
    # Archives
    "application/zip",
    "application/x-rar",
    "application/x-rar-compressed",
    "application/x-tar",
    "application/gzip",
    "application/x-zip",
    "application/x-zip-compressed",
    "application/x-7z-compressed",
    "application/x-compressed",
    "application/x-compressed-tar",
    "application/x-compressed-tar-gz",
    "application/x-compressed-tar-bz2",
    "application/x-compressed-tar-zip",
    "application/x-compressed-tar-7z",
    "application/x-compressed-tar-rar",
    "application/x-compressed-tar-zip",
    # 3D Models
    "model/gltf-binary",
    "model/gltf+json",
    "application/octet-stream",  # for .obj files, but be cautious
    # Fonts
    "font/ttf",
    "font/otf",
    "font/woff",
    "font/woff2",
    # Other
    "text/css",
    "text/javascript",
    "application/json",
    "text/xml",
    "text/csv",
    "application/xml",
    # SQL
    "application/x-sql",
    # Gzip
    "application/x-gzip",
    # Markdown
    "text/markdown",
]

# Seed directory path
SEED_DIR = os.path.join(BASE_DIR, "seeds")

ENABLE_DRF_SPECTACULAR = os.environ.get("ENABLE_DRF_SPECTACULAR", "0") == "1"

if ENABLE_DRF_SPECTACULAR:
    REST_FRAMEWORK["DEFAULT_SCHEMA_CLASS"] = "drf_spectacular.openapi.AutoSchema"
    INSTALLED_APPS.append("drf_spectacular")
    from .openapi import SPECTACULAR_SETTINGS  # noqa: F401

# MongoDB Settings
MONGO_DB_URL = os.environ.get("MONGO_DB_URL", False)
MONGO_DB_DATABASE = os.environ.get("MONGO_DB_DATABASE", False)
