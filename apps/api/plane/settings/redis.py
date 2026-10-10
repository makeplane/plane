# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import redis
from django.conf import settings


def redis_instance():
    # connect to redis
    if settings.REDIS_SSL:
        # Use the same URL parsing for TLS credentials, database and query options.
        ri = redis.Redis.from_url(settings.REDIS_URL, db=0, ssl_cert_reqs=None)
    else:
        ri = redis.Redis.from_url(settings.REDIS_URL, db=0)

    return ri
