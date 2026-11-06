# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""PQL on the stock project, cycle and module work-item lists, which the MCP sends `pql` to."""

import pytest

from plane.db.models import Cycle, CycleIssue, Issue, Module, ModuleIssue


@pytest.fixture
def items(project, create_user):
    high = Issue.objects.create(name="High one", priority="high", project=project, created_by=create_user)
    low = Issue.objects.create(name="Low one", priority="low", project=project, created_by=create_user)
    return high, low


def _names(res):
    assert res.status_code == 200, res.data
    return sorted(r["name"] for r in res.data["results"])


@pytest.mark.contract
class TestStockListsHonourPQL:
    def test_project_list(self, client, project_url, items):
        assert _names(client.get(project_url("work-items/"), {"pql": 'priority = "high"'})) == ["High one"]
        assert _names(client.get(project_url("work-items/"))) == ["High one", "Low one"]

    def test_cycle_list(self, client, project_url, project, items, create_user):
        cycle = Cycle.objects.create(name="C", project=project, owned_by=create_user)
        for item in items:
            CycleIssue.objects.create(cycle=cycle, issue=item, project=project)
        res = client.get(project_url(f"cycles/{cycle.id}/cycle-issues/"), {"pql": 'priority = "low"'})
        assert _names(res) == ["Low one"]

    def test_module_list(self, client, project_url, project, items):
        module = Module.objects.create(name="M", project=project)
        for item in items:
            ModuleIssue.objects.create(module=module, issue=item, project=project)
        res = client.get(project_url(f"modules/{module.id}/module-issues/"), {"pql": 'priority = "high"'})
        assert _names(res) == ["High one"]

    def test_invalid_pql_is_a_400_naming_the_problem(self, client, project_url, items):
        res = client.get(project_url("work-items/"), {"pql": "priority === nonsense"})
        assert res.status_code == 400 and res.data["pql"]

    def test_structured_filters_still_refused(self, client, project_url, items):
        assert client.get(project_url("work-items/"), {"filters": "{}"}).status_code == 400
