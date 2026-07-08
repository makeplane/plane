# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from decimal import Decimal
from uuid import uuid4

import pytest
from rest_framework.serializers import ValidationError

from plane.db.models import (
    IssueType,
    IssueProperty,
    IssuePropertyOption,
    Project,
    ProjectMember,
)
from plane.utils.issue_property import (
    PROPERTY_TYPE_COLUMN,
    V1_PROPERTY_TYPES,
    cast_property_value,
    cast_property_values,
    validate_required_value,
)


def make_property(property_type, relation_type=None, is_multi=False, is_required=False, is_active=True):
    """Build an unsaved IssueProperty for pure-cast tests."""
    return IssueProperty(
        property_type=property_type,
        relation_type=relation_type,
        is_multi=is_multi,
        is_required=is_required,
        is_active=is_active,
    )


@pytest.mark.unit
class TestCastSimpleTypes:
    """Casting of types that do not require database access."""

    def test_text_value(self):
        prop = make_property("TEXT")
        result = cast_property_value(prop, "hello", uuid4())
        assert result["value_text"] == "hello"
        assert result["value_decimal"] is None

    def test_decimal_value(self):
        prop = make_property("DECIMAL")
        result = cast_property_value(prop, "12.5", uuid4())
        assert result["value_decimal"] == Decimal("12.5")

    def test_decimal_invalid(self):
        prop = make_property("DECIMAL")
        with pytest.raises(ValidationError):
            cast_property_value(prop, "not-a-number", uuid4())

    def test_boolean_truthy(self):
        prop = make_property("BOOLEAN")
        assert cast_property_value(prop, "true", uuid4())["value_boolean"] is True
        assert cast_property_value(prop, False, uuid4())["value_boolean"] is False

    def test_boolean_invalid(self):
        prop = make_property("BOOLEAN")
        with pytest.raises(ValidationError):
            cast_property_value(prop, "maybe", uuid4())

    def test_datetime_valid(self):
        prop = make_property("DATETIME")
        result = cast_property_value(prop, "2026-07-08T10:00:00Z", uuid4())
        assert result["value_datetime"] is not None

    def test_datetime_invalid(self):
        prop = make_property("DATETIME")
        with pytest.raises(ValidationError):
            cast_property_value(prop, "08/07/2026", uuid4())

    def test_url_valid(self):
        prop = make_property("URL")
        result = cast_property_value(prop, "https://plane.so", uuid4())
        assert result["value_text"] == "https://plane.so"

    def test_url_invalid(self):
        prop = make_property("URL")
        with pytest.raises(ValidationError):
            cast_property_value(prop, "not a url", uuid4())

    def test_none_value_rejected(self):
        prop = make_property("TEXT")
        with pytest.raises(ValidationError):
            cast_property_value(prop, None, uuid4())

    def test_mapping_and_v1_types(self):
        assert PROPERTY_TYPE_COLUMN["TEXT"] == "value_text"
        assert PROPERTY_TYPE_COLUMN["OPTION"] == "value_option_id"
        assert "FORMULA" not in V1_PROPERTY_TYPES


@pytest.mark.unit
class TestCastMultiAndRequired:
    def test_multi_returns_multiple_rows(self):
        prop = make_property("TEXT", is_multi=True)
        rows = cast_property_values(prop, ["a", "b"], uuid4())
        assert len(rows) == 2
        assert rows[0]["value_text"] == "a"

    def test_single_rejects_multiple(self):
        prop = make_property("TEXT", is_multi=False)
        with pytest.raises(ValidationError):
            cast_property_values(prop, ["a", "b"], uuid4())

    def test_required_empty_rejected(self):
        prop = make_property("TEXT", is_required=True)
        with pytest.raises(ValidationError):
            validate_required_value(prop, None)
        with pytest.raises(ValidationError):
            validate_required_value(prop, [])

    def test_required_inactive_skipped(self):
        prop = make_property("TEXT", is_required=True, is_active=False)
        # Inactive required property should not block.
        validate_required_value(prop, None)


@pytest.fixture
def project_setup(db, create_user):
    from plane.db.models import Workspace, WorkspaceMember

    workspace = Workspace.objects.create(name="WS", owner=create_user, slug="ws-prop")
    WorkspaceMember.objects.create(workspace=workspace, member=create_user, role=20)
    project = Project.objects.create(name="P1", identifier="P1", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    issue_type = IssueType.objects.create(workspace=workspace, name="Task")
    return {"workspace": workspace, "project": project, "issue_type": issue_type, "user": create_user}


@pytest.mark.unit
class TestCastOptionAndRelation:
    @pytest.mark.django_db
    def test_option_belonging_to_property(self, project_setup):
        prop = IssueProperty.objects.create(
            workspace=project_setup["workspace"],
            project=project_setup["project"],
            issue_type=project_setup["issue_type"],
            display_name="Severity",
            property_type="OPTION",
        )
        option = IssuePropertyOption.objects.create(
            workspace=project_setup["workspace"],
            project=project_setup["project"],
            property=prop,
            name="High",
        )
        result = cast_property_value(prop, str(option.id), project_setup["project"].id)
        assert result["value_option_id"] == option.id

    @pytest.mark.django_db
    def test_option_from_another_property_rejected(self, project_setup):
        prop = IssueProperty.objects.create(
            workspace=project_setup["workspace"],
            project=project_setup["project"],
            issue_type=project_setup["issue_type"],
            display_name="Severity",
            property_type="OPTION",
        )
        other_prop = IssueProperty.objects.create(
            workspace=project_setup["workspace"],
            project=project_setup["project"],
            issue_type=project_setup["issue_type"],
            display_name="Impact",
            property_type="OPTION",
        )
        foreign_option = IssuePropertyOption.objects.create(
            workspace=project_setup["workspace"],
            project=project_setup["project"],
            property=other_prop,
            name="Low",
        )
        with pytest.raises(ValidationError):
            cast_property_value(prop, str(foreign_option.id), project_setup["project"].id)

    @pytest.mark.django_db
    def test_relation_user_must_be_project_member(self, project_setup, create_bot_user):
        prop = IssueProperty.objects.create(
            workspace=project_setup["workspace"],
            project=project_setup["project"],
            issue_type=project_setup["issue_type"],
            display_name="Owner",
            property_type="RELATION",
            relation_type="USER",
        )
        # The project owner is a member -> accepted.
        result = cast_property_value(prop, str(project_setup["user"].id), project_setup["project"].id)
        assert result["value_uuid"] == project_setup["user"].id

        # A non-member user -> rejected.
        with pytest.raises(ValidationError):
            cast_property_value(prop, str(create_bot_user.id), project_setup["project"].id)
