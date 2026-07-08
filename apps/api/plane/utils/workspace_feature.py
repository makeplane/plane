# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from plane.db.models import WorkspaceFeature


def is_workspace_feature_enabled(key, slug=None, workspace_id=None):
    """Return whether a per-workspace feature flag is enabled.

    The workspace can be resolved by slug or by id; flags default to disabled
    when no row exists.
    """
    if slug is None and workspace_id is None:
        return False

    queryset = WorkspaceFeature.objects.filter(key=key, is_enabled=True)
    if workspace_id is not None:
        queryset = queryset.filter(workspace_id=workspace_id)
    else:
        queryset = queryset.filter(workspace__slug=slug)
    return queryset.exists()
