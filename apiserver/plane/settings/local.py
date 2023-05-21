"""Development settings and globals."""

from __future__ import absolute_import

import dj_database_url
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.redis import RedisIntegration


from .common import *  # noqa

DEBUG = True

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql_psycopg2",
        "NAME": "plane",
        "USER": "",
        "PASSWORD": "",
        "HOST": "",
    }
}

DOCKERIZED = int(os.environ.get(
    "DOCKERIZED", 0
))  == 1

if DOCKERIZED:
    DATABASES["default"] = dj_database_url.config()

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

INSTALLED_APPS += ("debug_toolbar",)

MIDDLEWARE += ("debug_toolbar.middleware.DebugToolbarMiddleware",)

DEBUG_TOOLBAR_PATCH_SETTINGS = False

INTERNAL_IPS = ("127.0.0.1",)

CORS_ORIGIN_ALLOW_ALL = True

if os.environ.get("SENTRY_DSN", False):
    sentry_sdk.init(
        dsn=os.environ.get("SENTRY_DSN"),
        integrations=[DjangoIntegration(), RedisIntegration()],
        # If you wish to associate users to errors (assuming you are using
        # django.contrib.auth) you may enable sending PII data.
        send_default_pii=True,
        environment="local",
        traces_sample_rate=0.7,
    )

REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_URL = os.environ.get("REDIS_URL")


MEDIA_URL = "/uploads/"
MEDIA_ROOT = os.path.join(BASE_DIR, "uploads")

if DOCKERIZED:
    REDIS_URL = os.environ.get("REDIS_URL")

WEB_URL = os.environ.get("WEB_URL", "localhost:3000")
PROXY_BASE_URL = os.environ.get("PROXY_BASE_URL", False)

ANALYTICS_SECRET_KEY = os.environ.get("ANALYTICS_SECRET_KEY", False)
ANALYTICS_BASE_API = os.environ.get("ANALYTICS_BASE_API", False)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", False)
GPT_ENGINE = os.environ.get("GPT_ENGINE", "text-davinci-003")

SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN", False)

LOGGER_BASE_URL = os.environ.get("LOGGER_BASE_URL", False)

CELERY_RESULT_BACKEND = os.environ.get("REDIS_URL")
CELERY_BROKER_URL = os.environ.get("REDIS_URL")


GITHUB_ACCESS_TOKEN = os.environ.get("GITHUB_ACCESS_TOKEN", False)