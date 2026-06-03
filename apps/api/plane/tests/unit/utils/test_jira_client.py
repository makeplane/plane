# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from unittest.mock import MagicMock

from plane.utils.jira.client import JiraClient, JiraError


@pytest.fixture(autouse=True)
def _skip_ssrf_check(monkeypatch):
    # The SSRF guard resolves DNS; stub it out so tests stay hermetic.
    monkeypatch.setattr("plane.utils.jira.client.validate_url", lambda *args, **kwargs: None)


def _response(status_code=200, json_data=None, content=b"{}", headers=None):
    resp = MagicMock()
    resp.status_code = status_code
    resp.content = content
    resp.headers = headers or {}
    resp.is_redirect = False
    resp.json.return_value = json_data if json_data is not None else {}
    resp.text = "error body"
    return resp


@pytest.mark.unit
class TestJiraClientAuth:
    def test_test_connection_success(self):
        session = MagicMock()
        session.request.return_value = _response(json_data={"displayName": "Ada"})
        client = JiraClient("https://acme.atlassian.net/", "a@b.com", "tok", session=session)
        ok, message = client.test_connection()
        assert ok is True
        assert message == "Ada"
        # domain normalized + correct path/auth used
        args, kwargs = session.request.call_args
        assert args[0] == "GET"
        assert args[1] == "https://acme.atlassian.net/rest/api/3/myself"
        assert kwargs["auth"] == ("a@b.com", "tok")

    def test_test_connection_invalid_credentials(self):
        session = MagicMock()
        session.request.return_value = _response(status_code=401)
        client = JiraClient("acme.atlassian.net", "a@b.com", "bad", session=session)
        ok, message = client.test_connection()
        assert ok is False
        assert "credential" in message.lower()

    def test_raises_jira_error_on_500_after_retries(self):
        session = MagicMock()
        session.request.return_value = _response(status_code=500)
        client = JiraClient("acme.atlassian.net", "a@b.com", "tok", session=session)
        with pytest.raises(JiraError):
            client.myself()


@pytest.mark.unit
class TestJiraClientPagination:
    def test_paginate_values_follows_islast(self):
        session = MagicMock()
        page1 = _response(json_data={"values": [{"id": 1}, {"id": 2}], "isLast": False, "total": 3})
        page2 = _response(json_data={"values": [{"id": 3}], "isLast": True, "total": 3})
        session.request.side_effect = [page1, page2]
        client = JiraClient("acme.atlassian.net", "a@b.com", "tok", session=session)
        boards = client.boards()
        assert [b["id"] for b in boards] == [1, 2, 3]
        assert session.request.call_count == 2

    def test_search_issues_yields_all_pages(self):
        session = MagicMock()
        page1 = _response(json_data={"issues": [{"key": "A-1"}], "total": 2, "startAt": 0, "maxResults": 1})
        page2 = _response(json_data={"issues": [{"key": "A-2"}], "total": 2, "startAt": 1, "maxResults": 1})
        session.request.side_effect = [page1, page2]
        client = JiraClient("acme.atlassian.net", "a@b.com", "tok", session=session)
        keys = [issue["key"] for issue in client.search_issues("project = A", page_size=1)]
        assert keys == ["A-1", "A-2"]

    def test_sprints_returns_empty_for_kanban_board(self):
        session = MagicMock()
        session.request.return_value = _response(status_code=400)
        client = JiraClient("acme.atlassian.net", "a@b.com", "tok", session=session)
        assert client.sprints(99) == []
