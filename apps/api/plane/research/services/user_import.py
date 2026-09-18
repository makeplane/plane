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
import uuid
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
from plane.research.utils.org import build_path, ensure_root_org_unit
from plane.research.utils.roles import WORKSPACE_MEMBER_ROLE

GROUP_UNIT_TYPE = OrgUnit.UnitType.GROUP
STUDENT_ORG_ROLE = OrgUnitMember.OrgRole.REVIEWER
ADVISOR_ORG_ROLE = OrgUnitMember.OrgRole.ADVISOR

HEADER_ALIASES = {
    "group": ("分组", "组别", "方向", "group", "team"),
    "name": ("姓名", "名字", "name", "student"),
    "student_no": ("学号", "学籍号", "student_no", "student no", "student id"),
    "grade": ("年级", "grade", "year"),
    "degree": ("学位", "degree"),
    "advisor": ("负责导师", "导师", "指导老师", "advisor", "mentor", "supervisor"),
    "email": ("邮件", "邮箱", "电子邮箱", "email", "e-mail", "mail"),
    "phone": ("电话", "手机", "手机号", "phone", "mobile", "tel"),
    "category": ("人员类别", "身份类别", "category", "profile_category"),
    "business_category": ("业务方向", "方向类别", "business_category", "business category"),
    "primary_org_unit": ("主归属组织", "主归属", "primary_org_unit", "primary org unit"),
    "primary_advisor_email": ("主导师邮箱", "primary_advisor_email", "primary advisor email"),
    "co_advisor_emails": ("联合导师邮箱", "co_advisor_emails", "co advisor emails"),
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

DEGREE_ALIASES = {
    "ms": ResearchUserProfile.Degree.MS,
    "master": ResearchUserProfile.Degree.MS,
    "硕士": ResearchUserProfile.Degree.MS,
    "硕": ResearchUserProfile.Degree.MS,
    "phd": ResearchUserProfile.Degree.PHD,
    "ph.d": ResearchUserProfile.Degree.PHD,
    "ph.d.": ResearchUserProfile.Degree.PHD,
    "doctor": ResearchUserProfile.Degree.PHD,
    "博士": ResearchUserProfile.Degree.PHD,
    "博": ResearchUserProfile.Degree.PHD,
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
    degree: str = ""
    phone: str = ""
    group: str = ""
    advisor: str = ""
    category: str = ""
    business_category: str = ""
    primary_org_unit: str = ""
    primary_advisor_email: str = ""
    co_advisor_emails: tuple[str, ...] = ()
    raw: dict = field(default_factory=dict)

    @property
    def is_v3(self):
        return any(
            (self.category, self.business_category, self.primary_org_unit, self.primary_advisor_email, self.co_advisor_emails)
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


def _map_headers(header_row):
    """Return ``{field: column_index}`` for the aliases present in the sheet."""
    mapping = {}
    normalised = [_normalise_header(cell) for cell in header_row]
    for field_name, aliases in HEADER_ALIASES.items():
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


def normalise_degree(value):
    """Map the roster's degree wording onto the enum, or return ""."""
    return DEGREE_ALIASES.get(_normalise_header(value), "")


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


def split_emails(value):
    return tuple(dict.fromkeys(item.strip().lower() for item in re.split(r"[;,；，]", str(value or "")) if item.strip()))


def parse_students(payload, filename=""):
    """Parse the student roster into :class:`StudentRow` objects."""
    rows = sheet_rows(payload, filename)
    if not rows:
        raise AccountError(ResearchErrorCode.IMPORT_FILE_INVALID, "The roster is empty.")

    mapping = _map_headers(rows[0])
    if "name" not in mapping or "email" not in mapping:
        raise AccountError(
            ResearchErrorCode.IMPORT_FILE_INVALID,
            "The header row must contain at least the 姓名 and 邮件 columns.",
        )

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
        students.append(
            StudentRow(
                row_number=index,
                name=cell(row, "name"),
                email=cell(row, "email").lower(),
                student_no=cell(row, "student_no"),
                grade=cell(row, "grade"),
                degree=normalise_degree(cell(row, "degree")) or cell(row, "degree"),
                phone=cell(row, "phone"),
                group=cell(row, "group"),
                advisor=cell(row, "advisor"),
                category=normalise_category(cell(row, "category")) or cell(row, "category"),
                business_category=normalise_business_category(cell(row, "business_category"))
                or cell(row, "business_category"),
                primary_org_unit=cell(row, "primary_org_unit"),
                primary_advisor_email=cell(row, "primary_advisor_email").lower(),
                co_advisor_emails=split_emails(cell(row, "co_advisor_emails")),
                raw={field_name: cell(row, field_name) for field_name in HEADER_ALIASES},
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

    mapping = _map_headers(rows[0])
    # The advisor table may use 姓名/name or 导师/advisor for the first column.
    name_key = "name" if "name" in mapping else ("advisor" if "advisor" in mapping else None)
    if name_key is None or "email" not in mapping:
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
        name = cell(row, name_key)
        email = cell(row, "email").lower()
        if not name or not email:
            continue
        advisors[_normalise_header(name)] = email
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


def ensure_group_unit(workspace, label, actor=None, dry_run=False):
    """Return the GROUP node for ``label`` under the workspace root."""
    root = ensure_root_org_unit(workspace, actor=actor)
    label = str(label or "").strip()
    if not label:
        return root, False
    unit = OrgUnit.objects.filter(
        workspace=workspace, parent=root, name=label, deleted_at__isnull=True
    ).first()
    if unit is not None or dry_run:
        return (unit or root), unit is None
    unit = OrgUnit(
        workspace=workspace,
        parent=root,
        name=label,
        unit_type=GROUP_UNIT_TYPE,
        depth=root.depth + 1,
        path="",
        created_by=actor,
    )
    unit.path = build_path(unit.id, root.path)
    unit.save()
    return unit, True


def resolve_existing_org_unit(workspace, reference):
    """Resolve a v3 primary organisation by UUID or its full display path."""
    reference = str(reference or "").strip()
    if not reference:
        return None
    try:
        unit_id = uuid.UUID(reference)
    except (TypeError, ValueError):
        unit_id = None
    queryset = OrgUnit.objects.filter(workspace=workspace, is_active=True, deleted_at__isnull=True)
    if unit_id is not None:
        return queryset.filter(pk=unit_id).first()
    parts = [item.strip() for item in re.split(r"\s*(?:/|>|＞)\s*", reference) if item.strip()]
    candidates = list(queryset.filter(name=parts[-1]).select_related("parent")) if parts else []
    for candidate in candidates:
        names = []
        current = candidate
        while current is not None:
            names.append(current.name)
            current = current.parent
        if list(reversed(names)) == parts:
            return candidate
    return None


def resolve_existing_advisor(workspace, email):
    return User.objects.filter(
        email__iexact=email,
        is_active=True,
        member_workspace__workspace=workspace,
        member_workspace__is_active=True,
        member_workspace__deleted_at__isnull=True,
    ).first()


def v3_row_context(workspace, row):
    """Return resolved v3 relations and human-readable pending reasons."""
    unit = resolve_existing_org_unit(workspace, row.primary_org_unit)
    reasons = []
    if row.primary_org_unit and unit is None:
        reasons.append(f"主归属组织不存在：{row.primary_org_unit}")
    if unit is not None and row.business_category:
        lineage_categories = set()
        current = unit
        while current is not None:
            if current.business_category:
                lineage_categories.add(current.business_category)
            current = current.parent
        if row.business_category not in lineage_categories:
            reasons.append("业务方向与主归属组织不一致")

    primary_advisor = None
    if row.primary_advisor_email:
        primary_advisor = resolve_existing_advisor(workspace, row.primary_advisor_email)
        if primary_advisor is None:
            reasons.append(f"主导师不是当前工作空间有效成员：{row.primary_advisor_email}")
    co_advisors = []
    for email in row.co_advisor_emails:
        advisor = resolve_existing_advisor(workspace, email)
        if advisor is None:
            reasons.append(f"联合导师不是当前工作空间有效成员：{email}")
        else:
            co_advisors.append(advisor)
    return unit, primary_advisor, co_advisors, reasons


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
    if not _valid_email(row.email):
        return ResearchErrorCode.IMPORT_ROW_INVALID, f"{row.email} is not a valid mailbox."
    if row.degree and row.degree not in ResearchUserProfile.Degree.values:
        return ResearchErrorCode.IMPORT_ROW_INVALID, f"Unknown degree '{row.degree}'."
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
    for advisor_email in (row.primary_advisor_email, *row.co_advisor_emails):
        if advisor_email and not _valid_email(advisor_email):
            return ResearchErrorCode.IMPORT_ROW_INVALID, f"{advisor_email} is not a valid advisor mailbox."
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
            degree=row.degree,
            phone=row.phone,
            category=row.category or ResearchUserProfile.Category.STUDENT,
            group_label=group_label,
            source_batch=batch,
            created_by=actor,
        )
    updates = {
        "student_no": row.student_no or profile.student_no,
        "grade": row.grade or profile.grade,
        "degree": row.degree or profile.degree,
        "phone": row.phone or profile.phone,
        "group_label": group_label or profile.group_label,
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


def resolve_advisor(workspace, name, advisor_map, unit, actor):
    """Return ``(advisor_user, created)`` or ``(None, False)`` when unmapped."""
    key = _normalise_header(name)
    if not key:
        return None, False
    email = advisor_map.get(key)
    if not email or not _valid_email(email):
        return None, False

    advisor = User.objects.filter(email__iexact=email).first()
    created = advisor is None
    if created:
        advisor = User(
            email=email,
            username=email,
            first_name=name,
            display_name=name,
            is_active=True,
        )
        advisor.set_unusable_password()
        advisor.save()

    if ResearchUserProfile.objects.filter(user=advisor).first() is None:
        ResearchUserProfile.objects.create(
            user=advisor,
            category=ResearchUserProfile.Category.ADVISOR,
            created_by=actor,
        )

    ensure_workspace_membership(workspace, advisor, actor)
    ensure_org_membership(workspace, unit, advisor, ADVISOR_ORG_ROLE, actor)
    return advisor, created


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
            advisor_name=row.advisor,
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
                advisor_name=row.advisor,
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

    if row.is_v3:
        return _import_v3_row(
            workspace,
            actor,
            row,
            batch,
            dry_run=dry_run,
            reset_passwords=reset_passwords,
        )

    if dry_run:
        root = OrgUnit.objects.filter(
            workspace=workspace,
            unit_type=OrgUnit.UnitType.ROOT,
            deleted_at__isnull=True,
        ).first()
        unit = None
        if root is not None:
            unit = (
                OrgUnit.objects.filter(
                    workspace=workspace,
                    parent=root,
                    name=row.group,
                    deleted_at__isnull=True,
                ).first()
                if row.group
                else root
            )
        if row.advisor and _normalise_header(row.advisor) not in advisor_map:
            return {
                "status": ROW_PENDING,
                "message": f"缺少导师邮箱映射：{row.advisor}",
                "group": row.group,
                "unit": unit,
            }
        if not row.group:
            return {
                "status": ROW_PENDING,
                "message": "分组为空，将挂到根节点",
                "group": row.group,
                "unit": unit,
            }
        return {"status": ROW_OK, "message": "预检通过（未写库）", "group": row.group, "unit": unit}

    try:
        with transaction.atomic():
            unit, _unit_created = ensure_group_unit(workspace, row.group, actor=actor)
            user, _account_created, password = _upsert_user(row, reset_passwords=reset_passwords)
            ensure_workspace_membership(workspace, user, actor)
            ensure_org_membership(workspace, unit, user, STUDENT_ORG_ROLE, actor)
            _upsert_profile(user, row, row.group, batch, actor)

            advisor_user = None
            if row.advisor:
                advisor_user, _advisor_created = resolve_advisor(
                    workspace, row.advisor, advisor_map, unit, actor
                )
            if advisor_user is not None:
                ensure_mentor_binding(workspace, unit, user, advisor_user, actor)
    except (IntegrityError, AccountError) as exc:
        return {"status": ROW_ERROR, "message": str(exc)[:255]}
    except Exception as exc:  # noqa: BLE001 - per-row isolation is the point
        return {"status": ROW_ERROR, "message": f"{type(exc).__name__}: {exc}"[:255]}

    pending_reasons = []
    if row.advisor and advisor_user is None:
        pending_reasons.append(f"缺少导师邮箱映射：{row.advisor}")
    if not row.group:
        pending_reasons.append("分组为空，已挂到根节点")

    return {
        "status": ROW_PENDING if pending_reasons else ROW_OK,
        "message": "；".join(pending_reasons),
        "group": row.group,
        "password": password,
        "user": user,
        "unit": unit,
    }


def _import_v3_row(workspace, actor, row, batch, *, dry_run=False, reset_passwords=False):
    unit, primary_advisor, co_advisors, pending_reasons = v3_row_context(workspace, row)
    existing_user = find_user_for_row(row)
    if unit is None and not row.primary_org_unit:
        pending_reasons.append("未指定主归属组织")

    if existing_user is not None and unit is not None:
        current_primary = OrgUnitMember.objects.filter(
            workspace=workspace,
            user=existing_user,
            is_primary=True,
            deleted_at__isnull=True,
        ).first()
        if current_primary is not None and current_primary.org_unit_id != unit.id:
            pending_reasons.append("已有主归属，未覆盖为导入值")
            unit = None

    if existing_user is not None and primary_advisor is not None:
        today = timezone.localdate()
        current_primary_advisor = (
            MentorBinding.objects.filter(
                workspace=workspace,
                mentee=existing_user,
                is_primary_advisor=True,
                deleted_at__isnull=True,
                effective_from__lte=today,
            )
            .filter(models.Q(effective_to__isnull=True) | models.Q(effective_to__gte=today))
            .first()
        )
        if current_primary_advisor is not None and current_primary_advisor.mentor_id != primary_advisor.id:
            pending_reasons.append("已有主导师，未覆盖为导入值")
            primary_advisor = None

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
            if primary_advisor is not None:
                binding, _created = ensure_mentor_binding(workspace, unit, user, primary_advisor, actor)
                if not binding.is_primary_advisor:
                    pending_reasons.append("已有主导师，导入导师保留为联合导师")
            for co_advisor in co_advisors:
                ensure_mentor_binding(workspace, unit, user, co_advisor, actor)
    except (IntegrityError, AccountError) as exc:
        return {"status": ROW_ERROR, "message": str(exc)[:255]}
    except Exception as exc:  # noqa: BLE001 - keep per-row isolation
        return {"status": ROW_ERROR, "message": f"{type(exc).__name__}: {exc}"[:255]}

    return {
        "status": ROW_PENDING if pending_reasons else ROW_OK,
        "message": "；".join(dict.fromkeys(pending_reasons)),
        "group": unit.name if unit else "",
        "password": password,
        "user": user,
        "unit": unit,
    }
