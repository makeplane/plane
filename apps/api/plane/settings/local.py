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

"""Development settings"""

import os

from .common import *  # noqa

DEBUG = True

# Debug Toolbar settings
INSTALLED_APPS += ("debug_toolbar",)  # noqa
MIDDLEWARE += ("debug_toolbar.middleware.DebugToolbarMiddleware",)  # noqa

DEBUG_TOOLBAR_PATCH_SETTINGS = False

# Only show emails in console don't send it to smtp
EMAIL_BACKEND = os.environ.get("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")

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

DEFAULT_LOG_HANDLER = "console_verbose"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": True,
    "formatters": {
        "verbose": {"format": "%(asctime)s [%(process)d] %(levelname)s %(name)s: %(message)s"},
        "json": {
            "()": "pythonjsonlogger.json.JsonFormatter",
            "fmt": "%(levelname)s %(asctime)s %(module)s %(name)s %(message)s",
        },
    },
    "handlers": {
        "console_verbose": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
            "level": "DEBUG",
        },
        "console_json": {
            "class": "logging.StreamHandler",
            "formatter": "json",
            "level": "DEBUG",
        },
    },
    "loggers": {
        # Root logger - catches any unconfigured loggers
        "": {
            "level": "WARNING",
            "handlers": [DEFAULT_LOG_HANDLER],
        },
        # Django loggers - explicitly configured with our handler
        "django": {
            "level": "WARNING",
            "handlers": [DEFAULT_LOG_HANDLER],
            "propagate": False,
        },
        # SQL query logging - set to DEBUG to see all queries
        "django.db.backends": {
            "level": "INFO",
            "handlers": [DEFAULT_LOG_HANDLER],
            "propagate": False,
        },
        # Parent logger for all plane.* loggers
        "plane": {
            "level": "DEBUG" if DEBUG else "INFO",
            "handlers": [DEFAULT_LOG_HANDLER],
            "propagate": False,
        },
        "plane.api.request": {
            "level": "DEBUG" if DEBUG else "INFO",
            "handlers": [DEFAULT_LOG_HANDLER],
            "propagate": False,
        },
        "plane.api": {
            "level": "DEBUG" if DEBUG else "INFO",
            "handlers": [DEFAULT_LOG_HANDLER],
            "propagate": False,
        },
        "plane.worker": {
            "level": "DEBUG" if DEBUG else "INFO",
            "handlers": [DEFAULT_LOG_HANDLER],
            "propagate": False,
        },
        "plane.exception": {
            "level": "DEBUG" if DEBUG else "ERROR",
            "handlers": [DEFAULT_LOG_HANDLER],
            "propagate": False,
        },
        "plane.external": {
            "level": "INFO",
            "handlers": [DEFAULT_LOG_HANDLER],
            "propagate": False,
        },
        "plane.mongo": {
            "level": "INFO",
            "handlers": [DEFAULT_LOG_HANDLER],
            "propagate": False,
        },
        "plane.migrations": {
            "level": "DEBUG" if DEBUG else "INFO",
            "handlers": [DEFAULT_LOG_HANDLER],
            "propagate": False,
        },
        "plane.silo": {
            "level": "DEBUG" if DEBUG else "INFO",
            "handlers": [DEFAULT_LOG_HANDLER],
            "propagate": False,
        },
        "plane.event_stream": {
            "level": "INFO",
            "handlers": [DEFAULT_LOG_HANDLER],
            "propagate": False,
        },
        "plane.automations.consumer": {
            "level": "INFO",
            "handlers": [DEFAULT_LOG_HANDLER],
            "propagate": False,
        },
        "plane.authentication": {
            "level": "INFO",
            "handlers": [DEFAULT_LOG_HANDLER],
            "propagate": False,
        },
        "plane.payments": {
            "level": "INFO",
            "handlers": [DEFAULT_LOG_HANDLER],
            "propagate": False,
        },
        "plane.webhook": {
            "level": "INFO",
            "handlers": [DEFAULT_LOG_HANDLER],
            "propagate": False,
        },
    },
}
