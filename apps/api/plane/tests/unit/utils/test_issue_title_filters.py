# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json
from types import SimpleNamespace

import pytest

from plane.db.models import Issue, Project, State
from plane.utils.filters.filter_backend import ComplexFilterBackend
from plane.utils.filters.filterset import IssueFilterSet


@pytest.fixture
def title_issues(db, workspace, create_user):
    """Create project-scoped issues that distinguish title matches from description-only matches."""
    project = Project.objects.create(name="Title Filters", identifier="TF", workspace=workspace)
    started = State.objects.create(name="In progress", group="started", project=project, workspace=workspace)
    backlog = State.objects.create(name="Backlog", group="backlog", project=project, workspace=workspace)
    rows = [
        ("Fix LOGIN, SSO & 50%_done", "high", started, ""),
        ("login screen", "low", started, ""),
        ("Login backlog", "high", backlog, ""),
        ("Unrelated", "high", started, "<p>login appears only in description</p>"),
    ]
    for name, priority, state, description in rows:
        Issue.objects.create(
            name=name,
            priority=priority,
            state=state,
            description_html=description,
            project=project,
            workspace=workspace,
            created_by=create_user,
        )
    return Issue.objects.filter(project=project)


def filtered_titles(queryset, expression):
    """Apply a serialized rich-filter expression through the API backend and return matching titles."""
    request = SimpleNamespace(query_params={"filters": json.dumps(expression)})
    view = SimpleNamespace(filterset_class=IssueFilterSet)
    result = ComplexFilterBackend().filter_queryset(request, queryset, view)
    return set(result.values_list("name", flat=True))


@pytest.mark.unit
@pytest.mark.django_db
class TestTitleRichFilter:
    def test_matches_case_insensitive_substring_only_in_title(self, title_issues):
        """Verify mixed-case substrings match names without searching descriptions."""
        assert filtered_titles(title_issues, {"name__icontains": "LoGiN"}) == {
            "Fix LOGIN, SSO & 50%_done",
            "login screen",
            "Login backlog",
        }

    def test_combines_title_with_priority_and_state_group(self, title_issues):
        """Verify title, priority and state-group predicates intersect in an AND expression."""
        assert filtered_titles(
            title_issues,
            {
                "and": [
                    {"name__icontains": "login"},
                    {"priority__in": "high,urgent"},
                    {"state_group__in": "started"},
                ]
            },
        ) == {"Fix LOGIN, SSO & 50%_done"}

    def test_no_match_and_identifier_are_not_title_matches(self, title_issues):
        """Verify missing text, UUIDs and project identifiers do not match unrelated titles."""
        assert filtered_titles(title_issues, {"name__icontains": "does not exist"}) == set()
        issue = title_issues.get(name="Unrelated")
        assert filtered_titles(title_issues, {"name__icontains": str(issue.id)}) == set()
        assert filtered_titles(title_issues, {"name__icontains": f"TF-{issue.sequence_id}"}) == set()

    @pytest.mark.parametrize("substring", ["LOGIN, SSO", "50%_", "&"])
    def test_punctuation_is_literal_not_csv_or_sql_wildcards(self, title_issues, substring):
        """Verify commas, percent signs and underscores remain literal substring characters."""
        assert filtered_titles(title_issues, {"name__icontains": substring}) == {"Fix LOGIN, SSO & 50%_done"}

    def test_removing_title_preserves_other_filters(self, title_issues):
        """Verify a priority-only expression retains issues regardless of their title."""
        assert filtered_titles(title_issues, {"priority__in": "high"}) == {
            "Fix LOGIN, SSO & 50%_done",
            "Login backlog",
            "Unrelated",
        }
