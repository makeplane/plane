# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.apps import AppConfig


class AIAccountsConfig(AppConfig):
    name = "plane.ai_accounts"

    def ready(self):
        from . import signals  # noqa: F401
