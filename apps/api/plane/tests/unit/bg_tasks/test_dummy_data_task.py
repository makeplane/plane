# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.bgtasks import dummy_data_task


class _ParentIssues:
    def __init__(self, parent_ids):
        self.parent_ids = parent_ids

    def values_list(self, *_args, **_kwargs):
        return self.parent_ids


class _SubIssues:
    def __init__(self, sub_issues):
        self.sub_issues = sub_issues

    def exclude(self, **_kwargs):
        return self

    def __getitem__(self, value):
        return self.sub_issues[value]


class _Issue:
    def __init__(self):
        self.parent_id = None


class _IssueManager:
    def __init__(self, parent_ids, sub_issues):
        self.parent_ids = parent_ids
        self.sub_issues = sub_issues
        self.filter_calls = 0
        self.bulk_update_args = None

    def filter(self, **_kwargs):
        self.filter_calls += 1
        if self.filter_calls == 1:
            return _ParentIssues(self.parent_ids)
        return _SubIssues(self.sub_issues)

    def bulk_update(self, items, fields, batch_size):
        self.bulk_update_args = (items, fields, batch_size)


@pytest.mark.unit
class TestCreateIssueParent:
    def test_bulk_updates_generated_sub_issue_parents(self, monkeypatch):
        sub_issues = [_Issue(), _Issue(), _Issue(), _Issue()]
        manager = _IssueManager(["parent-1", "parent-2"], sub_issues)
        fake_issue_model = type("Issue", (), {"objects": manager})

        monkeypatch.setattr(dummy_data_task, "Issue", fake_issue_model)
        monkeypatch.setattr(dummy_data_task.random, "randint", lambda _start, _end: 0)

        dummy_data_task.create_issue_parent("workspace", "project", "user-id", issue_count=8)

        items, fields, batch_size = manager.bulk_update_args
        assert items == sub_issues
        assert fields == ["parent"]
        assert batch_size == 1000
        assert [issue.parent_id for issue in sub_issues] == ["parent-1"] * len(sub_issues)
