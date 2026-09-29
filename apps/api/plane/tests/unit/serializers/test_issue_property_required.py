# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""§30 P1.4 — required-property validation on IssueCreateSerializer.

These tests cover the §14 hook into the Work Item create path so
required properties cannot be bypassed by direct API calls.
"""

# Third Party imports
import pytest
from rest_framework import serializers

# Module imports
from plane.app.serializers import IssueCreateSerializer
from plane.db.models import (
    Issue,
    IssuePropertyValue,
    IssueTypeProperty,
    WorkspaceProperty,
)


@pytest.mark.unit
@pytest.mark.django_db
class TestIssueCreateRequiredProperty:
    def test_required_property_missing_raises(
        self, db, workspace, create_user, wp_project, wp_state, wp_type,
        dropdown_property
    ):
        IssueTypeProperty.objects.create(
            project=wp_project,
            workspace=workspace,
            issue_type=wp_type,
            property=dropdown_property,
            is_required=True,
            created_by=create_user,
        )
        serializer = IssueCreateSerializer(
            data={
                "name": "x",
                "type_id": str(wp_type.id),
                "state_id": str(wp_state.id),
            },
            context={
                "project_id": str(wp_project.id),
                "workspace_id": str(wp_project.workspace_id),
                "default_assignee_id": None,
            },
        )
        assert serializer.is_valid(), serializer.errors
        with pytest.raises(serializers.ValidationError) as exc:
            serializer.save()
        assert exc.value.detail
        # The error payload should be a structured workflow-property error.
        detail = exc.value.detail
        if isinstance(detail, dict) and "property_values" in detail:
            inner = detail["property_values"]
        else:
            inner = detail
        assert inner.get("code") == "WORKFLOW_PROPERTY_REQUIRED_MISSING"

    def test_required_property_supplied_passes(
        self, db, workspace, create_user, wp_project, wp_state, wp_type,
        dropdown_property
    ):
        IssueTypeProperty.objects.create(
            project=wp_project,
            workspace=workspace,
            issue_type=wp_type,
            property=dropdown_property,
            is_required=True,
            created_by=create_user,
        )
        serializer = IssueCreateSerializer(
            data={
                "name": "x",
                "type_id": str(wp_type.id),
                "state_id": str(wp_state.id),
                "property_values": [
                    {
                        "property_id": str(dropdown_property.id),
                        "value_json": "low",
                    }
                ],
            },
            context={
                "project_id": str(wp_project.id),
                "workspace_id": str(wp_project.workspace_id),
                "default_assignee_id": None,
            },
        )
        assert serializer.is_valid(), serializer.errors
        issue = serializer.save()
        values = IssuePropertyValue.objects.filter(issue=issue)
        assert values.count() == 1
        assert values.first().value_json == "low"

    def test_required_property_default_satisfies_check(
        self, db, workspace, create_user, wp_project, wp_state, wp_type,
        dropdown_property
    ):
        IssueTypeProperty.objects.create(
            project=wp_project,
            workspace=workspace,
            issue_type=wp_type,
            property=dropdown_property,
            is_required=True,
            default_value="high",
            created_by=create_user,
        )
        serializer = IssueCreateSerializer(
            data={
                "name": "x",
                "type_id": str(wp_type.id),
                "state_id": str(wp_state.id),
            },
            context={
                "project_id": str(wp_project.id),
                "workspace_id": str(wp_project.workspace_id),
                "default_assignee_id": None,
            },
        )
        assert serializer.is_valid(), serializer.errors
        issue = serializer.save()
        # Default supplied → no value row persisted (the spec does not
        # require materialising defaults), but creation must succeed.
        assert Issue.objects.filter(pk=issue.pk).exists()

    def test_supplied_value_validates_type(
        self, db, workspace, create_user, wp_project, wp_state, wp_type,
        dropdown_property
    ):
        IssueTypeProperty.objects.create(
            project=wp_project,
            workspace=workspace,
            issue_type=wp_type,
            property=dropdown_property,
            is_required=True,
            created_by=create_user,
        )
        serializer = IssueCreateSerializer(
            data={
                "name": "x",
                "type_id": str(wp_type.id),
                "state_id": str(wp_state.id),
                "property_values": [
                    {
                        "property_id": str(dropdown_property.id),
                        "value_json": "not-in-choices",
                    }
                ],
            },
            context={
                "project_id": str(wp_project.id),
                "workspace_id": str(wp_project.workspace_id),
                "default_assignee_id": None,
            },
        )
        assert not serializer.is_valid()
        assert "property_values" in serializer.errors

    def test_no_type_skips_required_check(
        self, db, workspace, create_user, wp_project, wp_state,
    ):
        # No type → no property attachments to check. Create must
        # proceed even if we never declared any required properties.
        serializer = IssueCreateSerializer(
            data={
                "name": "x",
                "state_id": str(wp_state.id),
            },
            context={
                "project_id": str(wp_project.id),
                "workspace_id": str(wp_project.workspace_id),
                "default_assignee_id": None,
            },
        )
        assert serializer.is_valid(), serializer.errors
        issue = serializer.save()
        assert Issue.objects.filter(pk=issue.pk).exists()
