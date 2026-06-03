# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.db.models.state import StateGroup
from plane.utils.jira.mappers import (
    normalize_domain,
    map_priority,
    map_status_group,
    map_relation_type,
)


@pytest.mark.unit
class TestNormalizeDomain:
    def test_strips_scheme_and_slashes(self):
        assert normalize_domain("https://acme.atlassian.net/") == "acme.atlassian.net"
        assert normalize_domain("http://acme.atlassian.net") == "acme.atlassian.net"
        assert normalize_domain("acme.atlassian.net") == "acme.atlassian.net"
        assert normalize_domain("  acme.atlassian.net/  ") == "acme.atlassian.net"

    def test_empty(self):
        assert normalize_domain("") == ""
        assert normalize_domain(None) == ""


@pytest.mark.unit
class TestMapPriority:
    def test_known_priorities(self):
        assert map_priority("Highest") == "urgent"
        assert map_priority("High") == "high"
        assert map_priority("Medium") == "medium"
        assert map_priority("Low") == "low"
        assert map_priority("Lowest") == "low"

    def test_aliases_and_case(self):
        assert map_priority("BLOCKER") == "urgent"
        assert map_priority("p2") == "high"
        assert map_priority("Minor") == "low"

    def test_unknown_defaults_to_none(self):
        assert map_priority("Whatever") == "none"
        assert map_priority(None) == "none"
        assert map_priority("") == "none"


@pytest.mark.unit
class TestMapStatusGroup:
    def test_categories(self):
        assert map_status_group("new") == StateGroup.UNSTARTED.value
        assert map_status_group("indeterminate") == StateGroup.STARTED.value
        assert map_status_group("done") == StateGroup.COMPLETED.value

    def test_unknown_defaults_to_backlog(self):
        assert map_status_group("nonsense") == StateGroup.BACKLOG.value
        assert map_status_group(None) == StateGroup.BACKLOG.value


@pytest.mark.unit
class TestMapRelationType:
    def test_known_links(self):
        assert map_relation_type("Blocks") == "blocked_by"
        assert map_relation_type("is blocked by") == "blocked_by"
        assert map_relation_type("Duplicate") == "duplicate"
        assert map_relation_type("Relates") == "relates_to"

    def test_unknown_defaults_to_relates(self):
        assert map_relation_type("Cloners") == "relates_to"
        assert map_relation_type(None) == "relates_to"
