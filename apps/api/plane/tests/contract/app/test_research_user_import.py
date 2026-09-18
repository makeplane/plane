# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Strict member roster import: profiles, TEAM membership and advisors."""

import io

from django.core.files.uploadedfile import SimpleUploadedFile
from openpyxl import Workbook
from rest_framework.test import APIClient

import pytest

from plane.db.models import (
    MentorBinding,
    OrgUnit,
    OrgUnitMember,
    ResearchUserProfile,
    User,
    UserImportBatch,
    WorkspaceMember,
)
from plane.tests.research_fixtures import (
    add_workspace_member,
    enable_research,
    make_user,
    public_workspace,
    user_imports_url,
)

pytestmark = pytest.mark.contract

ROSTER_HEADER = "姓名,学号,邮件,手机号,年级,人员类别,业务方向,小组,主导师,联合导师1,联合导师2\n"


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
    root = OrgUnit.objects.create(
        workspace=workspace,
        name="材料科学与工程学院",
        unit_type=OrgUnit.UnitType.ROOT,
        path="root",
        depth=0,
    )
    basic = OrgUnit.objects.create(
        workspace=workspace,
        parent=root,
        name="基础研究",
        unit_type=OrgUnit.UnitType.INSTITUTE,
        business_category=OrgUnit.BusinessCategory.BASIC_RESEARCH,
        path="root/basic",
        depth=1,
    )
    group = OrgUnit.objects.create(
        workspace=workspace,
        parent=basic,
        name="材料课题组",
        unit_type=OrgUnit.UnitType.GROUP,
        path="root/basic/group",
        depth=2,
    )
    team = OrgUnit.objects.create(
        workspace=workspace,
        parent=group,
        name="石墨负极小组",
        unit_type=OrgUnit.UnitType.TEAM,
        path="root/basic/group/team",
        depth=3,
    )
    advisors = {}
    for name, email in (
        ("刘俊扬", "primary@example.com"),
        ("陈志昕", "co1@example.com"),
        ("白杰", "co2@example.com"),
        ("赵老师", "co3@example.com"),
    ):
        user = make_user(email=email, first_name=name)
        add_workspace_member(workspace, user)
        advisors[name] = user
    return {
        "admin": admin,
        "workspace": workspace,
        "root": root,
        "basic": basic,
        "group": group,
        "team": team,
        "advisors": advisors,
    }


def upload(name, content):
    return SimpleUploadedFile(name, content.encode("utf-8"), content_type="text/csv")


def advisor_table(*names):
    emails = {
        "刘俊扬": "primary@example.com",
        "陈志昕": "co1@example.com",
        "白杰": "co2@example.com",
        "赵老师": "co3@example.com",
        "不存在导师": "missing@example.com",
    }
    return "姓名,邮箱\n" + "".join(f"{name},{emails[name]}\n" for name in names)


def roster_row(
    *,
    name="新成员",
    student_no="S001",
    email="student@example.com",
    phone="17700000000",
    grade="2026",
    category="学生",
    business="基础研究",
    team="石墨负极小组",
    primary="刘俊扬",
    co1="陈志昕",
    co2="白杰",
):
    return f"{name},{student_no},{email},{phone},{grade},{category},{business},{team},{primary},{co1},{co2}\n"


def post_import(env, row=None, *, advisors=None, dry_run=False):
    payload = {
        "students": upload("roster.csv", ROSTER_HEADER + (row or roster_row())),
        "dry_run": "true" if dry_run else "false",
    }
    if advisors is not None:
        payload["advisors"] = upload("advisors.csv", advisors)
    return client_for(env["admin"]).post(user_imports_url(env["workspace"]), payload, format="multipart")


def test_import_creates_profile_team_membership_and_three_advisor_bindings(env):
    response = post_import(env, advisors=advisor_table("刘俊扬", "陈志昕", "白杰"))

    assert response.status_code == 201
    assert response.data["rows_ok"] == 1
    student = User.objects.get(email="student@example.com")
    profile = ResearchUserProfile.objects.get(user=student)
    assert (profile.student_no, profile.phone, profile.grade, profile.category) == (
        "S001",
        "17700000000",
        "2026",
        "STUDENT",
    )
    membership = OrgUnitMember.objects.get(workspace=env["workspace"], user=student, is_primary=True)
    assert membership.org_unit == env["team"]
    bindings = MentorBinding.objects.filter(workspace=env["workspace"], mentee=student)
    assert set(bindings.values_list("mentor__email", flat=True)) == {
        "primary@example.com",
        "co1@example.com",
        "co2@example.com",
    }
    assert bindings.get(mentor=env["advisors"]["刘俊扬"]).is_primary_advisor is True


def test_full_team_path_is_supported(env):
    full_path = "材料科学与工程学院 / 基础研究 / 材料课题组 / 石墨负极小组"
    response = post_import(
        env,
        row=roster_row(team=full_path, co1="", co2=""),
        advisors=advisor_table("刘俊扬"),
    )
    assert response.status_code == 201
    assert response.data["rows_ok"] == 1


def test_ambiguous_team_name_is_pending_but_profile_is_created(env):
    other_group = OrgUnit.objects.create(
        workspace=env["workspace"], parent=env["basic"], name="另一课题组",
        unit_type=OrgUnit.UnitType.GROUP, path="root/basic/other", depth=2,
    )
    OrgUnit.objects.create(
        workspace=env["workspace"], parent=other_group, name="石墨负极小组",
        unit_type=OrgUnit.UnitType.TEAM, path="root/basic/other/team", depth=3,
    )
    response = post_import(
        env,
        row=roster_row(business="", co1="", co2=""),
        advisors=advisor_table("刘俊扬"),
    )
    assert response.data["rows_pending"] == 1
    assert "小组名称不唯一" in response.data["rows"][0]["message"]
    assert User.objects.filter(email="student@example.com").exists()
    assert not OrgUnitMember.objects.filter(user__email="student@example.com").exists()


@pytest.mark.parametrize(
    ("team", "business", "message"),
    [
        ("不存在小组", "", "小组不存在"),
        ("石墨负极小组", "产业化", "与业务方向不一致"),
    ],
)
def test_unresolved_team_is_pending(env, team, business, message):
    response = post_import(
        env,
        row=roster_row(team=team, business=business, co1="", co2=""),
        advisors=advisor_table("刘俊扬"),
    )
    assert response.data["rows_pending"] == 1
    assert message in response.data["rows"][0]["message"]


def test_advisor_table_is_required(env):
    response = post_import(env, advisors=None)
    assert response.status_code == 400
    assert response.data["error_code"] == "user_import_file_required"


def test_mapped_advisor_is_provisioned_and_missing_mapping_stays_pending(env):
    response = post_import(
        env,
        row=roster_row(co1="不存在导师", co2="未映射导师"),
        advisors=advisor_table("刘俊扬", "不存在导师"),
    )
    assert response.data["rows_pending"] == 1
    message = response.data["rows"][0]["message"]
    assert "缺少联合导师2邮箱映射" in message
    provisioned = User.objects.get(email="missing@example.com")
    assert provisioned.display_name == "不存在导师"
    assert WorkspaceMember.objects.filter(workspace=env["workspace"], member=provisioned, is_active=True).exists()
    assert ResearchUserProfile.objects.get(user=provisioned).category == "ADVISOR"


def test_required_values_are_row_errors(env):
    response = post_import(
        env,
        row=roster_row(student_no="", co1="", co2=""),
        advisors=advisor_table("刘俊扬"),
    )
    assert response.data["rows_error"] == 1
    assert "学号 is required" in response.data["rows"][0]["message"]
    assert not User.objects.filter(email="student@example.com").exists()


def test_reimport_preserves_primary_team_and_advisor_but_adds_non_conflicting_coadvisor(env):
    existing = make_user(email="existing@example.com", first_name="Existing")
    add_workspace_member(env["workspace"], existing)
    OrgUnitMember.objects.create(
        workspace=env["workspace"], org_unit=env["team"], user=existing,
        org_role=OrgUnitMember.OrgRole.REVIEWER, is_primary=True,
    )
    MentorBinding.objects.create(
        workspace=env["workspace"], mentee=existing, mentor=env["advisors"]["刘俊扬"],
        org_unit=env["team"], is_primary_advisor=True,
    )
    other_team = OrgUnit.objects.create(
        workspace=env["workspace"], parent=env["group"], name="另一小组",
        unit_type=OrgUnit.UnitType.TEAM, path="root/basic/group/other-team", depth=3,
    )
    response = post_import(
        env,
        row=roster_row(
            student_no="EXISTING", email="existing@example.com", team=other_team.name,
            primary="陈志昕", co1="白杰", co2="",
        ),
        advisors=advisor_table("陈志昕", "白杰"),
    )
    assert response.data["rows_pending"] == 1
    assert "已有主归属" in response.data["rows"][0]["message"]
    assert "已有主导师" in response.data["rows"][0]["message"]
    assert OrgUnitMember.objects.get(workspace=env["workspace"], user=existing, is_primary=True).org_unit == env["team"]
    assert MentorBinding.objects.get(workspace=env["workspace"], mentee=existing, is_primary_advisor=True).mentor == env["advisors"]["刘俊扬"]
    assert MentorBinding.objects.filter(workspace=env["workspace"], mentee=existing, mentor=env["advisors"]["白杰"]).exists()


def test_effective_advisor_total_is_capped_at_three(env):
    existing = make_user(email="capped@example.com", first_name="Capped")
    add_workspace_member(env["workspace"], existing)
    OrgUnitMember.objects.create(
        workspace=env["workspace"], org_unit=env["team"], user=existing,
        org_role=OrgUnitMember.OrgRole.REVIEWER, is_primary=True,
    )
    for name, primary in (("刘俊扬", True), ("陈志昕", False)):
        MentorBinding.objects.create(
            workspace=env["workspace"], mentee=existing, mentor=env["advisors"][name],
            org_unit=env["team"], is_primary_advisor=primary,
        )
    response = post_import(
        env,
        row=roster_row(
            student_no="CAPPED", email="capped@example.com", primary="刘俊扬", co1="白杰", co2="赵老师"
        ),
        advisors=advisor_table("刘俊扬", "白杰", "赵老师"),
    )
    assert response.data["rows_pending"] == 1
    assert "最多为3人" in response.data["rows"][0]["message"]
    bindings = MentorBinding.objects.filter(workspace=env["workspace"], mentee=existing)
    assert bindings.count() == 3
    assert bindings.filter(mentor=env["advisors"]["白杰"]).exists()
    assert not bindings.filter(mentor=env["advisors"]["赵老师"]).exists()


def test_import_is_idempotent(env):
    advisors = advisor_table("刘俊扬", "陈志昕", "白杰")
    first = post_import(env, advisors=advisors)
    second = post_import(env, advisors=advisors)
    assert first.status_code == second.status_code == 201
    assert User.objects.filter(email="student@example.com").count() == 1
    assert MentorBinding.objects.filter(workspace=env["workspace"], mentee__email="student@example.com").count() == 3
    assert second.data["summary"]["credentials_issued"] == 0
    assert UserImportBatch.objects.filter(workspace=env["workspace"]).count() == 2


def test_dry_run_writes_nothing(env):
    response = post_import(
        env,
        advisors=advisor_table("刘俊扬", "陈志昕", "白杰"),
        dry_run=True,
    )
    assert response.status_code == 200
    assert response.data["id"] is None
    assert response.data["rows_ok"] == 1
    assert not User.objects.filter(email="student@example.com").exists()
    assert not UserImportBatch.objects.filter(workspace=env["workspace"]).exists()


@pytest.mark.parametrize(("category", "degree"), [("Ph.D", "PHD"), ("MS", "MS")])
def test_template_category_saves_degree_and_reimport_preserves_it(env, category, degree):
    response = post_import(env, row=roster_row(category=category), advisors=advisor_table("刘俊扬", "陈志昕", "白杰"))
    assert response.status_code == 201
    assert response.data["rows_ok"] == 1
    profile = ResearchUserProfile.objects.get(user__email="student@example.com")
    assert profile.category == "STUDENT"
    assert profile.degree == degree
    post_import(env, advisors=advisor_table("刘俊扬", "陈志昕", "白杰"))
    profile.refresh_from_db()
    assert profile.degree == degree


def test_unknown_template_category_is_a_row_error(env):
    response = post_import(env, row=roster_row(category="kg"), advisors=advisor_table("刘俊扬", "陈志昕", "白杰"))
    assert response.status_code == 201
    assert response.data["rows_error"] == 1
    assert "无法识别人员类别：kg" in response.data["rows"][0]["message"]
    assert not User.objects.filter(email="student@example.com").exists()


@pytest.mark.parametrize("dry_run", [True, False])
def test_fixed_excel_templates_upload_through_api(env, dry_run):
    def xlsx(name, rows, trailing_blanks=False):
        workbook = Workbook()
        for row in rows:
            workbook.active.append(row)
        if trailing_blanks:
            workbook.active.cell(216, 26).number_format = "@"
        buffer = io.BytesIO()
        workbook.save(buffer)
        return SimpleUploadedFile(name, buffer.getvalue(), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

    students = xlsx(
        "π-Lab学生-导入信息表.xlsx",
        [
            ROSTER_HEADER.strip().replace("手机号", "电话").split(",") + ["备注"],
            roster_row(category="MS").strip().split(",") + [""],
        ],
        trailing_blanks=True,
    )
    advisors = xlsx("导师信息表.xlsx", [
        ["导师姓名", "邮箱"],
        ["刘俊扬", " primary@example.com "],
        ["陈志昕", "co1@example.com"],
        ["白杰", "co2@example.com"],
    ])
    response = client_for(env["admin"]).post(user_imports_url(env["workspace"]), {
        "students": students, "advisors": advisors, "dry_run": str(dry_run).lower(),
    }, format="multipart")
    assert response.status_code == (200 if dry_run else 201)
    assert response.data["rows_total"] == response.data["rows_ok"] == 1
    assert response.data["rows"][0]["row_number"] == 2
    assert User.objects.filter(email="student@example.com").exists() is not dry_run
    if not dry_run:
        assert ResearchUserProfile.objects.get(user__email="student@example.com").degree == "MS"


def test_report_uses_new_template_columns(env):
    batch_id = post_import(env, advisors=advisor_table("刘俊扬", "陈志昕", "白杰")).data["id"]
    report = client_for(env["admin"]).get(user_imports_url(env["workspace"], f"{batch_id}/report/"))
    body = report.content.decode("utf-8")
    assert report.status_code == 200
    for header in ("手机号", "年级", "小组", "主导师", "联合导师1", "联合导师2", "初始密码"):
        assert header in body
    assert "主归属组织" not in body


def test_user_profiles_are_scoped_to_active_workspace_members(env):
    other_workspace = public_workspace(owner=make_user(first_name="Other owner"), slug="other-profile-space")
    foreign_user = make_user(email="foreign-profile@example.com")
    add_workspace_member(other_workspace, foreign_user)
    foreign_profile = ResearchUserProfile.objects.create(user=foreign_user, student_no="FOREIGN-001")
    response = client_for(env["admin"]).get(f"/api/research/workspaces/{env['workspace'].slug}/user-profiles/")
    assert response.status_code == 200
    assert foreign_profile.id not in {item["id"] for item in response.data["results"]}
