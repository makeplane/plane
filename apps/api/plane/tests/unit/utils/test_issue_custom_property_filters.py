"""Unit tests for custom property issue filtering."""

import pytest
from django.db.models import Q

from plane.db.models import Issue, IssueProperty, IssuePropertyValue
from plane.utils.filters.issue_filter_backend import IssueComplexFilterBackend


@pytest.mark.unit
class TestIssueCustomPropertyFilters:
    def test_build_custom_property_exact_filter(self, db, workspace, create_user):
        from plane.db.models import Project, State, ProjectMember

        project = Project.objects.create(name="P", identifier="P1", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        state = State.objects.create(name="Open", project=project, workspace=workspace)

        prop = IssueProperty.objects.create(
            name="Priority tier",
            key="priority_tier",
            property_type="select",
            options=[{"value": "High"}, {"value": "Low"}],
            project=project,
            workspace=workspace,
            created_by=create_user,
        )

        issue_high = Issue.objects.create(
            name="High issue",
            project=project,
            workspace=workspace,
            state=state,
            created_by=create_user,
        )
        IssuePropertyValue.objects.create(
            issue=issue_high,
            property=prop,
            value="High",
            project=project,
            workspace=workspace,
            created_by=create_user,
        )

        issue_low = Issue.objects.create(
            name="Low issue",
            project=project,
            workspace=workspace,
            state=state,
            created_by=create_user,
        )
        IssuePropertyValue.objects.create(
            issue=issue_low,
            property=prop,
            value="Low",
            project=project,
            workspace=workspace,
            created_by=create_user,
        )

        backend = IssueComplexFilterBackend()
        view = type("View", (), {"kwargs": {"project_id": str(project.id)}})()

        conditions = {f"customproperty_{prop.id}__exact": "High"}
        q = backend._build_custom_property_q(conditions, view)

        qs = Issue.issue_objects.filter(project=project).filter(q).distinct()
        ids = set(qs.values_list("id", flat=True))

        assert issue_high.id in ids
        assert issue_low.id not in ids
        assert isinstance(q, Q)
