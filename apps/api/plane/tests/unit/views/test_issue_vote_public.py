# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

import pytest
from rest_framework import status

from plane.space.views.issue import IssueVotePublicViewSet


@pytest.mark.unit
def test_create_vote_rejects_when_public_board_voting_is_disabled():
    request = SimpleNamespace(
        user=SimpleNamespace(id=uuid4()),
        data={"vote": 1},
    )
    view = IssueVotePublicViewSet()
    board = SimpleNamespace(is_votes_enabled=False)

    with (
        patch(
            "plane.space.views.issue.DeployBoard.objects.get",
            return_value=board,
        ),
        patch("plane.space.views.issue.IssueVote.objects.get_or_create") as create_vote,
    ):
        response = view.create(request, anchor="public-board", issue_id=uuid4())

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data == {"error": "Votes are not enabled for this board"}
    create_vote.assert_not_called()
