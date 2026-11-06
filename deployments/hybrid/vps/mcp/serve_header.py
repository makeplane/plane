# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Nexus entrypoint for the official Plane MCP server (Community Edition).

Upstream's `http` mode always builds its OAuth and SSE endpoints, which need a
Plane OAuth app that Community Edition does not provide, so it refuses to start.
This serves only the header-auth MCP endpoint at /mcp: each client sends its own
Plane personal access token (Authorization: Bearer <PAT>) and X-Workspace-slug,
and every call runs as that user against the internal API.
"""

import logging
import sys

import uvicorn

# Importing __main__ installs upstream's JSON log formatting and user-context filter.
from plane_mcp.__main__ import JSONFormatter, UserContextFilter
from plane_mcp.server import get_header_mcp

app = get_header_mcp().http_app(path="/mcp", stateless_http=True)

for name in ("uvicorn", "uvicorn.error"):
    log = logging.getLogger(name)
    for h in log.handlers[:]:
        log.removeHandler(h)
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(JSONFormatter())
    handler.addFilter(UserContextFilter())
    log.addHandler(handler)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8211, log_level="info", access_log=False)
