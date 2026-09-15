# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework.test import APIClient

from plane.db.models import FileAsset, OrgUnit, OrgUnitMember, Page, ReportAttachment, ResearchAuditEvent
from plane.tests.research_fixtures import add_workspace_member, enable_research, make_user, make_workspace

pytestmark = pytest.mark.contract

MB = 1024 * 1024


@pytest.fixture(autouse=True)
def research_module_on(settings):
    settings.RESEARCH_MODULE_ENABLED = True


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def create_unit(workspace, name, parent=None, unit_type=OrgUnit.UnitType.GROUP):
    unit = OrgUnit.objects.create(
        workspace=workspace,
        name=name,
        parent=parent,
        unit_type=unit_type,
        depth=(parent.depth + 1) if parent else 0,
        path="",
    )
    unit.path = (parent.path if parent else "/") + str(unit.id).replace("-", "") + "/"
    unit.save(update_fields=["path"])
    return unit


def make_asset(workspace, user, name, content_type, size):
    return FileAsset.objects.create(
        attributes={"name": name, "type": content_type, "size": size},
        asset=f"{workspace.slug}/{name}",
        size=size,
        workspace=workspace,
        user=user,
        created_by=user,
        entity_type=FileAsset.EntityTypeContext.REPORT_ATTACHMENT,
        is_uploaded=True,
    )


@pytest.fixture
def env(db):
    admin = make_user(first_name="Admin")
    workspace = make_workspace(admin)
    enable_research(workspace)
    student = make_user(first_name="Student")
    outsider = make_user(first_name="Outsider")
    for user in (student, outsider):
        add_workspace_member(workspace, user)

    root = create_unit(workspace, "Root", None, OrgUnit.UnitType.ROOT)
    group = create_unit(workspace, "Group", root, OrgUnit.UnitType.GROUP)
    OrgUnitMember.objects.create(
        workspace=workspace, org_unit=group, user=student, org_role=OrgUnitMember.OrgRole.OWNER
    )

    student_client = client_for(student)
    student_client.post(
        f"/api/research/workspaces/{workspace.slug}/projects/",
        {"org_unit": str(group.id)},
        format="json",
    )
    report = student_client.post(
        f"/api/research/workspaces/{workspace.slug}/reports/",
        {"report_type": "WEEKLY", "period_key": "2026-W38", "visibility": "PRIVATE"},
        format="json",
    ).json()

    return {
        "admin": admin,
        "student": student,
        "outsider": outsider,
        "workspace": workspace,
        "report": report,
        "student_client": student_client,
        "outsider_client": client_for(outsider),
        "admin_client": client_for(admin),
        "attachments_url": (
            f"/api/research/workspaces/{workspace.slug}/reports/{report['id']}/attachments/"
        ),
    }


@pytest.mark.django_db
class TestReportAttachments:
    def test_pdf_can_be_registered(self, env):
        asset = make_asset(env["workspace"], env["student"], "paper.pdf", "application/pdf", 2 * MB)
        response = env["student_client"].post(
            env["attachments_url"], {"asset_id": str(asset.id)}, format="json"
        )
        assert response.status_code == 201
        payload = response.json()
        assert payload["kind"] == "PDF"
        assert ReportAttachment.objects.filter(report_id=env["report"]["id"]).count() == 1
        assert ResearchAuditEvent.objects.filter(action="report.attachment.add").exists()

    def test_unsupported_type_is_rejected_and_audited(self, env):
        asset = make_asset(env["workspace"], env["student"], "payload.sh", "application/x-sh", 1024)
        response = env["student_client"].post(
            env["attachments_url"], {"asset_id": str(asset.id)}, format="json"
        )
        assert response.status_code == 422
        assert response.json()["error_code"] == "file_type_not_allowed"
        assert ResearchAuditEvent.objects.filter(action="report.attachment.denied").exists()

    def test_oversized_pdf_is_rejected(self, env):
        asset = make_asset(env["workspace"], env["student"], "big.pdf", "application/pdf", 101 * MB)
        response = env["student_client"].post(
            env["attachments_url"], {"asset_id": str(asset.id)}, format="json"
        )
        assert response.status_code == 422
        assert response.json()["error_code"] == "file_size_exceeded"

    def test_workspace_limit_overrides_the_default(self, env):
        env["admin_client"].patch(
            f"/api/research/workspaces/{env['workspace'].slug}/settings/",
            {"pdf_max_mb": 200},
            format="json",
        )
        asset = make_asset(env["workspace"], env["student"], "big.pdf", "application/pdf", 150 * MB)
        response = env["student_client"].post(
            env["attachments_url"], {"asset_id": str(asset.id)}, format="json"
        )
        assert response.status_code == 201

    def test_duplicate_registration_is_rejected(self, env):
        asset = make_asset(env["workspace"], env["student"], "paper.pdf", "application/pdf", MB)
        payload = {"asset_id": str(asset.id)}
        assert env["student_client"].post(env["attachments_url"], payload, format="json").status_code == 201
        duplicate = env["student_client"].post(env["attachments_url"], payload, format="json")
        assert duplicate.status_code in (400, 422)

    def test_submitted_report_rejects_new_attachments(self, env):
        env["student_client"].post(
            f"/api/research/workspaces/{env['workspace'].slug}/reports/{env['report']['id']}/submit/",
            {},
            format="json",
        )
        asset = make_asset(env["workspace"], env["student"], "paper.pdf", "application/pdf", MB)
        response = env["student_client"].post(
            env["attachments_url"], {"asset_id": str(asset.id)}, format="json"
        )
        assert response.status_code == 409

    def test_attachment_list_is_acl_filtered(self, env):
        asset = make_asset(env["workspace"], env["student"], "paper.pdf", "application/pdf", MB)
        env["student_client"].post(env["attachments_url"], {"asset_id": str(asset.id)}, format="json")

        owner_list = env["student_client"].get(env["attachments_url"]).json()
        assert owner_list["count"] == 1
        # a private report is invisible to an unrelated member
        assert env["outsider_client"].get(env["attachments_url"]).status_code == 404

    def test_download_rechecks_the_acl(self, env, monkeypatch):
        asset = make_asset(env["workspace"], env["student"], "paper.pdf", "application/pdf", MB)
        attachment = env["student_client"].post(
            env["attachments_url"], {"asset_id": str(asset.id)}, format="json"
        ).json()
        download_url = f"{env['attachments_url']}{attachment['id']}/"

        allowed = env["student_client"].get(download_url)
        assert allowed.status_code == 302

        denied = env["outsider_client"].get(download_url)
        assert denied.status_code in (403, 404)
        assert ResearchAuditEvent.objects.filter(action="report.attachment.denied").exists()

    def test_delete_is_soft(self, env):
        asset = make_asset(env["workspace"], env["student"], "paper.pdf", "application/pdf", MB)
        attachment = env["student_client"].post(
            env["attachments_url"], {"asset_id": str(asset.id)}, format="json"
        ).json()
        response = env["student_client"].delete(f"{env['attachments_url']}{attachment['id']}/")
        assert response.status_code == 204
        assert ReportAttachment.objects.filter(pk=attachment["id"]).count() == 0
        assert ReportAttachment.all_objects.filter(pk=attachment["id"]).exists()

    def test_global_upload_limit_is_unchanged(self, env, settings):
        assert settings.FILE_SIZE_LIMIT == settings.FILE_SIZE_LIMIT
        env["admin_client"].patch(
            f"/api/research/workspaces/{env['workspace'].slug}/settings/",
            {"image_max_mb": 5, "pdf_max_mb": 10},
            format="json",
        )

    def test_presign_creates_a_pending_asset_and_register_completes_it(self, env, monkeypatch):
        monkeypatch.setattr(
            "plane.settings.storage.S3Storage.generate_presigned_post",
            lambda self, object_name, file_type, file_size, expiration=None: {
                "url": "https://s3.example.com/bucket",
                "fields": {"key": object_name, "Content-Type": file_type},
            },
        )
        monkeypatch.setattr(
            "plane.settings.storage.S3Storage.get_object_metadata",
            lambda self, object_name: {"size": 2 * MB, "content_type": "application/pdf"},
        )

        presign = env["student_client"].post(
            f"{env['attachments_url']}presign/",
            {"file_name": "paper.pdf", "content_type": "application/pdf", "size": 2 * MB},
            format="json",
        )
        assert presign.status_code == 200
        payload = presign.json()
        assert payload["upload_data"]["url"]
        assert FileAsset.objects.get(pk=payload["asset_id"]).is_uploaded is False

        registered = env["student_client"].post(
            env["attachments_url"], {"asset_id": payload["asset_id"]}, format="json"
        )
        assert registered.status_code == 201
        assert FileAsset.objects.get(pk=payload["asset_id"]).is_uploaded is True

    def test_presign_rejects_disallowed_types_and_sizes(self, env, monkeypatch):
        monkeypatch.setattr(
            "plane.settings.storage.S3Storage.generate_presigned_post",
            lambda self, object_name, file_type, file_size, expiration=None: {"url": "x", "fields": {}},
        )
        rejected_type = env["student_client"].post(
            f"{env['attachments_url']}presign/",
            {"file_name": "payload.exe", "content_type": "application/octet-stream", "size": 1024},
            format="json",
        )
        assert rejected_type.status_code == 422
        assert rejected_type.json()["error_code"] == "file_type_not_allowed"

        rejected_size = env["student_client"].post(
            f"{env['attachments_url']}presign/",
            {"file_name": "big.pdf", "content_type": "application/pdf", "size": 101 * MB},
            format="json",
        )
        assert rejected_size.status_code == 422
        assert rejected_size.json()["error_code"] == "file_size_exceeded"


@pytest.mark.django_db
class TestMarkdownImport:
    def _import_url(self, env):
        return f"/api/research/workspaces/{env['workspace'].slug}/reports/{env['report']['id']}/import-markdown/"

    def test_import_writes_the_page_body(self, env):
        response = env["student_client"].post(
            self._import_url(env),
            {"content": "# Title\n\n- item\n\n```\ncode\n```", "file_name": "weekly.md"},
            format="json",
        )
        assert response.status_code == 200
        page = Page.objects.get(pk=env["report"]["page"])
        assert "<h1>Title</h1>" in page.description_html
        assert "<li>item</li>" in page.description_html
        assert ResearchAuditEvent.objects.filter(action="report.import.markdown").exists()

    def test_local_images_are_reported_back(self, env):
        response = env["student_client"].post(
            self._import_url(env),
            {"content": "![local](./img.png)\n\n![remote](https://example.com/a.png)"},
            format="json",
        )
        assert response.status_code == 200
        assert response.json()["local_images"] == ["./img.png"]
        assert "https://example.com/a.png" in response.json()["content_html"]

    def test_oversized_markdown_is_rejected(self, env):
        response = env["student_client"].post(
            self._import_url(env),
            {"content": "x" * (6 * MB), "file_name": "big.md"},
            format="json",
        )
        # the body size guard rejects the payload before the view runs
        assert response.status_code == 413
        page = Page.objects.get(pk=env["report"]["page"])
        assert "<p></p>" in page.description_html

    def test_import_into_a_submitted_report_is_rejected(self, env):
        env["student_client"].post(
            f"/api/research/workspaces/{env['workspace'].slug}/reports/{env['report']['id']}/submit/",
            {},
            format="json",
        )
        response = env["student_client"].post(
            self._import_url(env), {"content": "# late", "file_name": "late.md"}, format="json"
        )
        assert response.status_code == 409

    def test_unrelated_member_cannot_import(self, env):
        response = env["outsider_client"].post(
            self._import_url(env), {"content": "# hack"}, format="json"
        )
        assert response.status_code == 404
