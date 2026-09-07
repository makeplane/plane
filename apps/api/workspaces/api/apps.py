# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.apps import AppConfig


class ApiConfig(AppConfig):
    name = "workspaces.api"

    def ready(self):
        # Import authentication extensions to register them with drf-spectacular
        try:
            import workspaces.utils.openapi.auth  # noqa
        except ImportError:
            pass
