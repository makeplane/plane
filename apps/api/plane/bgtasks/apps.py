# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.apps import AppConfig


class BgtasksConfig(AppConfig):
    name = "plane.bgtasks"

    def ready(self):
        # Register Lark autojoin signal handler. Imported here so Django sees
        # the @receiver decorator at startup. The handler is a no-op unless
        # LARK_AUTO_JOIN_NEW_PROJECTS is enabled at the env level.
        from plane.bgtasks import signals  # noqa: F401
