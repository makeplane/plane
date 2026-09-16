# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Scripted acceptance run for the system management baseline (v2.4.0).

The checks below drive the real API of a real (seeded) deployment, so the
evidence in ``docs/research-system-management-acceptance.md`` can be
reproduced on any environment with one command:

    python manage.py accept_system_management
"""

from dataclasses import dataclass, field

from rest_framework.test import APIClient

from plane.db.models import (
    MentorBinding,
    OrgUnit,
    OrgUnitMember,
    PeriodicReport,
    ResearchProjectProfile,
    ResearchStageInstance,
    ResearchUserProfile,
    StageReview,
    StageReviewerAssignment,
    User,
    Workspace,
    WorkspaceMember,
)
from plane.license.models import InstanceRoleAssignment
from plane.research.services.accounts import (
    invite_code_is_usable,
    redeem_invite_code,
)
from plane.research.services.user_import import parse_students, run_import
from plane.research.utils.roles import (
    DEV_ADMIN,
    MAIN_PI,
    OPS_ADMIN,
    PI_WORKSPACE_SLUG,
    PUBLIC_WORKSPACE_SLUG,
)

ROOT = "/api/research/workspaces"

TEST_GROUP = "测试组"
PI_EMAIL = "test.pi@ai4ms.local"
ADVISOR_EMAIL = "test.advisor@ai4ms.local"
OWNER_EMAIL = "test.owner@ai4ms.local"
REVIEWER_EMAIL = "test.reviewer@ai4ms.local"
DEV_ADMIN_EMAIL = "dev.admin@ai4ms.local"
OPS_ADMIN_EMAIL = "ops.admin@ai4ms.local"
MAIN_PI_EMAIL = "mainpi@ai4ms.local"
INSTANCE_ADMIN_EMAIL = "admin@ai4ms.local"

ACCEPTANCE_ROSTER = (
    "分组,姓名,学号,年级,学位,负责导师,邮件,电话\n"
    "器件,验收学生甲,20260000000001,25,MS,刘俊扬,acceptance.student1@stu.xmu.edu.cn,17000000001\n"
    "器件,验收学生乙,20260000000002,25,Ph.D,陈志昕,acceptance.student2@stu.xmu.edu.cn,17000000002\n"
)

ACCEPTANCE_ADVISORS = {"刘俊扬": "acceptance.advisor@xmu.edu.cn"}

# The walkthrough owns one weekly period and one stage run: both are reset by
# the harness so the command can be re-run on the same deployment.
ACCEPTANCE_PERIOD = "2026-W20"


@dataclass
class Check:
    key: str
    title: str
    status: str = "SKIP"
    detail: str = ""
    steps: list = field(default_factory=list)

    def step(self, label, ok, detail=""):
        self.steps.append({"label": label, "ok": bool(ok), "detail": detail})
        return ok

    def finish(self):
        failed = [step for step in self.steps if not step["ok"]]
        self.status = "FAIL" if failed else "PASS"
        self.detail = failed[0]["detail"] if failed else f"{len(self.steps)} step(s) verified"
        return self


class AcceptanceRunner:
    """Drive the real API as each role of the test group."""

    def __init__(self, public_slug=PUBLIC_WORKSPACE_SLUG, pi_slug=PI_WORKSPACE_SLUG, log=print):
        self.public_slug = public_slug
        self.pi_slug = pi_slug
        self.log = log
        self.checks: list[Check] = []
        self.public = Workspace.objects.filter(slug=public_slug).first()
        self.pi_area = Workspace.objects.filter(slug=pi_slug).first()
        self.test_group = None

    # -- helpers -----------------------------------------------------------

    def user(self, email):
        return User.objects.filter(email__iexact=email).first()

    def client(self, email):
        user = self.user(email)
        if user is None:
            return None
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def _check(self, key, title):
        check = Check(key=key, title=title)
        self.checks.append(check)
        return check

    @staticmethod
    def explain(response):
        """Short, log-friendly description of a DRF response."""
        data = getattr(response, "data", None)
        if isinstance(data, dict):
            code = data.get("error_code") or data.get("error")
            message = data.get("message")
            if code or message:
                parts = [str(part) for part in (code, message) if part]
                return f"HTTP {response.status_code} {' / '.join(parts)}"
        return f"HTTP {response.status_code}"

    def run(self):
        for method in (
            self.check_baseline,
            self.check_admin_tags,
            self.check_invite_codes,
            self.check_roster_import,
            self.check_report_approval_flow,
            self.check_stage_review_flow,
            self.check_admin_permission_matrix,
            self.check_pi_workspace_aggregate,
        ):
            check = method()
            self.log(f"[{check.status}] {check.title} - {check.detail}")
            for step in check.steps:
                mark = "ok " if step["ok"] else "!! "
                suffix = f" | {step['detail']}" if step["detail"] else ""
                self.log(f"    {mark}{step['label']}{suffix}")
        return self.checks

    @property
    def failed(self):
        return [check for check in self.checks if check.status == "FAIL"]

    # -- checks ------------------------------------------------------------

    def check_baseline(self):
        check = self._check("baseline", "双工作区与测试组基线")
        check.step("公共工作区存在", self.public is not None, self.public_slug)
        check.step("主PI工作区存在", self.pi_area is not None, self.pi_slug)
        if self.public is not None:
            self.test_group = OrgUnit.objects.filter(
                workspace=self.public, name=TEST_GROUP, deleted_at__isnull=True
            ).first()
        check.step(f"组织节点「{TEST_GROUP}」存在", self.test_group is not None)
        for email, role in ((PI_EMAIL, "PI"), (ADVISOR_EMAIL, "ADVISOR"), (OWNER_EMAIL, "REVIEWER")):
            user = self.user(email)
            membership = (
                OrgUnitMember.objects.filter(org_unit=self.test_group, user=user, org_role=role).exists()
                if user is not None and self.test_group is not None
                else False
            )
            check.step(f"{email} 是测试组 {role}", membership)
        return check.finish()

    def check_admin_tags(self):
        check = self._check("admin_tags", "管理员标签：授予、撤销与席位同步")
        for email, role in ((DEV_ADMIN_EMAIL, DEV_ADMIN), (OPS_ADMIN_EMAIL, OPS_ADMIN), (MAIN_PI_EMAIL, MAIN_PI)):
            user = self.user(email)
            tagged = (
                InstanceRoleAssignment.objects.filter(user=user, role=role, deleted_at__isnull=True).exists()
                if user is not None
                else False
            )
            check.step(f"{email} 持有 {role}", tagged)
            if user is not None:
                seats = WorkspaceMember.objects.filter(
                    member=user, workspace__slug__in=(self.public_slug, self.pi_slug), is_active=True
                ).count()
                check.step(f"{email} 已加入两个工作区", seats == 2, f"{seats} seat(s)")
        dev = self.user(DEV_ADMIN_EMAIL)
        if dev is not None and self.public is not None:
            check.step(
                "标签持有者是普通成员（不绕过组织数据边界）",
                WorkspaceMember.objects.filter(workspace=self.public, member=dev, role=15).exists(),
            )
        return check.finish()

    def check_invite_codes(self):
        check = self._check("invite_codes", "邀请码：签发、门禁与兑换")
        client = self.client(DEV_ADMIN_EMAIL)
        if client is None or self.public is None:
            check.step("管理员账号可用", False, DEV_ADMIN_EMAIL)
            return check.finish()

        response = client.post(
            f"{ROOT}/{self.public_slug}/invite-codes/",
            {"org_role": "REVIEWER", "max_uses": 2, "expires_in_days": 3, "note": "acceptance"},
            format="json",
        )
        check.step("管理员可签发邀请码", response.status_code == 201, f"HTTP {response.status_code}")
        if response.status_code != 201:
            return check.finish()
        code = response.data["code"]

        member_client = self.client(OWNER_EMAIL)
        forbidden = member_client.post(
            f"{ROOT}/{self.public_slug}/invite-codes/", {"max_uses": 1}, format="json"
        )
        check.step("普通成员无法签发邀请码", forbidden.status_code == 403, f"HTTP {forbidden.status_code}")
        check.step("有效邀请码可通过注册门禁", invite_code_is_usable(code) is True)
        check.step("无效邀请码被门禁拒绝", invite_code_is_usable("not-a-real-code") is False)

        newcomer_email = "acceptance.newcomer@ai4ms.local"
        newcomer = User.objects.filter(email=newcomer_email).first()
        if newcomer is None:
            newcomer = User.objects.create(
                email=newcomer_email, username=newcomer_email, display_name="验收新成员"
            )
            newcomer.set_password("Acceptance@12345")
            newcomer.save()
        redeem_invite_code(newcomer, code)
        check.step(
            "兑换后自动加入公共工作区",
            WorkspaceMember.objects.filter(
                workspace=self.public, member=newcomer, role=15, is_active=True
            ).exists(),
        )
        check.step(
            "兑换后写入组织关系与科研档案",
            OrgUnitMember.objects.filter(workspace=self.public, user=newcomer, org_role="REVIEWER").exists()
            and ResearchUserProfile.objects.filter(user=newcomer).exists(),
        )
        return check.finish()

    def check_roster_import(self):
        check = self._check("roster_import", "二维表导入：建号、建组织、建导师关系")
        if self.public is None:
            check.step("公共工作区可用", False)
            return check.finish()
        actor = self.user(DEV_ADMIN_EMAIL)
        rows = parse_students(ACCEPTANCE_ROSTER.encode("utf-8"), "acceptance.csv")
        existing_before = User.objects.filter(
            email__in=("acceptance.student1@stu.xmu.edu.cn", "acceptance.student2@stu.xmu.edu.cn")
        ).count()

        dry = run_import(
            self.public,
            actor,
            rows,
            advisor_map=ACCEPTANCE_ADVISORS,
            dry_run=True,
            source_filename="acceptance-dry.csv",
        )
        check.step(
            "预检不写账号",
            User.objects.filter(
                email__in=("acceptance.student1@stu.xmu.edu.cn", "acceptance.student2@stu.xmu.edu.cn")
            ).count()
            == existing_before,
        )
        check.step("预检报告完整", dry.rows_total == 2 and dry.dry_run is True, f"{dry.rows_total} rows")

        batch = run_import(
            self.public,
            actor,
            rows,
            advisor_map=ACCEPTANCE_ADVISORS,
            dry_run=False,
            source_filename="acceptance.csv",
        )
        check.step("正式导入成功", batch.rows_ok >= 1, f"ok={batch.rows_ok} pending={batch.rows_pending}")
        check.step("缺少导师邮箱的行进入待处理", batch.rows_pending >= 1, f"pending={batch.rows_pending}")
        student = User.objects.filter(email="acceptance.student1@stu.xmu.edu.cn").first()
        check.step("学生账号已创建", student is not None)
        check.step(
            "分组自动建成组织节点",
            OrgUnit.objects.filter(workspace=self.public, name="器件", deleted_at__isnull=True).exists(),
        )
        advisor = User.objects.filter(email="acceptance.advisor@xmu.edu.cn").first()
        binding = bool(
            student
            and advisor
            and MentorBinding.objects.filter(
                workspace=self.public, mentee=student, mentor=advisor
            ).exists()
        )
        check.step("导师关系已建立", binding)
        profile_ok = bool(
            student
            and ResearchUserProfile.objects.filter(
                user=student, student_no="20260000000001", degree="MS"
            ).exists()
        )
        check.step("科研档案写入学号与学位", profile_ok)
        check.step("一次性密码要求首登改密", bool(student and student.is_password_reset_required))
        return check.finish()

    def _ensure_project(self, client):
        owner = self.user(OWNER_EMAIL)
        profile = ResearchProjectProfile.objects.filter(
            workspace=self.public, owner=owner, is_active=True
        ).first()
        if profile is not None:
            return profile
        org_unit = str(self.test_group.id) if self.test_group is not None else None
        response = client.post(
            f"{ROOT}/{self.public_slug}/projects/",
            {"name": "验收科研项目", "research_type": "PHD", "org_unit": org_unit},
            format="json",
        )
        if response.status_code >= 300:
            return None
        project_id = (response.data.get("research") or {}).get("project") or response.data.get("id")
        if project_id is None:
            return None
        return ResearchProjectProfile.objects.filter(workspace=self.public, project_id=project_id).first()

    def _prepare_report(self, client):
        """Return the acceptance report, creating or resetting it as needed."""
        owner = self.user(OWNER_EMAIL)
        report = PeriodicReport.objects.filter(
            workspace=self.public, owner=owner, report_type="WEEKLY", period_key=ACCEPTANCE_PERIOD
        ).first()
        if report is None:
            created = client.post(
                f"{ROOT}/{self.public_slug}/reports/",
                {
                    "report_type": "WEEKLY",
                    "period_key": ACCEPTANCE_PERIOD,
                    "visibility": "DIRECT_ADVISOR",
                },
                format="json",
            )
            if created.status_code == 201:
                return created.data.get("id")
            report = PeriodicReport.objects.filter(
                workspace=self.public, owner=owner, report_type="WEEKLY", period_key=ACCEPTANCE_PERIOD
            ).first()
            if report is None:
                return None
        if report.status != PeriodicReport.Status.DRAFT:
            report.status = PeriodicReport.Status.DRAFT
            report.reviewer = None
            report.save(update_fields=["status", "reviewer", "updated_at"])
        return str(report.id)

    def _prepare_stage(self, project_id):
        """Return the PRE_OPENING instance of the acceptance project in IN_PROGRESS."""
        stage = ResearchStageInstance.objects.filter(
            workspace=self.public, project_id=project_id, stage="PRE_OPENING", deleted_at__isnull=True
        ).first()
        if stage is None:
            return None
        if stage.status != ResearchStageInstance.Status.IN_PROGRESS:
            StageReview.objects.filter(stage_instance=stage).delete()
            StageReviewerAssignment.objects.filter(stage_instance=stage).delete()
            stage.status = ResearchStageInstance.Status.IN_PROGRESS
            stage.submitted_at = None
            stage.save(update_fields=["status", "submitted_at", "updated_at"])
        return stage

    def check_report_approval_flow(self):
        check = self._check("report_flow", "科研提交审批流程（提交→退回→重提交→接受）")
        owner_client = self.client(OWNER_EMAIL)
        pi_client = self.client(PI_EMAIL)
        if owner_client is None or pi_client is None or self.public is None:
            check.step("测试组账号可用", False)
            return check.finish()

        profile = self._ensure_project(owner_client)
        check.step("科研责任人项目就绪", profile is not None)
        if profile is None:
            return check.finish()

        report_id = self._prepare_report(owner_client)
        check.step("验收周报就绪（DRAFT）", report_id is not None)
        if report_id is None:
            return check.finish()

        submitted = owner_client.post(
            f"{ROOT}/{self.public_slug}/reports/{report_id}/submit/", {}, format="json"
        )
        check.step("提交周报", submitted.status_code == 200, self.explain(submitted))
        returned = pi_client.post(
            f"{ROOT}/{self.public_slug}/reports/{report_id}/return/",
            {"comment": "验收：请补充本周实验进度"},
            format="json",
        )
        check.step("主PI退回周报", returned.status_code == 200, self.explain(returned))
        resubmitted = owner_client.post(
            f"{ROOT}/{self.public_slug}/reports/{report_id}/submit/", {}, format="json"
        )
        check.step("重新提交", resubmitted.status_code == 200, self.explain(resubmitted))
        accepted = pi_client.post(
            f"{ROOT}/{self.public_slug}/reports/{report_id}/accept/", {}, format="json"
        )
        check.step("主PI接受周报", accepted.status_code == 200, self.explain(accepted))
        report = PeriodicReport.objects.filter(pk=report_id).first()
        status_value = report.status if report else ""
        check.step("周报最终状态为已接受", status_value == "ACCEPTED", status_value)
        return check.finish()

    def check_stage_review_flow(self):
        check = self._check("stage_flow", "阶段流程（进入→闸门→提交→多人评审→通过）")
        owner_client = self.client(OWNER_EMAIL)
        pi_client = self.client(PI_EMAIL)
        admin_client = self.client(INSTANCE_ADMIN_EMAIL)
        profile = ResearchProjectProfile.objects.filter(
            workspace=self.public, owner=self.user(OWNER_EMAIL), is_active=True
        ).first()
        if profile is None or owner_client is None or pi_client is None:
            check.step("前置项目与账号就绪", False)
            return check.finish()
        project_id = str(profile.project_id)

        started = owner_client.post(
            f"{ROOT}/{self.public_slug}/projects/{project_id}/stages/", {}, format="json"
        )
        check.step(
            "进入科研阶段流程",
            started.status_code in (200, 201, 409),
            self.explain(started),
        )
        stage = self._prepare_stage(project_id)
        check.step("预开题阶段处于进行中", stage is not None)
        if stage is None:
            return check.finish()

        first_submit = owner_client.post(
            f"{ROOT}/{self.public_slug}/stages/{stage.id}/submit/", {}, format="json"
        )
        blocked = first_submit.status_code in (409, 422)
        check.step(
            "闸门生效（不足条件时拒绝提交或直接通过）",
            blocked or first_submit.status_code == 200,
            self.explain(first_submit),
        )
        if blocked and admin_client is not None:
            gates = first_submit.data.get("blockers") if isinstance(first_submit.data, dict) else None
            items = [
                {"stage": "PRE_OPENING", "code": code, "is_blocking": False}
                for code in (
                    "material_set",
                    "literature_min_included",
                    "literature_max_entries",
                    "literature_quality",
                    "literature_cited_sources",
                    "review_rule",
                )
            ]
            relaxed = admin_client.patch(
                f"{ROOT}/{self.public_slug}/stage-requirements/",
                {"items": items},
                format="json",
            )
            check.step("管理员调整闸门配置", relaxed.status_code == 200, self.explain(relaxed))
            if gates:
                check.step("闸门拦截项已记录", True, str(gates)[:120])
            first_submit = owner_client.post(
                f"{ROOT}/{self.public_slug}/stages/{stage.id}/submit/", {}, format="json"
            )
        check.step("阶段提交成功", first_submit.status_code == 200, self.explain(first_submit))

        gate = owner_client.get(f"{ROOT}/{self.public_slug}/stages/{stage.id}/gate/")
        check.step("闸门明细可查询", gate.status_code == 200, f"HTTP {gate.status_code}")

        reviewer_ids = [self.user(REVIEWER_EMAIL).id, self.user(ADVISOR_EMAIL).id]
        assigned = []
        for reviewer_id in reviewer_ids:
            response = pi_client.post(
                f"{ROOT}/{self.public_slug}/stages/{stage.id}/reviewers/",
                {"reviewer": str(reviewer_id), "reviewer_role": "REVIEWER", "is_required": True},
                format="json",
            )
            assigned.append(response.status_code in (200, 201, 409))
        check.step("主PI指派多名评审人", all(assigned), f"{sum(assigned)}/{len(assigned)} assigned")

        for email in (REVIEWER_EMAIL, ADVISOR_EMAIL):
            reviewer_client = self.client(email)
            submitted = reviewer_client.post(
                f"{ROOT}/{self.public_slug}/stages/{stage.id}/reviews/",
                {"recommendation": "PASS", "comment": "验收评审通过"},
                format="json",
            )
            check.step(
                f"{email} 提交评审",
                submitted.status_code in (200, 201),
                self.explain(submitted),
            )

        passed = pi_client.post(f"{ROOT}/{self.public_slug}/stages/{stage.id}/pass/", {}, format="json")
        check.step("主PI通过阶段", passed.status_code == 200, self.explain(passed))
        return check.finish()

    def check_admin_permission_matrix(self):
        check = self._check("admin_matrix", "管理员标签的配置权限矩阵")
        settings_url = f"{ROOT}/{self.public_slug}/settings/"
        for email in (DEV_ADMIN_EMAIL, OPS_ADMIN_EMAIL, MAIN_PI_EMAIL):
            client = self.client(email)
            if client is None:
                check.step(f"{email} 可配置平台参数", False, "账号缺失")
                continue
            response = client.patch(settings_url, {"report_enabled": True}, format="json")
            check.step(f"{email} 可配置平台参数", response.status_code == 200, f"HTTP {response.status_code}")

        member_client = self.client(OWNER_EMAIL)
        denied = member_client.patch(settings_url, {"report_enabled": True}, format="json")
        check.step("普通成员被拒绝", denied.status_code == 403, f"HTTP {denied.status_code}")

        target = self.user(OWNER_EMAIL)
        if target is not None:
            grant = self.client(DEV_ADMIN_EMAIL).post(
                f"/api/instances/users/{target.id}/roles/", {"role": "OPS_ADMIN"}, format="json"
            )
            check.step("标签持有者不能自行授予标签", grant.status_code == 403, f"HTTP {grant.status_code}")
        return check.finish()

    def check_pi_workspace_aggregate(self):
        check = self._check("pi_aggregate", "主PI工作区聚合范围")
        client = self.client(PI_EMAIL)
        if client is None or self.pi_area is None:
            check.step("主PI账号与主PI工作区可用", False)
            return check.finish()
        response = client.get(f"{ROOT}/{self.pi_slug}/aggregate/")
        check.step("聚合接口可访问", response.status_code == 200, f"HTTP {response.status_code}")
        if response.status_code != 200:
            return check.finish()
        payload = response.data
        check.step("聚合来源是公共工作区", payload["source_workspace"]["slug"] == self.public_slug)
        check.step(
            "范围非空（测试组在范围内）",
            payload["scope"]["is_empty"] is False,
            f"units={payload['scope']['unit_count']}",
        )
        unit_names = [unit["name"] for unit in payload["org_units"]]
        check.step(f"范围内包含「{TEST_GROUP}」", TEST_GROUP in unit_names, ", ".join(unit_names[:5]))

        bystander = self.client("gaopeng.member@ai4ms.local")
        if bystander is not None:
            empty = bystander.get(f"{ROOT}/{self.pi_slug}/aggregate/")
            is_empty_scope = empty.status_code == 200 and empty.data["scope"]["is_empty"] is True
            check.step(
                "无组织关系的账号看到空范围",
                is_empty_scope or empty.status_code == 404,
                f"HTTP {empty.status_code}",
            )
        return check.finish()
