# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Routes whose requests and responses carry work item text. APITokenLogMiddleware (plane/middleware/logger.py,
# hook marked "Liviere/plane fork") keeps a row for them in api_activity_logs, but without the query string,
# the request body and the response body. Kept free of model imports: the middleware imports it at load time.

import re

_PRIVATE_API_PATHS = (re.compile(r"^/api/v1/workspaces/[^/]+/liviere/search/?$"),)


def is_private_api_path(path):
    return any(pattern.match(path or "") for pattern in _PRIVATE_API_PATHS)
