# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Test Settings"""

from .common import *  # noqa

DEBUG = True

# Send it in a dummy outbox
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

INSTALLED_APPS.append(  # noqa
    "plane.tests"
)

# --- test-only Celery override --------------------------------------------
#
# ``plane.db.mixins`` calls ``soft_delete_related_objects.delay(...)``
# inside ``Model.delete()``. Without an eager broker, the test suite
# would either block on a real broker (Redis / RabbitMQ) or fail
# ``ACCESS_REFUSED`` when none is reachable. ``task_always_eager``
# executes the task synchronously in the same process so unit tests
# don't need a broker at all.
#
# ``task_eager_propagates`` re-raises exceptions inside the test
# thread so a failing task surfaces as a real test failure rather
# than silently disappearing.
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

