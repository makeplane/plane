# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Test Settings"""

from .common import *  # noqa

DEBUG = True

# Required by plane.utils.host.base_host() — prevents ImproperlyConfigured in tests
WEB_URL = "http://localhost:3000"

# Send it in a dummy outbox
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Run Celery tasks synchronously in-process so tests don't need a broker
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Disable Redis for unit tests (not needed, Celery runs in-process)
REDIS_URL = None
REDIS_SSL = False

# Remove optional apps not available in test environment
INSTALLED_APPS = [  # noqa
    app for app in INSTALLED_APPS if app != "django_celery_beat"  # noqa: F405
]
INSTALLED_APPS.append("plane.tests")
