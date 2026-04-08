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

"""
Artifact Handlers — routes external tool names to their handler.

Usage::

    from pi.services.actions.artifacts.handlers import get_handler_optional

    handler = get_handler_optional(tool_name)
    if handler:
        artifact = await handler.create_artifact(...)
        result = await handler.execute(...)

To add a new integration, create a handler subclassing ``ExternalHandler``
and register it below with ``_register()``.
"""

from typing import List
from typing import Optional

from pi.services.actions.artifacts.handlers.base import ExternalHandler

# ---------------------------------------------------------------------------
# Handler registry (module-level singleton list)
# ---------------------------------------------------------------------------

_handlers: List[ExternalHandler] = []


def _register(handler: ExternalHandler) -> None:
    """Register an external handler."""
    _handlers.append(handler)


def get_handler_optional(tool_name: str) -> Optional[ExternalHandler]:
    """Return the handler for *tool_name*, or ``None`` if none matches."""
    for handler in _handlers:
        if handler.can_handle(tool_name):
            return handler
    return None


# ---------------------------------------------------------------------------
# Auto-register all handlers on import
# ---------------------------------------------------------------------------

from .mcp import MCPHandler  # noqa: E402

_register(MCPHandler())

__all__ = [
    "get_handler_optional",
    "MCPHandler",
]
