# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.db.models import (
    IssueType,
    IssueProperty,
    IssuePropertyOption,
    State,
    Issue,
)
from plane.tests.factories import ProjectFactory
from plane.utils.issue_property_validator import (
    validate_property_values,
    build_property_value,
)


def _make_property(project, **kwargs):
    issue_type = IssueType.objects.create(workspace=project.workspace, name="Task", is_default=True)
    defaults = dict(
        project=project,
        issue_type=issue_type,
        name="field",
        display_name="Field",
        property_type="TEXT",
    )
    defaults.update(kwargs)
    return IssueProperty.objects.create(**defaults)


@pytest.mark.unit
class TestValidatePropertyValues:
    def test_required_missing(self, db):
        project = ProjectFactory()
        prop = _make_property(project, is_required=True, property_type="TEXT")
        errors = validate_property_values([prop], {})
        assert str(prop.id) in errors

    def test_required_satisfied(self, db):
        project = ProjectFactory()
        prop = _make_property(project, is_required=True, property_type="TEXT")
        errors = validate_property_values([prop], {str(prop.id): ["hello"]})
        assert errors == {}

    def test_boolean_never_required_error(self, db):
        project = ProjectFactory()
        prop = _make_property(project, is_required=True, property_type="BOOLEAN")
        # Booleans are never "missing"
        assert validate_property_values([prop], {}) == {}

    def test_single_value_cardinality(self, db):
        project = ProjectFactory()
        prop = _make_property(project, property_type="TEXT", is_multi=False)
        errors = validate_property_values([prop], {str(prop.id): ["a", "b"]})
        assert str(prop.id) in errors

    def test_number_validation(self, db):
        project = ProjectFactory()
        prop = _make_property(project, property_type="DECIMAL")
        assert validate_property_values([prop], {str(prop.id): ["12.5"]}) == {}
        assert str(prop.id) in validate_property_values([prop], {str(prop.id): ["abc"]})

    def test_url_validation(self, db):
        project = ProjectFactory()
        prop = _make_property(project, property_type="URL")
        assert validate_property_values([prop], {str(prop.id): ["https://plane.so"]}) == {}
        assert str(prop.id) in validate_property_values([prop], {str(prop.id): ["not-a-url"]})

    def test_option_membership(self, db):
        project = ProjectFactory()
        prop = _make_property(project, property_type="OPTION")
        option = IssuePropertyOption.objects.create(property=prop, project=project, name="High")
        assert validate_property_values([prop], {str(prop.id): [str(option.id)]}) == {}
        assert str(prop.id) in validate_property_values([prop], {str(prop.id): ["00000000-0000-0000-0000-000000000000"]})


@pytest.mark.unit
class TestBuildPropertyValue:
    def _issue(self, project):
        state = State.objects.create(
            project=project, workspace=project.workspace, name="Todo", color="#fff", group="unstarted"
        )
        return Issue.objects.create(project=project, workspace=project.workspace, name="I", state=state)

    def test_text_value(self, db):
        project = ProjectFactory()
        prop = _make_property(project, property_type="TEXT")
        issue = self._issue(project)
        value = build_property_value(prop, issue, project.id, "hello")
        assert value.value_text == "hello"

    def test_decimal_value(self, db):
        project = ProjectFactory()
        prop = _make_property(project, property_type="DECIMAL")
        issue = self._issue(project)
        value = build_property_value(prop, issue, project.id, "7.5")
        assert value.value_decimal == 7.5

    def test_boolean_value(self, db):
        project = ProjectFactory()
        prop = _make_property(project, property_type="BOOLEAN")
        issue = self._issue(project)
        assert build_property_value(prop, issue, project.id, "true").value_boolean is True
        assert build_property_value(prop, issue, project.id, False).value_boolean is False

    def test_option_value(self, db):
        project = ProjectFactory()
        prop = _make_property(project, property_type="OPTION")
        option = IssuePropertyOption.objects.create(property=prop, project=project, name="High")
        issue = self._issue(project)
        value = build_property_value(prop, issue, project.id, str(option.id))
        assert str(value.value_option_id) == str(option.id)
