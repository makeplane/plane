# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Regression tests for the ``expand`` query parameter.

See https://github.com/makeplane/plane/issues/4639 -- ``?expand=updated_by``
returned the bare UUID instead of a user object, and once the key was added to
the mapper it returned an empty object for the (very common) case of a record
that has never been updated.
"""

from uuid import uuid4

import pytest

from plane.api.serializers import ModuleLiteSerializer, ProjectSerializer
from plane.app.serializers import IssueSerializer as AppIssueSerializer
from plane.app.serializers.base import get_expansion_mapper
from plane.app.serializers.project import ProjectListSerializer
from plane.db.models import Issue, Module, ModuleMember, Project, User, Workspace

# The three fields from the request in issue #4639.
AUDIT_EXPANDS = ["created_by", "updated_by", "project_lead"]


def build_user():
    return User(
        id=uuid4(),
        email="ada@plane.so",
        first_name="Ada",
        last_name="Lovelace",
        display_name="ada",
    )


def build_project(**kwargs):
    workspace = Workspace(id=uuid4(), name="Test Workspace", slug="test-workspace")
    return Project(
        id=uuid4(),
        name="Test Project",
        identifier="TEST",
        workspace=workspace,
        **kwargs,
    )


@pytest.mark.unit
class TestPublicAPIExpand:
    """``/api/v1/`` -- plane.api.serializers.base.BaseSerializer."""

    def test_updated_by_expands_to_a_user_object(self):
        """The original report: updated_by came back as a bare UUID."""
        user = build_user()
        project = build_project(created_by=user, updated_by=user, project_lead=user)

        data = ProjectSerializer(project, expand=AUDIT_EXPANDS).data

        for field in AUDIT_EXPANDS:
            assert isinstance(data[field], dict), f"{field} was not expanded: {data[field]!r}"
            assert data[field]["id"] == user.id
            assert data[field]["display_name"] == "ada"

    def test_null_relation_expands_to_null_not_an_empty_object(self):
        """updated_by is null until a record is first updated (BaseModel.save).

        Expanding it used to emit ``{}`` -- the nested serializer built from its
        own defaults -- which does not match the unexpanded response.
        """
        user = build_user()
        project = build_project(created_by=user, updated_by=None, project_lead=None)

        data = ProjectSerializer(project, expand=AUDIT_EXPANDS).data

        assert data["updated_by"] is None
        assert data["project_lead"] is None
        assert isinstance(data["created_by"], dict)

    def test_expand_does_not_change_the_unexpanded_contract(self):
        user = build_user()
        project = build_project(created_by=user, updated_by=None, project_lead=None)

        data = ProjectSerializer(project).data

        assert data["created_by"] == user.id
        assert data["updated_by"] is None
        assert data["project_lead"] is None

    def test_expand_name_that_is_not_a_relation_is_not_a_field(self):
        project = build_project(created_by=build_user())

        data = ProjectSerializer(project, expand=["not_a_field"]).data

        assert "not_a_field" not in data

    def test_to_many_relation_expands_to_a_list_of_objects(self, db):
        """Guards the to-many arm of the dispatch.

        Arity is now read off the ORM object (a related manager) rather than
        guessed from the already-serialized value, so this pins that to-many
        expansion keeps working.
        """
        user = User.objects.create(email="member@plane.so", display_name="member")
        workspace = Workspace.objects.create(name="Test Workspace", slug="test-workspace", owner=user)
        project = Project.objects.create(name="Test Project", identifier="TEST", workspace=workspace)
        module = Module.objects.create(name="Test Module", project=project, workspace=workspace)
        ModuleMember.objects.create(module=module, member=user, project=project, workspace=workspace)

        data = ModuleLiteSerializer(module, expand=["members"]).data

        assert isinstance(data["members"], list)
        assert [m["id"] for m in data["members"]] == [user.id]

    def test_audit_fields_expand_identically(self):
        """created_by and updated_by must stay in lockstep.

        #4639 happened because only created_by was in the mapper.
        """
        user = build_user()
        project = build_project(created_by=user, updated_by=user)

        data = ProjectSerializer(project, expand=["created_by", "updated_by"]).data

        assert data["created_by"] == data["updated_by"]
        assert data["created_by"]["id"] == user.id


@pytest.mark.unit
class TestAppAPIExpand:
    """``/api/`` (internal) -- plane.app.serializers.base.DynamicBaseSerializer."""

    def build_issue(self, created_by, updated_by):
        workspace = Workspace(id=uuid4(), name="Test Workspace", slug="test-workspace")
        project = Project(id=uuid4(), name="Test Project", identifier="TEST", workspace=workspace)
        return Issue(
            id=uuid4(),
            name="Test work item",
            project=project,
            workspace=workspace,
            created_by=created_by,
            updated_by=updated_by,
        )

    def test_updated_by_expands_to_a_user_object(self):
        user = build_user()
        issue = self.build_issue(created_by=user, updated_by=user)

        data = AppIssueSerializer(issue, expand=["created_by", "updated_by"]).data

        assert isinstance(data["updated_by"], dict), f"not expanded: {data['updated_by']!r}"
        assert data["updated_by"]["id"] == user.id

    def test_null_relation_expands_to_null(self):
        """The app UserLiteSerializer leaves most fields writable, so a null
        relation used to serialize into a fabricated user with blank names."""
        user = build_user()
        issue = self.build_issue(created_by=user, updated_by=None)

        data = AppIssueSerializer(issue, expand=["created_by", "updated_by"]).data

        assert data["updated_by"] is None

    def test_expand_naming_a_method_field_keeps_the_serializer_value(self, db):
        """`members` is a SerializerMethodField on ProjectListSerializer and not a
        relation on Project at all. Resolving it used to raise AttributeError and
        return a 500; the value the serializer produced must survive instead."""
        workspace = Workspace(id=uuid4(), name="Test Workspace", slug="test-workspace")
        project = Project(id=uuid4(), name="Test Project", identifier="TEST", workspace=workspace)

        data = ProjectListSerializer(project, expand=["members"]).data

        assert data["members"] == []

    def test_mapper_is_shared_by_both_call_sites(self):
        """_filter_fields and to_representation had drifted apart, which is how
        updated_by ended up in one mapper and not the other."""
        mapper = get_expansion_mapper()

        assert "created_by" in mapper
        assert "updated_by" in mapper
