# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Module imports
from plane.db.models import Workspace
from .base import BaseSerializer

from rest_framework import serializers
from plane.ee.models import WorkspaceFeature
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag


class WorkspaceLiteSerializer(BaseSerializer):
    """
    Lightweight workspace serializer for minimal data transfer.

    Provides essential workspace identifiers including name, slug, and ID
    optimized for navigation, references, and performance-critical operations.
    """

    class Meta:
        model = Workspace
        fields = ["name", "slug", "id"]
        read_only_fields = fields


class WorkspaceFeatureSerializer(serializers.Serializer):
    """
    Serializer for updating workspace features.
    """

    project_grouping = serializers.BooleanField(required=False)
    initiatives = serializers.BooleanField(required=False)
    teams = serializers.BooleanField(required=False)
    customers = serializers.BooleanField(required=False)
    wiki = serializers.BooleanField(required=False)
    pi = serializers.BooleanField(required=False)
    work_item_types = serializers.BooleanField(required=False)

    def validate_project_grouping(self, value):
        if not check_workspace_feature_flag(FeatureFlag.PROJECT_GROUPING, self.context["slug"]):
            raise serializers.ValidationError("Upgrade your plan to enable Project Grouping")
        return value

    def validate_initiatives(self, value):
        if not check_workspace_feature_flag(FeatureFlag.INITIATIVES, self.context["slug"]):
            raise serializers.ValidationError("Upgrade your plan to enable Initiatives")
        return value

    def validate_teams(self, value):
        if not check_workspace_feature_flag(FeatureFlag.TEAMSPACES, self.context["slug"]):
            raise serializers.ValidationError("Upgrade your plan to enable Teams")
        return value

    def validate_customers(self, value):
        if not check_workspace_feature_flag(FeatureFlag.CUSTOMERS, self.context["slug"]):
            raise serializers.ValidationError("Upgrade your plan to enable Customers")
        return value

    def validate_wiki(self, value):
        if not check_workspace_feature_flag(FeatureFlag.WORKSPACE_PAGES, self.context["slug"]):
            raise serializers.ValidationError("Upgrade your plan to enable Wiki")
        return value

    def validate_pi(self, value):
        if not check_workspace_feature_flag(FeatureFlag.AI_CHAT, self.context["slug"]):
            raise serializers.ValidationError("Upgrade your plan to enable AI")
        return value

    def validate_work_item_types(self, value):
        if not check_workspace_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES, self.context["slug"]):
            raise serializers.ValidationError("Upgrade your plan to enable Work Item Types")
        return value

    def update(self, instance, validated_data):
        workspace_feature_fields = {
            "project_grouping": "is_project_grouping_enabled",
            "initiatives": "is_initiative_enabled",
            "teams": "is_teams_enabled",
            "customers": "is_customer_enabled",
            "wiki": "is_wiki_enabled",
            "pi": "is_pi_enabled",
            "work_item_types": "is_work_item_types_enabled",
        }

        workspace_feature = WorkspaceFeature.objects.get(workspace_id=self.context["workspace_id"])

        # teams can only be enabled
        if validated_data.get("teams", None) is not None:
            validated_data["teams"] = True

        for field, db_field in workspace_feature_fields.items():
            if field in validated_data:
                setattr(workspace_feature, db_field, validated_data[field])

        workspace_feature.save()

        return {
            "project_grouping": workspace_feature.is_project_grouping_enabled,
            "initiatives": workspace_feature.is_initiative_enabled,
            "teams": workspace_feature.is_teams_enabled,
            "customers": workspace_feature.is_customer_enabled,
            "wiki": workspace_feature.is_wiki_enabled,
            "pi": workspace_feature.is_pi_enabled,
            "work_item_types": workspace_feature.is_work_item_types_enabled,
        }
