# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for GET /api/workspaces/<slug>/agents/ (member-facing agent list)."""

import pytest
from rest_framework import status

from plane.db.models import User, Workspace, WorkspaceMember
from plane.license.models import AgentDefinition

MEMBER_FIELDS = {
    "id",
    "name",
    "slug",
    "description",
    "adapter",
    "default_permission_level",
    "max_permission_level",
}


def _url(slug):
    return f"/api/workspaces/{slug}/agents/"


def _make_agent(slug, **overrides):
    agent = AgentDefinition(name=slug.title(), slug=slug, adapter="claude", **overrides)
    agent.set_env({"ANTHROPIC_API_KEY": f"sk-{slug}-secret"})
    agent.save()
    return agent


@pytest.mark.contract
class TestWorkspaceAgents:
    @pytest.mark.django_db
    def test_member_sees_enabled_agents_only_without_env(self, session_client, workspace):
        enabled = _make_agent("claude", sort_order=2)
        second = _make_agent("codex", sort_order=1)
        _make_agent("hidden", is_enabled=False)

        response = session_client.get(_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert [item["slug"] for item in body] == ["codex", "claude"]  # sort_order
        assert {item["id"] for item in body} == {str(enabled.id), str(second.id)}
        for item in body:
            assert set(item) == MEMBER_FIELDS
        assert b"sk-" not in response.content
        assert b"env" not in response.content

    @pytest.mark.django_db
    def test_guest_member_can_list(self, api_client, workspace):
        guest = User.objects.create(email="guest@plane.so", username="guest-agents")
        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5)
        _make_agent("claude")
        api_client.force_authenticate(user=guest)

        response = api_client.get(_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 1

    @pytest.mark.django_db
    def test_non_member_is_rejected(self, session_client, create_user):
        other_owner = User.objects.create(email="other-owner@plane.so", username="other-owner")
        other = Workspace.objects.create(name="Other", slug="other-agents", owner=other_owner)
        WorkspaceMember.objects.create(workspace=other, member=other_owner, role=20)
        _make_agent("claude")

        response = session_client.get(_url(other.slug))

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_inactive_member_is_rejected(self, session_client, workspace, create_user):
        WorkspaceMember.objects.filter(workspace=workspace, member=create_user).update(is_active=False)
        _make_agent("claude")

        response = session_client.get(_url(workspace.slug))

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_anonymous_is_rejected(self, api_client, workspace):
        response = api_client.get(_url(workspace.slug))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
