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

"""Production settings"""

import os

from .common import *  # noqa

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = int(os.environ.get("DEBUG", 0)) == 1

# Honor the 'X-Forwarded-Proto' header for request.is_secure()
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

if os.environ.get("IS_MULTI_CLOUD", "0") == "1":
    SECURE_SSL_REDIRECT = True
else:
    SECURE_SSL_REDIRECT = False

# Scout Settings
SCOUT_MONITOR = os.environ.get("SCOUT_MONITOR", False)
SCOUT_KEY = os.environ.get("SCOUT_KEY", "")
SCOUT_NAME = "Plane"

LOG_DIR = os.path.join(BASE_DIR, "logs")  # noqa

if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

# Logging configuration
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
        "console_json": {
            "class": "logging.StreamHandler",
            "formatter": "json",
            "level": "INFO",
        },
        "console_verbose": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
            "level": "DEBUG",
        },
        "file": {
            "class": "plane.utils.logging.SizedTimedRotatingFileHandler",
            "filename": (
                os.path.join(BASE_DIR, "logs", "plane-debug.log")  # noqa
                if DEBUG
                else os.path.join(BASE_DIR, "logs", "plane-error.log")  # noqa
            ),
            "when": "s",
            "maxBytes": 1024 * 1024 * 1,
            "interval": 1,
            "backupCount": 5,
            "formatter": "json",
            "level": "DEBUG" if DEBUG else "ERROR",
        },
    },
    "loggers": {
        # Root logger - catches any unconfigured loggers
        "": {
            "level": "WARNING",
            "handlers": ["console_json"],
        },
        # Django loggers - explicitly configured with our JSON handler
        "django": {
            "level": "WARNING",
            "handlers": ["console_json"],
            "propagate": False,
        },
        # Parent logger for all plane.* loggers
        "plane": {
            "level": "DEBUG" if DEBUG else "INFO",
            "handlers": ["console_json"],
            "propagate": False,
        },
        "plane.api.request": {
            "level": "DEBUG" if DEBUG else "INFO",
            "handlers": ["console_json"],
            "propagate": False,
        },
        "plane.api": {
            "level": "DEBUG" if DEBUG else "INFO",
            "handlers": ["console_json"],
            "propagate": False,
        },
        "plane.worker": {
            "level": "DEBUG" if DEBUG else "INFO",
            "handlers": ["console_json"],
            "propagate": False,
        },
        "plane.exception": {
            "level": "DEBUG" if DEBUG else "ERROR",
            "handlers": ["console_json", "file"],
            "propagate": False,
        },
        "plane.external": {
            "level": "INFO",
            "handlers": ["console_json"],
            "propagate": False,
        },
        "plane.mongo": {
            "level": "INFO",
            "handlers": ["console_json"],
            "propagate": False,
        },
        "plane.migrations": {
            "level": "DEBUG" if DEBUG else "INFO",
            "handlers": ["console_json"],
            "propagate": False,
        },
        "plane.silo": {
            "level": "DEBUG" if DEBUG else "INFO",
            "handlers": ["console_json"],
            "propagate": False,
        },
        "plane.event_stream": {
            "level": "INFO",
            "handlers": ["console_json"],
            "propagate": False,
        },
        "plane.automations.consumer": {
            "level": "INFO",
            "handlers": ["console_json"],
            "propagate": False,
        },
        "plane.authentication": {
            "level": "INFO",
            "handlers": ["console_json"],
            "propagate": False,
        },
        "plane.payments": {
            "level": "INFO",
            "handlers": ["console_json"],
            "propagate": False,
        },
        "plane.webhook": {
            "level": "INFO",
            "handlers": ["console_json"],
            "propagate": False,
        },
    },
}
