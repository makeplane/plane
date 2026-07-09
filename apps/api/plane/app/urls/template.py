# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports

# Module imports
from .template import WorkItemTemplateViewSet

urlpatterns = [
    WorkItemTemplateViewSet.as_view({"get": "list", "post": "create"}),
    WorkItemTemplateViewSet.as_view(
        {"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}
    ),
    WorkItemTemplateViewSet.as_view({"post": "instantiate"}, name="instantiate"),
]
