# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Roster import: organisation nodes, accounts, mentors and reporting (SYS-IMP-*)."""

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

import pytest

from plane.db.models import (
    MentorBinding,
    OrgUnit,
    OrgUnitMember,
    ResearchUserProfile,
    User,
    UserImportBatch,
)
from plane.tests.research_fixtures import (
    add_workspace_member,
    enable_research,
    make_user,
    public_workspace,
    user_imports_url,
)

pytestmark = pytest.mark.contract

ROSTER_HEADER = "分组,姓名,学号,年级,学位,负责导师,邮件,电话\n"
ROSTER_ROWS = (
    "器件,邱智鑫,20220230156625,23,Ph.D,刘俊扬,qiuzhixin@stu.xmu.edu.cn,17706010502\n"
    ",白杰学生,20720241150079,24,MS,白杰,baijie.student@stu.xmu.edu.cn,18359311237\n"
    "量子,高靖琦,20620251151728,25,MS,陈志昕,gaojingqi@stu.xmu.edu.cn,15803745516\n"
    "器件,坏邮箱,20420241152012,24,MS,刘俊扬,not-an-email,18760406616\n"
)

ADVISOR_TABLE = "姓名,邮箱\n刘俊扬,liujunyang@xmu.edu.cn\n"


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
    workspace = public_workspace(owner=admin)
    enable_research(workspace)
    return {"admin": admin, "workspace": workspace}


def upload(name, content):
    return SimpleUploadedFile(name, content.encode("utf-8"), content_type="text/csv")


def post_import(client, workspace, *, dry_run=False, with_advisors=True):
    payload = {
        "students": upload("roster.csv", ROSTER_HEADER + ROSTER_ROWS),
        "dry_run": "true" if dry_run else "false",
    }
    if with_advisors:
        payload["advisors"] = upload("advisors.csv", ADVISOR_TABLE)
    return client.post(user_imports_url(workspace), payload, format="multipart")


def test_import_creates_accounts_nodes_and_mentors(env):
    workspace = env["workspace"]
    member_admin = make_user(first_name="WorkspaceAdmin")
    add_workspace_member(workspace, member_admin, role=20)
    client = client_for(member_admin)

    response = post_import(client, workspace)
    assert response.status_code == 201
    body = response.data
    assert body["rows_total"] == 4
    assert body["rows_ok"] == 1  # 器件 + 已映射导师
    assert body["rows_pending"] == 2  # 分组为空 / 导师未映射
    assert body["rows_error"] == 1  # 邮箱格式错误
    assert body["summary"]["credentials_issued"] == 3

    student = User.objects.get(email="qiuzhixin@stu.xmu.edu.cn")
    profile = ResearchUserProfile.objects.get(user=student)
    assert profile.student_no == "20220230156625"
    assert profile.degree == "PHD"
    assert profile.grade == "23"
    assert profile.phone == "17706010502"
    assert profile.group_label == "器件"
    assert student.is_password_reset_required is True

    unit = OrgUnit.objects.get(workspace=workspace, name="器件", deleted_at__isnull=True)
    assert unit.unit_type == OrgUnit.UnitType.GROUP
    student_membership = OrgUnitMember.objects.get(
        workspace=workspace, org_unit=unit, user=student, org_role="REVIEWER"
    )
    assert student_membership.is_primary is True

    advisor = User.objects.get(email="liujunyang@xmu.edu.cn")
    assert ResearchUserProfile.objects.get(user=advisor).category == "ADVISOR"
    binding = MentorBinding.objects.get(workspace=workspace, mentee=student, mentor=advisor)
    assert binding.is_primary_advisor is True

    # The blank-group row still becomes an account, parked at the root.
    root = OrgUnit.objects.get(workspace=workspace, unit_type=OrgUnit.UnitType.ROOT)
    parked = User.objects.get(email="baijie.student@stu.xmu.edu.cn")
    assert OrgUnitMember.objects.filter(workspace=workspace, org_unit=root, user=parked).exists()

    # The unusable mailbox is reported without touching the roster.
    assert not User.objects.filter(email="not-an-email").exists()


def test_missing_advisor_mapping_is_pending_not_fatal(env):
    workspace = env["workspace"]
    client = client_for(env["admin"])
    response = post_import(client, workspace, with_advisors=False)

    assert response.status_code == 201
    assert response.data["rows_ok"] == 0  # every importable row mentions an advisor
    assert response.data["rows_pending"] == 3
    assert User.objects.filter(email="qiuzhixin@stu.xmu.edu.cn").exists()
    assert not MentorBinding.objects.exists()


def test_import_is_idempotent(env):
    workspace = env["workspace"]
    client = client_for(env["admin"])
    post_import(client, workspace)
    users_after_first = User.objects.filter(email__endswith="stu.xmu.edu.cn").count()

    second = post_import(client, workspace)
    assert second.status_code == 201
    assert User.objects.filter(email__endswith="stu.xmu.edu.cn").count() == users_after_first
    assert second.data["summary"]["credentials_issued"] == 0
    assert UserImportBatch.objects.filter(workspace=workspace).count() == 2


def test_dry_run_writes_no_accounts(env):
    workspace = env["workspace"]
    client = client_for(env["admin"])
    response = post_import(client, workspace, dry_run=True)

    assert response.status_code == 201
    assert response.data["dry_run"] is True
    assert not User.objects.filter(email="qiuzhixin@stu.xmu.edu.cn").exists()
    assert not OrgUnit.objects.filter(workspace=workspace, name="器件").exists()


def test_report_download_contains_credentials(env):
    workspace = env["workspace"]
    client = client_for(env["admin"])
    batch_id = post_import(client, workspace).data["id"]

    report = client.get(user_imports_url(workspace, f"{batch_id}/report/"))
    assert report.status_code == 200
    body = report.content.decode("utf-8")
    assert "初始密码" in body
    assert "qiuzhixin@stu.xmu.edu.cn" in body
    assert "not-an-email" in body


def test_import_requires_roster_file(env):
    client = client_for(env["admin"])
    response = client.post(user_imports_url(env["workspace"]), {}, format="multipart")
    assert response.status_code == 400
    assert response.data["error_code"] == "user_import_file_required"
