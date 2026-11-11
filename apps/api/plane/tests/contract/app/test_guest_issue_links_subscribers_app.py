# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Imported pytest fixtures are requested by parameter name, which F811 misreads as redefinition.
# ruff: noqa: F811

"""A restricted guest (``guest_view_all_features=False``) must not reach issue
links or subscribers of issues they did not create. Own issues, members and
unrestricted guests are unaffected.

Reuses the fixtures of the sibling sub-resource test module.
"""

import pytest
from rest_framework import status

from plane.db.models import IssueLink, IssueSubscriber
from plane.tests.contract.app.test_guest_issue_subresource_scope_app import (  # noqa: F401
    foreign_issue,
    guest,
    guest_client,
    own_issue,
    project,
)

BASE = "/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/"
LINKS = BASE + "issue-links/"
SUBS = BASE + "issue-subscribers/"
SUBSCRIBE = BASE + "subscribe/"


def _url(tpl, workspace, project, issue):
    return tpl.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id)


@pytest.fixture
def foreign_link(workspace, project, foreign_issue):
    return IssueLink.objects.create(
        issue=foreign_issue, project=project, workspace=workspace, url="https://example.com"
    )


@pytest.mark.contract
@pytest.mark.django_db
class TestGuestIssueLinksSubscribers:
    def test_guest_blocked_links(self, guest_client, workspace, project, foreign_issue, foreign_link):
        url = _url(LINKS, workspace, project, foreign_issue)
        detail = f"{url}{foreign_link.id}/"
        responses = [
            guest_client.get(url),
            guest_client.post(url, {"url": "https://evil.example"}, format="json"),
            guest_client.patch(detail, {"url": "https://evil.example"}, format="json"),
            guest_client.delete(detail),
        ]
        assert [r.status_code for r in responses] == [status.HTTP_403_FORBIDDEN] * 4
        foreign_link.refresh_from_db()
        assert foreign_link.url == "https://example.com"

    def test_guest_blocked_subscribers(self, guest, guest_client, workspace, project, foreign_issue):
        subs = _url(SUBS, workspace, project, foreign_issue)
        subscribe = _url(SUBSCRIBE, workspace, project, foreign_issue)
        responses = [
            guest_client.get(subs),
            guest_client.post(subs, {"subscriber": str(guest.id)}, format="json"),
            guest_client.get(subscribe),
            guest_client.post(subscribe),
            guest_client.delete(subscribe),
        ]
        assert [r.status_code for r in responses] == [status.HTTP_403_FORBIDDEN] * 5
        assert not IssueSubscriber.objects.filter(issue=foreign_issue, subscriber=guest).exists()

    def test_guest_blocked_subscriber_detail_delete(self, guest, guest_client, workspace, project, foreign_issue):
        subscriber = IssueSubscriber.objects.create(
            issue=foreign_issue, project=project, workspace=workspace, subscriber=guest
        )
        response = guest_client.delete(f"{_url(SUBS, workspace, project, foreign_issue)}{guest.id}/")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert IssueSubscriber.objects.filter(pk=subscriber.pk).exists()

    def test_guest_allowed_own_issue(self, guest_client, workspace, project, own_issue):
        assert guest_client.get(_url(LINKS, workspace, project, own_issue)).status_code == 200
        assert guest_client.get(_url(SUBS, workspace, project, own_issue)).status_code == 200
        assert guest_client.get(_url(SUBSCRIBE, workspace, project, own_issue)).status_code == 200
        assert guest_client.post(_url(SUBSCRIBE, workspace, project, own_issue)).status_code == 201

    def test_member_unaffected(self, session_client, workspace, project, foreign_issue, foreign_link):
        assert len(session_client.get(_url(LINKS, workspace, project, foreign_issue)).data) == 1
        assert session_client.get(_url(SUBS, workspace, project, foreign_issue)).status_code == 200
        assert session_client.get(_url(SUBSCRIBE, workspace, project, foreign_issue)).status_code == 200

    def test_unrestricted_guest_unaffected(self, guest_client, workspace, project, foreign_issue, foreign_link):
        project.guest_view_all_features = True
        project.save(update_fields=["guest_view_all_features"])
        assert len(guest_client.get(_url(LINKS, workspace, project, foreign_issue)).data) == 1
        assert guest_client.get(_url(SUBS, workspace, project, foreign_issue)).status_code == 200
