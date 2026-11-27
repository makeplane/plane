# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Routes whose requests and responses carry work item or decision text. APITokenLogMiddleware
# (plane/middleware/logger.py, hook marked "Liviere/plane fork") keeps a row for them in api_activity_logs, but
# without the query string, the request body and the response body. Kept free of model imports: the middleware
# imports it at load time.

import re

_PRIVATE_API_PATHS = (
    re.compile(r"^/api/v1/workspaces/[^/]+/liviere/search/?$"),
    # Decision register (plane/liviere/decisions): requests and responses carry the text of decisions. Both
    # trees: a request with an X-Api-Key header to the session routes is refused (401) but logged all the same
    re.compile(r"^/api/(v1/)?workspaces/[^/]+/projects/[^/]+/liviere/decisions(/.*)?$"),
)


def is_private_api_path(path):
    return any(pattern.match(path or "") for pattern in _PRIVATE_API_PATHS)
