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
from django.db import transaction
from django.db.models import Prefetch

# drf-spectacular imports
from drf_spectacular.utils import extend_schema, OpenApiExample, inline_serializer
from rest_framework import serializers

# Module imports
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import (
    Project,
    ProjectIssueType,
    Issue,
    IssueAssignee,
    IssueLabel,
    State,
    Label,
    ProjectMember,
    EstimatePoint,
)
from plane.ee.models import (
    IssueProperty,
    IssuePropertyOption,
    IssuePropertyValue,
    PropertyTypeEnum,
    RelationTypeEnum,
)
from plane.api.views.base import BaseAPIView
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.bgtasks.issue_activities_task import issue_activity
from plane.utils.openapi import (
    WORKSPACE_SLUG_PARAMETER,
    PROJECT_ID_PARAMETER,
    VALIDATION_ERROR_RESPONSE,
)


class WorkItemCreateAPIEndpoint(BaseAPIView):
    """
    POST: Create a new work item with support for custom properties.

    Request Body:
        name: Required. Work item title.
        type_id: Work item type ID. Required when project has work item types enabled.
        description_html: Optional. HTML formatted description.
        priority: Optional. One of: urgent, high, medium, low, none. Default: none.
        state_id: Optional. State ID. Defaults to project's default state.
        assignee_ids: Optional. List of user IDs to assign.
        label_ids: Optional. List of label IDs.
        start_date: Optional. Format: YYYY-MM-DD.
        target_date: Optional. Format: YYYY-MM-DD.
        parent_id: Optional. Parent work item ID for sub-issues.
        estimate_point_id: Optional. Estimate point ID.
        custom_field_{name}: Optional. Custom property values using field name as key.
    """

    permission_classes = [ProjectEntityPermission]

    @extend_schema(
        operation_id="create_work_item",
        summary="Create Work Item",
        description="""Create a new work item with support for custom properties.

**Required fields:**
- `name`: Work item title

**Conditional requirements:**
- `type_id`: Required when project has work item types enabled

**Standard fields:**
- `description_html`: HTML formatted description
- `priority`: One of: urgent, high, medium, low, none (default: none)
- `state_id`: State ID (defaults to project's default state)
- `assignee_ids`: List of user IDs to assign
- `label_ids`: List of label IDs
- `start_date`: Format YYYY-MM-DD
- `target_date`: Format YYYY-MM-DD
- `parent_id`: Parent work item ID for sub-issues
- `estimate_point_id`: Estimate point ID

**Custom fields:**
- Use `custom_field_{name}` format for custom property values
- Field names must match property names from the schema endpoint
- Values must match the property type (TEXT, DECIMAL, OPTION UUID, etc.)""",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_ID_PARAMETER,
        ],
        request=inline_serializer(
            name="WorkItemCreateRequest",
            fields={
                "name": serializers.CharField(help_text="Work item title (required)"),
                "type_id": serializers.UUIDField(help_text="Work item type ID", required=False),
                "description_html": serializers.CharField(help_text="HTML formatted description", required=False),
                "priority": serializers.ChoiceField(
                    choices=["urgent", "high", "medium", "low", "none"],
                    help_text="Priority level",
                    required=False,
                ),
                "state_id": serializers.UUIDField(help_text="State ID", required=False),
                "assignee_ids": serializers.ListField(
                    child=serializers.UUIDField(),
                    help_text="List of assignee user IDs",
                    required=False,
                ),
                "label_ids": serializers.ListField(
                    child=serializers.UUIDField(),
                    help_text="List of label IDs",
                    required=False,
                ),
                "start_date": serializers.DateField(help_text="Start date (YYYY-MM-DD)", required=False),
                "target_date": serializers.DateField(help_text="Target date (YYYY-MM-DD)", required=False),
                "parent_id": serializers.UUIDField(help_text="Parent work item ID", required=False),
                "estimate_point_id": serializers.UUIDField(help_text="Estimate point ID", required=False),
            },
        ),
        responses={
            201: inline_serializer(
                name="WorkItemCreateResponse",
                fields={
                    "id": serializers.UUIDField(),
                    "name": serializers.CharField(),
                    "sequence_id": serializers.IntegerField(),
                    "project_id": serializers.UUIDField(),
                    "workspace_id": serializers.UUIDField(),
                    "state_id": serializers.UUIDField(allow_null=True),
                    "type_id": serializers.UUIDField(allow_null=True),
                    "priority": serializers.CharField(),
                    "created_at": serializers.DateTimeField(),
                    "updated_at": serializers.DateTimeField(),
                },
            ),
            400: VALIDATION_ERROR_RESPONSE,
        },
        tags=["Work Items"],
        examples=[
            OpenApiExample(
                name="Minimal work item",
                request_only=True,
                value={
                    "name": "New feature request",
                },
            ),
            OpenApiExample(
                name="Work item with type and custom fields",
                request_only=True,
                value={
                    "name": "Bug: Login fails on mobile",
                    "type_id": "550e8400-e29b-41d4-a716-446655440000",
                    "priority": "high",
                    "description_html": "<p>Users report login failures on iOS devices</p>",
                    "custom_field_severity": "critical",
                    "custom_field_affected_version": "2.1.0",
                },
            ),
            OpenApiExample(
                name="Complete work item",
                request_only=True,
                value={
                    "name": "Implement user dashboard",
                    "type_id": "550e8400-e29b-41d4-a716-446655440000",
                    "description_html": "<p>Create a new dashboard for users</p>",
                    "priority": "medium",
                    "state_id": "660e8400-e29b-41d4-a716-446655440001",
                    "assignee_ids": ["770e8400-e29b-41d4-a716-446655440002"],
                    "label_ids": ["880e8400-e29b-41d4-a716-446655440003"],
                    "start_date": "2026-02-15",
                    "target_date": "2026-03-15",
                },
            ),
        ],
    )
    def post(self, request, slug, project_id):
        # Get project
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        workspace_id = project.workspace_id

        # Check feature flag
        issue_types_enabled = check_workspace_feature_flag(
            feature_key=FeatureFlag.ISSUE_TYPES,
            slug=slug,
            user_id=str(request.user.id) if not request.user.is_bot else None,
        )

        # Determine issue type
        issue_type = None
        type_id = request.data.get("type_id")

        if issue_types_enabled:
            # Check if project has work item types configured
            default_project_issue_type = (
                ProjectIssueType.objects.select_related("issue_type")
                .filter(
                    project_id=project_id,
                    is_default=True,
                    issue_type__workspace__slug=slug,
                )
                .first()
            )

            project_has_types = default_project_issue_type is not None

            if project_has_types:
                if not type_id:
                    return Response(
                        {"error": "type_id is required when work item types are enabled for this project"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Validate the provided type_id
                project_issue_type = (
                    ProjectIssueType.objects.select_related("issue_type")
                    .filter(
                        project_id=project_id,
                        issue_type_id=type_id,
                        issue_type__workspace__slug=slug,
                    )
                    .first()
                )

                if not project_issue_type:
                    return Response(
                        {"error": "Invalid type_id. Work item type not found for this project."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                issue_type = project_issue_type.issue_type

        # Extract and validate standard fields
        data = request.data
        errors = {}

        # Required field: name
        name = data.get("name")
        if not name:
            errors["name"] = "This field is required."

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # Validate state_id if provided
        state_id = data.get("state_id")
        if state_id:
            state_exists = State.objects.filter(
                id=state_id,
                project_id=project_id,
                workspace__slug=slug,
            ).exists()
            if not state_exists:
                errors["state_id"] = "Invalid state ID."

        # Validate assignee_ids if provided
        assignee_ids = data.get("assignee_ids", [])
        if assignee_ids:
            valid_member_ids = set(
                ProjectMember.objects.filter(
                    project_id=project_id,
                    member_id__in=assignee_ids,
                    is_active=True,
                ).values_list("member_id", flat=True)
            )
            invalid_assignees = set(assignee_ids) - {str(mid) for mid in valid_member_ids}
            if invalid_assignees:
                errors["assignee_ids"] = f"Invalid assignee IDs: {', '.join(invalid_assignees)}"

        # Validate label_ids if provided
        label_ids = data.get("label_ids", [])
        if label_ids:
            valid_label_ids = set(
                Label.objects.filter(
                    id__in=label_ids,
                    workspace__slug=slug,
                )
                .filter(
                    # Project labels or workspace labels
                    project_id__in=[project_id, None]
                )
                .values_list("id", flat=True)
            )
            invalid_labels = set(label_ids) - {str(lid) for lid in valid_label_ids}
            if invalid_labels:
                errors["label_ids"] = f"Invalid label IDs: {', '.join(invalid_labels)}"

        # Validate parent_id if provided
        parent_id = data.get("parent_id")
        if parent_id:
            parent_exists = Issue.objects.filter(
                id=parent_id,
                project_id=project_id,
                workspace__slug=slug,
            ).exists()
            if not parent_exists:
                errors["parent_id"] = "Invalid parent ID. Work item not found."

        # Validate estimate_point_id if provided
        estimate_point_id = data.get("estimate_point_id")
        if estimate_point_id:
            estimate_exists = EstimatePoint.objects.filter(
                id=estimate_point_id,
                project_id=project_id,
                workspace__slug=slug,
            ).exists()
            if not estimate_exists:
                errors["estimate_point_id"] = "Invalid estimate point ID."

        # Validate priority if provided
        priority = data.get("priority", "none")
        valid_priorities = ["urgent", "high", "medium", "low", "none"]
        if priority not in valid_priorities:
            errors["priority"] = f"Invalid priority. Must be one of: {', '.join(valid_priorities)}"

        # Extract custom fields from request
        custom_field_data = {}
        for key, value in data.items():
            if key.startswith("custom_field_"):
                custom_field_data[key] = value

        # Validate custom fields if issue type exists
        issue_properties = []
        if issue_type and custom_field_data:
            # Fetch all properties for this issue type
            issue_properties = list(
                IssueProperty.objects.filter(
                    workspace__slug=slug,
                    project_id=project_id,
                    issue_type_properties__issue_type_id=issue_type.id,
                    is_active=True,
                ).prefetch_related(
                    Prefetch(
                        "options",
                        queryset=IssuePropertyOption.objects.filter(is_active=True),
                    )
                )
            )

            # Build lookup by field key
            property_lookup = {f"custom_field_{prop.name}": prop for prop in issue_properties}

            # Validate each custom field
            for field_key, field_value in custom_field_data.items():
                if field_key not in property_lookup:
                    errors[field_key] = f"Unknown custom field: {field_key}"
                    continue

                prop = property_lookup[field_key]
                field_errors = self._validate_custom_field(prop, field_value, workspace_id)
                if field_errors:
                    errors[field_key] = field_errors

        # Check for required custom fields that are missing
        if issue_type:
            if not issue_properties:
                issue_properties = list(
                    IssueProperty.objects.filter(
                        workspace__slug=slug,
                        project_id=project_id,
                        issue_type_properties__issue_type_id=issue_type.id,
                        is_active=True,
                        is_required=True,
                    )
                )
            for prop in issue_properties:
                if prop.is_required:
                    field_key = f"custom_field_{prop.name}"
                    if field_key not in custom_field_data:
                        errors[field_key] = f"{prop.display_name} is required."

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # Create work item in transaction
        with transaction.atomic():
            # Create the issue
            issue = Issue.objects.create(
                name=name,
                description_html=data.get("description_html", "<p></p>"),
                priority=priority,
                state_id=state_id,
                parent_id=parent_id,
                estimate_point_id=estimate_point_id,
                start_date=data.get("start_date"),
                target_date=data.get("target_date"),
                type=issue_type,
                project_id=project_id,
                workspace_id=workspace_id,
                created_by=request.user,
                updated_by=request.user,
            )

            # Create assignee records
            if assignee_ids:
                IssueAssignee.objects.bulk_create(
                    [
                        IssueAssignee(
                            assignee_id=assignee_id,
                            issue=issue,
                            project_id=project_id,
                            workspace_id=workspace_id,
                            created_by=request.user,
                            updated_by=request.user,
                        )
                        for assignee_id in assignee_ids
                    ],
                    batch_size=10,
                )

            # Create label records
            if label_ids:
                IssueLabel.objects.bulk_create(
                    [
                        IssueLabel(
                            label_id=label_id,
                            issue=issue,
                            project_id=project_id,
                            workspace_id=workspace_id,
                            created_by=request.user,
                            updated_by=request.user,
                        )
                        for label_id in label_ids
                    ],
                    batch_size=10,
                )

            # Create custom field values
            if issue_type and custom_field_data:
                property_lookup = {f"custom_field_{prop.name}": prop for prop in issue_properties}
                property_values_to_create = []

                for field_key, field_value in custom_field_data.items():
                    if field_key not in property_lookup:
                        continue

                    prop = property_lookup[field_key]
                    property_values = self._build_property_values(prop, field_value, issue.id, project_id, workspace_id)
                    property_values_to_create.extend(property_values)

                if property_values_to_create:
                    IssuePropertyValue.objects.bulk_create(property_values_to_create, batch_size=50)

        # Trigger activity tracking
        issue_activity.delay(
            type="issue.activity.created",
            requested_data={},
            actor_id=str(request.user.id),
            issue_id=str(issue.id),
            project_id=str(project_id),
            current_instance=None,
            epoch=0,
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )

        # Build response
        response_data = {
            "id": str(issue.id),
            "name": issue.name,
            "description_html": issue.description_html,
            "priority": issue.priority,
            "state_id": str(issue.state_id) if issue.state_id else None,
            "parent_id": str(issue.parent_id) if issue.parent_id else None,
            "estimate_point_id": str(issue.estimate_point_id) if issue.estimate_point_id else None,
            "start_date": str(issue.start_date) if issue.start_date else None,
            "target_date": str(issue.target_date) if issue.target_date else None,
            "type_id": str(issue.type_id) if issue.type_id else None,
            "sequence_id": issue.sequence_id,
            "project_id": str(project_id),
            "workspace_id": str(workspace_id),
            "assignee_ids": assignee_ids,
            "label_ids": label_ids,
            "created_at": issue.created_at.isoformat(),
            "updated_at": issue.updated_at.isoformat(),
        }

        # Add custom field values to response
        for field_key, field_value in custom_field_data.items():
            response_data[field_key] = field_value

        return Response(response_data, status=status.HTTP_201_CREATED)

    def _validate_custom_field(self, prop, value, workspace_id):
        """Validate a custom field value against its property definition."""
        if value is None or value == "":
            if prop.is_required:
                return f"{prop.display_name} is required."
            return None

        property_type = prop.property_type

        # TEXT, URL, EMAIL, FILE - must be string
        if property_type in [
            PropertyTypeEnum.TEXT,
            PropertyTypeEnum.URL,
            PropertyTypeEnum.EMAIL,
            PropertyTypeEnum.FILE,
        ]:
            if not isinstance(value, str):
                return "Must be a string."

            if property_type == PropertyTypeEnum.URL:
                from django.core.validators import URLValidator
                from django.core.exceptions import ValidationError as DjangoValidationError

                try:
                    URLValidator()(value)
                except DjangoValidationError:
                    return "Must be a valid URL."

            if property_type == PropertyTypeEnum.EMAIL:
                from django.core.validators import validate_email
                from django.core.exceptions import ValidationError as DjangoValidationError

                try:
                    validate_email(value)
                except DjangoValidationError:
                    return "Must be a valid email address."

        # DECIMAL - must be number
        elif property_type == PropertyTypeEnum.DECIMAL:
            if not isinstance(value, (int, float)):
                return "Must be a number."

        # BOOLEAN - must be boolean
        elif property_type == PropertyTypeEnum.BOOLEAN:
            if not isinstance(value, bool):
                return "Must be a boolean (true or false)."

        # DATETIME - must be valid date string
        elif property_type == PropertyTypeEnum.DATETIME:
            if not isinstance(value, str):
                return "Must be a date string."
            from datetime import datetime

            valid_formats = ["%Y-%m-%d", "%Y-%m-%d %H:%M:%S"]
            parsed = False
            for fmt in valid_formats:
                try:
                    datetime.strptime(value, fmt)
                    parsed = True
                    break
                except ValueError:
                    continue
            if not parsed:
                return "Must be a valid date in format YYYY-MM-DD or YYYY-MM-DD HH:MM:SS."

        # OPTION - must be valid option ID or list of IDs
        elif property_type == PropertyTypeEnum.OPTION:
            import uuid

            values = value if isinstance(value, list) else [value]

            if prop.is_multi:
                if not isinstance(value, list):
                    # Single value is acceptable for multi
                    values = [value]
            else:
                if isinstance(value, list):
                    return "This field does not accept multiple values."

            option_ids = set(str(opt.id) for opt in prop.options.all())
            for v in values:
                if not isinstance(v, str):
                    return "Option values must be strings (UUIDs)."
                try:
                    uuid.UUID(v)
                except (ValueError, AttributeError):
                    return f"Invalid UUID format: {v}"
                if v not in option_ids:
                    return f"Invalid option ID: {v}"

        # RELATION - must be valid UUID(s)
        elif property_type == PropertyTypeEnum.RELATION:
            import uuid

            values = value if isinstance(value, list) else [value]

            if prop.is_multi:
                if not isinstance(value, list):
                    values = [value]
            else:
                if isinstance(value, list):
                    return "This field does not accept multiple values."

            for v in values:
                if not isinstance(v, str):
                    return "Relation values must be strings (UUIDs)."
                try:
                    uuid.UUID(v)
                except (ValueError, AttributeError):
                    return f"Invalid UUID format: {v}"

            # Validate based on relation type
            if prop.relation_type == RelationTypeEnum.USER:
                from plane.db.models import WorkspaceMember

                existing_count = WorkspaceMember.objects.filter(
                    workspace_id=workspace_id,
                    member_id__in=values,
                ).count()
                if existing_count != len(values):
                    return "One or more users are not members of this workspace."

            elif prop.relation_type == RelationTypeEnum.ISSUE:
                existing_count = Issue.objects.filter(
                    workspace_id=workspace_id,
                    id__in=values,
                ).count()
                if existing_count != len(values):
                    return "One or more referenced work items do not exist."

        return None

    def _build_property_values(self, prop, value, issue_id, project_id, workspace_id):
        """Build IssuePropertyValue instances for a custom field."""
        property_type = prop.property_type
        values = value if isinstance(value, list) and prop.is_multi else [value]

        property_values = []
        for v in values:
            pv = IssuePropertyValue(
                property_id=prop.id,
                issue_id=issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
            )

            if property_type in [
                PropertyTypeEnum.TEXT,
                PropertyTypeEnum.URL,
                PropertyTypeEnum.EMAIL,
                PropertyTypeEnum.FILE,
            ]:
                pv.value_text = v
            elif property_type == PropertyTypeEnum.DECIMAL:
                pv.value_decimal = float(v)
            elif property_type == PropertyTypeEnum.BOOLEAN:
                pv.value_boolean = bool(v)
            elif property_type == PropertyTypeEnum.DATETIME:
                pv.value_datetime = v
            elif property_type == PropertyTypeEnum.OPTION:
                pv.value_option_id = v
            elif property_type == PropertyTypeEnum.RELATION:
                pv.value_uuid = v

            property_values.append(pv)

        return property_values
