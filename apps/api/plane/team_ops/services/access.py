# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from datetime import timedelta
from functools import cached_property

# Django imports
from django.utils import timezone

# Module imports
from plane.app.permissions import ROLE
from plane.db.models import WorkspaceMember
from plane.team_ops.models import CalendarSettings, OpsTeamMember
from plane.team_ops.services.policy import get_policy

# Guests do not take part in the work calendar.
CALENDAR_ROLES = [ROLE.ADMIN, ROLE.MEMBER]
_CALENDAR_ROLE_VALUES = [role.value for role in CALENDAR_ROLES]


def calendar_members(workspace):
    """Active workspace members who have a work calendar."""
    return WorkspaceMember.objects.filter(workspace=workspace, is_active=True, role__in=_CALENDAR_ROLE_VALUES)


def calendar_user_ids(workspace):
    return set(calendar_members(workspace).values_list("member_id", flat=True))


class CalendarAccess:
    """What a user may see and change in one workspace's work calendar.

    Built once per request from the workspace role, the team memberships and the
    workspace policy. "Manager" is not a workspace role: it means a workspace admin,
    or a team lead where the policy lets leads act on their teams.
    """

    def __init__(self, user, workspace):
        self.user = user
        self.workspace = workspace
        self.settings: CalendarSettings = get_policy(workspace)
        self.role = (
            WorkspaceMember.objects.filter(workspace=workspace, member=user, is_active=True)
            .values_list("role", flat=True)
            .first()
        )

    @property
    def is_admin(self):
        return self.role == ROLE.ADMIN.value

    @property
    def is_calendar_user(self):
        return self.role in _CALENDAR_ROLE_VALUES

    @cached_property
    def is_lead(self):
        return OpsTeamMember.objects.filter(
            team__workspace=self.workspace, user=self.user, role=OpsTeamMember.Role.LEAD
        ).exists()

    @cached_property
    def led_user_ids(self):
        """Everyone in the teams the caller leads, the caller included."""
        led_teams = OpsTeamMember.objects.filter(
            team__workspace=self.workspace, user=self.user, role=OpsTeamMember.Role.LEAD
        ).values("team_id")
        return set(OpsTeamMember.objects.filter(team_id__in=led_teams).values_list("user_id", flat=True))

    # --- reading ---------------------------------------------------------------------------

    @property
    def can_view_team(self):
        if not self.is_calendar_user:
            return False
        if self.is_admin or self.settings.team_view_access == CalendarSettings.TeamViewAccess.ALL_MEMBERS:
            return True
        return self.settings.team_view_access == CalendarSettings.TeamViewAccess.ADMINS_AND_LEADS and self.is_lead

    def visible_user_ids(self):
        """Ids of the users whose plans the caller may read; `None` means every calendar user."""
        if not self.is_calendar_user:
            return set()
        if self.is_admin or self.settings.team_view_access == CalendarSettings.TeamViewAccess.ALL_MEMBERS:
            return None
        ids = {self.user.id}
        if self.settings.team_view_access == CalendarSettings.TeamViewAccess.ADMINS_AND_LEADS:
            ids |= self.led_user_ids
        return ids

    def can_view_user(self, user_id):
        ids = self.visible_user_ids()
        return ids is None or user_id in ids

    # --- writing ---------------------------------------------------------------------------

    @property
    def can_edit_others(self):
        access = self.settings.edit_others_access
        if not self.is_calendar_user or access == CalendarSettings.EditOthersAccess.NONE:
            return False
        if self.is_admin:
            return True
        return access == CalendarSettings.EditOthersAccess.ADMINS_AND_LEADS and self.is_lead

    def can_edit_user(self, user_id):
        """May the caller change the plan of `user_id`? Date limits are checked separately."""
        if not self.is_calendar_user:
            return False
        if user_id == self.user.id:
            return True
        access = self.settings.edit_others_access
        if access == CalendarSettings.EditOthersAccess.NONE:
            return False
        if self.is_admin:
            return True
        return access == CalendarSettings.EditOthersAccess.ADMINS_AND_LEADS and user_id in self.led_user_ids

    @property
    def can_manage(self):
        """Teams, holidays and the policy itself are for workspace admins."""
        return self.is_admin

    def earliest_editable_date(self):
        """First day the caller may change, in their own timezone. `None` means no limit (admins)."""
        if self.is_admin:
            return None
        return timezone.localdate() - timedelta(days=self.settings.member_edit_past_days)

    def can_edit_date(self, day):
        earliest = self.earliest_editable_date()
        return earliest is None or day >= earliest

    def describe(self):
        """The caller's effective rights, as the settings endpoint reports them."""
        earliest = self.earliest_editable_date()
        return {
            "role": self.role,
            "is_admin": self.is_admin,
            "is_lead": self.is_lead,
            "can_view_team": self.can_view_team,
            "can_edit_others": self.can_edit_others,
            "can_manage": self.can_manage,
            "earliest_editable_date": earliest.isoformat() if earliest else None,
        }
