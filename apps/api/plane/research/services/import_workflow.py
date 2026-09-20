"""Reviewable single-person provisioning and conservative import reconciliation."""

import hashlib
import json
from uuid import UUID

from django.db import models, transaction
from django.utils import timezone

from plane.db.models import (
    MentorBinding,
    OrgUnit,
    OrgUnitMember,
    ResearchUserProfile,
    User,
    UserImportBatch,
    WorkspaceMember,
)
from plane.research.services.accounts import AccountError
from plane.research.services import user_import as imports
from plane.research.utils.audit import ResearchAuditAction, ResearchResourceType, record_audit_event
from plane.research.utils.errors import ResearchErrorCode


def invalid(message):
    raise AccountError(ResearchErrorCode.IMPORT_ROW_INVALID, message)


def unit_path(unit):
    return " / ".join(item.name for item in imports._unit_lineage(unit))


def active(query):
    today = timezone.localdate()
    return query.filter(deleted_at__isnull=True, effective_from__lte=today).filter(
        models.Q(effective_to__isnull=True) | models.Q(effective_to__gte=today)
    )


def get_unit(workspace, value):
    try:
        unit_id = UUID(str(value))
    except (ValueError, TypeError, AttributeError):
        invalid("请选择有效的组织。")
    unit = OrgUnit.objects.filter(workspace=workspace, pk=unit_id, is_active=True).first()
    if unit is None:
        invalid("组织不存在或已停用。")
    return unit


def batch_for(workspace, batch_id):
    batch = UserImportBatch.objects.filter(workspace=workspace, pk=batch_id).first()
    if batch is None:
        raise AccountError(ResearchErrorCode.IMPORT_BATCH_NOT_FOUND, "找不到导入批次。")
    return batch


@transaction.atomic
def create_single(workspace, actor, payload):
    category = payload.get("category")
    if category not in ("STUDENT", "ADVISOR"):
        invalid("单条录入仅支持学生和导师。")
    unit = get_unit(workspace, payload.get("org_unit"))
    if category == "STUDENT" and unit.unit_type != "TEAM":
        invalid("学生主归属必须为小组。")
    advisors = payload.get("advisors", [])
    if not isinstance(advisors, list) or len(advisors) > 3 or any(not isinstance(item, dict) for item in advisors):
        invalid("最多选择一名主导师和两名联合导师。")
    if category == "ADVISOR" and advisors:
        invalid("导师录入不需要指定主导师。")
    if category == "STUDENT" and not advisors:
        invalid("请选择主导师。")
    fields = {
        key: str(payload.get(key) or "").strip()
        for key in (
            "display_name",
            "email",
            "student_no",
            "phone",
            "grade",
            "degree",
            "review_note",
        )
    }
    limits = {
        "display_name": 255,
        "email": 255,
        "student_no": 64,
        "phone": 32,
        "grade": 16,
        "degree": 8,
        "review_note": 500,
    }
    if any(len(fields[key]) > limit for key, limit in limits.items()):
        invalid("录入字段超过允许长度。")
    if fields["degree"] not in ("", "MS", "PHD"):
        invalid("请选择有效学位。")
    names, emails = [], []
    for item in advisors:
        user = None
        if item.get("id"):
            try:
                user_id = UUID(str(item["id"]))
            except ValueError:
                invalid("导师标识无效。")
            user = User.objects.filter(
                pk=user_id,
                is_active=True,
                member_workspace__workspace=workspace,
                member_workspace__is_active=True,
                member_workspace__deleted_at__isnull=True,
            ).first()
            if user is None:
                invalid("导师不是当前工作区有效成员。")
        name = user.display_name or user.first_name if user else str(item.get("name") or "").strip()
        email = user.email if user else str(item.get("email") or "").strip().lower()
        if not name or len(name) > 255 or not imports._valid_email(email):
            invalid("请填写导师姓名和有效邮箱。")
        names.append(name)
        emails.append(email)
    names += [""] * (3 - len(names))
    emails += [""] * (3 - len(emails))
    row = imports.StudentRow(
        row_number=1,
        name=fields["display_name"],
        email=fields["email"].lower(),
        student_no=fields["student_no"],
        phone=fields["phone"],
        grade=fields["grade"],
        degree=fields["degree"],
        category=category,
        group=unit_path(unit),
        business_category=unit.business_category or "",
        primary_advisor_name=names[0],
        co_advisor_1_name=names[1],
        co_advisor_2_name=names[2],
        advisor_emails=tuple(emails),
        raw={"org_unit_id": str(unit.id)},
    )
    batch = imports.create_review_batch(workspace, actor, [row], source_filename=f"单条录入 · {row.name}")
    batch.options = {**batch.options, "source": "single"}
    batch.save()
    saved = batch.rows.get()
    saved.primary_advisor_email, saved.co_advisor_1_email, saved.co_advisor_2_email = emails
    saved.review_note = fields["review_note"]
    imports.validate_review_row(workspace, saved).save()
    imports._refresh_batch_counts(batch)
    return batch


def import_advisor_row(workspace, actor, row, batch, *, dry_run=False):
    unit = None
    if row.raw.get("org_unit_id"):
        unit = get_unit(workspace, row.raw["org_unit_id"])
    else:
        candidates = [
            item
            for item in OrgUnit.objects.filter(workspace=workspace, is_active=True).select_related("parent")
            if unit_path(item) == row.group or item.name == row.group
        ]
        unit = candidates[0] if len(candidates) == 1 else None
        if not unit:
            return {"status": "PENDING", "message": "请选择有效且唯一的组织完整路径。"}
    existing = imports.find_user_for_row(row)
    if existing:
        primary = active(OrgUnitMember.objects.filter(workspace=workspace, user=existing, is_primary=True)).first()
        if primary and primary.org_unit_id != unit.id:
            return {"status": "PENDING", "message": "已有其他主归属，请在成员管理中处理。", "unit": unit}
    if dry_run:
        return {"status": "OK", "message": "校验通过（未创建账号和关系）", "unit": unit}
    user, _, password = imports._upsert_user(row)
    imports.ensure_workspace_membership(workspace, user, actor)
    imports._upsert_profile(user, row, unit.name, batch, actor)
    membership = ensure_advisor_membership(workspace, unit, user, actor)
    if not active(OrgUnitMember.objects.filter(workspace=workspace, user=user, is_primary=True)).exists():
        membership.is_primary = True
        membership.save(update_fields=["is_primary", "updated_at"])
    return {"status": "OK", "message": "", "unit": unit, "user": user, "password": password}


def ensure_advisor_membership(workspace, unit, user, actor):
    membership = active(
        OrgUnitMember.objects.filter(workspace=workspace, org_unit=unit, user=user, org_role="ADVISOR")
    ).first()
    if membership:
        return membership
    if OrgUnitMember.all_objects.filter(workspace=workspace, org_unit=unit, user=user, org_role="ADVISOR").exists():
        invalid("导师在该组织存在已结束或已删除角色，请人工处理。")
    return OrgUnitMember.objects.create(
        workspace=workspace,
        org_unit=unit,
        user=user,
        org_role="ADVISOR",
        is_primary=False,
        effective_from=timezone.localdate(),
        created_by=actor,
    )


def state_token(workspace, batch):
    # Covers edits and external changes to identities, memberships and relationships.
    state = {
        "batch": [str(batch.id), batch.status, batch.options, batch.advisor_mapping],
        "rows": list(batch.rows.order_by("id").values()),
    }
    for model in (OrgUnit, OrgUnitMember, MentorBinding, WorkspaceMember):
        state[model.__name__] = list(model.all_objects.filter(workspace=workspace).order_by("id").values())
    emails = set()
    for row in state["rows"]:
        emails.update(
            row[key]
            for key in ("email", "primary_advisor_email", "co_advisor_1_email", "co_advisor_2_email")
            if row[key]
        )
    state["users"] = list(
        User.objects.filter(email__in=emails)
        .order_by("id")
        .values("id", "email", "display_name", "is_active", "updated_at")
    )
    state["profiles"] = list(ResearchUserProfile.objects.filter(user__email__in=emails).order_by("id").values())
    state["date"] = timezone.localdate().isoformat()
    return hashlib.sha256(json.dumps(state, sort_keys=True, default=str).encode()).hexdigest()


def approval_preview(workspace, batch):
    included, excluded, advisors, blockers = [], [], {}, []
    if batch.status != "PENDING_REVIEW":
        blockers.append("当前批次不在待审批状态。")
    rows = list(batch.rows.select_related("org_unit").order_by("row_number"))
    for row in rows:
        if row.review_decision == "PENDING":
            blockers.append(f"第 {row.row_number} 行尚未审核")
        item = {
            "id": str(row.id),
            "name": row.display_name,
            "email": row.email,
            "category": row.category,
            "org_unit": str(row.org_unit_id) if row.org_unit_id else None,
            "org_path": unit_path(row.org_unit) if row.org_unit else row.group_label,
            "advisors": [],
        }
        if row.review_decision == "EXCLUDED":
            excluded.append(item)
            continue
        if row.review_decision != "INCLUDED":
            continue
        imports.validate_review_row(workspace, row)
        if row.status != "OK":
            blockers.append(f"{row.display_name}：{row.message}")
        user = User.objects.filter(email__iexact=row.email).first()
        item["account_action"] = "JOIN_WORKSPACE" if user else "CREATE"
        for index, (name, email) in enumerate(
            (
                (row.advisor_name, row.primary_advisor_email),
                (row.co_advisor_1_name, row.co_advisor_1_email),
                (row.co_advisor_2_name, row.co_advisor_2_email),
            )
        ):
            if not name:
                continue
            mentor = User.objects.filter(email__iexact=email).first()
            member = (
                mentor and WorkspaceMember.objects.filter(workspace=workspace, member=mentor, is_active=True).exists()
            )
            primary = (
                active(OrgUnitMember.objects.filter(workspace=workspace, user=mentor, is_primary=True)).first()
                if mentor
                else None
            )
            advisor = advisors.setdefault(
                email,
                {
                    "name": mentor.display_name or name if mentor else name,
                    "email": email,
                    "account_action": "REFERENCE" if member else "JOIN_WORKSPACE" if mentor else "CREATE",
                    "groups": [],
                    "primary_org": str(primary.org_unit_id)
                    if primary
                    else batch.options.get("advisor_primary_orgs", {}).get(email),
                    "primary_locked": bool(primary),
                },
            )
            if row.org_unit_id and item["org_unit"] not in [g["id"] for g in advisor["groups"]]:
                advisor["groups"].append({"id": item["org_unit"], "name": item["org_path"]})
            role_exists = bool(
                mentor
                and active(
                    OrgUnitMember.objects.filter(
                        workspace=workspace, user=mentor, org_unit_id=row.org_unit_id, org_role="ADVISOR"
                    )
                ).exists()
            )
            binding_exists = bool(
                mentor
                and user
                and active(MentorBinding.objects.filter(workspace=workspace, mentee=user, mentor=mentor)).exists()
            )
            item["advisors"].append(
                {
                    "name": advisor["name"],
                    "email": email,
                    "primary": index == 0,
                    "membership_action": "KEEP" if role_exists else "CREATE",
                    "binding_action": "KEEP" if binding_exists else "CREATE",
                }
            )
            if (
                mentor
                and not role_exists
                and OrgUnitMember.all_objects.filter(
                    workspace=workspace, user=mentor, org_unit_id=row.org_unit_id, org_role="ADVISOR"
                ).exists()
            ):
                blockers.append(f"{name} 的小组角色已结束或删除，请人工处理")
        included.append(item)
    if not included:
        blockers.append("没有可导入人员。")
    for email, unit_id in batch.options.get("advisor_primary_orgs", {}).items():
        if email not in advisors:
            continue
        try:
            unit = get_unit(workspace, unit_id)
            if advisors[email]["primary_locked"] and advisors[email]["primary_org"] != str(unit.id):
                blockers.append("导师主归属已变化，请重新核对。")
        except AccountError as exc:
            blockers.append(exc.message)
    return {
        "token": state_token(workspace, batch),
        "included": included,
        "excluded": excluded,
        "advisors": list(advisors.values()),
        "blockers": list(dict.fromkeys(blockers)),
    }


@transaction.atomic
def save_primary_choices(workspace, batch, choices):
    batch = UserImportBatch.objects.select_for_update().get(pk=batch.pk, workspace=workspace)
    if batch.status != "PENDING_REVIEW" or not isinstance(choices, dict):
        invalid("该批次不能修改审核选项。")
    preview = approval_preview(workspace, batch)
    known = {item["email"]: item for item in preview["advisors"]}
    selected = {}
    for email, unit_id in choices.items():
        if email not in known:
            invalid("导师不在已纳入名单中。")
        if not unit_id:
            continue
        unit = get_unit(workspace, unit_id)
        advisor = known[email]
        if advisor["primary_locked"] and advisor["primary_org"] != str(unit.id):
            invalid("已有导师主归属不能被导入覆盖。")
        selected[email] = str(unit.id)
    batch.options = {**batch.options, "advisor_primary_orgs": selected}
    batch.save()
    return approval_preview(workspace, batch)


def apply_advisor_primary_orgs(workspace, actor, batch):
    referenced = {
        email
        for row in batch.rows.filter(review_decision="INCLUDED")
        for email in (row.primary_advisor_email, row.co_advisor_1_email, row.co_advisor_2_email)
        if email
    }
    for email, unit_id in batch.options.get("advisor_primary_orgs", {}).items():
        if email not in referenced:
            continue
        user = imports.resolve_existing_advisor(workspace, email)
        if not user:
            invalid("导师账号不可用。")
        unit = get_unit(workspace, unit_id)
        primary = active(OrgUnitMember.objects.filter(workspace=workspace, user=user, is_primary=True)).first()
        if primary:
            if primary.org_unit_id != unit.id:
                invalid("导师主归属已变化，请重新确认。")
            continue
        membership = ensure_advisor_membership(workspace, unit, user, actor)
        membership.is_primary = True
        membership.save(update_fields=["is_primary", "updated_at"])


def relation_preview(workspace, batch):
    if batch.status != "IMPORTED":
        invalid("只能检查已审批导入的批次。")
    items = {}

    def add(kind, row, user, mentor=None, primary=False):
        key = f"{kind}:{row.org_unit_id}:{user.pk if user else row.email}:{mentor.pk if mentor else ''}"
        item = {
            "id": key,
            "kind": kind,
            "name": user.display_name if user else row.display_name,
            "email": user.email if user else row.email,
            "user": str(user.pk) if user else None,
            "mentor": str(mentor.pk) if mentor else None,
            "mentor_name": mentor.display_name if mentor else "",
            "org_unit": str(row.org_unit_id) if row.org_unit_id else None,
            "org_path": unit_path(row.org_unit) if row.org_unit else row.group_label,
            "primary": primary,
            "status": "missing",
            "reason": "",
        }
        if not user or not user.is_active or not row.org_unit or not row.org_unit.is_active or row.org_unit.deleted_at:
            item.update(status="conflict", reason="账号或组织失效，需要人工处理")
        elif not WorkspaceMember.objects.filter(workspace=workspace, member=user, is_active=True).exists():
            item.update(status="conflict", reason="人员已不在当前工作区")
        else:
            if kind == "BINDING":
                query = MentorBinding.all_objects.filter(workspace=workspace, mentee=user, mentor=mentor)
                current = active(query).first()
                if current:
                    item.update(
                        status="present"
                        if current.org_unit_id == row.org_unit_id and current.is_primary_advisor == primary
                        else "conflict",
                        reason="已有指导关系",
                    )
                elif query.exists():
                    item.update(status="conflict", reason="该指导关系曾被删除或已结束")
                elif (
                    primary
                    and active(
                        MentorBinding.objects.filter(workspace=workspace, mentee=user, is_primary_advisor=True)
                    ).exists()
                ):
                    item.update(status="conflict", reason="已有其他主导师")
                elif active(MentorBinding.objects.filter(workspace=workspace, mentee=user)).count() >= 3:
                    item.update(status="conflict", reason="有效导师已达到三名")
                if (
                    not mentor
                    or not mentor.is_active
                    or not WorkspaceMember.objects.filter(workspace=workspace, member=mentor, is_active=True).exists()
                ):
                    item.update(status="conflict", reason="导师已失效或不在工作区")
            else:
                role = "ADVISOR" if kind == "ADVISOR_ROLE" or row.category == "ADVISOR" else imports.STUDENT_ORG_ROLE
                query = OrgUnitMember.all_objects.filter(
                    workspace=workspace, org_unit_id=row.org_unit_id, user=user, org_role=role
                )
                current = active(query).first()
                if current:
                    item.update(
                        status="present" if kind == "ADVISOR_ROLE" or current.is_primary else "conflict",
                        reason="已有组织成员关系",
                    )
                elif query.exists():
                    item.update(status="conflict", reason="该组织关系曾被删除或已结束")
                elif (
                    kind == "PRIMARY"
                    and active(OrgUnitMember.objects.filter(workspace=workspace, user=user, is_primary=True)).exists()
                ):
                    item.update(status="conflict", reason="已有其他主归属")
        items[key] = item

    for row in batch.rows.filter(review_decision="INCLUDED").select_related("user", "org_unit"):
        add("PRIMARY", row, row.user)
        for index, email in enumerate((row.primary_advisor_email, row.co_advisor_1_email, row.co_advisor_2_email)):
            if not email:
                continue
            mentor = User.objects.filter(email__iexact=email).first()
            add("ADVISOR_ROLE", row, mentor)
            add("BINDING", row, row.user, mentor, index == 0)
    return {"token": state_token(workspace, batch), "items": list(items.values())}


@transaction.atomic
def repair_relations(workspace, actor, batch, token, item_ids, request=None):
    imports._acquire_import_lock(workspace)
    batch = UserImportBatch.objects.select_for_update().get(pk=batch.pk, workspace=workspace)
    preview = relation_preview(workspace, batch)
    if (
        not isinstance(item_ids, list)
        or not item_ids
        or len(item_ids) > 5000
        or any(not isinstance(value, str) for value in item_ids)
    ):
        invalid("请选择需要补齐的关系。")
    by_id = {item["id"]: item for item in preview["items"]}
    if any(key not in by_id or by_id[key]["status"] == "conflict" for key in item_ids):
        invalid("关系存在冲突，请重新检查。")
    selected = [by_id[key] for key in set(item_ids) if by_id[key]["status"] == "missing"]
    if selected and token != preview["token"]:
        raise AccountError(ResearchErrorCode.IMPORT_REVIEW_INCOMPLETE, "关系已变化，请重新检查。")
    for item in sorted(selected, key=lambda item: (item["kind"] == "BINDING", not item["primary"])):
        if item["kind"] == "BINDING":
            primary = active(
                OrgUnitMember.objects.filter(workspace=workspace, user_id=item["user"], is_primary=True)
            ).first()
            if not primary or str(primary.org_unit_id) != item["org_unit"]:
                invalid("请先补齐学生的主归属，再补齐师生关系。")
            MentorBinding.objects.create(
                workspace=workspace,
                mentee_id=item["user"],
                mentor_id=item["mentor"],
                org_unit_id=item["org_unit"],
                is_primary_advisor=item["primary"],
                effective_from=timezone.localdate(),
                created_by=actor,
            )
        else:
            is_advisor = (
                item["kind"] == "ADVISOR_ROLE"
                or ResearchUserProfile.objects.filter(user_id=item["user"], category="ADVISOR").exists()
            )
            OrgUnitMember.objects.create(
                workspace=workspace,
                user_id=item["user"],
                org_unit_id=item["org_unit"],
                org_role="ADVISOR" if is_advisor else imports.STUDENT_ORG_ROLE,
                is_primary=item["kind"] == "PRIMARY",
                effective_from=timezone.localdate(),
                created_by=actor,
            )
    record_audit_event(
        workspace=workspace,
        action=ResearchAuditAction.USER_IMPORT,
        resource_type=ResearchResourceType.IMPORT_BATCH,
        resource_id=batch.id,
        actor=actor,
        metadata={"operation": "repair_import_relations", "relations": selected},
        request=request,
    )
    return relation_preview(workspace, batch)
