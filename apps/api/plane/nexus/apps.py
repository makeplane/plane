# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.apps import AppConfig


class NexusConfig(AppConfig):
    """Nexus additions to the public API: the endpoints Plane's paid plans serve and CE does not."""

    name = "plane.nexus"
    label = "nexus"
    default_auto_field = "django.db.models.BigAutoField"
