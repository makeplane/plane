# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Project estimates and estimate points, served from CE's own public views (plane-sdk api/estimates)."""

import pytest

from plane.db.models import Estimate, Project

M = "plane.models.estimates"


@pytest.mark.contract
class TestEstimates:
    def test_lifecycle(self, client, project_url, project, sdk):
        assert client.get(project_url("estimates/")).status_code == 404

        res = client.post(
            project_url("estimates/"), {"name": "Hours", "type": "time", "last_used": True}, format="json"
        )
        assert res.status_code == 201, res.data
        estimate = sdk(f"{M}.Estimate", res.data)
        assert estimate["type"] == "time" and estimate["project"] == str(project.id)
        assert client.post(project_url("estimates/"), {"name": "Again"}, format="json").status_code == 409
        assert client.post(project_url("estimates/"), {"name": "Bad", "type": "weird"}, format="json").status_code in (
            400,
            409,
        )

        assert sdk(f"{M}.Estimate", client.get(project_url("estimates/")).data)["id"] == estimate["id"]
        res = client.patch(project_url("estimates/"), {"name": "Effort", "description": "d"}, format="json")
        assert res.status_code == 200 and sdk(f"{M}.Estimate", res.data)["name"] == "Effort"

        points_url = project_url(f"estimates/{estimate['id']}/estimate-points/")
        res = client.post(points_url, [{"value": "1", "key": 0}, {"value": "2", "key": 1}], format="json")
        assert res.status_code == 201, res.data
        points = [sdk(f"{M}.EstimatePoint", p) for p in res.data]
        res = client.get(points_url)
        assert res.status_code == 200 and len([sdk(f"{M}.EstimatePoint", p) for p in res.data]) == 2

        res = client.patch(f"{points_url}{points[0]['id']}/", {"value": "3", "key": 5}, format="json")
        assert res.status_code == 200 and sdk(f"{M}.EstimatePoint", res.data)["value"] == "3"
        assert client.delete(f"{points_url}{points[1]['id']}/").status_code == 204
        assert len(client.get(points_url).data) == 1

        Project.objects.filter(pk=project.pk).update(estimate_id=estimate["id"])
        assert client.delete(project_url("estimates/")).status_code == 204
        project.refresh_from_db()
        assert project.estimate_id is None
        assert client.get(project_url("estimates/")).status_code == 404

    def test_retrieve_returns_the_active_estimate(self, client, project_url, project, workspace):
        Estimate.objects.create(name="Old", project=project, workspace=workspace)
        active = Estimate.objects.create(name="Zzz active", project=project, workspace=workspace)
        Project.objects.filter(pk=project.pk).update(estimate=active)
        assert str(client.get(project_url("estimates/")).data["id"]) == str(active.id)

    def test_permissions_and_foreign_ids(self, client, guest_client, outsider_client, project_url, workspace, project):
        res = client.post(project_url("estimates/"), {"name": "Points", "type": "points"}, format="json")
        assert guest_client.get(project_url("estimates/")).status_code == 200
        assert guest_client.patch(project_url("estimates/"), {"name": "x"}, format="json").status_code == 403
        assert outsider_client.get(project_url("estimates/")).status_code == 403

        other = Project.objects.create(name="Other", identifier="OT", workspace=workspace)
        foreign = Estimate.objects.create(name="Elsewhere", project=other, workspace=workspace)
        url = project_url(f"estimates/{foreign.id}/estimate-points/")
        assert client.get(url).status_code == 404
        assert client.post(url, [{"value": "1", "key": 0}], format="json").status_code == 404
        assert res.status_code == 201
