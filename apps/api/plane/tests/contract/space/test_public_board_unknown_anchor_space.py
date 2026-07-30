# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for public board routes reached with an unknown ``anchor``.

Every public Space route resolves its board with ``DeployBoard.objects.get(anchor=...)``
and none of the write methods wrap that call in ``try/except``. The 404 they return
today is produced further out, by the ``ObjectDoesNotExist`` branch of
``handle_exception()`` on the shared ``BaseAPIView`` / ``BaseViewSet``, since
``DeployBoard.DoesNotExist`` subclasses ``ObjectDoesNotExist``.

That makes the status code load-bearing on a base class several layers removed from
the views that depend on it, so these tests pin the contract: an anchor that was
never published, or whose board has since been unpublished, answers 404 and not 500.

These tests deliberately assert only on the status code. The response body
(``{"error": "The required object does not exist."}``) is a shared base-class string,
not a per-view contract.

Related: https://github.com/makeplane/plane/issues/9499
"""

from uuid import uuid4

import pytest
from rest_framework import status

UNKNOWN_ANCHOR = "this-anchor-was-never-published"


@pytest.fixture
def issue_id():
    return uuid4()


@pytest.fixture
def comment_id():
    return uuid4()


@pytest.mark.contract
@pytest.mark.django_db
class TestPublicBoardUnknownAnchor:
    """Public board routes answer 404 when no DeployBoard matches the anchor."""

    def test_issue_retrieve(self, session_client, issue_id):
        response = session_client.get(f"/api/public/anchor/{UNKNOWN_ANCHOR}/issues/{issue_id}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_comment_create(self, session_client, issue_id):
        response = session_client.post(
            f"/api/public/anchor/{UNKNOWN_ANCHOR}/issues/{issue_id}/comments/",
            {"comment_html": "<p>hello</p>"},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_comment_partial_update(self, session_client, issue_id, comment_id):
        response = session_client.patch(
            f"/api/public/anchor/{UNKNOWN_ANCHOR}/issues/{issue_id}/comments/{comment_id}/",
            {"comment_html": "<p>edited</p>"},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_comment_destroy(self, session_client, issue_id, comment_id):
        response = session_client.delete(
            f"/api/public/anchor/{UNKNOWN_ANCHOR}/issues/{issue_id}/comments/{comment_id}/"
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_issue_reaction_create(self, session_client, issue_id):
        response = session_client.post(
            f"/api/public/anchor/{UNKNOWN_ANCHOR}/issues/{issue_id}/reactions/",
            {"reaction": "128077"},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_issue_reaction_destroy(self, session_client, issue_id):
        response = session_client.delete(f"/api/public/anchor/{UNKNOWN_ANCHOR}/issues/{issue_id}/reactions/128077/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_comment_reaction_create(self, session_client, comment_id):
        response = session_client.post(
            f"/api/public/anchor/{UNKNOWN_ANCHOR}/comments/{comment_id}/reactions/",
            {"reaction": "128077"},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_comment_reaction_destroy(self, session_client, comment_id):
        response = session_client.delete(f"/api/public/anchor/{UNKNOWN_ANCHOR}/comments/{comment_id}/reactions/128077/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_vote_create(self, session_client, issue_id):
        response = session_client.post(
            f"/api/public/anchor/{UNKNOWN_ANCHOR}/issues/{issue_id}/votes/",
            {"vote": 1},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_vote_destroy(self, session_client, issue_id):
        response = session_client.delete(f"/api/public/anchor/{UNKNOWN_ANCHOR}/issues/{issue_id}/votes/")
        assert response.status_code == status.HTTP_404_NOT_FOUND
