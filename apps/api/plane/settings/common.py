# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""Global Settings"""

# Python imports
import os
from datetime import timedelta
from urllib.parse import urljoin, urlparse, quote

# Third party imports
import dj_database_url
from corsheaders.defaults import default_headers

# Django imports
from django.core.management.utils import get_random_secret_key

# Module imports
from plane.utils.url import is_valid_url

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Secret Key
SECRET_KEY = os.environ.get("SECRET_KEY", get_random_secret_key())
AES_SECRET_KEY = os.environ.get("AES_SECRET_KEY", "")
AES_SALT = os.environ.get("AES_SALT", "aes-salt")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = int(os.environ.get("DEBUG", "0"))

# Self-hosted mode
IS_SELF_MANAGED = os.environ.get("IS_SELF_MANAGED", "1") == "1"


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
    "plane.automations",
    "plane.ee",
    "plane.graphql",
    "plane.payment",
    "plane.silo",
    "plane.event_stream",
    "plane.agents",
    "plane.webhook",
    "plane.runnerctl",
    # Third-party things
    "strawberry.django",
    "rest_framework",
    "oauth2_provider",
    "corsheaders",
    "django_celery_beat",
    "pgtrigger",
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
    "oauth2_provider.middleware.OAuth2TokenMiddleware",
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


# True when either IRSA (AWS_ROLE_ARN) or EKS Pod Identity
# (AWS_CONTAINER_CREDENTIALS_FULL_URI) is present.
_has_aws_credentials = bool(
    os.environ.get("AWS_ROLE_ARN", "")
    or os.environ.get("AWS_CONTAINER_CREDENTIALS_FULL_URI", "")
)

# AWS Secrets Manager: When _has_aws_credentials and RDS_SECRET_ARN are both set,
# IRSA or Pod Identity is used to fetch DB credentials from Secrets Manager.
# Rotation is handled automatically by the custom backend (cache + retry).
# DATABASE_URL (and DATABASE_READ_REPLICA_URL) take precedence when set.
if (
    _has_aws_credentials
    and os.environ.get("RDS_SECRET_ARN")
    and not os.environ.get("DATABASE_URL")
):
    _aws_region = os.environ.get("AWS_REGION", "us-east-1")
    DATABASES["default"]["ENGINE"] = "plane.db.backends.secrets_manager"
    DATABASES["default"]["SECRET_ARN"] = os.environ.get("RDS_SECRET_ARN")
    DATABASES["default"]["AWS_REGION"] = _aws_region
    if "replica" in DATABASES and not os.environ.get("DATABASE_READ_REPLICA_URL"):
        DATABASES["replica"]["ENGINE"] = "plane.db.backends.secrets_manager"
        DATABASES["replica"]["SECRET_ARN"] = os.environ.get("RDS_SECRET_ARN")
        DATABASES["replica"]["AWS_REGION"] = _aws_region
        DATABASES["replica"]["RDS_READ_REPLICA_URI"] = "RDS_READ_REPLICA_URI"


# Redis Config
def _is_bare_redis_host_port(url: str) -> bool:
    return bool(url) and not url.startswith(("redis://", "rediss://"))


REDIS_URL = os.environ.get("REDIS_URL")
_aws_region = os.environ.get("AWS_REGION", "us-east-1")
_has_elasticache = (
    _has_aws_credentials
    and os.environ.get("ELASTICACHE_SECRET_ARN")
)

# ElastiCache case 3: REDIS_URL not set — fetch host, port, token from Secrets Manager.
if not REDIS_URL and _has_elasticache:
    from plane.utils.aws_secrets import get_secret

    _ec_secret = get_secret(os.environ["ELASTICACHE_SECRET_ARN"], _aws_region)
    REDIS_URL = "rediss://:{token}@{host}:{port}".format(
        token=quote(_ec_secret.get(os.environ.get("REDIS_AUTH_TOKEN_KEY"), ""), safe=""),
        host=_ec_secret.get(os.environ.get("REDIS_HOST_KEY"), ""),
        port=_ec_secret.get(os.environ.get("REDIS_PORT_KEY"), 6379),
    )
# ElastiCache case 4: REDIS_URL is bare host:port — fetch token from Secrets Manager only.
elif REDIS_URL and _is_bare_redis_host_port(REDIS_URL) and _has_elasticache:
    from plane.utils.aws_secrets import get_secret

    _ec_secret = get_secret(os.environ["ELASTICACHE_SECRET_ARN"], _aws_region)
    _token = quote(_ec_secret.get(os.environ.get("REDIS_AUTH_TOKEN_KEY", "token"), ""), safe="")
    REDIS_URL = f"rediss://:{_token}@{REDIS_URL}"

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


def _is_bare_amqp_host_port(url: str) -> bool:
    return bool(url) and not url.startswith(("amqp://", "amqps://"))


AMQP_URL = os.environ.get("AMQP_URL")
_aws_region_mq = os.environ.get("AWS_REGION", "us-east-1")
_has_amazonmq = (
    _has_aws_credentials
    and os.environ.get("AMAZONMQ_SECRET_ARN")
)

# AmazonMQ: AMQP_URL not set — build URL from full secret (user, password, host, port, vhost) in Secrets Manager.
if not AMQP_URL and _has_amazonmq:
    from plane.utils.aws_secrets import get_secret

    _mq_secret = get_secret(os.environ["AMAZONMQ_SECRET_ARN"], _aws_region_mq)
    AMQP_URL = "amqps://{user}:{password}@{host}:{port}/{vhost}".format(
        user=quote(_mq_secret.get(os.environ.get("RABBITMQ_USER_KEY"), ""), safe=""),
        password=quote(_mq_secret.get(os.environ.get("RABBITMQ_PASSWORD_KEY"), ""), safe=""),
        host=_mq_secret.get(os.environ.get("RABBITMQ_HOST_KEY"), ""),
        port=_mq_secret.get(os.environ.get("RABBITMQ_PORT_KEY"), 5671),
        vhost=quote(_mq_secret.get(os.environ.get("RABBITMQ_VHOST_KEY"), "/"), safe=""),
    )
# AmazonMQ: AMQP_URL is bare host:port — build amqps URL with username/password from Secrets Manager, vhost from env.
elif AMQP_URL and _is_bare_amqp_host_port(AMQP_URL) and _has_amazonmq:
    from plane.utils.aws_secrets import get_secret

    _mq_secret = get_secret(os.environ["AMAZONMQ_SECRET_ARN"], _aws_region_mq)
    _vhost = quote(os.environ.get("RABBITMQ_VHOST", "/"), safe="")
    AMQP_URL = "amqps://{user}:{password}@{host}/{vhost}".format(
        user=quote(_mq_secret.get(os.environ.get("RABBITMQ_USER_KEY"), ""), safe=""),
        password=quote(_mq_secret.get(os.environ.get("RABBITMQ_PASSWORD_KEY"), ""), safe=""),
        host=AMQP_URL,
        vhost=_vhost,
    )

# Celery Configuration
if AMQP_URL:
    CELERY_BROKER_URL = AMQP_URL
else:
    CELERY_BROKER_URL = "amqp://{user}:{password}@{host}:{port}/{vhost}".format(
        user=quote(RABBITMQ_USER, safe=""),
        password=quote(RABBITMQ_PASSWORD, safe=""),
        host=RABBITMQ_HOST,
        port=RABBITMQ_PORT,
        vhost=quote(RABBITMQ_VHOST, safe=""),
    )


CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["application/json"]

# Automation Consumer Settings
AUTOMATION_EVENT_STREAM_QUEUE_NAME = os.environ.get(
    "AUTOMATION_EVENT_STREAM_QUEUE_NAME", "plane.event_stream.automations"
)
AUTOMATION_EXCHANGE_NAME = os.environ.get("AUTOMATION_EXCHANGE_NAME", "plane.event_stream")
AUTOMATION_EVENT_TYPES = ["workitem.", "issue."]

CELERY_IMPORTS = (
    # scheduled tasks
    "plane.bgtasks.issue_automation_task",
    "plane.bgtasks.exporter_expired_task",
    "plane.bgtasks.data_import_task",
    "plane.bgtasks.file_asset_task",
    "plane.bgtasks.email_notification_task",
    "plane.bgtasks.cleanup_task",
    "plane.bgtasks.logger_task",
    "plane.license.bgtasks.tracer",
    "plane.license.bgtasks.version_check_task",
    # payment tasks
    "plane.payment.bgtasks.workspace_subscription_sync_task",
    "plane.payment.bgtasks.free_seat_sync",
    "plane.payment.bgtasks.update_license_task",
    # management tasks
    "plane.bgtasks.transfer_api_log_task",
    "plane.bgtasks.hard_delete_api_log_task",
    "plane.bgtasks.transfer_email_notification_log_task",
    "plane.bgtasks.hard_delete_email_notification_log_task",
    "plane.bgtasks.transfer_webhook_log_task",
    "plane.bgtasks.hard_delete_webhook_log_task",
    "plane.bgtasks.hard_delete_user_recent_visit_task",
    "plane.bgtasks.dummy_data_task",
    "plane.bgtasks.copy_project_data_task",
    "plane.bgtasks.copy_workspace_data_task",
    # issue version tasks
    "plane.bgtasks.issue_version_sync",
    "plane.bgtasks.issue_description_version_sync",
    "plane.bgtasks.silo_data_migration_task",
    "plane.bgtasks.silo_credentials_update_task",
    "plane.bgtasks.project_subscriber_task",
    "plane.bgtasks.link_crawler_task",
    # ee tasks
    "plane.ee.bgtasks.entity_issue_state_progress_task",
    "plane.ee.bgtasks.app_bot_task",
    "plane.authentication.bgtasks.send_app_uninstall_webhook",
    "plane.ee.bgtasks.batched_search_update_task",
    "plane.ee.bgtasks.recurring_work_item_task",
    "plane.ee.bgtasks.cycle_automation_task",
    # silo tasks
    "plane.silo.bgtasks.toggle_issue_properties_task",
    "plane.silo.bgtasks.integration_apps_task",
    "plane.silo.bgtasks.bulk_update_issue_relations_task",
    "plane.silo.bgtasks.bulk_update_issue_relations_task_v2",
    "plane.silo.bgtasks.generate_job_summary",
    # event stream tasks
    "plane.event_stream.bgtasks.outbox_cleaner",
    # webhook tasks
    "plane.webhook.bgtasks.webhook_task",
    # agents tasks
    "plane.agents.bgtasks.agent_run_agent_assigned_task",
    "plane.agents.bgtasks.agent_run_user_comment_task",
    "plane.agents.bgtasks.agent_run_activity_webhook",
    "plane.agents.bgtasks.agent_run_webhook",
    # authentication tasks
    "plane.authentication.bgtasks.group_sync_task",
)

# Application Envs
SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN", False)
FILE_SIZE_LIMIT = int(os.environ.get("FILE_SIZE_LIMIT", 5242880))
PRO_FILE_SIZE_LIMIT = int(os.environ.get("PRO_FILE_SIZE_LIMIT", 104857600))

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

# MongoDB Settings
MONGO_DB_URL = os.environ.get("MONGO_DB_URL", False)

# Cookie Settings
SESSION_COOKIE_SECURE = secure_origins
SESSION_COOKIE_HTTPONLY = True
SESSION_ENGINE = "plane.db.models.session"
SESSION_COOKIE_AGE = int(os.environ.get("SESSION_COOKIE_AGE", 604800))
SESSION_COOKIE_NAME = os.environ.get("SESSION_COOKIE_NAME", "session-id")
SESSION_COOKIE_DOMAIN = os.environ.get("SESSION_COOKIE_DOMAIN", None)
SESSION_SAVE_EVERY_REQUEST = os.environ.get("SESSION_SAVE_EVERY_REQUEST", "0") == "1"
# If on cloud, set the session cookie domain to the cloud domain else None
if not IS_SELF_MANAGED:
    SESSION_COOKIE_DOMAIN = os.environ.get("SESSION_COOKIE_DOMAIN", ".plane.so")
else:
    SESSION_COOKIE_DOMAIN = None


# Admin Cookie
ADMIN_SESSION_COOKIE_NAME = "admin-session-id"
ADMIN_SESSION_COOKIE_AGE = int(os.environ.get("ADMIN_SESSION_COOKIE_AGE", 3600))

# Concurrent Session Limit
MAX_CONCURRENT_SESSIONS = int(os.environ.get("MAX_CONCURRENT_SESSIONS", 5))

# CSRF cookies
CSRF_COOKIE_SECURE = secure_origins
CSRF_COOKIE_HTTPONLY = True
CSRF_TRUSTED_ORIGINS = cors_allowed_origins
CSRF_COOKIE_DOMAIN = os.environ.get("SESSION_COOKIE_DOMAIN", None)
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
LIVE_BASE_PATH = os.environ.get("LIVE_BASE_PATH", "live/")

LIVE_URL = urljoin(LIVE_BASE_URL, LIVE_BASE_PATH) if LIVE_BASE_URL else None
LIVE_SERVER_SECRET_KEY = os.environ.get("LIVE_SERVER_SECRET_KEY", "")

PI_BASE_URL = os.environ.get("PI_BASE_URL", "")
PI_BASE_PATH = os.environ.get("PI_BASE_PATH", "/pi")
PI_URL = urljoin(PI_BASE_URL, PI_BASE_PATH).rstrip("/")
PI_INTERNAL_SECRET = os.environ.get("PI_INTERNAL_SECRET", "")

# WEB URL
WEB_URL = os.environ.get("WEB_URL")

# Silo Base URL
SILO_BASE_URL = os.environ.get("SILO_BASE_URL", None)
if not SILO_BASE_URL:
    SILO_BASE_URL = WEB_URL or APP_BASE_URL
SILO_BASE_PATH = os.environ.get("SILO_BASE_PATH", "/silo")
SILO_URL = urljoin(SILO_BASE_URL, SILO_BASE_PATH)

RUNNER_BASE_URL = os.environ.get("RUNNER_BASE_URL", "")

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
    # SQL
    "application/x-sql",
    # Markdown
    "text/markdown",
]


# Seed directory path
SEED_DIR = os.path.join(BASE_DIR, "seeds")

# Prime Server Base url
PRIME_SERVER_BASE_URL = os.environ.get("PRIME_SERVER_BASE_URL", False)
PRIME_SERVER_AUTH_TOKEN = os.environ.get("PRIME_SERVER_AUTH_TOKEN", "")

# payment server base url
PAYMENT_SERVER_BASE_URL = os.environ.get("PAYMENT_SERVER_BASE_URL", False)
PAYMENT_SERVER_AUTH_TOKEN = os.environ.get("PAYMENT_SERVER_AUTH_TOKEN", "")

# feature flag server base urls
FEATURE_FLAG_SERVER_BASE_URL = os.environ.get("FEATURE_FLAG_SERVER_BASE_URL", False)
FEATURE_FLAG_SERVER_AUTH_TOKEN = os.environ.get("FEATURE_FLAG_SERVER_AUTH_TOKEN", "")

# Instance Changelog URL
INSTANCE_CHANGELOG_URL = os.environ.get("INSTANCE_CHANGELOG_URL", "")

# JWT Settings
SIMPLE_JWT = {
    # The number of seconds the access token will be valid
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.environ.get("ACCESS_TOKEN_LIFETIME", 15))),
    # The number of seconds the refresh token will be valid
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.environ.get("REFRESH_TOKEN_LIFETIME", 90))),
    # The number of seconds the refresh token will be valid
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    # Algorithm used to sign the token
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# silo hmac secret key
SILO_HMAC_SECRET_KEY = os.environ.get("SILO_HMAC_SECRET_KEY", "")
RUNNER_HMAC_SECRET_KEY = os.environ.get("RUNNER_HMAC_SECRET_KEY", "")


# firebase settings
IS_MOBILE_PUSH_NOTIFICATION_ENABLED = os.environ.get("IS_MOBILE_PUSH_NOTIFICATION_ENABLED", "0") == "1"
FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "")
FIREBASE_PRIVATE_KEY_ID = os.environ.get("FIREBASE_PRIVATE_KEY_ID", "")
FIREBASE_PRIVATE_KEY = os.environ.get("FIREBASE_PRIVATE_KEY", "")
FIREBASE_CLIENT_EMAIL = os.environ.get("FIREBASE_CLIENT_EMAIL", "")
FIREBASE_CLIENT_ID = os.environ.get("FIREBASE_CLIENT_ID", "")
FIREBASE_CLIENT_CERT_URL = os.environ.get("FIREBASE_CLIENT_CERT_URL", "")

# Oauth Provider Settings
from plane.authentication.utils import is_pkce_required  # noqa
from plane.utils.oauth import ALL_OAUTH_SCOPES, READ_SCOPE, WRITE_SCOPE  # noqa

OAUTH2_PROVIDER_ACCESS_TOKEN_MODEL = "authentication.AccessToken"
OAUTH2_PROVIDER_APPLICATION_MODEL = "authentication.Application"
OAUTH2_PROVIDER_GRANT_MODEL = "authentication.Grant"
OAUTH2_PROVIDER_REFRESH_TOKEN_MODEL = "authentication.RefreshToken"
OAUTH2_PROVIDER_ID_TOKEN_MODEL = "authentication.IDToken"


OAUTH2_PROVIDER = {
    "AUTHORIZATION_CODE_EXPIRE_SECONDS": 60,  # 1 minute
    "OAUTH2_VALIDATOR_CLASS": "plane.authentication.views.oauth.CustomOAuth2Validator",
    "ALLOWED_GRANT_TYPES": [
        "authorization_code",
        "client_credentials",
        "refresh_token",
    ],
    "PKCE_REQUIRED": is_pkce_required,
    "SCOPES": ALL_OAUTH_SCOPES,
    "DEFAULT_SCOPES": [READ_SCOPE, WRITE_SCOPE],
}

# OpenSearch settings
OPENSEARCH_ENABLED = os.environ.get("OPENSEARCH_ENABLED", "0") == "1"

if OPENSEARCH_ENABLED:
    # OpenSearch Index Settings
    OPENSEARCH_INDEX_PREFIX = os.environ.get("OPENSEARCH_INDEX_PREFIX", "")
    OPENSEARCH_SHARD_COUNT = os.environ.get("OPENSEARCH_SHARD_COUNT", 1)
    OPENSEARCH_REPLICA_COUNT = os.environ.get("OPENSEARCH_REPLICA_COUNT", 0)

    # Text Search Performance Optimization
    OPENSEARCH_SEARCH_TIMEOUT = int(os.environ.get("OPENSEARCH_SEARCH_TIMEOUT", "60"))  # seconds
    OPENSEARCH_MAX_PAGE_SIZE = int(os.environ.get("OPENSEARCH_MAX_PAGE_SIZE", "100"))
    OPENSEARCH_DEFAULT_PAGE_SIZE = int(os.environ.get("OPENSEARCH_DEFAULT_PAGE_SIZE", "25"))

    # Optimizations for 2-active-data-node setup with heavy indexing
    OPENSEARCH_BULK_CHUNK_SIZE = int(os.environ.get("OPENSEARCH_BULK_CHUNK_SIZE", "500"))  # Smaller chunks
    OPENSEARCH_INDEXING_TIMEOUT = int(os.environ.get("OPENSEARCH_INDEXING_TIMEOUT", "120"))  # Longer indexing timeout

    OPENSEARCH_ISSUE_INDEX_DEFAULT_PIPELINE = os.environ.get("OPENSEARCH_ISSUE_INDEX_DEFAULT_PIPELINE", None)
    OPENSEARCH_PAGE_INDEX_DEFAULT_PIPELINE = os.environ.get("OPENSEARCH_PAGE_INDEX_DEFAULT_PIPELINE", None)
    OPENSEARCH_EMBEDDING_DIMENSION = int(os.environ.get("OPENSEARCH_EMBEDDING_DIMENSION", "1536"))

    # Batch processing and memory optimization
    OPENSEARCH_UPDATE_CHUNK_SIZE = int(
        os.environ.get("OPENSEARCH_UPDATE_CHUNK_SIZE", "1000")
    )  # Chunk size for processing queued updates

    # OpenSearch Config: If explicit creds (OPENSEARCH_USERNAME / OPENSEARCH_PASSWORD) are provided,
    # they take precedence over IAM auth. IAM auth (SigV4) is used when AWS credentials are present
    # via IRSA (AWS_ROLE_ARN) or EKS Pod Identity (AWS_CONTAINER_CREDENTIALS_FULL_URI).
    _os_username = os.environ.get("OPENSEARCH_USERNAME")
    _os_password = os.environ.get("OPENSEARCH_PASSWORD")

    if _has_aws_credentials and not (_os_username and _os_password):
        import boto3
        from opensearchpy import RequestsHttpConnection
        from requests_aws4auth import AWS4Auth

        _os_credentials = boto3.Session().get_credentials().get_frozen_credentials()
        _os_awsauth = AWS4Auth(
            _os_credentials.access_key,
            _os_credentials.secret_key,
            os.environ.get("AWS_REGION", "us-east-1"),
            "es",
            session_token=_os_credentials.token,
        )
        _os_auth_config = {
            "http_auth": _os_awsauth,
            "connection_class": RequestsHttpConnection,
            "verify_certs": True,
        }
    else:
        _os_auth_config = {
            "http_auth": (_os_username, _os_password) if _os_username and _os_password else None,
            "verify_certs": False,
        }

    OPENSEARCH_DSL = {
        "default": {
            "hosts": os.environ.get("OPENSEARCH_URL"),
            "use_ssl": True,
            "ssl_show_warn": False,
            "timeout": OPENSEARCH_SEARCH_TIMEOUT,
            # Connection pool optimization for 2-data-node setup
            "maxsize": 15,  # Reduced from 25 to not overwhelm 2 data nodes
            "max_retries": 3,
            "retry_on_timeout": True,
            # Bulk indexing optimizations
            "http_compress": True,  # Reduce network overhead
            **_os_auth_config,
        }
    }
    # Use batched signal processor (only supported mode)
    OPENSEARCH_DSL_SIGNAL_PROCESSOR = os.environ.get(
        "OPENSEARCH_DSL_SIGNAL_PROCESSOR",
        "plane.ee.documents.core.signals.BatchedCelerySignalProcessor",
    )

    INSTALLED_APPS += ["django_opensearch_dsl"]

# Web URL
WEB_URL = os.environ.get("WEB_URL", "http://localhost:3000")

# admin email for user deletion
MOBILE_USER_DELETE_ADMIN_EMAILS = os.environ.get("MOBILE_USER_DELETE_ADMIN_EMAILS", "")

# Intake Email Domain
INTAKE_EMAIL_DOMAIN = os.environ.get("INTAKE_EMAIL_DOMAIN", "example.com")

# DRF Spectacular settings
ENABLE_DRF_SPECTACULAR = os.environ.get("ENABLE_DRF_SPECTACULAR", "0") == "1"

if ENABLE_DRF_SPECTACULAR:
    REST_FRAMEWORK["DEFAULT_SCHEMA_CLASS"] = "drf_spectacular.openapi.AutoSchema"
    INSTALLED_APPS.append("drf_spectacular")
    from .openapi import SPECTACULAR_SETTINGS  # noqa: F401

# MongoDB Settings
MONGO_DB_URL = os.environ.get("MONGO_DB_URL", False)
MONGO_DB_DATABASE = os.environ.get("MONGO_DB_DATABASE", False)

# Airgapped settings
IS_AIRGAPPED = os.environ.get("IS_AIRGAPPED", "0") == "1"

ENABLE_OUTBOX_POLLER = os.environ.get("ENABLE_OUTBOX_POLLER", "0") == "1"

USE_STORAGE_PROXY = os.environ.get("USE_STORAGE_PROXY", "0") == "1"

# API Token limit settings

DEFAULT_API_RATE_LIMIT = os.environ.get("DEFAULT_API_RATE_LIMIT", "60/min")
PRO_PLAN_API_RATE_LIMIT = os.environ.get("PRO_PLAN_API_RATE_LIMIT", "300/min")
BUSINESS_PLAN_API_RATE_LIMIT = os.environ.get("BUSINESS_PLAN_API_RATE_LIMIT", "1000/min")
ENTERPRISE_PLAN_API_RATE_LIMIT = os.environ.get("ENTERPRISE_PLAN_API_RATE_LIMIT", "3000/min")

# Agent settings
AGENT_RUN_STALE_TIMEOUT_IN_MINS = int(os.environ.get("AGENT_RUN_STALE_TIMEOUT_IN_MINS", 5))

# IDP sync rate limit delay
IDP_SYNC_RATE_LIMIT_DELAY = os.environ.get("IDP_SYNC_RATE_LIMIT_DELAY", 0.5)
# Chat Support Identity Verification
CHAT_SUPPORT_IDENTITY_VERIFICATION_SECRET = os.environ.get("CHAT_SUPPORT_IDENTITY_VERIFICATION_SECRET", "")
