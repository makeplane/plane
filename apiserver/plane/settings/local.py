"""Development settings"""

import os

from .common import *  # noqa

DEBUG = True

# Debug Toolbar settings
INSTALLED_APPS += ("debug_toolbar",)  # noqa
MIDDLEWARE += ("debug_toolbar.middleware.DebugToolbarMiddleware",)  # noqa

DEBUG_TOOLBAR_PATCH_SETTINGS = False

# Only show emails in console don't send it to smtp
EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend"
)

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,  # noqa
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    }
}

INTERNAL_IPS = ("127.0.0.1",)

MEDIA_URL = "/uploads/"
MEDIA_ROOT = os.path.join(BASE_DIR, "uploads")  # noqa

LOG_DIR = os.path.join(BASE_DIR, "logs")  # noqa

if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": True,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "fmt": "%(levelname)s %(asctime)s %(module)s %(name)s %(message)s",
        },
    },
    "handlers": {
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
            "formatter": "json",
        }
    },
    "loggers": {
        "plane.api.request": {
            "level": "INFO",
            "handlers": ["console"],
            "propagate": False,
        },
        "plane.api": {"level": "INFO", "handlers": ["console"], "propagate": False},
        "plane.worker": {"level": "INFO", "handlers": ["console"], "propagate": False},
        "plane.exception": {
            "level": "ERROR",
            "handlers": ["console"],
            "propagate": False,
        },
        "plane.external": {
            "level": "INFO",
            "handlers": ["console"],
            "propagate": False,
        },
    },
}
