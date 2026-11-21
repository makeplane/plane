# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""A cycle ending on the day the clocks go forward must not spill into the next day.

The end date was computed as project-local midnight plus 23h59m. That day is
only 23 hours long, so the cycle ended at 00:59 on the following day and the
date check rejected a cycle starting on that following day.
"""

from datetime import date

import pytest
from django.urls import reverse
from rest_framework import status

from plane.db.models import Project, ProjectMember


@pytest.fixture
def new_york_project(db, workspace, create_user):
    project = Project.objects.create(
        name="New York Project",
        identifier="NYC",
        workspace=workspace,
        created_by=create_user,
        timezone="America/New_York",
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.mark.contract
class TestCycleEndingOnDstTransitionDay:
    @pytest.mark.django_db
    def test_next_cycle_can_start_the_day_after(self, session_client, workspace, new_york_project):
        url_kwargs = {"slug": workspace.slug, "project_id": new_york_project.id}

        # Clocks go forward in New York on Sunday 2027-03-14.
        response = session_client.post(
            reverse("project-cycle", kwargs=url_kwargs),
            {"name": "Sprint 1", "start_date": "2027-03-01", "end_date": "2027-03-14"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["end_date"].date() == date(2027, 3, 14)

        response = session_client.post(
            reverse("project-cycle-date", kwargs=url_kwargs),
            {"start_date": "2027-03-15", "end_date": "2027-03-28"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] is True
