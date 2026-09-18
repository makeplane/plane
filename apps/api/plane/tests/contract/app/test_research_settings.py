# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework.test import APIClient

from plane.db.models import OrgUnit, ResearchAuditEvent, WorkspaceResearchSetting
from plane.research.utils.settings import workspace_research_enabled
from plane.tests.research_fixtures import (
    add_workspace_member,
    enable_research,
    make_user,
    make_workspace,
    org_units_url,
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
    member = make_user(first_name="Member")
    add_workspace_member(workspace, member)
    return {
        "admin": admin,
        "member": member,
        "workspace": workspace,
        "admin_client": client_for(admin),
        "member_client": client_for(member),
        "url": f"/api/research/workspaces/{workspace.slug}/settings/",
        "identity_url": f"/api/research/workspaces/{workspace.slug}/identity/me/",
    }


@pytest.mark.django_db
class TestResearchSettingsEndpoint:
    def test_defaults_follow_the_deployment_switch_when_no_row_exists(self, env):
        # A workspace without a row renders research by default; reading the
        # page provisions the row without flipping the workspace off. The page
        # is an administrator surface since v2.5.0, so the administrator reads
        # it and a plain member is refused.
        assert not WorkspaceResearchSetting.objects.filter(workspace=env["workspace"]).exists()
        refused = env["member_client"].get(env["url"])
        assert refused.status_code == 403
        assert refused.json()["error_code"] == "research_permission_denied"

        response = env["admin_client"].get(env["url"])
        assert response.status_code == 200
        payload = response.json()
        assert payload["module_enabled"] is True
        assert payload["default_report_visibility"] == "DIRECT_ADVISOR"
        assert payload["image_max_mb"] == 20
        assert payload["pdf_max_mb"] == 100
        assert payload["markdown_max_mb"] == 5
        assert payload["audit_retention_days"] == 0
        assert WorkspaceResearchSetting.objects.filter(workspace=env["workspace"]).exists()
        assert env["member_client"].get(env["identity_url"]).json()["workspace_enabled"] is True

    def test_workspace_without_row_renders_research_by_default(self, env):
        assert not WorkspaceResearchSetting.objects.filter(workspace=env["workspace"]).exists()
        identity = env["member_client"].get(env["identity_url"]).json()
        assert identity["workspace_enabled"] is True
        assert identity["sections"] == {
            "org": True,
            "reports": True,
            "approvals": True,
            "stages": True,
            "experiments": True,
            "code": True,
            "integrations": True,
        }
        assert env["member_client"].get(org_units_url(env["workspace"])).status_code == 200

    def test_workspace_without_row_stays_off_when_the_deployment_switch_is_off(self, env, settings):
        settings.RESEARCH_MODULE_ENABLED = False
        assert workspace_research_enabled(env["workspace"]) is False
        assert env["member_client"].get(env["identity_url"]).status_code == 404

    def test_workspace_member_cannot_patch_settings(self, env):
        response = env["member_client"].patch(env["url"], {"module_enabled": True}, format="json")
        assert response.status_code == 403
        assert response.json()["error_code"] == "research_permission_denied"

    def test_admin_can_toggle_switches_and_limits(self, env):
        response = env["admin_client"].patch(
            env["url"],
            {
                "module_enabled": True,
                "org_enabled": True,
                "report_enabled": False,
                "approval_enabled": True,
                "pdf_max_mb": 200,
                "timezone": "Asia/Shanghai",
            },
            format="json",
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["module_enabled"] is True
        assert payload["report_enabled"] is False
        assert payload["pdf_max_mb"] == 200
        assert payload["timezone"] == "Asia/Shanghai"

        event = ResearchAuditEvent.objects.filter(action="config.update").first()
        assert event is not None
        assert "pdf_max_mb" in event.metadata["changed"]

    def test_research_limits_do_not_touch_the_global_upload_limit(self, env, settings):
        default_limit = settings.FILE_SIZE_LIMIT
        env["admin_client"].patch(env["url"], {"module_enabled": True, "pdf_max_mb": 200}, format="json")
        assert settings.FILE_SIZE_LIMIT == default_limit

    def test_invalid_visibility_is_rejected(self, env):
        response = env["admin_client"].patch(
            env["url"], {"default_report_visibility": "EVERYONE"}, format="json"
        )
        assert response.status_code == 400
        assert response.json()["error_code"] == "report_visibility_exceeds_default"

    def test_invalid_timezone_is_rejected(self, env):
        response = env["admin_client"].patch(env["url"], {"timezone": "Mars/Olympus"}, format="json")
        assert response.status_code == 400

    def test_admin_configures_required_reporter_categories(self, env):
        response = env["admin_client"].patch(
            env["url"],
            {"required_reporter_categories": ["STUDENT", "POSTDOC", "STUDENT"]},
            format="json",
        )

        assert response.status_code == 200
        assert response.data["required_reporter_categories"] == ["STUDENT", "POSTDOC"]

    def test_unknown_required_reporter_category_is_rejected(self, env):
        response = env["admin_client"].patch(
            env["url"],
            {"required_reporter_categories": ["STUDENT", "UNKNOWN"]},
            format="json",
        )

        assert response.status_code == 400
        assert response.data["error_code"] == "org_member_invalid"

    def test_enabling_the_module_provisions_the_root_node(self, env):
        assert OrgUnit.objects.filter(workspace=env["workspace"]).count() == 0
        env["admin_client"].patch(env["url"], {"module_enabled": True}, format="json")
        root = OrgUnit.objects.filter(workspace=env["workspace"]).first()
        assert root is not None
        assert root.unit_type == OrgUnit.UnitType.ROOT

    def test_workspace_switch_gates_research_endpoints(self, env):
        enable_research(env["workspace"], module_enabled=False)
        identity = env["member_client"].get(env["identity_url"]).json()
        assert identity["module_enabled"] is True
        assert identity["workspace_enabled"] is False
        assert identity["sections"] == {
            "org": False,
            "reports": False,
            "approvals": False,
            "stages": False,
            "experiments": False,
            "code": False,
            "integrations": False,
        }

        blocked = env["member_client"].get(org_units_url(env["workspace"]))
        assert blocked.status_code == 403
        assert blocked.json()["error_code"] == "research_module_not_enabled"

    def test_sub_switch_disables_only_its_section(self, env):
        enable_research(env["workspace"], report_enabled=False)
        identity = env["member_client"].get(env["identity_url"]).json()
        assert identity["sections"] == {
            "org": True,
            "reports": False,
            "approvals": True,
            "stages": True,
            "experiments": True,
            "code": True,
            "integrations": True,
        }
        assert env["member_client"].get(org_units_url(env["workspace"])).status_code == 200

    def test_deployment_switch_wins(self, env, settings):
        enable_research(env["workspace"])
        settings.RESEARCH_MODULE_ENABLED = False
        response = env["admin_client"].get(env["url"])
        assert response.status_code == 404
        assert response.json()["error_code"] == "research_module_disabled"
        assert WorkspaceResearchSetting.objects.filter(workspace=env["workspace"]).exists()
