# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Bulk account import from the two-dimensional roster (SYS-IMP-01 ~ SYS-IMP-09).

The roster is the authoritative source for "who exists": every row becomes an
account, a seat in the public workspace, an organisation membership and a
research profile. Rows whose advisor has no mailbox mapping are still imported
and reported as pending, because a missing mentoring link must not hold back
the rest of the batch.
"""

import csv
import io
import re
import secrets
from dataclasses import dataclass, field

from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError, models, transaction
from django.utils import timezone

from plane.db.models import (
    MentorBinding,
    OrgUnit,
    OrgUnitMember,
    ResearchUserProfile,
    User,
    UserImportBatch,
    UserImportRow,
    WorkspaceMember,
)
from plane.research.services.accounts import AccountError
from plane.research.utils.audit import ResearchAuditAction, ResearchResourceType, record_audit_event
from plane.research.utils.errors import ResearchErrorCode
from plane.research.utils.roles import WORKSPACE_MEMBER_ROLE

STUDENT_ORG_ROLE = OrgUnitMember.OrgRole.REVIEWER

ROSTER_HEADERS = {
    "name": "姓名",
    "student_no": "学号",
    "email": "邮件",
    "phone": "手机号",
    "grade": "年级",
    "category": "人员类别",
    "business_category": "业务方向",
    "group": "小组",
    "primary_advisor_name": "主导师",
    "co_advisor_1_name": "联合导师1",
    "co_advisor_2_name": "联合导师2",
}

ADVISOR_HEADERS = {
    "name": ("姓名", "导师"),
    "email": ("邮箱", "邮件"),
}

CATEGORY_ALIASES = {
    "学生": ResearchUserProfile.Category.STUDENT,
    "student": ResearchUserProfile.Category.STUDENT,
    "博士后": ResearchUserProfile.Category.POSTDOC,
    "postdoc": ResearchUserProfile.Category.POSTDOC,
    "导师": ResearchUserProfile.Category.ADVISOR,
    "advisor": ResearchUserProfile.Category.ADVISOR,
    "pi": ResearchUserProfile.Category.PI,
    "员工": ResearchUserProfile.Category.STAFF,
    "staff": ResearchUserProfile.Category.STAFF,
    "其他": ResearchUserProfile.Category.OTHER,
    "other": ResearchUserProfile.Category.OTHER,
}

BUSINESS_CATEGORY_ALIASES = {
    "基础研究": OrgUnit.BusinessCategory.BASIC_RESEARCH,
    "basicresearch": OrgUnit.BusinessCategory.BASIC_RESEARCH,
    "产业化": OrgUnit.BusinessCategory.INDUSTRIALIZATION,
    "industrialization": OrgUnit.BusinessCategory.INDUSTRIALIZATION,
}

ROW_OK = UserImportRow.Status.OK
ROW_PENDING = UserImportRow.Status.PENDING
ROW_ERROR = UserImportRow.Status.ERROR


@dataclass
class StudentRow:
    """One normalised roster row."""

    row_number: int
    name: str = ""
    email: str = ""
    student_no: str = ""
    grade: str = ""
    phone: str = ""
    group: str = ""
    category: str = ""
    business_category: str = ""
    primary_advisor_name: str = ""
    co_advisor_1_name: str = ""
    co_advisor_2_name: str = ""
    raw: dict = field(default_factory=dict)

    @property
    def co_advisor_names(self):
        return tuple(name for name in (self.co_advisor_1_name, self.co_advisor_2_name) if name)

    @property
    def advisor_names(self):
        return (self.primary_advisor_name, *self.co_advisor_names)

    @property
    def advisor_entries(self):
        return (
            ("主导师", self.primary_advisor_name),
            ("联合导师1", self.co_advisor_1_name),
            ("联合导师2", self.co_advisor_2_name),
        )


@dataclass
class ImportPreviewRow:
    """Transient row result returned by a dry run without database writes."""

    row_number: int
    raw: dict
    status: str
    message: str
    display_name: str
    email: str
    student_no: str
    group_label: str
    advisor_name: str
    user: None = None
    org_unit: object = None

    def as_dict(self):
        return {
            "id": None,
            "batch": None,
            "row_number": self.row_number,
            "status": self.status,
            "message": self.message,
            "display_name": self.display_name,
            "email": self.email,
            "student_no": self.student_no,
            "group_label": self.group_label,
            "advisor_name": self.advisor_name,
            "user": None,
            "user_detail": None,
            "org_unit": str(self.org_unit.id) if self.org_unit is not None else None,
            "raw": self.raw,
            "created_at": None,
        }


@dataclass
class ImportPreview:
    """In-memory import report used by API, CLI and acceptance checks."""

    source_filename: str
    rows: list[ImportPreviewRow]
    rows_total: int
    rows_ok: int
    rows_pending: int
    rows_error: int
    summary: dict
    dry_run: bool = True
    status: str = UserImportBatch.Status.PENDING
    id: None = None
    options: dict = field(default_factory=dict)
    created_by_detail: None = None
    created_at: None = None

    def as_dict(self):
        return {
            "id": None,
            "source_filename": self.source_filename,
            "dry_run": True,
            "status": self.status,
            "rows_total": self.rows_total,
            "rows_ok": self.rows_ok,
            "rows_pending": self.rows_pending,
            "rows_error": self.rows_error,
            "options": self.options,
            "summary": self.summary,
            "created_by_detail": None,
            "created_at": None,
            "rows": [row.as_dict() for row in self.rows],
        }


def _normalise_header(value):
    return str(value or "").strip().lower().replace(" ", "").replace("　", "")


def _map_exact_headers(header_row, headers):
    """Return field positions only when every required Chinese header exists."""
    normalised = [_normalise_header(cell) for cell in header_row]
    if len(normalised) != len(set(normalised)):
        raise AccountError(ResearchErrorCode.IMPORT_FILE_INVALID, "The header row contains duplicate columns.")
    mapping = {}
    for field_name, header in headers.items():
        key = _normalise_header(header)
        if key not in normalised:
            raise AccountError(
                ResearchErrorCode.IMPORT_FILE_INVALID,
                f"The header row is missing the {header} column.",
            )
        mapping[field_name] = normalised.index(key)
    return mapping


def _map_advisor_headers(header_row):
    normalised = [_normalise_header(cell) for cell in header_row]
    mapping = {}
    for field_name, aliases in ADVISOR_HEADERS.items():
        for alias in aliases:
            key = _normalise_header(alias)
            if key in normalised:
                mapping[field_name] = normalised.index(key)
                break
    return mapping


def _decode_csv(payload):
    for encoding in ("utf-8-sig", "utf-8", "gb18030"):
        try:
            return payload.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise AccountError(
        ResearchErrorCode.IMPORT_FILE_INVALID,
        "The file must be UTF-8 or GB18030 encoded CSV/XLSX.",
    )


def _rows_from_csv(payload):
    text = _decode_csv(payload)
    reader = csv.reader(io.StringIO(text))
    return [list(row) for row in reader]


def _rows_from_xlsx(payload):
    from openpyxl import load_workbook

    workbook = load_workbook(io.BytesIO(payload), data_only=True, read_only=True)
    sheet = workbook[workbook.sheetnames[0]]
    rows = []
    for row in sheet.iter_rows(values_only=True):
        rows.append(["" if cell is None else cell for cell in row])
    workbook.close()
    return rows


def sheet_rows(payload, filename=""):
    """Read a CSV or XLSX upload into a list of rows (each a list of cells)."""
    if not payload:
        raise AccountError(ResearchErrorCode.IMPORT_FILE_REQUIRED, "A file is required.")
    lowered = str(filename or "").lower()
    try:
        if lowered.endswith(".xlsx") or payload[:2] == b"PK":
            return _rows_from_xlsx(payload)
        return _rows_from_csv(payload)
    except AccountError:
        raise
    except Exception as exc:  # noqa: BLE001 - surfaced as a 400 to the caller
        raise AccountError(
            ResearchErrorCode.IMPORT_FILE_INVALID,
            f"The roster could not be read: {exc}",
        )


def normalise_category(value):
    raw = str(value or "").strip()
    upper = raw.upper()
    if upper in ResearchUserProfile.Category.values:
        return upper
    return CATEGORY_ALIASES.get(_normalise_header(raw), "")


def normalise_business_category(value):
    raw = str(value or "").strip()
    upper = raw.upper()
    if upper in (OrgUnit.BusinessCategory.BASIC_RESEARCH, OrgUnit.BusinessCategory.INDUSTRIALIZATION):
        return upper
    return BUSINESS_CATEGORY_ALIASES.get(_normalise_header(raw), "")


def parse_students(payload, filename=""):
    """Parse the student roster into :class:`StudentRow` objects."""
    rows = sheet_rows(payload, filename)
    if not rows:
        raise AccountError(ResearchErrorCode.IMPORT_FILE_INVALID, "The roster is empty.")

    mapping = _map_exact_headers(rows[0], ROSTER_HEADERS)

    def cell(row, field_name):
        position = mapping.get(field_name)
        if position is None or position >= len(row):
            return ""
        value = row[position]
        return str(value).strip() if value is not None else ""

    students = []
    for index, row in enumerate(rows[1:], start=2):
        if not any(str(value or "").strip() for value in row):
            continue
        category_value = cell(row, "category")
        students.append(
            StudentRow(
                row_number=index,
                name=cell(row, "name"),
                email=cell(row, "email").lower(),
                student_no=cell(row, "student_no"),
                grade=cell(row, "grade"),
                phone=cell(row, "phone"),
                group=cell(row, "group"),
                category=normalise_category(category_value) or category_value or ResearchUserProfile.Category.STUDENT,
                business_category=normalise_business_category(cell(row, "business_category"))
                or cell(row, "business_category"),
                primary_advisor_name=cell(row, "primary_advisor_name"),
                co_advisor_1_name=cell(row, "co_advisor_1_name"),
                co_advisor_2_name=cell(row, "co_advisor_2_name"),
                raw={field_name: cell(row, field_name) for field_name in ROSTER_HEADERS},
            )
        )
    if not students:
        raise AccountError(
            ResearchErrorCode.IMPORT_FILE_INVALID,
            "The roster has a header row but no data rows.",
        )
    return students


def parse_advisors(payload, filename=""):
    """Parse a name to mailbox table into ``{normalised name: email}``."""
    rows = sheet_rows(payload, filename)
    if not rows:
        raise AccountError(ResearchErrorCode.IMPORT_FILE_INVALID, "The advisor table is empty.")

    mapping = _map_advisor_headers(rows[0])
    if "name" not in mapping or "email" not in mapping:
        raise AccountError(
            ResearchErrorCode.IMPORT_FILE_INVALID,
            "The advisor table needs 姓名/name and 邮件/email columns.",
        )

    def cell(row, field_name):
        position = mapping.get(field_name)
        if position is None or position >= len(row):
            return ""
        value = row[position]
        return str(value).strip() if value is not None else ""

    advisors = {}
    for row in rows[1:]:
        name = cell(row, "name")
        email = cell(row, "email").lower()
        if not name or not email:
            continue
        key = _normalise_header(name)
        existing = advisors.get(key)
        if existing is not None and existing != email:
            raise AccountError(
                ResearchErrorCode.IMPORT_FILE_INVALID,
                f"导师姓名 {name} 对应了多个邮箱。",
            )
        advisors[key] = email
    return advisors


def generate_password():
    """A one-time credential strong enough for the change-password screen."""
    return secrets.token_urlsafe(9)


def _valid_email(value):
    try:
        validate_email(value)
    except ValidationError:
        return False
    return True


def _unit_lineage(unit):
    lineage = []
    current = unit
    while current is not None:
        lineage.append(current)
        current = current.parent
    return list(reversed(lineage))


def resolve_team_unit(workspace, reference, business_category=""):
    """Resolve one existing TEAM by full path or an unambiguous name."""
    reference = str(reference or "").strip()
    if not reference:
        return None, "小组 is required."

    parts = [item.strip() for item in re.split(r"\s*(?:/|>|＞)\s*", reference) if item.strip()]
    queryset = OrgUnit.objects.filter(
        workspace=workspace,
        unit_type=OrgUnit.UnitType.TEAM,
        is_active=True,
        deleted_at__isnull=True,
    ).select_related("parent")
    candidates = list(queryset.filter(name=parts[-1])) if parts else []
    if len(parts) > 1:
        candidates = [
            unit
            for unit in candidates
            if [item.name for item in _unit_lineage(unit)] == parts
        ]

    if business_category:
        candidates = [
            unit
            for unit in candidates
            if business_category in {item.business_category for item in _unit_lineage(unit)}
        ]

    if not candidates:
        if business_category:
            return None, f"小组不存在或与业务方向不一致：{reference}"
        return None, f"小组不存在：{reference}"
    if len(candidates) > 1:
        return None, f"小组名称不唯一，请填写完整路径：{reference}"
    return candidates[0], ""


def resolve_existing_advisor(workspace, email):
    return User.objects.filter(
        email__iexact=email,
        is_active=True,
        member_workspace__workspace=workspace,
        member_workspace__is_active=True,
        member_workspace__deleted_at__isnull=True,
    ).first()


def resolve_row_advisors(workspace, row, advisor_map):
    """Resolve roster advisor names without provisioning advisor accounts."""
    primary_advisor = None
    co_advisors = []
    reasons = []
    for label, name in row.advisor_entries:
        if not name:
            continue
        email = advisor_map.get(_normalise_header(name), "")
        if not email:
            reasons.append(f"缺少{label}邮箱映射：{name}")
            continue
        if not _valid_email(email):
            reasons.append(f"{label}邮箱无效：{email}")
            continue
        advisor = resolve_existing_advisor(workspace, email)
        if advisor is None:
            reasons.append(f"{label}不是当前工作空间有效成员：{name}")
            continue
        if label == "主导师":
            primary_advisor = advisor
        else:
            co_advisors.append(advisor)
    return primary_advisor, co_advisors, reasons


def find_user_for_row(row):
    """Locate an existing account by mailbox, then by student number."""
    if row.email:
        user = User.objects.filter(email__iexact=row.email).first()
        if user is not None:
            return user
    if row.student_no:
        profile = ResearchUserProfile.objects.filter(student_no=row.student_no).select_related("user").first()
        if profile is not None:
            return profile.user
    return None


def validate_row(row):
    """Return ``(error_code, message)``; both ``None`` when the row is usable."""
    if not row.name:
        return ResearchErrorCode.IMPORT_ROW_INVALID, "姓名 is required."
    if not row.email:
        return ResearchErrorCode.IMPORT_ROW_INVALID, "邮件 is required."
    if not row.student_no:
        return ResearchErrorCode.IMPORT_ROW_INVALID, "学号 is required."
    if not row.group:
        return ResearchErrorCode.IMPORT_ROW_INVALID, "小组 is required."
    if not row.primary_advisor_name:
        return ResearchErrorCode.IMPORT_ROW_INVALID, "主导师 is required."
    if not _valid_email(row.email):
        return ResearchErrorCode.IMPORT_ROW_INVALID, f"{row.email} is not a valid mailbox."
    if row.student_no:
        owner = ResearchUserProfile.objects.filter(student_no=row.student_no).select_related("user").first()
        if owner is not None and owner.user is not None and owner.user.email.lower() != row.email:
            return (
                ResearchErrorCode.IMPORT_ROW_INVALID,
                f"学号 {row.student_no} already belongs to {owner.user.email}.",
            )
    if row.category and row.category not in ResearchUserProfile.Category.values:
        return ResearchErrorCode.IMPORT_ROW_INVALID, f"Unknown category '{row.category}'."
    if row.business_category and row.business_category not in (
        OrgUnit.BusinessCategory.BASIC_RESEARCH,
        OrgUnit.BusinessCategory.INDUSTRIALIZATION,
    ):
        return ResearchErrorCode.IMPORT_ROW_INVALID, f"Unknown business category '{row.business_category}'."
    normalised_advisors = [_normalise_header(name) for name in row.advisor_names if name]
    if len(normalised_advisors) != len(set(normalised_advisors)):
        return ResearchErrorCode.IMPORT_ROW_INVALID, "导师不能重复。"
    return None, None


def _upsert_user(row, reset_passwords=False):
    """Create or update the account; returns ``(user, created, password)``."""
    user = find_user_for_row(row)
    if user is None:
        password = generate_password()
        user = User(
            email=row.email,
            username=row.email,
            first_name=row.name,
            display_name=row.name,
            is_active=True,
        )
        user.password = make_password(password)
        user.is_password_reset_required = True
        user.save()
        return user, True, password

    changed = set()
    if row.name and user.display_name != row.name:
        user.display_name = row.name
        changed.add("display_name")
    if not user.first_name and row.name:
        user.first_name = row.name
        changed.add("first_name")
    if not user.is_active:
        user.is_active = True
        changed.add("is_active")

    password = ""
    if reset_passwords:
        password = generate_password()
        user.password = make_password(password)
        user.is_password_reset_required = True
        changed.update({"password", "is_password_reset_required"})

    if changed:
        user.save(update_fields=sorted(changed | {"updated_at"}))
    return user, False, password


def _upsert_profile(user, row, group_label, batch, actor):
    profile = ResearchUserProfile.objects.filter(user=user).first()
    if profile is None:
        return ResearchUserProfile.objects.create(
            user=user,
            student_no=row.student_no,
            grade=row.grade,
            phone=row.phone,
            category=row.category or ResearchUserProfile.Category.STUDENT,
            group_label=group_label,
            source_batch=batch,
            created_by=actor,
        )
    updates = {
        "student_no": row.student_no or profile.student_no,
        "grade": row.grade or profile.grade,
        "phone": row.phone or profile.phone,
        "group_label": profile.group_label or group_label,
        "source_batch": batch or profile.source_batch,
        "category": row.category or profile.category,
    }
    for field_name, value in updates.items():
        setattr(profile, field_name, value)
    profile.save()
    return profile


def ensure_workspace_membership(workspace, user, actor):
    membership, created = WorkspaceMember.objects.get_or_create(
        workspace=workspace,
        member=user,
        defaults={"role": WORKSPACE_MEMBER_ROLE, "created_by": actor},
    )
    if not created and not membership.is_active:
        membership.is_active = True
        membership.save(update_fields=["is_active", "updated_at"])
    return membership, created


def ensure_org_membership(workspace, unit, user, role, actor):
    member = OrgUnitMember.objects.filter(
        workspace=workspace, org_unit=unit, user=user, org_role=role, deleted_at__isnull=True
    ).first()
    if member is not None:
        return member, False
    has_primary = OrgUnitMember.objects.filter(
        workspace=workspace,
        user=user,
        is_primary=True,
        deleted_at__isnull=True,
    ).exists()
    member = OrgUnitMember.objects.create(
        workspace=workspace,
        org_unit=unit,
        user=user,
        org_role=role,
        # Preserve the import contract while making a first, unambiguous roster
        # relation usable by the v3 resolver. Existing non-primary relations are
        # never rewritten or guessed during idempotent re-imports.
        is_primary=not has_primary,
        effective_from=timezone.localdate(),
        created_by=actor,
    )
    return member, True


def ensure_v3_primary_membership(workspace, unit, user, actor):
    current = OrgUnitMember.objects.filter(
        workspace=workspace, user=user, is_primary=True, deleted_at__isnull=True
    ).first()
    if current is not None:
        return current, current.org_unit_id == unit.id
    member, _created = OrgUnitMember.objects.get_or_create(
        workspace=workspace,
        org_unit=unit,
        user=user,
        org_role=STUDENT_ORG_ROLE,
        deleted_at__isnull=True,
        defaults={
            "is_primary": True,
            "effective_from": timezone.localdate(),
            "created_by": actor,
        },
    )
    if not member.is_primary:
        member.is_primary = True
        member.save(update_fields=["is_primary", "updated_at"])
    return member, True


def ensure_mentor_binding(workspace, unit, mentee, mentor, actor):
    binding = MentorBinding.objects.filter(
        workspace=workspace, mentee=mentee, mentor=mentor, deleted_at__isnull=True
    ).first()
    if binding is not None:
        return binding, False
    today = timezone.localdate()
    has_primary = (
        MentorBinding.objects.filter(
            workspace=workspace,
            mentee=mentee,
            is_primary_advisor=True,
            deleted_at__isnull=True,
            effective_from__lte=today,
        )
        .filter(models.Q(effective_to__isnull=True) | models.Q(effective_to__gte=today))
        .exists()
    )
    binding = MentorBinding.objects.create(
        workspace=workspace,
        mentee=mentee,
        mentor=mentor,
        org_unit=unit,
        is_primary_advisor=not has_primary,
        effective_from=timezone.localdate(),
        created_by=actor,
    )
    return binding, True


def run_import(
    workspace,
    actor,
    rows,
    *,
    advisor_map=None,
    dry_run=False,
    source_filename="",
    request=None,
    reset_passwords=False,
):
    """Import ``rows`` and return the persisted :class:`UserImportBatch`."""
    advisor_map = {_normalise_header(key): value for key, value in (advisor_map or {}).items()}
    if dry_run:
        return preview_import(
            workspace,
            rows,
            advisor_map=advisor_map,
            source_filename=source_filename,
            reset_passwords=reset_passwords,
        )
    batch = UserImportBatch.objects.create(
        workspace=workspace,
        source_filename=str(source_filename or "")[:255],
        dry_run=bool(dry_run),
        status=UserImportBatch.Status.PENDING,
        options={"advisor_mapping_size": len(advisor_map), "reset_passwords": bool(reset_passwords)},
        created_by=actor,
    )

    counts = {"ok": 0, "pending": 0, "error": 0}
    groups = set()
    credentials = 0

    for row in rows:
        outcome = _import_row(
            workspace,
            actor,
            row,
            batch,
            advisor_map,
            dry_run=dry_run,
            reset_passwords=reset_passwords,
        )
        counts[outcome["status"].lower()] += 1
        if outcome.get("group"):
            groups.add(outcome["group"])
        if outcome.get("password"):
            credentials += 1
        UserImportRow.objects.create(
            batch=batch,
            row_number=row.row_number,
            raw=row.raw,
            status=outcome["status"],
            message=outcome.get("message", "")[:255],
            display_name=row.name,
            email=row.email,
            student_no=row.student_no,
            group_label=row.group,
            advisor_name=row.primary_advisor_name,
            user=outcome.get("user"),
            org_unit=outcome.get("unit"),
            initial_password=outcome.get("password", ""),
            created_by=actor,
        )

    batch.rows_total = len(rows)
    batch.rows_ok = counts["ok"]
    batch.rows_pending = counts["pending"]
    batch.rows_error = counts["error"]
    batch.status = (
        UserImportBatch.Status.FAILED
        if counts["error"] and not counts["ok"] and not counts["pending"]
        else UserImportBatch.Status.IMPORTED
    )
    batch.summary = {
        "dry_run": bool(dry_run),
        "groups": sorted(groups),
        "credentials_issued": credentials,
    }
    batch.save()

    if not dry_run:
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.USER_IMPORT,
            resource_type=ResearchResourceType.IMPORT_BATCH,
            resource_id=batch.id,
            actor=actor,
            metadata={
                "source": batch.source_filename,
                "rows": batch.rows_total,
                "ok": batch.rows_ok,
                "pending": batch.rows_pending,
                "error": batch.rows_error,
            },
            request=request,
        )
    return batch


def preview_import(workspace, rows, *, advisor_map=None, source_filename="", reset_passwords=False):
    """Validate an import entirely in memory and return a transient report."""
    advisor_map = {_normalise_header(key): value for key, value in (advisor_map or {}).items()}
    counts = {"ok": 0, "pending": 0, "error": 0}
    groups = set()
    preview_rows = []
    for row in rows:
        outcome = _import_row(
            workspace,
            None,
            row,
            None,
            advisor_map,
            dry_run=True,
            reset_passwords=reset_passwords,
        )
        counts[outcome["status"].lower()] += 1
        if outcome.get("group"):
            groups.add(outcome["group"])
        preview_rows.append(
            ImportPreviewRow(
                row_number=row.row_number,
                raw=row.raw,
                status=outcome["status"],
                message=outcome.get("message", ""),
                display_name=row.name,
                email=row.email,
                student_no=row.student_no,
                group_label=row.group,
                advisor_name=row.primary_advisor_name,
                org_unit=outcome.get("unit"),
            )
        )
    return ImportPreview(
        source_filename=str(source_filename or "")[:255],
        rows=preview_rows,
        rows_total=len(rows),
        rows_ok=counts["ok"],
        rows_pending=counts["pending"],
        rows_error=counts["error"],
        options={"advisor_mapping_size": len(advisor_map), "reset_passwords": bool(reset_passwords)},
        summary={"dry_run": True, "groups": sorted(groups), "credentials_issued": 0},
    )


def _import_row(workspace, actor, row, batch, advisor_map, *, dry_run=False, reset_passwords=False):
    """Import one roster row and describe the outcome."""
    error_code, message = validate_row(row)
    if error_code:
        return {"status": ROW_ERROR, "message": message}

    return _import_roster_row(
        workspace,
        actor,
        row,
        batch,
        advisor_map,
        dry_run=dry_run,
        reset_passwords=reset_passwords,
    )


def _active_mentor_bindings(workspace, user):
    today = timezone.localdate()
    return MentorBinding.objects.filter(
        workspace=workspace,
        mentee=user,
        deleted_at__isnull=True,
        effective_from__lte=today,
    ).filter(models.Q(effective_to__isnull=True) | models.Q(effective_to__gte=today))


def _import_roster_row(
    workspace,
    actor,
    row,
    batch,
    advisor_map,
    *,
    dry_run=False,
    reset_passwords=False,
):
    unit, unit_reason = resolve_team_unit(workspace, row.group, row.business_category)
    mentor_unit = unit
    primary_advisor, co_advisors, pending_reasons = resolve_row_advisors(workspace, row, advisor_map)
    if unit_reason:
        pending_reasons.append(unit_reason)

    existing_user = find_user_for_row(row)

    if existing_user is not None and unit is not None:
        current_primary = OrgUnitMember.objects.filter(
            workspace=workspace,
            user=existing_user,
            is_primary=True,
            deleted_at__isnull=True,
        ).first()
        if current_primary is not None and current_primary.org_unit_id != unit.id:
            pending_reasons.append("已有主归属，未覆盖为导入值")
            mentor_unit = current_primary.org_unit
            unit = None

    if existing_user is not None and primary_advisor is not None:
        current_primary_advisor = _active_mentor_bindings(workspace, existing_user).filter(
            is_primary_advisor=True
        ).first()
        if current_primary_advisor is not None and current_primary_advisor.mentor_id != primary_advisor.id:
            pending_reasons.append("已有主导师，未覆盖为导入值")
            primary_advisor = None

    existing_mentor_ids = set()
    if existing_user is not None:
        existing_mentor_ids = set(
            _active_mentor_bindings(workspace, existing_user).values_list("mentor_id", flat=True)
        )
    requested_advisors = [advisor for advisor in (primary_advisor, *co_advisors) if advisor is not None]
    new_advisors = [advisor for advisor in requested_advisors if advisor.id not in existing_mentor_ids]
    available_slots = max(0, 3 - len(existing_mentor_ids))
    if len(new_advisors) > available_slots:
        allowed_ids = {advisor.id for advisor in new_advisors[:available_slots]}
        if primary_advisor is not None and primary_advisor.id not in existing_mentor_ids | allowed_ids:
            primary_advisor = None
        co_advisors = [
            advisor
            for advisor in co_advisors
            if advisor.id in existing_mentor_ids or advisor.id in allowed_ids
        ]
        pending_reasons.append("有效导师总数最多为3人，超额导师未写入")

    if dry_run:
        return {
            "status": ROW_PENDING if pending_reasons else ROW_OK,
            "message": "；".join(pending_reasons) or "预检通过（未写库）",
            "group": unit.name if unit else "",
            "unit": unit,
        }

    try:
        with transaction.atomic():
            user, _account_created, password = _upsert_user(row, reset_passwords=reset_passwords)
            ensure_workspace_membership(workspace, user, actor)
            if unit is not None:
                _membership, accepted = ensure_v3_primary_membership(workspace, unit, user, actor)
                if not accepted:
                    pending_reasons.append("已有主归属，未覆盖为导入值")
                    unit = None
            _upsert_profile(user, row, unit.name if unit else "", batch, actor)
            if mentor_unit is None and (primary_advisor is not None or co_advisors):
                pending_reasons.append("小组未解析，导师关系未写入")
            elif primary_advisor is not None:
                binding, _created = ensure_mentor_binding(workspace, mentor_unit, user, primary_advisor, actor)
                if not binding.is_primary_advisor:
                    pending_reasons.append("已有主导师，未覆盖为导入值")
            if mentor_unit is not None:
                has_primary_binding = _active_mentor_bindings(workspace, user).filter(
                    is_primary_advisor=True
                ).exists()
                if co_advisors and not has_primary_binding:
                    pending_reasons.append("主导师未解析，联合导师未写入")
                elif has_primary_binding:
                    for co_advisor in co_advisors:
                        ensure_mentor_binding(workspace, mentor_unit, user, co_advisor, actor)
    except (IntegrityError, AccountError) as exc:
        return {"status": ROW_ERROR, "message": str(exc)[:255]}
    except Exception as exc:  # noqa: BLE001 - keep per-row isolation
        return {"status": ROW_ERROR, "message": f"{type(exc).__name__}: {exc}"[:255]}

    return {
        "status": ROW_PENDING if pending_reasons else ROW_OK,
        "message": "；".join(dict.fromkeys(pending_reasons)),
        "group": unit.name if unit else row.group,
        "password": password,
        "user": user,
        "unit": unit,
    }
