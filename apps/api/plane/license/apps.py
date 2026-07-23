# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.apps import AppConfig


class LicenseConfig(AppConfig):
    name = "plane.license"

    def ready(self):
        from plane.license import signals  # noqa: F401
