# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""``DynamicBaseSerializer`` must honour ``fields=`` (WEB-10019 / SEC-122).

``__init__`` used to overwrite the caller's ``fields`` with ``expand`` and
``_filter_fields`` never removed anything, so every ``fields=`` allowlist was
a no-op and ``WorkSpaceMemberSerializer`` (``__all__``) returned full records.
"""

from uuid import uuid4

import pytest

from plane.app.serializers import WorkSpaceMemberSerializer
from plane.app.serializers.project import ProjectListSerializer
from plane.app.serializers.webhook import WebhookSerializer
from plane.db.models import Project, User, Webhook, Workspace, WorkspaceMember


def build_member():
    workspace = Workspace(id=uuid4(), name="WS", slug="ws")
    user = User(id=uuid4(), email="ada@plane.so", first_name="Ada", display_name="ada")
    return WorkspaceMember(id=uuid4(), workspace=workspace, member=user, role=5, view_props={"a": 1})


@pytest.mark.unit
class TestDynamicFields:
    def test_fields_restricts_output(self):
        data = WorkSpaceMemberSerializer(build_member(), fields=("id", "role")).data

        assert set(data) == {"id", "role"}

    def test_no_fields_returns_everything(self):
        data = WorkSpaceMemberSerializer(build_member()).data

        assert {"id", "role", "member", "view_props", "workspace"} <= set(data)

    def test_empty_fields_returns_nothing_extra(self):
        assert WorkSpaceMemberSerializer(build_member(), fields=[]).data == {}

    def test_fields_with_expand(self):
        user = User(id=uuid4(), email="ada@plane.so", first_name="Ada", display_name="ada")
        project = Project(
            id=uuid4(),
            name="P",
            identifier="P",
            workspace=Workspace(id=uuid4(), name="WS", slug="ws"),
            created_by=user,
        )

        data = ProjectListSerializer(project, fields=["id", "name"], expand=["created_by"]).data

        assert set(data) == {"id", "name", "created_by"}
        assert isinstance(data["created_by"], dict)
        assert data["created_by"]["first_name"] == "Ada"

    def test_expand_alone_does_not_restrict(self):
        data = WorkSpaceMemberSerializer(build_member(), expand=["workspace"]).data

        assert "view_props" in data and "role" in data


@pytest.mark.unit
@pytest.mark.django_db
def test_fields_restricts_output_not_input(create_user, workspace):
    """fields= with data= must still validate and save every writable field."""
    webhook = Webhook.objects.create(workspace=workspace, url="https://example.com/old")
    serializer = WebhookSerializer(
        webhook, data={"url": "https://example.com/new"}, partial=True, fields=("id",), context={}
    )

    assert serializer.is_valid(), serializer.errors
    serializer.save()

    webhook.refresh_from_db()
    assert webhook.url == "https://example.com/new"
    assert set(serializer.data) == {"id"}
