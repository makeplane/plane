# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""A points estimate holding text such as ``M = 2`` must not break cycle and module views.

Existing rows: the views ran ``CAST(value AS double precision)`` in SQL, which Postgres
rejects for non-numeric text, so the request returned a 500. Such values now count as
"no estimate" in SQL and in ``burndown_plot`` alike.

New rows: every write path rejects a non-numeric value for a ``points`` estimate with a
400; ``categories`` estimates keep accepting text.
"""

from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import (
    Cycle,
    CycleIssue,
    Estimate,
    EstimatePoint,
    Issue,
    Module,
    ModuleIssue,
    Project,
    ProjectMember,
)
from plane.utils.estimate import estimate_value_as_float, is_numeric_estimate


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="P", identifier="P", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


def make_estimate(project, estimate_type, values):
    estimate = Estimate.objects.create(name=f"E {estimate_type}", type=estimate_type, project=project)
    points = [
        EstimatePoint.objects.create(estimate=estimate, project=project, key=key, value=value)
        for key, value in enumerate(values, start=1)
    ]
    return estimate, points


@pytest.fixture
def bad_points(project, workspace, create_user):
    """A points estimate with a pre-existing text value; one issue per point, in a cycle and a module."""
    estimate, points = make_estimate(project, "points", ["M = 2", "3"])
    project.estimate = estimate
    project.save()
    today = timezone.now()
    cycle = Cycle.objects.create(
        name="C",
        project=project,
        workspace=workspace,
        owned_by=create_user,
        start_date=today - timedelta(days=1),
        end_date=today + timedelta(days=1),
    )
    module = Module.objects.create(
        name="M",
        project=project,
        workspace=workspace,
        start_date=(today - timedelta(days=1)).date(),
        target_date=(today + timedelta(days=1)).date(),
    )
    for point in points:
        issue = Issue.objects.create(name=point.value, workspace=workspace, project=project, estimate_point=point)
        CycleIssue.objects.create(issue=issue, cycle=cycle, project=project, workspace=workspace)
        ModuleIssue.objects.create(issue=issue, module=module, project=project, workspace=workspace)
    return {"cycle": cycle, "module": module}


def base(workspace, project):
    return f"/api/workspaces/{workspace.slug}/projects/{project.id}"


@pytest.mark.contract
@pytest.mark.django_db
def test_cycle_analytics_skips_non_numeric_point(session_client, workspace, project, bad_points):
    response = session_client.get(f"{base(workspace, project)}/cycles/{bad_points['cycle'].id}/analytics/?type=points")

    assert response.status_code == status.HTTP_200_OK
    # SQL distribution and Python burndown agree: only the "3" counts
    assert [row["total_estimates"] for row in response.data["assignees"]] == [3.0]
    assert response.data["completion_chart"][str(timezone.now().date())] == 3.0


@pytest.mark.contract
@pytest.mark.django_db
def test_cycle_progress_skips_non_numeric_point(session_client, workspace, project, bad_points):
    response = session_client.get(f"{base(workspace, project)}/cycles/{bad_points['cycle'].id}/progress/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["total_estimate_points"] == 3.0


@pytest.mark.contract
@pytest.mark.django_db
def test_module_retrieve_skips_non_numeric_point(session_client, workspace, project, bad_points, mock_celery):
    response = session_client.get(f"{base(workspace, project)}/modules/{bad_points['module'].id}/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["total_estimate_points"] == 3.0
    assert [row["total_estimates"] for row in response.data["estimate_distribution"]["assignees"]] == [3.0]


@pytest.mark.contract
@pytest.mark.django_db
def test_workspace_analytics_skips_non_numeric_point(session_client, workspace, bad_points):
    response = session_client.get(f"/api/workspaces/{workspace.slug}/analytics/?x_axis=priority&y_axis=estimate")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["distribution"] == {"none": [{"dimension": "none", "estimate": 3.0}]}


# Values Python float() and Postgres would otherwise read differently, or that Postgres refuses to cast
TRICKY_VALUES = ["3", "2.5", "3.", ".5", "007", " 2 ", "9" * 255, "M = 2", "", " ", ".", "-1", "+1", "1e3"]
TRICKY_VALUES += ["NaN", "inf", "Infinity", "0x10", "1_000", "1,5", "1.2.3", "3\n", "\t3", "\u0663"]


@pytest.mark.contract
@pytest.mark.django_db
def test_sql_and_python_agree_on_numeric_values(workspace, project):
    _, points = make_estimate(project, "points", TRICKY_VALUES)
    for point in points:
        Issue.objects.create(name="I", workspace=workspace, project=project, estimate_point=point)

    rows = Issue.objects.filter(project=project).annotate(number=estimate_value_as_float())
    rows = list(rows.values_list("estimate_point__value", "number"))

    assert len(rows) == len(TRICKY_VALUES)
    for value, number in rows:
        assert number == (float(value) if is_numeric_estimate(value) else None), repr(value)


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize(
    "estimate_type, value, expected",
    [
        ("points", "M = 2", status.HTTP_400_BAD_REQUEST),
        ("points", "2.5", status.HTTP_200_OK),
        ("categories", "M = 2", status.HTTP_200_OK),
    ],
)
def test_bulk_create_checks_point_values(session_client, workspace, project, estimate_type, value, expected):
    payload = {"estimate": {"name": "E", "type": estimate_type}, "estimate_points": [{"key": 1, "value": value}]}

    response = session_client.post(f"{base(workspace, project)}/estimates/", payload, format="json")

    assert response.status_code == expected
    # a rejected request leaves no estimate behind
    created = 1 if expected == status.HTTP_200_OK else 0
    assert Estimate.objects.filter(project=project).count() == created
    assert EstimatePoint.objects.filter(project=project).count() == created


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize(
    "estimate_type, value, expected",
    [
        ("points", "L", status.HTTP_400_BAD_REQUEST),
        ("points", "8", status.HTTP_200_OK),
        ("categories", "L", status.HTTP_200_OK),
    ],
)
def test_point_create_and_update_check_value(session_client, workspace, project, estimate_type, value, expected):
    estimate, (point,) = make_estimate(project, estimate_type, ["1"])
    url = f"{base(workspace, project)}/estimates/{estimate.id}/estimate-points/"

    response = session_client.post(url, {"key": 2, "value": value}, format="json")
    assert response.status_code == expected

    response = session_client.patch(f"{url}{point.id}/", {"value": value}, format="json")
    assert response.status_code == expected

    values = set(EstimatePoint.objects.filter(estimate=estimate).values_list("value", flat=True))
    assert values == ({value} if expected == status.HTTP_200_OK else {"1"})


@pytest.mark.contract
@pytest.mark.django_db
def test_bulk_update_rejects_type_change_to_points_with_text_values(session_client, workspace, project):
    estimate, (small, large) = make_estimate(project, "categories", ["S", "L"])
    url = f"{base(workspace, project)}/estimates/{estimate.id}/"

    # "L" is not in the payload and stays text, so the estimate cannot become a points estimate
    payload = {"estimate": {"type": "points"}, "estimate_points": [{"id": str(small.id), "value": "1"}]}
    response = session_client.patch(url, payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    # nothing was saved
    estimate.refresh_from_db()
    small.refresh_from_db()
    assert (estimate.type, small.value) == ("categories", "S")

    payload["estimate_points"].append({"id": str(large.id), "value": "3"})
    response = session_client.patch(url, payload, format="json")

    assert response.status_code == status.HTTP_200_OK
    estimate.refresh_from_db()
    assert estimate.type == "points"
    assert set(estimate.points.values_list("value", flat=True)) == {"1", "3"}

    # and once it is a points estimate, a point cannot be set back to text
    payload = {"estimate_points": [{"id": str(small.id), "value": "S"}]}
    response = session_client.patch(url, payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    small.refresh_from_db()
    assert small.value == "1"
