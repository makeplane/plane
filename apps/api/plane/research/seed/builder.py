# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Turn the declarative scenario into research records.

The builder only talks to models and to the production services
(``stage_service``, ``review_service``, ``record_audit_event`` and the
notification helpers), so everything it writes goes through the same rules the
API enforces. Every step is idempotent on its natural key: re-running the
seeder tops the workspace up instead of duplicating it.
"""

import zlib
from collections import Counter
from datetime import timedelta

from django.db import connection, transaction
from django.db.models import Q
from django.utils import timezone

from plane.db.models import (
    STAGE_SEQUENCE,
    ReviewerRole,
    ResearchStageInstance,
    StageMaterial,
    StageReviewerAssignment,
    State,
)
from plane.db.models import (
    DEFAULT_STATES,
    MATERIAL_TYPES_BY_STAGE,
    ApprovalAction,
    ApprovalFlow,
    ApprovalFlowStep,
    ApprovalRequest,
    CodeArtifact,
    ExperimentAmendment,
    ExperimentRecord,
    ExperimentRecordVersion,
    FileAsset,
    IdentityMapping,
    Issue,
    LiteratureEntry,
    MentorBinding,
    OrgUnit,
    OrgUnitMember,
    Page,
    PeriodicReport,
    Project,
    ProjectCodeRepository,
    ProjectIdentifier,
    ProjectMember,
    ProjectPage,
    ReportAccessGrant,
    ReportAttachment,
    ReportReviewLog,
    ReportTemplate,
    ResearchOutcome,
    ResearchOutcomeLink,
    ResearchProjectProfile,
    User,
    WorkspaceMember,
    WorkspaceResearchSetting,
)
from plane.research.seed import scenario
from plane.research.services.review_rules import effective_assignments
from plane.research.services.review_service import submit_review
from plane.research.services.stage_service import (
    enter_stage,
    ensure_stage_instances,
    pass_stage,
    return_stage,
    snapshot_material,
    submit_stage,
)
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)
from plane.research.utils.notifications import (
    notify_report_accepted,
    notify_report_returned,
    notify_report_submitted,
)
from plane.research.utils.org import build_path, ensure_root_org_unit
from plane.research.utils.periods import current_period

PROJECT_ADMIN_ROLE = 20
PROJECT_MEMBER_ROLE = 15


class SeedError(Exception):
    """Raised when the target workspace cannot host the fixture."""


def _escape(text):
    return str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def document_from_blocks(blocks):
    """Build the ``(description_json, html, stripped)`` triple for a page.

    ``blocks`` is a list of ``(kind, text)`` tuples where kind is one of
    ``h1`` / ``h2`` / ``h3`` / ``p`` / ``bullet``, which is all the fixture
    needs from the shared editor document model.
    """
    nodes = []
    html_parts = []
    stripped_lines = []
    open_list = False

    def close_list():
        nonlocal open_list
        if open_list:
            html_parts.append("</ul>")
            open_list = False

    for kind, text in blocks:
        text = "" if text is None else str(text)
        if kind in ("h1", "h2", "h3"):
            close_list()
            level = int(kind[1])
            nodes.append(
                {
                    "type": "heading",
                    "attrs": {"level": level, "textAlign": None},
                    "content": [{"type": "text", "text": text}],
                }
            )
            html_parts.append(f'<h{level} class="editor-heading-block">{_escape(text)}</h{level}>')
            stripped_lines.append(text)
        elif kind == "bullet":
            if not open_list:
                html_parts.append('<ul class="list-disc">')
                open_list = True
            nodes.append(
                {
                    "type": "bulletList",
                    "content": [
                        {
                            "type": "listItem",
                            "content": [{"type": "paragraph", "content": [{"type": "text", "text": text}]}],
                        }
                    ],
                }
            )
            html_parts.append(f"<li>{_escape(text)}</li>")
            stripped_lines.append(f"- {text}")
        else:
            close_list()
            nodes.append({"type": "paragraph", "content": [{"type": "text", "text": text}]})
            html_parts.append(f'<p class="editor-paragraph-block">{_escape(text)}</p>')
            stripped_lines.append(text)

    close_list()
    return (
        {"type": "doc", "content": nodes},
        "".join(html_parts) or "<p></p>",
        "\n".join(stripped_lines),
    )


def minimal_pdf(title, lines):
    """A small but structurally valid single page PDF (no external deps)."""

    def esc(text):
        return str(text).replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")

    content_parts = [f"BT /F1 15 Tf 48 780 Td ({esc(title)}) Tj ET"]
    cursor = 750
    for line in lines:
        content_parts.append(f"BT /F1 10 Tf 48 {cursor} Td ({esc(line)}) Tj ET")
        cursor -= 16
    content = "\n".join(content_parts)
    objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        (
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
            "/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>"
        ),
        f"<< /Length {len(content)} >>\nstream\n{content}\nendstream",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    payload = "%PDF-1.4\n"
    offsets = []
    for index, body in enumerate(objects, start=1):
        offsets.append(len(payload))
        payload += f"{index} 0 obj\n{body}\nendobj\n"
    xref_offset = len(payload)
    payload += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n"
    for offset in offsets:
        payload += f"{offset:010d} 00000 n \n"
    payload += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n"
    return payload.encode("latin-1")


def _png_chunk(chunk_type, data):
    import struct

    chunk = chunk_type + data
    return struct.pack(">I", len(data)) + chunk + struct.pack(">I", zlib.crc32(chunk) & 0xFFFFFFFF)


def gradient_png(width=240, height=120):
    """A valid RGB PNG used as the report image attachment."""
    import struct

    raw = bytearray()
    for y in range(height):
        raw.append(0)
        for x in range(width):
            raw += bytes(
                (
                    40 + int(120 * x / max(width - 1, 1)),
                    90 + int(100 * y / max(height - 1, 1)),
                    180,
                )
            )
    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    payload = b"\x89PNG\r\n\x1a\n"
    payload += _png_chunk(b"IHDR", header)
    payload += _png_chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    payload += _png_chunk(b"IEND", b"")
    return payload


def zip_archive(file_name, text):
    """A minimal single entry zip for code snapshots."""
    import struct

    name = file_name.encode("utf-8")
    data = text.encode("utf-8")
    crc = zlib.crc32(data) & 0xFFFFFFFF
    local = struct.pack("<IHHHHHIIIHH", 0x04034B50, 20, 0, 0, 0, 0, crc, len(data), len(data), len(name), 0)
    local += name + data
    central = struct.pack(
        "<IHHHHHHIIIHHHHHII",
        0x02014B50,
        20,
        20,
        0,
        0,
        0,
        0,
        crc,
        len(data),
        len(data),
        len(name),
        0,
        0,
        0,
        0,
        0,
        0,
    )
    central += name
    trailer = struct.pack("<IHHHHIIH", 0x06054B50, 0, 0, 1, 1, len(central), len(local), 0)
    return local + central + trailer


MARKDOWN_LINES = (
    "# 本周进展",
    "## 实验",
    "完成石墨负极界面成膜电位对照实验，成膜均匀性提升约 12%；补测 3 组低温工况阻抗数据。",
    "## 数据",
    "首圈库仑效率 88.2% 到 90.6%；界面阻抗 42 欧 降至 35 欧。",
    "## 下周计划",
    "完成原位 XRD 数据标定，整理开题材料中的技术路线章节。",
)


def markdown_body():
    """Text of the ``.md`` report attachment / body import."""
    return "\n\n".join(MARKDOWN_LINES) + "\n"


def week_period(reference, weeks_back):
    return current_period("WEEKLY", reference=reference - timedelta(weeks=weeks_back))


def month_period(reference, months_back):
    year = reference.year
    month = reference.month - months_back
    while month <= 0:
        month += 12
        year -= 1
    return current_period("MONTHLY", reference=reference.replace(year=year, month=month, day=1))


class ResearchSeedBuilder:
    """Create (or top up) the demo fixture inside one workspace."""

    def __init__(self, workspace, actor, *, with_files=True, log=None):
        self.workspace = workspace
        self.actor = actor
        self.with_files = with_files
        self.log = log or (lambda message: None)
        self.created = Counter()
        self.users = {}
        self.units = {}
        self.projects = {}
        self.issues = {}
        self.flows = {}
        self.file_warnings = []
        self.today = timezone.localdate()

    # -- small helpers ----------------------------------------------------

    def note(self, message):
        self.log(message)

    def count(self, key, created):
        if created:
            self.created[key] += 1
        return created

    def user_for(self, key):
        if key == scenario.OWNER_KEY:
            return self.actor
        return self.users[key]

    def org_unit(self, key):
        return self.units[key]

    def project_for(self, key):
        return self.projects[key]

    def audit(self, action, resource_type, resource_id=None, org_unit=None, actor=None, metadata=None):
        return record_audit_event(
            workspace=self.workspace,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            org_unit=org_unit,
            actor=actor if actor is not None else self.actor,
            metadata={"source": "seed_research_demo", **(metadata or {})},
        )

    # -- entry point ------------------------------------------------------

    def run(self):
        with transaction.atomic():
            self.ensure_settings()
            self.ensure_users()
            self.ensure_workspace_members()
            self.ensure_org_tree()
            self.ensure_org_members()
            self.ensure_mentor_bindings()
            self.ensure_identity_mappings()
            self.ensure_templates()
            self.ensure_projects()
            self.ensure_work_items()
            self.ensure_reports()
            self.ensure_approvals()
            for project in scenario.PROJECTS:
                self.ensure_project_records(project)
        return self.created

    # -- platform configuration -------------------------------------------

    def ensure_settings(self):
        setting, created = WorkspaceResearchSetting.objects.get_or_create(
            workspace=self.workspace,
            defaults={
                "module_enabled": True,
                "org_enabled": True,
                "report_enabled": True,
                "approval_enabled": True,
                "stage_enabled": True,
                "experiment_enabled": True,
                "code_enabled": True,
                "integration_enabled": True,
                "created_by": self.actor,
            },
        )
        if created or not setting.module_enabled:
            setting.module_enabled = True
            setting.save(update_fields=["module_enabled", "updated_at"])
            self.count("settings", True)
            self.audit(
                ResearchAuditAction.CONFIG_UPDATE,
                ResearchResourceType.WORKSPACE_SETTING,
                resource_id=setting.id,
                metadata={"module_enabled": True},
            )

    # -- accounts ---------------------------------------------------------

    def ensure_users(self):
        self.users[scenario.OWNER_KEY] = self.actor
        for spec in scenario.ACCOUNTS:
            user = User.objects.filter(email__iexact=spec.email).first()
            created = False
            if user is None:
                user = User(
                    email=spec.email,
                    username=spec.email,
                    first_name=spec.first_name,
                    last_name=spec.last_name,
                    display_name=spec.display_name,
                    is_active=True,
                )
                user.set_password(scenario.PASSWORD)
                user.save()
                created = True
            else:
                # keep the account usable even if a previous run was partial
                user.set_password(scenario.PASSWORD)
                user.is_active = True
                user.save(update_fields=["password", "is_active"])
            self.users[spec.key] = user
            self.count("users", created)

    def ensure_workspace_members(self):
        for spec in scenario.ACCOUNTS:
            user = self.users[spec.key]
            member, created = WorkspaceMember.objects.get_or_create(
                workspace=self.workspace,
                member=user,
                defaults={"role": spec.workspace_role, "created_by": self.actor},
            )
            if not created and (member.role != spec.workspace_role or not member.is_active):
                member.role = spec.workspace_role
                member.is_active = True
                member.save(update_fields=["role", "is_active", "updated_at"])
            self.count("workspace_members", created)

    # -- organisation ------------------------------------------------------

    def ensure_org_tree(self):
        self.units[scenario.ROOT_KEY] = ensure_root_org_unit(self.workspace, actor=self.actor)
        for spec in scenario.ORG_UNITS:
            parent = self.units[spec.parent]
            unit = OrgUnit.objects.filter(
                workspace=self.workspace,
                parent=parent,
                name=spec.name,
                deleted_at__isnull=True,
            ).first()
            created = unit is None
            if created:
                unit = OrgUnit(
                    workspace=self.workspace,
                    parent=parent,
                    name=spec.name,
                    unit_type=spec.unit_type,
                    depth=parent.depth + 1,
                    path="",
                    created_by=self.actor,
                )
                unit.path = build_path(unit.id, parent.path)
                unit.save()
            self.units[spec.key] = unit
            self.count("org_units", created)
            if created:
                self.audit(
                    ResearchAuditAction.ORG_UNIT_CREATE,
                    ResearchResourceType.ORG_UNIT,
                    resource_id=unit.id,
                    org_unit=unit,
                    metadata={"name": spec.name, "unit_type": spec.unit_type, "parent": str(parent.id)},
                )

    def _ensure_org_member(self, unit_key, user_key, role, is_primary=False):
        unit = self.units[unit_key]
        user = self.user_for(user_key)
        member = OrgUnitMember.objects.filter(
            org_unit=unit,
            user=user,
            org_role=role,
            deleted_at__isnull=True,
        ).first()
        created = member is None
        if created:
            if is_primary:
                OrgUnitMember.objects.filter(workspace=self.workspace, user=user, is_primary=True).update(
                    is_primary=False
                )
            member = OrgUnitMember.objects.create(
                workspace=self.workspace,
                org_unit=unit,
                user=user,
                org_role=role,
                is_primary=is_primary,
                effective_from=self.today,
                created_by=self.actor,
            )
            self.audit(
                ResearchAuditAction.ORG_MEMBER_ADD,
                ResearchResourceType.ORG_UNIT_MEMBER,
                resource_id=member.id,
                org_unit=unit,
                metadata={"user": str(user.id), "org_role": role, "is_primary": is_primary},
            )
        elif is_primary and not member.is_primary:
            member.is_primary = True
            member.save(update_fields=["is_primary", "updated_at"])
        self.count("org_members", created)
        return member

    def ensure_org_members(self):
        for unit_key, role, is_primary in scenario.OWNER_ORG_ROLES:
            self._ensure_org_member(unit_key, scenario.OWNER_KEY, role, is_primary)
        for spec in scenario.ACCOUNTS:
            for unit_key, role, is_primary in spec.org_roles:
                self._ensure_org_member(unit_key, spec.key, role, is_primary)

    def ensure_mentor_bindings(self):
        for mentee_key, mentor_key, unit_key in scenario.MENTOR_BINDINGS:
            mentee = self.user_for(mentee_key)
            mentor = self.user_for(mentor_key)
            binding = MentorBinding.objects.filter(
                workspace=self.workspace,
                mentee=mentee,
                mentor=mentor,
                deleted_at__isnull=True,
            ).first()
            created = binding is None
            if created:
                binding = MentorBinding.objects.create(
                    workspace=self.workspace,
                    mentee=mentee,
                    mentor=mentor,
                    org_unit=self.units[unit_key],
                    effective_from=self.today,
                    created_by=self.actor,
                )
                self.audit(
                    ResearchAuditAction.MENTOR_BINDING_CREATE,
                    ResearchResourceType.MENTOR_BINDING,
                    resource_id=binding.id,
                    org_unit=self.units[unit_key],
                    metadata={"mentee": str(mentee.id), "mentor": str(mentor.id)},
                )
            self.count("mentor_bindings", created)

    def ensure_identity_mappings(self):
        provider = scenario.OIDC_PROVIDER
        for spec in scenario.IDENTITY_MAPPINGS:
            user = self.users[spec.account]
            mapping = IdentityMapping.objects.filter(provider=provider, user=user).first()
            created = mapping is None
            if created:
                mapping = IdentityMapping.objects.create(
                    user=user,
                    provider=provider,
                    subject=spec.subject,
                    email_snapshot=user.email,
                    employee_id=spec.employee_id,
                    status=spec.status,
                    created_by=self.actor,
                )
                self.audit(
                    ResearchAuditAction.IDENTITY_BIND,
                    ResearchResourceType.IDENTITY_MAPPING,
                    resource_id=mapping.id,
                    metadata={"provider": provider, "subject": spec.subject, "status": spec.status},
                )
            elif mapping.status != spec.status:
                mapping.status = spec.status
                mapping.save(update_fields=["status", "updated_at"])
            self.count("identity_mappings", created)

    # -- templates ---------------------------------------------------------

    def ensure_templates(self):
        for spec in scenario.TEMPLATES:
            template = ReportTemplate.objects.filter(
                workspace=self.workspace,
                report_type=spec.report_type,
                name=spec.name,
                deleted_at__isnull=True,
            ).first()
            created = template is None
            blocks = [(f"h{min(index + 1, 3)}", heading) for index, heading in enumerate(spec.headings)]
            if spec.scope == "STAGE_MATERIAL":
                blocks.insert(0, ("p", "负责人：{{user}} ｜ 项目：{{project}} ｜ 阶段：{{stage}}"))
            description_json, _html, _stripped = document_from_blocks(blocks)
            if created:
                template = ReportTemplate.objects.create(
                    workspace=self.workspace,
                    report_type=spec.report_type,
                    name=spec.name,
                    scope=spec.scope,
                    stage=spec.stage,
                    material_type=spec.material_type,
                    is_default=spec.is_default,
                    variables=list(spec.variables),
                    content_json=description_json,
                    is_active=True,
                    created_by=self.actor,
                )
                self.audit(
                    ResearchAuditAction.TEMPLATE_CREATE,
                    ResearchResourceType.REPORT_TEMPLATE,
                    resource_id=template.id,
                    metadata={"name": spec.name, "scope": spec.scope},
                )
            self.count("templates", created)

    # -- projects ----------------------------------------------------------

    def ensure_projects(self):
        for spec in scenario.PROJECTS:
            owner = self.user_for(spec.owner)
            project = Project.objects.filter(
                workspace=self.workspace,
                name=spec.name,
                deleted_at__isnull=True,
            ).first()
            created = project is None
            if created:
                project = Project.objects.create(
                    workspace=self.workspace,
                    name=spec.name,
                    identifier=self._unique_identifier(spec.identifier),
                    network=2,
                    created_by=self.actor,
                )
                ProjectIdentifier.objects.create(
                    name=project.identifier,
                    project=project,
                    workspace=self.workspace,
                )
                State.objects.bulk_create(
                    [
                        State(
                            name=state["name"],
                            color=state["color"],
                            project=project,
                            sequence=state["sequence"],
                            workspace=self.workspace,
                            group=state["group"],
                            default=state.get("default", False),
                            created_by=self.actor,
                        )
                        for state in DEFAULT_STATES
                    ]
                )
                ProjectMember.objects.create(
                    project=project,
                    member=owner,
                    role=PROJECT_ADMIN_ROLE,
                    created_by=self.actor,
                )
                if owner.id != self.actor.id:
                    ProjectMember.objects.create(
                        project=project,
                        member=self.actor,
                        role=PROJECT_ADMIN_ROLE,
                        created_by=self.actor,
                    )
                profile = ResearchProjectProfile.objects.create(
                    project=project,
                    workspace=self.workspace,
                    owner=owner,
                    org_unit=self.units[spec.org_unit],
                    research_type=spec.research_type,
                    workflow_status=spec.workflow_status,
                    is_active=spec.workflow_status == ResearchProjectProfile.WorkflowStatus.ACTIVE,
                    started_at=self.today - timedelta(days=120),
                    expected_end_at=self.today + timedelta(days=240),
                    created_by=self.actor,
                )
                self.audit(
                    ResearchAuditAction.PROJECT_CREATE,
                    ResearchResourceType.PROJECT_PROFILE,
                    resource_id=profile.id,
                    org_unit=self.units[spec.org_unit],
                    metadata={"project": str(project.id), "owner": str(owner.id), "type": spec.research_type},
                )
                if spec.workflow_status == ResearchProjectProfile.WorkflowStatus.ARCHIVED:
                    self.audit(
                        ResearchAuditAction.PROJECT_ARCHIVE,
                        ResearchResourceType.PROJECT_PROFILE,
                        resource_id=profile.id,
                        org_unit=self.units[spec.org_unit],
                        metadata={"project": str(project.id)},
                    )
            else:
                profile = ResearchProjectProfile.objects.filter(project=project).first()
            self.projects[spec.key] = (project, profile)
            self.count("projects", created)

    def _unique_identifier(self, base):
        candidate = base
        suffix = 0
        while Project.objects.filter(workspace=self.workspace, identifier=candidate).exists():
            suffix += 1
            candidate = f"{base[:6]}{suffix}"[:12]
        return candidate

    # -- work items --------------------------------------------------------

    def ensure_work_items(self):
        for project_key, items in scenario.WORK_ITEMS.items():
            project, _profile = self.projects[project_key]
            states = {
                state.group: state
                for state in State.objects.filter(project=project, deleted_at__isnull=True).order_by("sequence")
            }
            for index, item in enumerate(items, start=1):
                issue = Issue.objects.filter(
                    project=project,
                    name=item.name,
                    deleted_at__isnull=True,
                ).first()
                created = issue is None
                if created:
                    issue = Issue.objects.create(
                        project=project,
                        name=item.name,
                        state=states.get(item.state_group) or states.get("backlog"),
                        priority=item.priority,
                        sequence_id=index,
                        sort_order=index * 1000,
                        created_by=self.actor,
                    )
                    assignee = self.user_for(item.assignee) if item.assignee else None
                    if assignee is not None:
                        issue.assignees.add(
                            assignee,
                            through_defaults={"project": project, "workspace": self.workspace},
                        )
                self.issues[(project_key, item.name)] = issue
                self.count("work_items", created)

    # -- reports -----------------------------------------------------------

    def _report_blocks(self, *, owner_name, project_name, period_key, status):
        return [
            ("h1", f"{period_key} 科研进展（{owner_name}）"),
            ("p", f"项目：{project_name}"),
            ("h2", "本周进展"),
            ("bullet", "完成既定实验批次，数据已同步到项目数据目录"),
            ("bullet", "补充 3 组对照实验，偏差收敛到可接受区间"),
            ("bullet", "与课题组例会同步阶段材料撰写进度"),
            ("h2", "遇到的问题"),
            ("bullet", "低温工况下界面阻抗波动较大，需要增加重复次数"),
            ("h2", "下周计划"),
            ("bullet", "完成数据标定并输出第一版图表"),
            ("bullet", "整理阶段材料中的技术路线章节"),
            ("h2", "需要支持"),
            ("bullet", "申请设备机时与耗材采购审批"),
        ]

    def _create_report(
        self,
        *,
        spec_key,
        owner,
        project,
        profile,
        report_type,
        period_key,
        period_start,
        period_end,
        status,
        visibility,
        attachment="",
        grantee=None,
        is_backfill=False,
    ):
        report = PeriodicReport.objects.filter(
            workspace=self.workspace,
            owner=owner,
            report_type=report_type,
            period_key=period_key,
            deleted_at__isnull=True,
        ).first()
        if report is not None:
            self._ensure_report_extras(report, owner=owner, project=project, attachment=attachment, grantee=grantee)
            return report, False

        blocks = self._report_blocks(
            owner_name=owner.display_name,
            project_name=project.name,
            period_key=period_key,
            status=status,
        )
        description_json, description_html, description_stripped = document_from_blocks(blocks)
        page = Page.objects.create(
            workspace=self.workspace,
            name=f"{period_key} {report_type}",
            description_json=description_json,
            description_html=description_html,
            description_stripped=description_stripped,
            owned_by=owner,
            access=Page.PRIVATE_ACCESS,
            created_by=owner,
        )
        ProjectPage.objects.create(
            project=project,
            page=page,
            workspace=self.workspace,
            created_by=owner,
        )
        now = timezone.now()
        report = PeriodicReport.objects.create(
            workspace=self.workspace,
            project=project,
            owner=owner,
            org_unit=profile.org_unit,
            page=page,
            report_type=report_type,
            period_key=period_key,
            period_start=period_start,
            period_end=period_end,
            timezone="UTC",
            status=status,
            visibility=visibility,
            is_backfill=is_backfill,
            submitted_at=now if status != PeriodicReport.Status.DRAFT else None,
            accepted_at=now if status == PeriodicReport.Status.ACCEPTED else None,
            reviewer=None,
            created_by=owner,
        )
        self.audit(
            ResearchAuditAction.REPORT_CREATE,
            ResearchResourceType.REPORT,
            resource_id=report.id,
            org_unit=profile.org_unit,
            actor=owner,
            metadata={"report_type": report_type, "period_key": period_key, "is_backfill": is_backfill},
        )
        self._apply_report_status(
            report,
            owner=owner,
            project=project,
            status=status,
        )
        self._ensure_report_extras(report, owner=owner, project=project, attachment=attachment, grantee=grantee)
        self.count("reports", True)
        return report, True

    def _report_reviewer(self, owner_key):
        for mentee_key, mentor_key, _unit in scenario.MENTOR_BINDINGS:
            if mentee_key == owner_key:
                return self.user_for(mentor_key)
        return self.actor

    def _apply_report_status(self, report, *, owner, project, status):
        owner_key = self._account_key(owner)
        reviewer = self._report_reviewer(owner_key) if owner_key else self.actor
        if status == PeriodicReport.Status.SUBMITTED:
            ReportReviewLog.objects.create(
                report=report,
                actor=owner,
                action=ReportReviewLog.Action.SUBMIT,
                from_status=PeriodicReport.Status.DRAFT,
                to_status=PeriodicReport.Status.SUBMITTED,
                comment="",
            )
            self.audit(
                ResearchAuditAction.REPORT_SUBMIT,
                ResearchResourceType.REPORT,
                resource_id=report.id,
                org_unit=report.org_unit,
                actor=owner,
                metadata={"period_key": report.period_key},
            )
            notify_report_submitted(report, owner)
        elif status == PeriodicReport.Status.ACCEPTED:
            report.reviewer = reviewer
            report.save(update_fields=["reviewer", "updated_at"])
            ReportReviewLog.objects.create(
                report=report,
                actor=owner,
                action=ReportReviewLog.Action.SUBMIT,
                from_status=PeriodicReport.Status.DRAFT,
                to_status=PeriodicReport.Status.SUBMITTED,
                comment="",
            )
            ReportReviewLog.objects.create(
                report=report,
                actor=reviewer,
                action=ReportReviewLog.Action.ACCEPT,
                from_status=PeriodicReport.Status.SUBMITTED,
                to_status=PeriodicReport.Status.ACCEPTED,
                comment=scenario.REPORT_ACCEPT_COMMENT,
            )
            self.audit(
                ResearchAuditAction.REPORT_ACCEPT,
                ResearchResourceType.REPORT,
                resource_id=report.id,
                org_unit=report.org_unit,
                actor=reviewer,
                metadata={"period_key": report.period_key},
            )
            notify_report_accepted(report, reviewer)
        elif status == PeriodicReport.Status.NEEDS_REVISION:
            report.reviewer = reviewer
            report.save(update_fields=["reviewer", "updated_at"])
            ReportReviewLog.objects.create(
                report=report,
                actor=owner,
                action=ReportReviewLog.Action.SUBMIT,
                from_status=PeriodicReport.Status.DRAFT,
                to_status=PeriodicReport.Status.SUBMITTED,
                comment="",
            )
            ReportReviewLog.objects.create(
                report=report,
                actor=reviewer,
                action=ReportReviewLog.Action.RETURN,
                from_status=PeriodicReport.Status.SUBMITTED,
                to_status=PeriodicReport.Status.NEEDS_REVISION,
                comment=scenario.REPORT_RETURN_COMMENT,
            )
            self.audit(
                ResearchAuditAction.REPORT_RETURN,
                ResearchResourceType.REPORT,
                resource_id=report.id,
                org_unit=report.org_unit,
                actor=reviewer,
                metadata={"period_key": report.period_key, "reason": scenario.REPORT_RETURN_COMMENT[:200]},
            )
            notify_report_returned(report, reviewer, scenario.REPORT_RETURN_COMMENT)

    def _ensure_report_extras(self, report, *, owner, project, attachment="", grantee=None):
        """Attachments and custom grants are idempotent and re-checked on re-run."""
        if grantee:
            ReportAccessGrant.objects.get_or_create(
                report=report,
                grantee_user=self.user_for(grantee),
                defaults={"granted_by": owner, "created_by": owner},
            )
        if attachment:
            self._attach_file(report, kind=attachment, owner=owner, project=project)

    def _account_key(self, user):
        for key, candidate in self.users.items():
            if candidate.id == user.id:
                return key
        return ""

    # -- attachments -------------------------------------------------------

    def _attachment_payload(self, kind, report):
        if kind == "PDF":
            payload = minimal_pdf(
                "AI4MS Research Report",
                (
                    f"Period: {report.period_key}",
                    f"Type: {report.report_type}",
                    "Owner: " + report.owner.display_name.encode("ascii", "ignore").decode(),
                    "",
                    "1. Experiment batch completed, deviation within tolerance.",
                    "2. Data calibration pending, next step is the technical route draft.",
                    "",
                    "(demo fixture generated by seed_research_demo)",
                ),
            )
            return f"{report.period_key}-report.pdf", "application/pdf", payload
        if kind == "PNG":
            return f"{report.period_key}-chart.png", "image/png", gradient_png()
        return f"{report.period_key}-notes.md", "text/markdown", markdown_body().encode("utf-8")

    def _put_object(self, asset, file_name, payload, content_type):
        """Write bytes to the shared object storage (MinIO) without a request.

        ``S3Storage`` is request oriented (it does not implement ``save``), so
        the fixture uploads with the same client and the same object key scheme
        the presigned upload path uses.
        """
        from plane.db.models.asset import get_upload_path
        from plane.settings.storage import S3Storage

        key = get_upload_path(asset, file_name)
        storage = S3Storage()
        client = getattr(storage, "s3_client", None)
        bucket = getattr(storage, "aws_storage_bucket_name", None)
        if client is None or not bucket:
            raise RuntimeError("object storage is not configured")
        client.put_object(Bucket=bucket, Key=key, Body=payload, ContentType=content_type)
        asset.asset.name = key
        asset.storage_metadata = {"size": len(payload), "content_type": content_type}
        return key

    def _attach_file(self, report, *, kind, owner, project):
        if not self.with_files:
            return None
        file_name, content_type, payload = self._attachment_payload(kind, report)
        existing = ReportAttachment.objects.filter(report=report, file_name=file_name, deleted_at__isnull=True).first()
        if existing is not None:
            return existing
        try:
            asset = FileAsset(
                attributes={"name": file_name, "type": content_type, "size": len(payload)},
                user=owner,
                workspace=self.workspace,
                project=project,
                entity_type=FileAsset.EntityTypeContext.REPORT_ATTACHMENT,
                size=len(payload),
            )
            self._put_object(asset, file_name, payload, content_type)
            asset.is_uploaded = True
            asset.save()
        except Exception as error:  # pragma: no cover - storage availability
            self.file_warnings.append(f"{file_name}: {error}")
            self.with_files = False
            return None
        attachment = ReportAttachment.objects.create(
            report=report,
            asset=asset,
            kind=kind,
            file_name=file_name,
            file_size=len(payload),
            content_type=content_type,
            uploaded_by=owner,
            created_by=owner,
        )
        self.audit(
            ResearchAuditAction.REPORT_ATTACHMENT_ADD,
            ResearchResourceType.REPORT_ATTACHMENT,
            resource_id=attachment.id,
            org_unit=report.org_unit,
            actor=owner,
            metadata={"file_name": file_name, "kind": kind, "size": len(payload)},
        )
        self.count("attachments", True)
        return attachment

    # -- report plans ------------------------------------------------------

    def ensure_reports(self):
        for spec_key, weekly_specs in scenario.REPORT_PLANS.items():
            project_spec = scenario.PROJECT_BY_KEY.get(spec_key)
            if project_spec is None:
                continue
            project, profile = self.projects[project_spec.key]
            owner = self.user_for(project_spec.owner)
            for weekly in weekly_specs:
                period_key, period_start, period_end = week_period(self.today, weekly.week_offset)
                self._create_report(
                    spec_key=spec_key,
                    owner=owner,
                    project=project,
                    profile=profile,
                    report_type=PeriodicReport.ReportType.WEEKLY,
                    period_key=period_key,
                    period_start=period_start,
                    period_end=period_end,
                    status=weekly.status,
                    visibility=weekly.visibility,
                    attachment=weekly.attachment,
                    is_backfill=weekly.week_offset > 0,
                )
        for spec_key, monthly in scenario.MONTHLY_REPORT_PLANS.items():
            project_spec = scenario.PROJECT_BY_KEY[spec_key]
            project, profile = self.projects[project_spec.key]
            owner = self.user_for(project_spec.owner)
            period_key, period_start, period_end = month_period(self.today, monthly.month_offset)
            self._create_report(
                spec_key=spec_key,
                owner=owner,
                project=project,
                profile=profile,
                report_type=PeriodicReport.ReportType.MONTHLY,
                period_key=period_key,
                period_start=period_start,
                period_end=period_end,
                status=monthly.status,
                visibility=monthly.visibility,
                attachment=monthly.attachment,
                is_backfill=False,
            )
        self.ensure_matrix_reports()

    def ensure_matrix_reports(self):
        """Six reports with one visibility level each (P0 ACL matrix)."""
        project_spec = scenario.PROJECT_BY_KEY[scenario.MATRIX_OWNER_PROJECT]
        project, profile = self.projects[project_spec.key]
        owner = self.user_for(project_spec.owner)
        for spec in scenario.MATRIX_REPORTS:
            period_key, period_start, period_end = week_period(self.today, spec.week_offset)
            self._create_report(
                spec_key=project_spec.key,
                owner=owner,
                project=project,
                profile=profile,
                report_type=PeriodicReport.ReportType.WEEKLY,
                period_key=period_key,
                period_start=period_start,
                period_end=period_end,
                status=spec.status,
                visibility=spec.visibility,
                grantee=spec.grantee or None,
                is_backfill=True,
            )

    # -- approvals ---------------------------------------------------------

    def ensure_approvals(self):
        for spec in scenario.APPROVAL_FLOWS:
            org_unit = self.units[spec.org_unit]
            flow = ApprovalFlow.objects.filter(
                workspace=self.workspace,
                org_unit=org_unit,
                approval_type=spec.approval_type,
                name=spec.name,
                version=1,
                deleted_at__isnull=True,
            ).first()
            created = flow is None
            if created:
                flow = ApprovalFlow.objects.create(
                    workspace=self.workspace,
                    org_unit=org_unit,
                    approval_type=spec.approval_type,
                    name=spec.name,
                    version=1,
                    created_by=self.actor,
                )
                for index, step in enumerate(spec.steps, start=1):
                    ApprovalFlowStep.objects.create(
                        flow=flow,
                        order=index,
                        approver_mode=step.approver_mode,
                        approver_org_role=step.approver_role or None,
                        approver_user=self.user_for(step.approver) if step.approver else None,
                        is_required=True,
                        created_by=self.actor,
                    )
                self.audit(
                    ResearchAuditAction.APPROVAL_FLOW_CREATE,
                    ResearchResourceType.APPROVAL_FLOW,
                    resource_id=flow.id,
                    org_unit=org_unit,
                    metadata={"name": spec.name, "approval_type": spec.approval_type},
                )
            self.flows[spec.key] = flow
            self.count("approval_flows", created)

        for spec in scenario.APPROVAL_REQUESTS:
            issue = self.issues.get((spec.project, spec.issue_name))
            if issue is None:
                continue
            if ApprovalRequest.objects.filter(issue=issue).exists():
                continue
            flow = self.flows[spec.flow]
            project, _profile = self.projects[spec.project]
            requester = self.user_for(spec.requester)
            request = ApprovalRequest.objects.create(
                issue=issue,
                flow=flow,
                flow_version=flow.version,
                approval_type=flow.approval_type,
                status=spec.status,
                current_step_order=spec.current_step_order,
                requested_by=requester,
                org_unit=self.units[spec.org_unit],
                research_project=project,
                created_by=requester,
            )
            steps = {step.order: step for step in flow.steps.all()}
            for actor_key, order, comment in spec.approvals:
                ApprovalAction.objects.create(
                    request=request,
                    step=steps.get(order),
                    actor=self.user_for(actor_key),
                    action=ApprovalAction.Action.APPROVE,
                    comment=comment,
                )
            if spec.rejection:
                actor_key, order, comment = spec.rejection
                ApprovalAction.objects.create(
                    request=request,
                    step=steps.get(order),
                    actor=self.user_for(actor_key),
                    action=ApprovalAction.Action.REJECT,
                    comment=comment,
                )
            if spec.withdrawal:
                ApprovalAction.objects.create(
                    request=request,
                    step=steps.get(spec.current_step_order),
                    actor=self.user_for(spec.withdrawal),
                    action=ApprovalAction.Action.WITHDRAW,
                    comment="需求变更，撤回本次申请。",
                )
            self.audit(
                ResearchAuditAction.APPROVAL_REQUEST_CREATE,
                ResearchResourceType.APPROVAL_REQUEST,
                resource_id=request.id,
                org_unit=request.org_unit,
                actor=requester,
                metadata={"flow": str(flow.id), "issue": str(issue.id), "status": spec.status},
            )
            if spec.approvals:
                self.audit(
                    ResearchAuditAction.APPROVAL_APPROVE,
                    ResearchResourceType.APPROVAL_REQUEST,
                    resource_id=request.id,
                    org_unit=request.org_unit,
                    actor=self.user_for(spec.approvals[-1][0]),
                    metadata={"step": spec.approvals[-1][1]},
                )
            if spec.rejection:
                self.audit(
                    ResearchAuditAction.APPROVAL_REJECT,
                    ResearchResourceType.APPROVAL_REQUEST,
                    resource_id=request.id,
                    org_unit=request.org_unit,
                    actor=self.user_for(spec.rejection[0]),
                    metadata={"step": spec.rejection[1], "reason": spec.rejection[2][:200]},
                )
            if spec.withdrawal:
                self.audit(
                    ResearchAuditAction.APPROVAL_WITHDRAW,
                    ResearchResourceType.APPROVAL_REQUEST,
                    resource_id=request.id,
                    org_unit=request.org_unit,
                    actor=requester,
                    metadata={},
                )
            self.count("approval_requests", True)

    # -- P1 project records ------------------------------------------------

    def ensure_project_records(self, spec):
        project, profile = self.projects[spec.key]
        owner = self.user_for(spec.owner)
        instances, created = ensure_stage_instances(self.workspace, profile, actor=owner)
        self.count("stage_instances", created)
        by_stage = {instance.stage: instance for instance in instances}
        self.ensure_materials(spec, owner, by_stage)
        self.ensure_literature(spec, project, owner, by_stage)
        self.ensure_experiments(spec, project, owner, by_stage)
        self.ensure_code(spec, project, owner)
        self.ensure_outcomes(spec, project, owner)
        self.ensure_stage_flow(spec, owner, by_stage)

    def ensure_materials(self, spec, owner, by_stage):
        for stage, count in spec.material_counts.items():
            instance = by_stage.get(stage)
            if instance is None:
                continue
            for material_type in MATERIAL_TYPES_BY_STAGE.get(stage, ())[:count]:
                existing = StageMaterial.objects.filter(
                    stage_instance=instance,
                    material_type=material_type,
                    deleted_at__isnull=True,
                ).first()
                if existing is not None:
                    continue
                title = scenario.STAGE_MATERIAL_TITLES.get(material_type, material_type)
                blocks = [
                    ("h1", title),
                    ("p", f"所属项目：{instance.project.name} ｜ 阶段：{stage}"),
                    ("h2", "要点"),
                    ("bullet", "围绕本阶段目标给出可验收的结论与依据"),
                    ("bullet", "引用纳入文献与已登记实验记录作为支撑"),
                    ("h2", "当前状态"),
                    ("p", "草稿已成型，等待课题组内部确认后提交。"),
                ]
                description_json, description_html, description_stripped = document_from_blocks(blocks)
                page = Page.objects.create(
                    workspace=self.workspace,
                    name=title,
                    description_json=description_json,
                    description_html=description_html,
                    description_stripped=description_stripped,
                    owned_by=owner,
                    access=Page.PRIVATE_ACCESS,
                    created_by=owner,
                )
                ProjectPage.objects.create(
                    project=instance.project,
                    page=page,
                    workspace=self.workspace,
                    created_by=owner,
                )
                material = StageMaterial.objects.create(
                    stage_instance=instance,
                    material_type=material_type,
                    page=page,
                    status=StageMaterial.Status.DRAFT,
                    visibility="DIRECT_ADVISOR",
                    is_required=True,
                    owner=owner,
                    created_by=owner,
                )
                snapshot_material(material, owner, change_source="MANUAL", reason="material created")
                self.audit(
                    ResearchAuditAction.STAGE_MATERIAL_CREATE,
                    ResearchResourceType.STAGE_MATERIAL,
                    resource_id=material.id,
                    org_unit=instance.org_unit,
                    actor=owner,
                    metadata={"stage": stage, "material_type": material_type},
                )
                self.count("materials", True)

    def ensure_literature(self, spec, project, owner, by_stage):
        plan = scenario.LITERATURE_PLAN.get(spec.key)
        if plan is None:
            return
        instance = by_stage.get("PRE_OPENING")
        index = 0

        def create_entry(status, *, annotated=True, sourced=True):
            nonlocal index
            index += 1
            topic = scenario.LITERATURE_TOPICS[(index - 1) % len(scenario.LITERATURE_TOPICS)]
            title = f"{topic}（{spec.key}-{index:02d}）"
            doi = f"10.9999/ai4ms.demo.{spec.key}.{index:03d}" if sourced else ""
            entry = LiteratureEntry.objects.filter(project=project, title=title, deleted_at__isnull=True).first()
            if entry is not None:
                return entry
            entry = LiteratureEntry.objects.create(
                workspace=self.workspace,
                project=project,
                owner=owner,
                title=title,
                authors="AI4MS 示例作者组",
                year=2021 + (index % 5),
                venue="AI4MS Demo Venue" if sourced else "",
                doi=doi,
                url="",
                summary="总结了该方向的代表性方法、数据规模与结论，并给出可复现的实验条件。" if annotated else "",
                gap_notes="现有工作缺少界面尺度与器件尺度之间的定量关联，可作为本课题切入点。" if annotated else "",
                method_tags=["材料", "界面", "表征"] if annotated else [],
                system_tags=["锂电"] if annotated else [],
                relevance_score=80 + (index % 15) if annotated else None,
                status=status,
                visibility="DIRECT_ADVISOR",
                stage_instance=instance,
                created_by=owner,
            )
            self.audit(
                ResearchAuditAction.LITERATURE_CREATE,
                ResearchResourceType.LITERATURE,
                resource_id=entry.id,
                org_unit=instance.org_unit if instance else None,
                actor=owner,
                metadata={"status": status, "title": title[:120]},
            )
            self.count("literature", True)
            return entry

        for offset in range(plan.included):
            create_entry(
                LiteratureEntry.Status.INCLUDED,
                annotated=offset >= plan.unannotated,
                sourced=offset >= plan.unsourced,
            )
        for _ in range(plan.screened):
            create_entry(LiteratureEntry.Status.SCREENED, annotated=False)
        for _ in range(plan.collected):
            create_entry(LiteratureEntry.Status.COLLECTED, annotated=False)
        for _ in range(plan.excluded):
            create_entry(LiteratureEntry.Status.EXCLUDED, annotated=False)

    def _experiment_snapshot(self, record):
        return {
            "title": record.title,
            "status": record.status,
            "objective": record.objective,
            "method": record.method,
            "result": record.result,
            "metrics": record.metrics,
            "conclusion": record.conclusion,
            "status_note": record.status_note,
        }

    def ensure_experiments(self, spec, project, owner, by_stage):
        specs = scenario.EXPERIMENTS.get(spec.key, ())
        if not specs:
            return
        instance = by_stage.get("OPENING") or by_stage.get("MIDTERM") or by_stage.get("PRE_OPENING")
        now = timezone.now()
        for index, exp in enumerate(specs, start=1):
            if ExperimentRecord.objects.filter(project=project, sequence_no=index).exists():
                continue
            finished = exp.status in ("COMPLETED", "FAILED")
            record = ExperimentRecord.objects.create(
                workspace=self.workspace,
                project=project,
                sequence_no=index,
                stage_instance=instance,
                title=exp.title,
                objective=exp.objective or "验证假设并记录可复现的实验条件。",
                hypothesis="界面调控参数与循环稳定性显著相关。",
                molecular_system="石墨 / 电解液界面",
                method="电化学测试 + 结构表征",
                parameters={"temperature_c": 25, "cycles": 200, "rate_c": 0.5},
                environment={"lab": "能源材料实验室", "equipment": "arbin-ct2001a"},
                result="循环 200 次后容量保持率 92.4%，界面阻抗下降 17%。" if finished else "",
                metrics={"retention_pct": 92.4} if finished else {},
                conclusion="成膜电位优化后界面更均匀。" if finished else "",
                failure_reason="极片涂布均匀性不足导致数据离散。" if exp.status == "FAILED" else "",
                status_note=exp.status_note,
                status=exp.status,
                source=ExperimentRecord.Source.MANUAL,
                owner=owner,
                started_at=now - timedelta(days=20 - index) if exp.status != "PLANNED" else None,
                completed_at=now - timedelta(days=5) if finished else None,
                is_locked=exp.status in ("RUNNING", "COMPLETED", "FAILED"),
                submitted_at=now if finished else None,
                current_version_no=1,
                visibility="DIRECT_ADVISOR",
                created_by=owner,
            )
            self.audit(
                ResearchAuditAction.EXPERIMENT_CREATE,
                ResearchResourceType.EXPERIMENT,
                resource_id=record.id,
                org_unit=instance.org_unit if instance else None,
                actor=owner,
                metadata={"sequence_no": index, "status": exp.status, "title": exp.title[:120]},
            )
            if finished:
                ExperimentRecordVersion.objects.create(
                    record=record,
                    version_no=1,
                    snapshot=self._experiment_snapshot(record),
                    change_source=ExperimentRecordVersion.ChangeSource.SUBMIT,
                    created_by=owner,
                )
                self.audit(
                    ResearchAuditAction.EXPERIMENT_SUBMIT,
                    ResearchResourceType.EXPERIMENT,
                    resource_id=record.id,
                    org_unit=instance.org_unit if instance else None,
                    actor=owner,
                    metadata={"version": 1},
                )
            self.count("experiments", True)

        amended = scenario.AMENDED_EXPERIMENTS.get(spec.key)
        if amended is None:
            return
        record = ExperimentRecord.objects.filter(project=project, sequence_no=amended + 1).first()
        if record is None or record.amendments.exists():
            return
        reviewer = self._report_reviewer(spec.owner)
        amendment = ExperimentAmendment.objects.create(
            record=record,
            requested_by=owner,
            reason=scenario.AMENDMENT_REASON,
            change_set=["conclusion", "metrics"],
            status=ExperimentAmendment.Status.APPROVED,
            reviewed_by=reviewer,
            reviewed_at=now,
            review_comment=scenario.AMENDMENT_APPROVAL_COMMENT,
            created_by=owner,
        )
        record.result = "补充统计口径后，容量保持率修订为 93.1%（n=3）。"
        record.metrics = {"retention_pct": 93.1, "samples": 3}
        record.conclusion = "修订结论：成膜电位优化使界面更均匀，结论在 3 次重复下稳定。"
        record.current_version_no = 2
        record.save(update_fields=["result", "metrics", "conclusion", "current_version_no", "updated_at"])
        version = ExperimentRecordVersion.objects.create(
            record=record,
            version_no=2,
            snapshot=self._experiment_snapshot(record),
            change_source=ExperimentRecordVersion.ChangeSource.AMENDMENT,
            reason=scenario.AMENDMENT_REASON,
            created_by=reviewer,
        )
        amendment.result_version = version
        amendment.save(update_fields=["result_version", "updated_at"])
        self.audit(
            ResearchAuditAction.EXPERIMENT_AMENDMENT_CREATE,
            ResearchResourceType.EXPERIMENT_AMENDMENT,
            resource_id=amendment.id,
            org_unit=record.stage_instance.org_unit if record.stage_instance else None,
            actor=owner,
            metadata={"record": str(record.id), "change_set": ["conclusion", "metrics"]},
        )
        self.audit(
            ResearchAuditAction.EXPERIMENT_AMENDMENT_APPROVE,
            ResearchResourceType.EXPERIMENT_AMENDMENT,
            resource_id=amendment.id,
            org_unit=record.stage_instance.org_unit if record.stage_instance else None,
            actor=reviewer,
            metadata={"version": 2},
        )
        self.count("experiment_amendments", True)

    def _snapshot_asset(self, file_name, owner, project):
        if not self.with_files:
            return None
        existing = FileAsset.objects.filter(
            workspace=self.workspace, attributes__name=file_name, is_deleted=False
        ).first()
        if existing is not None:
            return existing
        payload = zip_archive(
            "README.md",
            "# AI4MS demo code snapshot\n\nGenerated by seed_research_demo for traceability testing.\n",
        )
        try:
            asset = FileAsset(
                attributes={"name": file_name, "type": "application/zip", "size": len(payload)},
                user=owner,
                workspace=self.workspace,
                project=project,
                entity_type=FileAsset.EntityTypeContext.REPORT_ATTACHMENT,
                size=len(payload),
            )
            self._put_object(asset, file_name, payload, "application/zip")
            asset.is_uploaded = True
            asset.save()
        except Exception as error:  # pragma: no cover - storage availability
            self.file_warnings.append(f"{file_name}: {error}")
            self.with_files = False
            return None
        self.count("snapshots", True)
        return asset

    def ensure_code(self, spec, project, owner):
        for repo_spec in scenario.CODE_REPOSITORIES.get(spec.key, ()):
            repo = ProjectCodeRepository.objects.filter(project=project, repository_url=repo_spec.url).first()
            if repo is None:
                repo = ProjectCodeRepository.objects.create(
                    workspace=self.workspace,
                    project=project,
                    provider=repo_spec.provider,
                    repository_url=repo_spec.url,
                    repository_slug=repo_spec.slug,
                    default_branch=repo_spec.default_branch,
                    visibility=ProjectCodeRepository.Visibility.PRIVATE,
                    status=repo_spec.status,
                    sync_error=repo_spec.sync_error,
                    last_synced_commit="a1b2c3d" if repo_spec.status == "ACTIVE" else "",
                    last_sync_at=timezone.now() if repo_spec.status == "ACTIVE" else None,
                    created_by=owner,
                )
                self.audit(
                    ResearchAuditAction.CODE_REPOSITORY_CREATE,
                    ResearchResourceType.CODE_REPOSITORY,
                    resource_id=repo.id,
                    actor=owner,
                    metadata={"provider": repo_spec.provider, "url": repo_spec.url, "status": repo_spec.status},
                )
                if repo_spec.status != "ACTIVE":
                    self.audit(
                        ResearchAuditAction.CODE_SYNC,
                        ResearchResourceType.CODE_REPOSITORY,
                        resource_id=repo.id,
                        actor=owner,
                        metadata={"result": repo_spec.status, "error": repo_spec.sync_error},
                    )
                self.count("code_repositories", True)
            for order, (ref_type, ref_value, description) in enumerate(repo_spec.artifacts):
                artifact = CodeArtifact.objects.filter(repository=repo, ref_type=ref_type, ref_value=ref_value).first()
                if artifact is not None:
                    if ref_type == "SNAPSHOT" and artifact.snapshot_asset_id is None and self.with_files:
                        asset = self._snapshot_asset(ref_value, owner, project)
                        if asset is not None:
                            artifact.snapshot_asset = asset
                            artifact.save(update_fields=["snapshot_asset", "updated_at"])
                    continue
                asset = self._snapshot_asset(ref_value, owner, project) if ref_type == "SNAPSHOT" else None
                artifact = CodeArtifact.objects.create(
                    repository=repo,
                    ref_type=ref_type,
                    ref_value=ref_value,
                    commit_message=description,
                    author_name=owner.display_name,
                    committed_at=timezone.now() - timedelta(days=30 - order * 5),
                    snapshot_asset=asset,
                    description=description,
                    created_by=owner,
                )
                self.audit(
                    ResearchAuditAction.CODE_SNAPSHOT_CREATE
                    if ref_type == "SNAPSHOT"
                    else ResearchAuditAction.CODE_ARTIFACT_CREATE,
                    ResearchResourceType.CODE_ARTIFACT,
                    resource_id=artifact.id,
                    actor=owner,
                    metadata={"ref_type": ref_type, "ref_value": ref_value},
                )
                self.count("code_artifacts", True)

    def ensure_outcomes(self, spec, project, owner):
        for outcome_spec in scenario.OUTCOMES.get(spec.key, ()):
            existing = ResearchOutcome.objects.filter(
                project=project, title=outcome_spec.title, deleted_at__isnull=True
            ).first()
            if existing is not None:
                continue
            outcome = ResearchOutcome.objects.create(
                workspace=self.workspace,
                project=project,
                output_type=outcome_spec.output_type,
                title=outcome_spec.title,
                authors=[owner.display_name, self._report_reviewer(spec.owner).display_name],
                venue=outcome_spec.venue,
                doi=outcome_spec.doi,
                status=outcome_spec.status,
                published_at=self.today - timedelta(days=outcome_spec.published_offset_days),
                visibility="DIRECT_ADVISOR",
                created_by=owner,
            )
            self.audit(
                ResearchAuditAction.OUTCOME_CREATE,
                ResearchResourceType.OUTCOME,
                resource_id=outcome.id,
                actor=owner,
                metadata={"output_type": outcome_spec.output_type, "status": outcome_spec.status},
            )
            self.count("outcomes", True)

        # link the first outcome to the project's code snapshot when present
        outcome = ResearchOutcome.objects.filter(project=project, deleted_at__isnull=True).first()
        snapshot = (
            CodeArtifact.objects.filter(repository__project=project, ref_type="SNAPSHOT")
            .order_by("-created_at")
            .first()
        )
        if outcome is not None and snapshot is not None:
            link, created = ResearchOutcomeLink.objects.get_or_create(
                outcome=outcome,
                target_type=ResearchOutcomeLink.TargetType.CODE_ARTIFACT,
                target_id=snapshot.id,
                defaults={"created_by": owner},
            )
            if created:
                self.audit(
                    ResearchAuditAction.OUTCOME_LINK,
                    ResearchResourceType.OUTCOME,
                    resource_id=outcome.id,
                    actor=owner,
                    metadata={"target_type": "CODE_ARTIFACT", "target_id": str(snapshot.id)},
                )

    # -- stage workflow ----------------------------------------------------

    REVIEWER_ROLE_BY_ACCOUNT = {
        scenario.OWNER_KEY: ReviewerRole.PI,
        "zhaoqiang": ReviewerRole.UNIT_ADMIN,
        "zhengkai": ReviewerRole.REVIEWER,
    }

    REVIEW_COMMENTS = (
        "材料完整、论证清晰，同意进入下一阶段。",
        "文献综述和方法设计可执行，建议按里程碑推进。",
        "技术路线与实验设计匹配，同意通过。",
        "评审认为预开题目标明确，同意通过。",
    )

    def _assign_manual_reviewer(self, instance, reviewer_key, owner):
        reviewer = self.user_for(reviewer_key)
        if reviewer.id == owner.id:
            return None
        existing = StageReviewerAssignment.objects.filter(
            stage_instance=instance,
            reviewer=reviewer,
            is_active=True,
            deleted_at__isnull=True,
        ).first()
        if existing is not None:
            return existing
        assignment = StageReviewerAssignment.objects.create(
            stage_instance=instance,
            reviewer=reviewer,
            reviewer_role=self.REVIEWER_ROLE_BY_ACCOUNT.get(reviewer_key, ReviewerRole.REVIEWER),
            is_required=True,
            assignment_kind=StageReviewerAssignment.AssignmentKind.MANUAL,
            assigned_by=self.actor,
            created_by=self.actor,
        )
        self.audit(
            ResearchAuditAction.REVIEW_ASSIGN,
            ResearchResourceType.STAGE_REVIEW_ASSIGNMENT,
            resource_id=instance.id,
            org_unit=instance.org_unit,
            metadata={"stage": instance.stage, "reviewer": str(reviewer.id), "kind": "manual"},
        )
        self.count("reviewer_assignments", True)
        return assignment

    def _submit_stage_reviews(self, instance, owner):
        for index, assignment in enumerate(effective_assignments(instance)):
            if assignment.reviewer_id == owner.id:
                continue
            submit_review(
                instance,
                assignment.reviewer,
                recommendation="PASS",
                comment=self.REVIEW_COMMENTS[index % len(self.REVIEW_COMMENTS)],
                score=85 + (index % 3) * 3,
            )
            self.count("stage_reviews", True)

    def ensure_stage_flow(self, spec, owner, by_stage):
        for stage in STAGE_SEQUENCE:
            target = spec.stage_status.get(stage)
            if not target or target == "NOT_STARTED":
                continue
            instance = by_stage.get(stage)
            if instance is None or instance.status != "NOT_STARTED":
                # already seeded (or partially so): leave the trail untouched
                continue
            enter_stage(instance, owner)
            self.count("stage_enters", True)
            if target in ("SUBMITTED", "PASSED", "NEEDS_REVISION"):
                submit_stage(instance, owner)
                self.count("stage_submits", True)
                for reviewer_key in spec.manual_reviewers.get(stage, ()):
                    self._assign_manual_reviewer(instance, reviewer_key, owner)
            if target == "PASSED":
                self._submit_stage_reviews(instance, owner)
                pass_stage(instance, self.actor)
                self.count("stage_passes", True)
            elif target == "NEEDS_REVISION":
                reviewer = self._report_reviewer(spec.owner)
                return_stage(instance, reviewer, scenario.STAGE_RETURN_REASON)
                self.count("stage_returns", True)


# ---------------------------------------------------------------------------
# reset / wipe helpers
# ---------------------------------------------------------------------------


def seeded_users():
    """Accounts owned by this fixture.

    Scoped to the declared account list on purpose: the ``@ai4ms.local``
    domain is also used by the system baseline accounts (instance
    administrator, administrator tags and the acceptance test group), and
    ``--reset`` must never delete those.
    """
    emails = [spec.email for spec in scenario.ACCOUNTS]
    return User.objects.filter(email__in=emails)


def seeded_projects(workspace):
    """Fixture projects, including rows a previous soft delete left behind."""
    return Project.all_objects.filter(
        workspace=workspace,
        name__in=[spec.name for spec in scenario.PROJECTS],
    )


APPEND_ONLY_STATEMENTS = (
    (
        "stage_transitions",
        "DELETE FROM research_stage_transitions WHERE stage_instance_id IN "
        "(SELECT id FROM research_stage_instances WHERE project_id IN ({marks}))",
    ),
    (
        "material_versions",
        "DELETE FROM research_stage_material_versions WHERE material_id IN "
        "(SELECT material.id FROM research_stage_materials material "
        "JOIN research_stage_instances stage ON stage.id = material.stage_instance_id "
        "WHERE stage.project_id IN ({marks}))",
    ),
    (
        "review_revisions",
        "DELETE FROM research_stage_review_revisions WHERE review_id IN "
        "(SELECT review.id FROM research_stage_reviews review "
        "JOIN research_stage_instances stage ON stage.id = review.stage_instance_id "
        "WHERE stage.project_id IN ({marks}))",
    ),
    (
        "experiment_versions",
        "DELETE FROM research_experiment_record_versions WHERE record_id IN "
        "(SELECT id FROM research_experiment_records WHERE project_id IN ({marks}))",
    ),
)


def purge_append_only(project_ids):
    """Drop the append-only evidence rows of the given projects.

    Stage transitions, material versions, review revisions and experiment
    versions use ``PROTECT`` foreign keys and reject ORM deletes at three
    layers, so a test fixture can only be removed with a scoped SQL delete.
    ``research_audit_events`` is deliberately never touched: the audit trail
    stays complete even after a reset.
    """
    ids = [str(project_id) for project_id in project_ids if project_id]
    if not ids:
        return Counter()
    marks = ",".join(["%s"] * len(ids))
    purged = Counter()
    with connection.cursor() as cursor:
        for key, statement in APPEND_ONLY_STATEMENTS:
            cursor.execute(statement.format(marks=marks), ids)
            purged[key] = cursor.rowcount
    return purged


def hard_delete(queryset):
    """Delete rows for real, bypassing the workspace wide soft delete.

    Every research model inherits the upstream ``SoftDeleteModel`` queryset, so
    a plain ``.delete()`` only stamps ``deleted_at`` - which would keep the
    fixture's names and identifiers occupied and break the next seed.
    """
    try:
        return queryset.delete(soft=False)
    except TypeError:
        return queryset.delete()


def _delete_research_payload(projects):
    """Delete the given projects with everything hanging off them."""
    ids = [str(project_id) for project_id in projects.values_list("id", flat=True)]
    deleted = Counter()
    if not ids:
        return deleted
    deleted.update(purge_append_only(ids))
    page_ids = list(ProjectPage.all_objects.filter(project_id__in=ids).values_list("page_id", flat=True))
    deleted["work_items"] = Issue.all_objects.filter(project_id__in=ids).count()
    deleted["reports"] = PeriodicReport.all_objects.filter(project_id__in=ids).count()
    deleted["projects"] = len(ids)
    hard_delete(Project.all_objects.filter(id__in=ids))
    if page_ids:
        pages = Page.all_objects.filter(id__in=page_ids)
        deleted["pages"] = pages.count()
        hard_delete(pages)
    return deleted


def _delete_org_units(workspace, names=None, only_children=False):
    units = list(OrgUnit.all_objects.filter(workspace=workspace))
    if names is not None:
        units = [unit for unit in units if unit.name in names]
    deleted = 0
    for unit in sorted(units, key=lambda item: item.depth, reverse=True):
        if unit.parent_id is None:
            continue
        hard_delete(OrgUnit.all_objects.filter(id=unit.id))
        deleted += 1
    return deleted


@transaction.atomic
def reset_seed(workspace):
    """Delete everything this fixture created, leaving user data untouched."""
    deleted = Counter()
    users = seeded_users()
    user_ids = list(users.values_list("id", flat=True))

    reports = PeriodicReport.objects.filter(workspace=workspace, owner_id__in=user_ids)
    deleted["reports"] = reports.count()
    hard_delete(reports)

    project_names = [spec.name for spec in scenario.PROJECTS]
    project_ids = set(
        ResearchProjectProfile.all_objects.filter(workspace=workspace)
        .filter(Q(owner_id__in=user_ids) | Q(project__name__in=project_names))
        .values_list("project_id", flat=True)
    )
    project_ids |= set(seeded_projects(workspace).values_list("id", flat=True))
    deleted.update(_delete_research_payload(Project.all_objects.filter(id__in=project_ids)))

    bindings = MentorBinding.objects.filter(workspace=workspace).filter(
        Q(mentor_id__in=user_ids) | Q(mentee_id__in=user_ids)
    )
    deleted["mentor_bindings"] = bindings.count()
    hard_delete(bindings)
    deleted["org_members"] = OrgUnitMember.objects.filter(workspace=workspace, user_id__in=user_ids).count()
    hard_delete(OrgUnitMember.all_objects.filter(workspace=workspace, user_id__in=user_ids))
    # Retired names from earlier fixture versions are cleared too, so an
    # existing workspace converges on the current single-chain tree.
    deleted["org_units"] = _delete_org_units(
        workspace,
        names=[spec.name for spec in scenario.ORG_UNITS] + list(scenario.RETIRED_ORG_UNIT_NAMES),
    )

    template_names = [spec.name for spec in scenario.TEMPLATES]
    templates = ReportTemplate.all_objects.filter(workspace=workspace, name__in=template_names)
    deleted["templates"] = templates.count()
    hard_delete(templates)
    flow_names = [spec.name for spec in scenario.APPROVAL_FLOWS]
    flows = ApprovalFlow.all_objects.filter(workspace=workspace, name__in=flow_names)
    deleted["approval_flows"] = flows.count()
    hard_delete(flows)

    deleted["users"] = users.count()
    users.delete()
    return deleted


def wipe_research_data(workspace):
    """Count (do not delete) every research record of the workspace."""
    counts = Counter()
    counts["research_projects"] = ResearchProjectProfile.all_objects.filter(workspace=workspace).count()
    counts["reports"] = PeriodicReport.all_objects.filter(workspace=workspace).count()
    counts["stage_instances"] = ResearchStageInstance.all_objects.filter(workspace=workspace).count()
    counts["literature"] = LiteratureEntry.all_objects.filter(workspace=workspace).count()
    counts["experiments"] = ExperimentRecord.all_objects.filter(workspace=workspace).count()
    counts["code_repositories"] = ProjectCodeRepository.all_objects.filter(workspace=workspace).count()
    counts["outcomes"] = ResearchOutcome.all_objects.filter(workspace=workspace).count()
    counts["approval_requests"] = ApprovalRequest.all_objects.filter(flow__workspace=workspace).count()
    counts["org_units"] = OrgUnit.all_objects.filter(workspace=workspace).count()
    counts["projects"] = Project.all_objects.filter(workspace=workspace).count()
    return counts


@transaction.atomic
def perform_wipe(workspace):
    """Delete every research record of the workspace (``--wipe --yes``)."""
    deleted = Counter()
    project_ids = list(
        ResearchProjectProfile.all_objects.filter(workspace=workspace).values_list("project_id", flat=True)
    )
    deleted.update(_delete_research_payload(Project.all_objects.filter(id__in=project_ids)))

    reports = PeriodicReport.all_objects.filter(workspace=workspace)
    deleted["reports"] = reports.count()
    hard_delete(reports)
    # any stage or experiment left over from an unprofiled project first
    purge_append_only(
        list(ResearchStageInstance.all_objects.filter(workspace=workspace).values_list("project_id", flat=True))
        + list(ExperimentRecord.all_objects.filter(workspace=workspace).values_list("project_id", flat=True))
    )
    hard_delete(ResearchOutcome.all_objects.filter(workspace=workspace))
    hard_delete(LiteratureEntry.all_objects.filter(workspace=workspace))
    hard_delete(ExperimentRecord.all_objects.filter(workspace=workspace))
    hard_delete(ProjectCodeRepository.all_objects.filter(workspace=workspace))
    hard_delete(ResearchStageInstance.all_objects.filter(workspace=workspace))
    hard_delete(ApprovalFlow.all_objects.filter(workspace=workspace))
    hard_delete(MentorBinding.all_objects.filter(workspace=workspace))
    hard_delete(OrgUnitMember.all_objects.filter(workspace=workspace))
    hard_delete(ResearchProjectProfile.all_objects.filter(workspace=workspace))
    hard_delete(ReportTemplate.all_objects.filter(workspace=workspace))
    deleted["org_units"] = _delete_org_units(workspace)
    return deleted
