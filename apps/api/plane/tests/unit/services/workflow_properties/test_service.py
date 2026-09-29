# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Tests for the workflow-property service helpers (build payload, persist)."""

# Third Party imports
import pytest

# Module imports
from plane.db.models import (
    IssuePropertyValue,
    IssueTypeProperty,
    WorkspaceProperty,
)
from plane.services.workflow_properties import (
    build_property_payload,
    coerce_property_value,
    persist_property_values,
    validate_required_properties_for_issue,
)
from plane.services.workflow_properties.errors import (
    WorkflowPropertyInvalidValue,
    WorkflowPropertyRequiredMissing,
)


@pytest.mark.unit
@pytest.mark.django_db
class TestCoercePropertyValue:
    def test_number_string_to_int_when_whole(self):
        assert coerce_property_value("42", "NUMBER") == 42

    def test_number_string_to_float_when_not_whole(self):
        result = coerce_property_value("3.14", "NUMBER")
        assert isinstance(result, float)
        assert result == pytest.approx(3.14)

    def test_boolean_string_to_bool(self):
        assert coerce_property_value("true", "BOOLEAN") is True
        assert coerce_property_value("false", "BOOLEAN") is False

    def test_text_passes_through(self):
        assert coerce_property_value("hello", "TEXT") == "hello"

    def test_none_passes_through(self):
        assert coerce_property_value(None, "TEXT") is None


@pytest.mark.unit
@pytest.mark.django_db
class TestPersistPropertyValues:
    def test_persist_creates_rows(
        self, db, property_project, property_issue, text_property, create_user
    ):
        persisted = persist_property_values(
            issue=property_issue,
            project_id=property_project.id,
            workspace_id=property_project.workspace_id,
            actor_id=str(create_user.id),
            values_by_property_id={str(text_property.id): "hello"},
        )
        assert len(persisted) == 1
        assert persisted[0].value_json == "hello"

    def test_persist_updates_existing(
        self, db, property_project, property_issue, text_property, create_user
    ):
        persist_property_values(
            issue=property_issue,
            project_id=property_project.id,
            workspace_id=property_project.workspace_id,
            actor_id=str(create_user.id),
            values_by_property_id={str(text_property.id): "first"},
        )
        persist_property_values(
            issue=property_issue,
            project_id=property_project.id,
            workspace_id=property_project.workspace_id,
            actor_id=str(create_user.id),
            values_by_property_id={str(text_property.id): "second"},
        )
        rows = IssuePropertyValue.objects.filter(issue=property_issue)
        assert rows.count() == 1
        assert rows.first().value_json == "second"

    def test_persist_drops_missing_existing(
        self, db, property_project, property_issue, text_property, dropdown_property, create_user
    ):
        persist_property_values(
            issue=property_issue,
            project_id=property_project.id,
            workspace_id=property_project.workspace_id,
            actor_id=str(create_user.id),
            values_by_property_id={
                str(text_property.id): "hello",
                str(dropdown_property.id): "low",
            },
        )
        # Re-issue without ``text_property``: the row should soft-delete.
        persist_property_values(
            issue=property_issue,
            project_id=property_project.id,
            workspace_id=property_project.workspace_id,
            actor_id=str(create_user.id),
            values_by_property_id={str(dropdown_property.id): "high"},
        )
        values = IssuePropertyValue.objects.filter(
            issue=property_issue, deleted_at__isnull=True
        )
        assert values.count() == 1
        assert values.first().property_id == dropdown_property.id

    def test_persist_rejects_required_missing(
        self, db, property_project, property_issue, required_dropdown, create_user
    ):
        # required_dropdown requires a value. Pass the attachment
        # directly so the required check fires (the test issue has
        # no type, so attachments would otherwise be empty).
        with pytest.raises(WorkflowPropertyRequiredMissing):
            persist_property_values(
                issue=property_issue,
                project_id=property_project.id,
                workspace_id=property_project.workspace_id,
                actor_id=str(create_user.id),
                values_by_property_id={},
                attachments=[required_dropdown],
            )

    def test_persist_validates_value_type(
        self, db, property_project, property_issue, dropdown_property, create_user
    ):
        # ``not-a-choice`` is not in the dropdown's choices; the
        # validator should raise a typed error.
        with pytest.raises(WorkflowPropertyInvalidValue):
            persist_property_values(
                issue=property_issue,
                project_id=property_project.id,
                workspace_id=property_project.workspace_id,
                actor_id=str(create_user.id),
                values_by_property_id={str(dropdown_property.id): "not-a-choice"},
            )


@pytest.mark.unit
@pytest.mark.django_db
class TestValidateRequiredPropertiesForIssue:
    def test_returns_when_no_required_attachments(
        self, db, property_issue
    ):
        # No issue_type → no attachments → no required check.
        property_issue.type_id = None
        property_issue.save()
        validate_required_properties_for_issue(property_issue)

    def test_raises_when_required_missing(
        self, db, property_issue, property_project, property_issue_type,
        dropdown_property, create_user
    ):
        property_issue.type_id = property_issue_type.id
        property_issue.save()
        IssueTypeProperty.objects.create(
            project=property_project,
            workspace=property_project.workspace,
            issue_type=property_issue_type,
            property=dropdown_property,
            is_required=True,
            created_by=create_user,
            updated_by=create_user,
        )
        with pytest.raises(WorkflowPropertyRequiredMissing):
            validate_required_properties_for_issue(property_issue)


@pytest.mark.unit
@pytest.mark.django_db
class TestBuildPropertyPayload:
    def test_empty_when_no_type(
        self, db, property_issue
    ):
        property_issue.type_id = None
        property_issue.save()
        assert build_property_payload(property_issue) == []

    def test_returns_one_row_per_attachment(
        self, db, property_issue, property_project, property_issue_type,
        text_property, dropdown_property, create_user
    ):
        property_issue.type_id = property_issue_type.id
        property_issue.save()
        IssueTypeProperty.objects.create(
            project=property_project,
            workspace=property_project.workspace,
            issue_type=property_issue_type,
            property=text_property,
            is_required=False,
            sequence=2.0,
            created_by=create_user,
            updated_by=create_user,
        )
        IssueTypeProperty.objects.create(
            project=property_project,
            workspace=property_project.workspace,
            issue_type=property_issue_type,
            property=dropdown_property,
            is_required=True,
            sequence=1.0,
            created_by=create_user,
            updated_by=create_user,
        )
        payload = build_property_payload(property_issue)
        assert len(payload) == 2
        # Sorted by sequence → dropdown first, text second.
        assert payload[0]["property_type"] == "DROPDOWN"
        assert payload[1]["property_type"] == "TEXT"
        # No values written yet, so value_json is None.
        assert all(row["value_json"] is None for row in payload)
