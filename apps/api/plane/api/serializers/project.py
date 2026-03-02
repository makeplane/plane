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

# Third party imports
import random
from rest_framework import serializers

# Python imports
import re

# Module imports
from plane.db.models import (
    Project,
    ProjectIdentifier,
    WorkspaceMember,
    State,
    Estimate,
    Issue,
    IssueType,
    ProjectIssueType,
)

from plane.utils.content_validator import (
    validate_html_content,
)
from .base import BaseSerializer

# ee imports
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.ee.models import WorkitemTemplate, ProjectFeature
from plane.payment.flags.flag import FeatureFlag


class ProjectCreateSerializer(BaseSerializer):
    """
    Serializer for creating projects with workspace validation.

    Handles project creation including identifier validation, member verification,
    and workspace association for new project initialization.
    """

    PROJECT_ICON_DEFAULT_COLORS = [
        "#95999f",
        "#6d7b8a",
        "#5e6ad2",
        "#02b5ed",
        "#02b55c",
        "#f2be02",
        "#e57a00",
        "#f38e82",
    ]
    PROJECT_ICON_DEFAULT_ICONS = [
        "home",
        "apps",
        "settings",
        "star",
        "favorite",
        "done",
        "check_circle",
        "add_task",
        "create_new_folder",
        "dataset",
        "terminal",
        "key",
        "rocket",
        "public",
        "quiz",
        "mood",
        "gavel",
        "eco",
        "diamond",
        "forest",
        "bolt",
        "sync",
        "cached",
        "library_add",
        "view_timeline",
        "view_kanban",
        "empty_dashboard",
        "cycle",
    ]

    class Meta:
        model = Project
        fields = [
            "name",
            "description",
            "project_lead",
            "default_assignee",
            "identifier",
            "icon_prop",
            "emoji",
            "cover_image",
            "module_view",
            "cycle_view",
            "issue_views_view",
            "page_view",
            "intake_view",
            "guest_view_all_features",
            "archive_in",
            "close_in",
            "timezone",
            "external_source",
            "external_id",
            "is_issue_type_enabled",
            "is_time_tracking_enabled",
        ]

        read_only_fields = [
            "id",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "logo_props",
        ]

    def validate(self, data):
        project_name = data.get("name", None)
        project_identifier = data.get("identifier", None)

        if project_name is not None and re.match(Project.FORBIDDEN_IDENTIFIER_CHARS_PATTERN, project_name):
            raise serializers.ValidationError("Project name cannot contain special characters.")

        if project_identifier is not None and re.match(Project.FORBIDDEN_IDENTIFIER_CHARS_PATTERN, project_identifier):
            raise serializers.ValidationError("Project identifier cannot contain special characters.")

        if data.get("project_lead", None) is not None:
            # Check if the project lead is a member of the workspace
            if not WorkspaceMember.objects.filter(
                workspace_id=self.context["workspace_id"],
                member_id=data.get("project_lead"),
            ).exists():
                raise serializers.ValidationError("Project lead should be a user in the workspace")

        if data.get("default_assignee", None) is not None:
            # Check if the default assignee is a member of the workspace
            if not WorkspaceMember.objects.filter(
                workspace_id=self.context["workspace_id"],
                member_id=data.get("default_assignee"),
            ).exists():
                raise serializers.ValidationError("Default assignee should be a user in the workspace")

        return data

    def create(self, validated_data):
        identifier = validated_data.get("identifier", "").strip().upper()

        if identifier == "":
            raise serializers.ValidationError(detail="Project Identifier is required")

        if ProjectIdentifier.objects.filter(name=identifier, workspace_id=self.context["workspace_id"]).exists():
            raise serializers.ValidationError(detail="Project Identifier is taken")

        if validated_data.get("logo_props", None) is None:
            # Generate a random icon and color for the project icon
            validated_data["logo_props"] = {
                "in_use": "icon",
                "icon": {
                    "name": random.choice(self.PROJECT_ICON_DEFAULT_ICONS),
                    "color": random.choice(self.PROJECT_ICON_DEFAULT_COLORS),
                },
            }

        project = Project.objects.create(**validated_data, workspace_id=self.context["workspace_id"])
        return project


class ProjectUpdateSerializer(ProjectCreateSerializer):
    """
    Serializer for updating projects with enhanced state and estimation management.

    Extends project creation with update-specific validations including default state
    assignment, estimation configuration, and project setting modifications.
    """

    class Meta(ProjectCreateSerializer.Meta):
        model = Project
        fields = ProjectCreateSerializer.Meta.fields + [
            "default_state",
            "estimate",
        ]

        read_only_fields = ProjectCreateSerializer.Meta.read_only_fields

    def update(self, instance, validated_data):
        project_name = validated_data.get("name", None)
        project_identifier = validated_data.get("identifier", None)

        if project_name is not None and re.match(Project.FORBIDDEN_IDENTIFIER_CHARS_PATTERN, project_name):
            raise serializers.ValidationError("Project name cannot contain special characters.")

        if project_identifier is not None and re.match(Project.FORBIDDEN_IDENTIFIER_CHARS_PATTERN, project_identifier):
            raise serializers.ValidationError("Project identifier cannot contain special characters.")

        """Update a project"""
        if (
            validated_data.get("default_state", None) is not None
            and not State.objects.filter(project=instance, id=validated_data.get("default_state")).exists()
        ):
            # Check if the default state is a state in the project
            raise serializers.ValidationError("Default state should be a state in the project")

        if (
            validated_data.get("estimate", None) is not None
            and not Estimate.objects.filter(project=instance, id=validated_data.get("estimate").id).exists()
        ):
            # Check if the estimate is a estimate in the project
            raise serializers.ValidationError("Estimate should be a estimate in the project")
        return super().update(instance, validated_data)


class ProjectSerializer(BaseSerializer):
    """
    Comprehensive project serializer with metrics and member context.

    Provides complete project data including member counts, cycle/module totals,
    deployment status, and user-specific context for project management.
    """

    total_members = serializers.IntegerField(read_only=True)
    total_cycles = serializers.IntegerField(read_only=True)
    total_modules = serializers.IntegerField(read_only=True)
    is_member = serializers.BooleanField(read_only=True)
    sort_order = serializers.FloatField(read_only=True)
    member_role = serializers.IntegerField(read_only=True)
    is_deployed = serializers.BooleanField(read_only=True)
    cover_image_url = serializers.CharField(read_only=True)

    class Meta:
        model = Project
        fields = "__all__"
        read_only_fields = [
            "id",
            "emoji",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "deleted_at",
            "cover_image_url",
        ]

    def validate(self, data):
        project_name = data.get("name", None)
        project_identifier = data.get("identifier", None)

        if project_name is not None and re.match(Project.FORBIDDEN_IDENTIFIER_CHARS_PATTERN, project_name):
            raise serializers.ValidationError("Project name cannot contain special characters.")

        if project_identifier is not None and re.match(Project.FORBIDDEN_IDENTIFIER_CHARS_PATTERN, project_identifier):
            raise serializers.ValidationError("Project identifier cannot contain special characters.")

        # Check project lead should be a member of the workspace
        if (
            data.get("project_lead", None) is not None
            and not WorkspaceMember.objects.filter(
                workspace_id=self.context["workspace_id"],
                member_id=data.get("project_lead"),
            ).exists()
        ):
            raise serializers.ValidationError("Project lead should be a user in the workspace")

        # Check default assignee should be a member of the workspace
        if (
            data.get("default_assignee", None) is not None
            and not WorkspaceMember.objects.filter(
                workspace_id=self.context["workspace_id"],
                member_id=data.get("default_assignee"),
            ).exists()
        ):
            raise serializers.ValidationError("Default assignee should be a user in the workspace")

        # Validate description content for security
        if "description_html" in data and data["description_html"]:
            if isinstance(data["description_html"], dict):
                is_valid, error_msg, sanitized_html = validate_html_content(str(data["description_html"]))
                # Update the data with sanitized HTML if available
                if sanitized_html is not None:
                    data["description_html"] = sanitized_html
            if not is_valid:
                raise serializers.ValidationError({"error": "html content is not valid"})

        return data

    def create(self, validated_data):
        identifier = validated_data.get("identifier", "").strip().upper()
        if identifier == "":
            raise serializers.ValidationError(detail="Project Identifier is required")

        if ProjectIdentifier.objects.filter(name=identifier, workspace_id=self.context["workspace_id"]).exists():
            raise serializers.ValidationError(detail="Project Identifier is taken")

        project = Project.objects.create(**validated_data, workspace_id=self.context["workspace_id"])
        _ = ProjectIdentifier.objects.create(
            name=project.identifier,
            project=project,
            workspace_id=self.context["workspace_id"],
        )
        return project


class ProjectLiteSerializer(BaseSerializer):
    """
    Lightweight project serializer for minimal data transfer.

    Provides essential project information including identifiers, visual properties,
    and basic metadata optimized for list views and references.
    """

    cover_image_url = serializers.CharField(read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "identifier",
            "name",
            "cover_image",
            "icon_prop",
            "emoji",
            "description",
            "cover_image_url",
        ]
        read_only_fields = fields


class ProjectFeatureSerializer(serializers.Serializer):
    """
    Serializer for updating project features.
    """

    epics = serializers.BooleanField(required=False)
    modules = serializers.BooleanField(required=False)
    cycles = serializers.BooleanField(required=False)
    views = serializers.BooleanField(required=False)
    pages = serializers.BooleanField(required=False)
    intakes = serializers.BooleanField(required=False)
    work_item_types = serializers.BooleanField(required=False)

    def validate_epics(self, value):
        if not check_workspace_feature_flag(FeatureFlag.EPICS, self.context["slug"]):
            raise serializers.ValidationError("Upgrade your plan to enable Epics")
        return value

    def validate_work_item_types(self, value):
        if not check_workspace_feature_flag(FeatureFlag.ISSUE_TYPES, self.context["slug"]):
            raise serializers.ValidationError("Upgrade your plan to enable Work Item Types")
        return value

    def update(self, instance, validated_data):
        project_feature_fields = [
            "modules",
            "cycles",
            "views",
            "pages",
            "intakes",
        ]
        old_name_map = {
            "modules": "module_view",
            "cycles": "cycle_view",
            "views": "issue_views_view",
            "pages": "page_view",
            "intakes": "intake_view",
        }
        for field in project_feature_fields:
            if field in validated_data:
                Project.objects.filter(id=self.context["project_id"]).update(
                    **{old_name_map[field]: validated_data[field]}
                )

        project = Project.objects.get(id=self.context["project_id"])

        if validated_data.get("work_item_types"):
            # Check if default issue type already exists
            if not ProjectIssueType.objects.filter(project_id=project.id, is_default=True).exists():
                # Create default issue type
                issue_type = IssueType.objects.create(
                    workspace_id=project.workspace_id,
                    name="Task",
                    is_default=True,
                    description="Default work item type with the option to add new properties",
                    logo_props={
                        "in_use": "icon",
                        "icon": {"color": "#ffffff", "background_color": "#6695FF"},
                    },
                )

                # Update existing issues to use the new default issue type
                Issue.objects.filter(project_id=project.id, type_id__isnull=True).update(type_id=issue_type.id)

                # Bridge the issue type with the project
                ProjectIssueType.objects.create(
                    project_id=project.id, issue_type_id=issue_type.id, level=0, is_default=True
                )

                # Update existing work item templates to use the new default issue type
                work_item_type_template_schema = {
                    "id": str(issue_type.id),
                    "name": issue_type.name,
                    "logo_props": issue_type.logo_props,
                    "is_epic": issue_type.is_epic,
                }
                WorkitemTemplate.objects.filter(
                    project_id=project.id, workspace=project.workspace, type__exact={}
                ).update(type=work_item_type_template_schema)

            # Enable issue types for the project
            project.is_issue_type_enabled = True
            project.save()

        if validated_data.get("epics", None) is not None:
            if validated_data.get("epics"):
                # get or create the project feature
                project_feature = ProjectFeature.objects.filter(project=project).first()
                if not project_feature:
                    project_feature = ProjectFeature.objects.create(project=project)

                # Check if the epic issue type is already created for the project or not
                project_issue_type = ProjectIssueType.objects.filter(project=project, issue_type__is_epic=True).first()

                if not project_issue_type:
                    # create the epic issue type
                    epic = IssueType.objects.create(workspace=project.workspace, is_epic=True, level=1)

                    # add it to the project epic issue type
                    _ = ProjectIssueType.objects.create(project=project, issue_type=epic)

                # enable epic issue type
                project_feature.is_epic_enabled = True
                project_feature.save()
            else:
                # get or create the project feature
                project_feature = ProjectFeature.objects.filter(project=project).first()
                if not project_feature:
                    project_feature = ProjectFeature.objects.create(project=project)

                if project_feature.is_epic_enabled:
                    project_feature.is_epic_enabled = False
                    project_feature.save()

        # Refresh instance with updated project data
        project = Project.objects.get(id=self.context["project_id"])
        project_feature = ProjectFeature.objects.filter(project=project).first()
        is_epic_enabled = project_feature.is_epic_enabled if project_feature else False

        return {
            "epics": is_epic_enabled,
            "modules": project.module_view,
            "cycles": project.cycle_view,
            "views": project.issue_views_view,
            "pages": project.page_view,
            "intakes": project.intake_view,
            "work_item_types": project.is_issue_type_enabled,
        }
