# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework.test import APIClient

from plane.db.models import ReportTemplate, ResearchAuditEvent
from plane.tests.research_fixtures import (
    add_workspace_member,
    enable_research,
    make_user,
    make_workspace,
)

pytestmark = pytest.mark.contract


@pytest.fixture(autouse=True)
def research_module_on(settings):
    settings.RESEARCH_MODULE_ENABLED = True


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def env(db):
    admin = make_user(first_name="Admin")
    workspace = make_workspace(admin)
    enable_research(workspace)
    member = make_user(first_name="Member")
    add_workspace_member(workspace, member)
    return {
        "admin": admin,
        "member": member,
        "workspace": workspace,
        "admin_client": client_for(admin),
        "member_client": client_for(member),
        "templates_url": f"/api/research/workspaces/{workspace.slug}/report-templates/",
        "audit_url": f"/api/research/workspaces/{workspace.slug}/audit-events/",
    }


@pytest.mark.django_db
class TestReportTemplateApi:
    def test_templates_are_an_administrator_surface(self, env):
        created = env["admin_client"].post(
            env["templates_url"],
            {"name": "Standard weekly", "report_type": "WEEKLY", "is_default": True},
            format="json",
        )
        assert created.status_code == 201
        assert created.json()["is_default"] is True

        listing = env["admin_client"].get(env["templates_url"]).json()
        assert listing["count"] == 1
        assert listing["results"][0]["name"] == "Standard weekly"

        # v2.5.0: a plain member without a research relation is refused, which is
        # the same rule that hides the 报告模板 menu entry.
        denied = env["member_client"].get(env["templates_url"])
        assert denied.status_code == 403
        assert denied.json()["error_code"] == "research_permission_denied"

    def test_member_cannot_create_templates(self, env):
        response = env["member_client"].post(
            env["templates_url"],
            {"name": "Nope", "report_type": "WEEKLY"},
            format="json",
        )
        assert response.status_code == 403

    def test_duplicate_template_name_is_rejected(self, env):
        payload = {"name": "Standard", "report_type": "WEEKLY"}
        assert env["admin_client"].post(env["templates_url"], payload, format="json").status_code == 201
        duplicate = env["admin_client"].post(env["templates_url"], payload, format="json")
        assert duplicate.status_code == 400

    def test_marking_a_new_default_unsets_the_previous_one(self, env):
        first = env["admin_client"].post(
            env["templates_url"],
            {"name": "First", "report_type": "WEEKLY", "is_default": True},
            format="json",
        ).json()
        second = env["admin_client"].post(
            env["templates_url"],
            {"name": "Second", "report_type": "WEEKLY", "is_default": True},
            format="json",
        ).json()
        assert env["admin_client"].get(f"{env['templates_url']}{first['id']}/").json()["is_default"] is False
        assert env["admin_client"].get(f"{env['templates_url']}{second['id']}/").json()["is_default"] is True
        assert ReportTemplate.objects.filter(is_default=True).count() == 1

    def test_default_flags_are_scoped_per_report_type(self, env):
        env["admin_client"].post(
            env["templates_url"], {"name": "W", "report_type": "WEEKLY", "is_default": True}, format="json"
        )
        env["admin_client"].post(
            env["templates_url"], {"name": "M", "report_type": "MONTHLY", "is_default": True}, format="json"
        )
        assert ReportTemplate.objects.filter(is_default=True).count() == 2

    def test_update_and_soft_delete_are_audited(self, env):
        template = env["admin_client"].post(
            env["templates_url"], {"name": "Draft", "report_type": "WEEKLY"}, format="json"
        ).json()
        updated = env["admin_client"].patch(
            f"{env['templates_url']}{template['id']}/", {"name": "Renamed"}, format="json"
        )
        assert updated.status_code == 200
        assert updated.json()["name"] == "Renamed"

        removed = env["admin_client"].delete(f"{env['templates_url']}{template['id']}/")
        assert removed.status_code == 204
        assert ReportTemplate.objects.filter(pk=template["id"]).count() == 0
        assert ReportTemplate.all_objects.filter(pk=template["id"], is_active=False).exists()

        actions = set(ResearchAuditEvent.objects.values_list("action", flat=True))
        assert {"template.create", "template.update", "template.delete"} <= actions

    def test_invalid_report_type_is_rejected(self, env):
        response = env["admin_client"].post(
            env["templates_url"], {"name": "X", "report_type": "DAILY"}, format="json"
        )
        assert response.status_code == 400


@pytest.mark.django_db
class TestAuditQueryApi:
    def _seed(self, env):
        env["admin_client"].post(
            env["templates_url"], {"name": "Seed", "report_type": "WEEKLY"}, format="json"
        )
        env["admin_client"].patch(
            f"/api/research/workspaces/{env['workspace'].slug}/settings/",
            {"module_enabled": True},
            format="json",
        )

    def test_admin_can_query_and_filter_events(self, env):
        self._seed(env)
        response = env["admin_client"].get(env["audit_url"])
        assert response.status_code == 200
        payload = response.json()
        assert payload["total"] >= 2
        assert all(event["workspace"] == str(env["workspace"].id) for event in payload["results"])

        filtered = env["admin_client"].get(f"{env['audit_url']}?action=template.create").json()
        assert filtered["total"] == 1
        assert filtered["results"][0]["action"] == "template.create"

        by_actor = env["admin_client"].get(f"{env['audit_url']}?actor={env['admin'].id}").json()
        assert by_actor["total"] >= 2

    def test_non_admin_cannot_query_audit(self, env):
        response = env["member_client"].get(env["audit_url"])
        assert response.status_code == 403

    def test_invalid_date_filter_is_rejected(self, env):
        response = env["admin_client"].get(f"{env['audit_url']}?from=not-a-date")
        assert response.status_code == 400

    def test_audit_trail_has_no_mutation_endpoint(self, env):
        self._seed(env)
        event = ResearchAuditEvent.objects.first()
        assert env["admin_client"].patch(f"{env['audit_url']}{event.id}/", {}, format="json").status_code == 404
        assert env["admin_client"].delete(f"{env['audit_url']}{event.id}/").status_code == 404

    def test_audit_events_survive_business_object_deletion(self, env):
        template = env["admin_client"].post(
            env["templates_url"], {"name": "Temp", "report_type": "WEEKLY"}, format="json"
        ).json()
        env["admin_client"].delete(f"{env['templates_url']}{template['id']}/")
        assert ResearchAuditEvent.objects.filter(resource_id=template["id"]).count() >= 2

    def test_audit_events_are_scoped_to_the_workspace(self, env):
        other_admin = make_user()
        other_workspace = make_workspace(other_admin)
        enable_research(other_workspace)
        other_client = client_for(other_admin)
        other_client.post(
            f"/api/research/workspaces/{other_workspace.slug}/report-templates/",
            {"name": "Other", "report_type": "WEEKLY"},
            format="json",
        )
        payload = env["admin_client"].get(env["audit_url"]).json()
        assert all(event["workspace"] == str(env["workspace"].id) for event in payload["results"])
