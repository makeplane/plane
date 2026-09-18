# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Cross-cutting access policy for PI-private workspaces.

This module deliberately lives outside ``plane.research`` so ordinary Plane
permissions can enforce the private-workspace boundary without importing the
research view or permission stack.
"""

from django.db.models import Q

from plane.db.models import ResearchWorkspaceAccessGrant, WorkspaceResearchSetting
from plane.license.models import InstanceAdmin


PI_PRIVATE = WorkspaceResearchSetting.Purpose.PI_PRIVATE


def user_can_access_workspace(
    user,
    *,
    workspace_slug=None,
    workspace_id=None,
):
    """Return whether ``user`` passes a workspace's extra private-seat gate.

    General/public workspaces have no additional restriction.  A PI-private
    workspace requires one of the three explicit principals in addition to
    the endpoint's normal Plane membership and role checks.
    """
    if workspace_slug is None and workspace_id is None:
        return True

    settings = WorkspaceResearchSetting.objects.only("id", "purpose", "main_pi_id")
    if workspace_id is not None:
        settings = settings.filter(workspace_id=workspace_id)
    else:
        settings = settings.filter(workspace__slug=workspace_slug)
    setting = settings.first()

    if setting is None or setting.purpose != PI_PRIVATE:
        return True

    user_id = getattr(user, "id", None)
    if user_id is None:
        return False
    if setting.main_pi_id == user_id:
        return True
    if InstanceAdmin.objects.filter(user_id=user_id, role__gte=15).exists():
        return True
    return ResearchWorkspaceAccessGrant.objects.filter(
        setting_id=setting.id,
        user_id=user_id,
        deleted_at__isnull=True,
    ).exists()


def filter_workspaces_for_private_access(queryset, user):
    """Remove PI-private workspaces for which ``user`` has no explicit seat."""
    user_id = getattr(user, "id", None)
    if user_id is None:
        return queryset.none()
    if InstanceAdmin.objects.filter(user_id=user_id, role__gte=15).exists():
        return queryset
    return queryset.filter(
        Q(research_setting__isnull=True)
        | ~Q(research_setting__purpose=PI_PRIVATE)
        | Q(research_setting__main_pi_id=user_id)
        | Q(
            research_setting__private_access_grants__user_id=user_id,
            research_setting__private_access_grants__deleted_at__isnull=True,
        )
    ).distinct()
