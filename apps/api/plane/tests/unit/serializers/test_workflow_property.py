# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Serializer-level tests for the §14 property admin surface."""

# Third Party imports
import pytest

# Module imports
from plane.app.serializers.workflow_property import (
    WorkspacePropertyCreateSerializer,
    WorkspacePropertyUpdateSerializer,
)
from plane.db.models import WorkspaceProperty


@pytest.mark.unit
@pytest.mark.django_db
class TestWorkspacePropertyCreateSerializer:
    def test_accepts_minimal_payload(self, db, workspace):
        serializer = WorkspacePropertyCreateSerializer(
            data={
                "name": "Priority",
                "property_type": "TEXT",
            },
            context={"workspace_id": workspace.id},
        )
        assert serializer.is_valid(), serializer.errors

    def test_rejects_unknown_property_type(self, db, workspace):
        serializer = WorkspacePropertyCreateSerializer(
            data={
                "name": "Priority",
                "property_type": "FLOATING_POINT",
            },
            context={"workspace_id": workspace.id},
        )
        assert not serializer.is_valid()
        assert "property_type" in serializer.errors

    def test_rejects_dropdown_without_choices(self, db, workspace):
        serializer = WorkspacePropertyCreateSerializer(
            data={
                "name": "Priority",
                "property_type": "DROPDOWN",
                "config": {},
            },
            context={"workspace_id": workspace.id},
        )
        assert not serializer.is_valid()
        assert "config" in serializer.errors

    def test_rejects_duplicate_name_in_workspace(
        self, db, workspace, create_user
    ):
        WorkspaceProperty.objects.create(
            workspace=workspace,
            name="Priority",
            property_type="TEXT",
            created_by=create_user,
        )
        serializer = WorkspacePropertyCreateSerializer(
            data={
                "name": "Priority",
                "property_type": "TEXT",
            },
            context={"workspace_id": workspace.id},
        )
        assert not serializer.is_valid()
        assert "name" in serializer.errors

    def test_entity_reference_requires_entity_type_in_config(
        self, db, workspace
    ):
        serializer = WorkspacePropertyCreateSerializer(
            data={
                "name": "Owner",
                "property_type": "ENTITY_REFERENCE",
                "config": {},
            },
            context={"workspace_id": workspace.id},
        )
        assert not serializer.is_valid()
        assert "config" in serializer.errors


@pytest.mark.unit
@pytest.mark.django_db
class TestWorkspacePropertyUpdateSerializer:
    def test_property_type_is_ignored_on_patch(
        self, db, workspace, create_user
    ):
        prop = WorkspaceProperty.objects.create(
            workspace=workspace,
            name="Priority",
            property_type="TEXT",
            created_by=create_user,
        )
        serializer = WorkspacePropertyUpdateSerializer(
            prop,
            data={"property_type": "NUMBER"},
            partial=True,
            context={"workspace_id": workspace.id},
        )
        # ``property_type`` is not a writable field on the update
        # serializer, so it should be silently ignored rather than
        # raise the type-immutable error.
        assert serializer.is_valid(), serializer.errors
        assert prop.property_type == "TEXT"

    def test_config_update_validated_against_existing_type(
        self, db, workspace, create_user
    ):
        prop = WorkspaceProperty.objects.create(
            workspace=workspace,
            name="Priority",
            property_type="DROPDOWN",
            config={"choices": ["low"]},
            created_by=create_user,
        )
        serializer = WorkspacePropertyUpdateSerializer(
            prop,
            data={"config": {"choices": []}},
            partial=True,
            context={"workspace_id": workspace.id},
        )
        assert not serializer.is_valid()
        assert "config" in serializer.errors
