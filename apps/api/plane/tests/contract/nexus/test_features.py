# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest


@pytest.mark.contract
class TestWorkspaceFeatures:
    def test_defaults_enable_every_implemented_feature(self, client, ws_url, sdk):
        res = client.get(ws_url("features/"))
        assert res.status_code == 200, res.data
        features = sdk("plane.models.workspaces.WorkspaceFeature", res.data)
        assert features["customers"] and features["initiatives"] and features["releases"]
        assert features["work_item_types"] and features["states_owned_by_workspace"] is False

    def test_admin_can_toggle_one(self, client, ws_url):
        res = client.patch(ws_url("features/"), {"customers": False}, format="json")
        assert res.status_code == 200 and res.data["customers"] is False and res.data["releases"] is True

    def test_read_only_flag_is_refused(self, client, ws_url):
        res = client.patch(ws_url("features/"), {"states_owned_by_workspace": True}, format="json")
        assert res.status_code == 400 and "states_owned_by_workspace" in res.data["error"]

    def test_member_cannot_toggle(self, member_client, ws_url):
        assert member_client.patch(ws_url("features/"), {"customers": False}, format="json").status_code == 403

    def test_outsider_cannot_read(self, outsider_client, ws_url):
        assert outsider_client.get(ws_url("features/")).status_code == 403


@pytest.mark.contract
class TestProjectFeatures:
    def test_get_and_patch(self, client, project_url, project, sdk):
        res = client.get(project_url("features/"))
        assert res.status_code == 200
        sdk("plane.models.projects.ProjectFeature", res.data)
        res = client.patch(project_url("features/"), {"cycles": True, "epics": False}, format="json")
        assert res.status_code == 200 and res.data["cycles"] is True and res.data["epics"] is False
        project.refresh_from_db()
        assert project.cycle_view is True

    def test_member_cannot_patch(self, member_client, project_url):
        assert member_client.patch(project_url("features/"), {"cycles": True}, format="json").status_code == 403


@pytest.mark.contract
class TestEnablingIntake:
    def test_enabling_intake_creates_the_default_intake_so_items_can_be_filed(self, client, project_url, project):
        from plane.db.models import Intake

        res = client.patch(project_url("features/"), {"intakes": True}, format="json")
        assert res.status_code == 200
        assert Intake.objects.filter(project=project, is_default=True).count() == 1
        res = client.post(project_url("intake-issues/"), {"issue": {"name": "Please add SSO"}}, format="json")
        assert res.status_code == 201, res.data

    def test_stock_intake_create_recovers_when_intake_row_is_missing(self, client, project_url, project):
        project.intake_view = True
        project.save(update_fields=["intake_view"])
        res = client.post(project_url("intake-issues/"), {"issue": {"name": "Please add SSO"}}, format="json")
        assert res.status_code == 201, res.data


@pytest.mark.contract
class TestDefaultIntake:
    def test_update_and_delete_without_an_intake_do_not_create_one(self, client, project_url, project):
        from uuid import uuid4

        from plane.db.models import Intake

        project.intake_view = True
        project.save(update_fields=["intake_view"])
        url = project_url(f"intake-issues/{uuid4()}/")
        assert client.patch(url, {"issue": {"name": "x"}}, format="json").status_code == 404
        assert client.delete(url).status_code == 404
        assert not Intake.objects.filter(project=project).exists()

    def test_concurrent_first_submissions_share_one_intake(self, project, monkeypatch):
        from plane.api.views import intake as intake_views

        existing = intake_views.Intake.objects.create(name=f"{project.name} Intake", project=project, is_default=True)
        manager = intake_views.Intake.objects
        real_filter = manager.filter
        looks = []

        def filter_(*args, **kwargs):
            looks.append(kwargs)
            queryset = real_filter(*args, **kwargs)
            # The first look ran before the other request's intake was committed.
            return queryset.none() if len(looks) == 1 else queryset

        monkeypatch.setattr(manager, "filter", filter_)
        assert intake_views.ensure_default_intake(project) == existing
        assert len(looks) == 2
