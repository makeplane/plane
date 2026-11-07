# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Every Nexus Messages route, mounted at /api/workspaces/<str:slug>/chat/ (see plane/urls.py).

The mount captures the workspace slug, so each view here receives it as the `slug` kwarg.
"""

urlpatterns = []
