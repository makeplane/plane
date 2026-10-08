# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Who can see and change time entries. Every time tracking endpoint goes through this class.

Assumptions (plan section 2.3):
- A1: "everyone" means workspace Admins and Members; workspace Guests can neither see nor log time.
- A2: time in Secret projects is visible only to that project's members and workspace admins.
"""

# Python imports
from functools import cached_property
from uuid import UUID

# Django imports
from django.db.models import Q

# Module imports
from plane.db.models import ProjectMember, Workspace, WorkspaceMember
from plane.db.models.project import ProjectNetwork

from .models import TimeEntry

ADMIN = 20
MEMBER = 15
LOGGING_ROLES = (ADMIN, MEMBER)


class TimeTrackingAccess:
    """Role lookups for one user in one workspace, cached for the request (at most 2 queries)."""

    def __init__(self, user, slug):
        self.user = user
        self.slug = slug

    # Cached lookups

    @cached_property
    def _workspace_member(self):
        return (
            WorkspaceMember.objects.filter(workspace__slug=self.slug, member_id=self.user.id, is_active=True)
            .select_related("workspace")
            .first()
        )

    @cached_property
    def workspace(self) -> Workspace | None:
        return self._workspace_member.workspace if self._workspace_member else None

    @property
    def workspace_role(self) -> int | None:
        return self._workspace_member.role if self._workspace_member else None

    @cached_property
    def project_roles(self) -> dict:
        """{project_id: role} for the user's active project memberships in this workspace."""
        if self.workspace is None:
            return {}
        return dict(
            ProjectMember.objects.filter(
                workspace_id=self.workspace.id,
                member_id=self.user.id,
                is_active=True,
                project__deleted_at__isnull=True,
            ).values_list("project_id", "role")
        )

    # Role helpers

    @property
    def is_workspace_admin(self) -> bool:
        return self.workspace_role == ADMIN

    def project_role(self, project_id) -> int | None:
        return self.project_roles.get(_as_uuid(project_id))

    def is_project_admin(self, project_id) -> bool:
        return self.project_role(project_id) == ADMIN

    def is_project_logger(self, project_id) -> bool:
        return self.project_role(project_id) in LOGGING_ROLES

    # Checks

    def can_view(self) -> bool:
        """Workspace Admins and Members see time tracking; Guests and non-members don't (A1)."""
        return self.workspace_role in LOGGING_ROLES

    def can_view_project(self, project) -> bool:
        if not self.can_view() or project is None or project.workspace_id != self.workspace.id:
            return False
        if project.deleted_at is not None:
            return False
        return (
            self.is_workspace_admin
            or project.network == ProjectNetwork.PUBLIC.value
            or self.project_role(project.id) is not None
        )

    def visible_entries(self):
        """Every time entry this user may see. All read endpoints start from this queryset."""
        if not self.can_view():
            return TimeEntry.objects.none()
        entries = TimeEntry.objects.filter(workspace_id=self.workspace.id, project__deleted_at__isnull=True)
        if self.is_workspace_admin:
            return entries
        return entries.filter(
            Q(project__network=ProjectNetwork.PUBLIC.value) | Q(project_id__in=list(self.project_roles.keys()))
        )

    def can_log_own(self, project) -> bool:
        """Start a timer or log own time: an active project Admin/Member, in a live project."""
        return (
            self.can_view()
            and _is_live(project)
            and project.workspace_id == self.workspace.id
            and self.is_project_logger(project.id)
        )

    def can_log_for_others(self, project) -> bool:
        """Log time on someone else's behalf: a project admin, or any workspace admin."""
        return (
            self.can_view()
            and _is_live(project)
            and project.workspace_id == self.workspace.id
            and (self.is_project_admin(project.id) or self.is_workspace_admin)
        )

    def can_log_for(self, project, target_user_id) -> bool:
        return self.can_log_for_others(project) and is_project_logger(project.id, target_user_id)

    def can_edit(self, entry) -> bool:
        """Edit or delete an entry: the owner while still able to log in the project, or an admin."""
        if not self.can_view() or entry.workspace_id != self.workspace.id:
            return False
        if self.is_workspace_admin or self.is_project_admin(entry.project_id):
            return True
        return entry.user_id == self.user.id and self.can_log_own(entry.project)

    def can_manage_settings(self, project) -> bool:
        return (
            self.can_view()
            and project.workspace_id == self.workspace.id
            and (self.is_workspace_admin or self.is_project_admin(project.id))
        )


def is_project_logger(project_id, user_id) -> bool:
    """Whether a user is an active Admin/Member of the project (the target-user rule for logging on behalf)."""
    return ProjectMember.objects.filter(
        project_id=project_id,
        member_id=user_id,
        is_active=True,
        role__in=LOGGING_ROLES,
        member__is_active=True,
    ).exists()


def _is_live(project) -> bool:
    return project is not None and project.deleted_at is None and project.archived_at is None


def _as_uuid(value):
    """Role maps are keyed by UUID; callers sometimes hold the id as a string."""
    if isinstance(value, str):
        try:
            return UUID(value)
        except ValueError:
            return None
    return value
