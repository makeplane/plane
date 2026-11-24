# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import Portfolio, Team, TeamMember, WorkspaceMember

from .base import BaseSerializer


class UniqueNameMixin:
    """Return a 400 for a duplicate name; the database constraint covers the race."""

    def _check_name(self, queryset, name):
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.filter(name=name).exists():
            raise serializers.ValidationError("NAME_ALREADY_EXISTS")
        return name


class TeamSerializer(UniqueNameMixin, BaseSerializer):
    member_role = serializers.IntegerField(read_only=True)

    class Meta:
        model = Team
        fields = [
            "id",
            "name",
            "description",
            "logo_props",
            "kind",
            "archived_at",
            "workspace",
            "member_role",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["workspace", "archived_at"]

    def validate_name(self, name):
        return self._check_name(Team.objects.filter(workspace_id=self.context["workspace_id"]), name)

    def validate_kind(self, kind):
        workspace_id = self.context["workspace_id"]
        if kind == "management":
            others = Team.objects.filter(workspace_id=workspace_id, kind="management")
            if self.instance is not None:
                others = others.exclude(pk=self.instance.pk)
                if self.instance.portfolios.exists():
                    raise serializers.ValidationError("TEAM_HAS_PORTFOLIOS")
            if others.exists():
                raise serializers.ValidationError("MANAGEMENT_TEAM_ALREADY_EXISTS")
        return kind


class TeamMemberSerializer(BaseSerializer):
    class Meta:
        model = TeamMember
        fields = ["id", "team", "member", "role", "created_at"]
        read_only_fields = ["team", "member", "created_at"]


class PortfolioSerializer(UniqueNameMixin, BaseSerializer):
    class Meta:
        model = Portfolio
        fields = [
            "id",
            "name",
            "description",
            "logo_props",
            "team",
            "workspace",
            "lead",
            "sort_order",
            "archived_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["team", "workspace", "archived_at"]

    def validate_name(self, name):
        return self._check_name(Portfolio.objects.filter(team_id=self.context["team_id"]), name)

    def validate_lead(self, lead):
        if (
            lead is not None
            and not WorkspaceMember.objects.filter(
                workspace_id=self.context["workspace_id"], member=lead, is_active=True
            ).exists()
        ):
            raise serializers.ValidationError("The provided user is not a member of this workspace.")
        return lead
