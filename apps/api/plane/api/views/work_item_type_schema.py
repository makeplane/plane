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
from rest_framework import status
from rest_framework.response import Response
from django.db.models import Prefetch

# drf-spectacular imports
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

# Module imports
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import (
    ProjectIssueType,
    State,
    Label,
    EstimatePoint,
    ProjectMember,
)
from plane.ee.models import (
    IssueProperty,
    IssuePropertyOption,
    PropertyTypeEnum,
    RelationTypeEnum,
)
from plane.api.views.base import BaseAPIView
from plane.api.serializers.work_item_type_schema import WorkItemTypeSchemaSerializer
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.utils.openapi import (
    WORKSPACE_SLUG_PARAMETER,
    PROJECT_ID_PARAMETER,
)


# Query parameters for schema endpoint
TYPE_ID_QUERY_PARAMETER = OpenApiParameter(
    name="type_id",
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.QUERY,
    description=(
        "Work item type ID. If not provided, returns schema for default type "
        "(when types enabled) or standard fields only."
    ),
    required=False,
)

INCLUDE_PARAMETER = OpenApiParameter(
    name="include",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.QUERY,
    description="Comma-separated list of additional options to include: members, labels",
    required=False,
    examples=[
        OpenApiExample(name="Include members", value="members"),
        OpenApiExample(name="Include labels", value="labels"),
        OpenApiExample(name="Include both", value="members,labels"),
    ],
)


class WorkItemTypeSchemaAPIEndpoint(BaseAPIView):
    """
    GET: Returns the complete schema for a work item type including
    all standard fields and custom properties with their available options inline.
    This enables LLMs and MCP integrations to understand what fields are
    available when creating/updating work items.

    Query Parameters:
        type_id: Optional UUID of the work item type.
                 - If provided: returns schema for that specific type
                 - If not provided and work item types enabled: returns schema for default type
                 - If not provided and work item types not enabled: returns standard fields only
        include: Comma-separated list of additional options to include.
                 Supported values: members, labels
                 Example: ?include=members,labels
    """

    use_read_replica = True

    permission_classes = [ProjectEntityPermission]

    @extend_schema(
        operation_id="get_work_item_type_schema",
        summary="Get Work Item Type Schema",
        description="""Returns the complete schema for a work item type including all standard fields
and custom properties with their available options inline.

This endpoint enables LLMs and MCP integrations to understand what fields are available
when creating/updating work items.

**Standard fields** are always included:
- name, description_html, priority, state_id, assignee_ids, label_ids, start_date, target_date, parent_id

**Custom fields** are included when:
- ISSUE_TYPES feature is enabled AND
- A type_id is provided or a default type exists for the project

**Options behavior:**
- state_id options are always included
- priority options are always included
- assignee_ids and label_ids options require `?include=members,labels`
- estimate_point_id options are included when project has estimates configured""",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_ID_PARAMETER,
            TYPE_ID_QUERY_PARAMETER,
            INCLUDE_PARAMETER,
        ],
        responses={
            200: WorkItemTypeSchemaSerializer,
        },
        tags=["Work Item Types"],
        examples=[
            OpenApiExample(
                name="Schema with custom fields",
                response_only=True,
                value={
                    "type_id": "550e8400-e29b-41d4-a716-446655440000",
                    "type_name": "Bug",
                    "type_description": "Bug tracking",
                    "type_logo_props": {},
                    "fields": {
                        "name": {"type": "string", "required": True, "max_length": 255},
                        "priority": {
                            "type": "option",
                            "required": False,
                            "options": [
                                {"value": "urgent", "label": "Urgent"},
                                {"value": "high", "label": "High"},
                            ],
                        },
                        "state_id": {
                            "type": "uuid",
                            "required": False,
                            "options": [{"id": "...", "name": "Backlog", "group": "backlog"}],
                        },
                    },
                    "custom_fields": {
                        "custom_field_severity": {
                            "id": "...",
                            "type": "OPTION",
                            "name": "severity",
                            "display_name": "Severity",
                            "required": True,
                            "is_multi": False,
                            "options": [{"id": "...", "name": "Critical"}],
                        }
                    },
                },
            ),
        ],
    )
    def get(self, request, slug, project_id):
        # Parse query params
        type_id = request.GET.get("type_id")
        include_param = request.GET.get("include", "")
        include_options = [opt.strip().lower() for opt in include_param.split(",") if opt.strip()]
        include_members = "members" in include_options
        include_labels = "labels" in include_options

        # 1. Check feature flag and determine the issue type
        issue_types_enabled = check_workspace_feature_flag(
            feature_key=FeatureFlag.ISSUE_TYPES,
            slug=slug,
            user_id=str(request.user.id) if not request.user.is_bot else None,
        )

        issue_type = None
        if issue_types_enabled:
            if type_id:
                # Use specified type
                project_issue_type = (
                    ProjectIssueType.objects.select_related("issue_type")
                    .filter(
                        project_id=project_id,
                        issue_type_id=type_id,
                        issue_type__workspace__slug=slug,
                    )
                    .first()
                )
                if project_issue_type:
                    issue_type = project_issue_type.issue_type
            else:
                # Use project's default type
                project_issue_type = (
                    ProjectIssueType.objects.select_related("issue_type")
                    .filter(
                        project_id=project_id,
                        is_default=True,
                        issue_type__workspace__slug=slug,
                    )
                    .first()
                )
                if project_issue_type:
                    issue_type = project_issue_type.issue_type

        # 2. Fetch standard field options
        states = list(
            State.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
            )
            .exclude(group="triage")
            .order_by("sequence")
            .values("id", "name", "color", "group")
        )

        # Fetch labels only if requested
        label_options = None
        if include_labels:
            labels = list(
                Label.objects.filter(
                    workspace__slug=slug,
                    project_id=project_id,
                )
                .order_by("sort_order")
                .values("id", "name", "color")
            )

            # Also include workspace-level labels (project_id is null)
            workspace_labels = list(
                Label.objects.filter(
                    workspace__slug=slug,
                    project_id__isnull=True,
                )
                .order_by("sort_order")
                .values("id", "name", "color")
            )
            labels.extend(workspace_labels)

            label_options = [
                {
                    "id": str(label["id"]),
                    "name": label["name"],
                    "color": label["color"],
                }
                for label in labels
            ]

        # Fetch members only if requested
        member_options = None
        if include_members:
            members = list(
                ProjectMember.objects.filter(
                    workspace__slug=slug,
                    project_id=project_id,
                    is_active=True,
                )
                .select_related("member")
                .values(
                    "member__id",
                    "member__display_name",
                    "member__email",
                    "member__avatar",
                )
            )

            # Transform member data to expected format
            member_options = [
                {
                    "id": str(m["member__id"]),
                    "display_name": m["member__display_name"],
                    "email": m["member__email"],
                    "avatar": m["member__avatar"],
                }
                for m in members
            ]

        estimate_points = list(
            EstimatePoint.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
            )
            .select_related("estimate")
            .filter(estimate__last_used=True)
            .order_by("key")
            .values("id", "key", "value")
        )

        # 3. Build standard fields schema
        fields = {
            "name": {
                "type": "string",
                "required": True,
                "max_length": 255,
                "description": "Work item title",
            },
            "description_html": {
                "type": "string",
                "required": False,
                "description": "HTML formatted description",
            },
            "priority": {
                "type": "option",
                "required": False,
                "default": "none",
                "description": "Work item priority level",
                "options": [
                    {"value": "urgent", "label": "Urgent"},
                    {"value": "high", "label": "High"},
                    {"value": "medium", "label": "Medium"},
                    {"value": "low", "label": "Low"},
                    {"value": "none", "label": "None"},
                ],
            },
            "state_id": {
                "type": "uuid",
                "required": False,
                "description": "State ID (defaults to project default state)",
                "options": [
                    {
                        "id": str(s["id"]),
                        "name": s["name"],
                        "color": s["color"],
                        "group": s["group"],
                    }
                    for s in states
                ],
            },
            "assignee_ids": {
                "type": "uuid",
                "is_multi": True,
                "required": False,
                "description": "List of assignee user IDs. Use ?include=members to get options.",
            },
            "label_ids": {
                "type": "uuid",
                "is_multi": True,
                "required": False,
                "description": "List of label IDs. Use ?include=labels to get options.",
            },
            "start_date": {
                "type": "date",
                "required": False,
                "format": "YYYY-MM-DD",
                "description": "Start date (must be <= target_date)",
            },
            "target_date": {
                "type": "date",
                "required": False,
                "format": "YYYY-MM-DD",
                "description": "Target/due date (must be >= start_date)",
            },
            "parent_id": {
                "type": "uuid",
                "required": False,
                "description": "Parent work item ID for sub-issues",
            },
        }

        # Add options for assignee_ids if requested
        if include_members and member_options is not None:
            fields["assignee_ids"]["options"] = member_options
            fields["assignee_ids"]["description"] = "List of assignee user IDs"

        # Add options for label_ids if requested
        if include_labels and label_options is not None:
            fields["label_ids"]["options"] = label_options
            fields["label_ids"]["description"] = "List of label IDs"

        # Add estimate_point_id only if project has estimates
        if estimate_points:
            fields["estimate_point_id"] = {
                "type": "uuid",
                "required": False,
                "description": "Estimate point ID",
                "options": [
                    {
                        "id": str(ep["id"]),
                        "key": ep["key"],
                        "value": ep["value"],
                    }
                    for ep in estimate_points
                ],
            }

        # 4. Fetch custom properties if we have an issue type
        custom_fields = {}
        if issue_type:
            properties = list(
                IssueProperty.objects.filter(
                    workspace__slug=slug,
                    project_id=project_id,
                    issue_type_properties__issue_type_id=issue_type.id,
                    is_active=True,
                )
                .prefetch_related(
                    Prefetch(
                        "options",
                        queryset=IssuePropertyOption.objects.filter(is_active=True).order_by("sort_order"),
                    )
                )
                .order_by("sort_order")
            )

            for prop in properties:
                field_key = f"custom_field_{prop.name}"
                field_data = {
                    "id": str(prop.id),
                    "type": prop.property_type,
                    "name": prop.name,
                    "display_name": prop.display_name,
                    "description": prop.description or "",
                    "required": prop.is_required,
                    "is_multi": prop.is_multi,
                }

                # Add options for OPTION type properties
                if prop.property_type == PropertyTypeEnum.OPTION:
                    field_data["options"] = [
                        {
                            "id": str(opt.id),
                            "name": opt.name,
                            "logo_props": opt.logo_props,
                        }
                        for opt in prop.options.all()
                    ]

                # Add options for RELATION type properties
                elif prop.property_type == PropertyTypeEnum.RELATION:
                    field_data["relation_type"] = prop.relation_type

                    if prop.relation_type == RelationTypeEnum.USER:
                        # Include project members as options only if requested
                        if include_members and member_options is not None:
                            field_data["options"] = member_options
                    # For ISSUE relation type, skip options (too many to include)

                custom_fields[field_key] = field_data

        # 5. Build and return the response
        response_data = {
            "type_id": str(issue_type.id) if issue_type else None,
            "type_name": issue_type.name if issue_type else None,
            "type_description": (issue_type.description or "") if issue_type else None,
            "type_logo_props": issue_type.logo_props if issue_type else None,
            "fields": fields,
            "custom_fields": custom_fields,
        }

        return Response(response_data, status=status.HTTP_200_OK)
