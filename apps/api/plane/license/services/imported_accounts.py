# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

"""Safe lifecycle operations for accounts first created by roster imports."""

from django.db import transaction
from django.utils import timezone
from uuid import UUID

from plane.db.models import ResearchAuditEvent, User, UserImportAccountSource, Workspace, WorkspaceMember
from plane.license.models import InstanceAdmin, InstanceRoleAssignment


class ImportedAccountError(Exception):
    def __init__(self, code, message):
        self.code = code
        self.message = message
        super().__init__(message)


def _failure(user_id, code, message):
    return {"id": str(user_id), "code": code, "reason": message}


def _uuid(value, code="INVALID_ID"):
    try:
        return UUID(str(value))
    except (TypeError, ValueError, AttributeError) as exc:
        raise ImportedAccountError(code, "A valid UUID is required.") from exc


def _protected_reason(user, actor):
    if user.id == actor.id:
        return "CURRENT_OPERATOR", "The current operator cannot be deactivated."
    if InstanceAdmin.objects.filter(user=user).exists():
        return "INSTANCE_ADMIN", "Instance administrators cannot be deactivated."
    if InstanceRoleAssignment.objects.filter(user=user, deleted_at__isnull=True).exists():
        return "REQUIRED_ADMIN_ROLE", "Remove the account's administrator responsibilities first."
    if Workspace.objects.filter(owner=user, deleted_at__isnull=True).exists() or WorkspaceMember.objects.filter(
        member=user,
        role__gte=20,
        is_active=True,
        deleted_at__isnull=True,
    ).exists():
        return "WORKSPACE_ADMIN", "Transfer the account's workspace administration duties first."
    return None


def _audit(source, actor, action, metadata):
    return ResearchAuditEvent.objects.create(
        workspace=source.batch.workspace,
        actor=actor,
        action=action,
        resource_type="user",
        resource_id=source.user_id,
        metadata=metadata,
    )


@transaction.atomic
def deactivate_imported_account(user_id, actor):
    user_id = _uuid(user_id)
    user = User.objects.select_for_update().filter(pk=user_id).first()
    if user is None:
        raise ImportedAccountError("NOT_FOUND", "User not found.")
    source = UserImportAccountSource.objects.select_for_update().select_related("batch").filter(user=user).first()
    if source is None:
        raise ImportedAccountError("NOT_IMPORTED", "Only import-created accounts can be deactivated here.")
    protected = _protected_reason(user, actor)
    if protected:
        raise ImportedAccountError(*protected)
    if not user.is_active and source.deactivated_at is not None:
        return {"id": str(user.id), "status": "SKIPPED", "reason": "ALREADY_INACTIVE"}

    membership_ids = list(
        WorkspaceMember.objects.filter(member=user, is_active=True, deleted_at__isnull=True)
        .values_list("id", flat=True)
    )
    WorkspaceMember.objects.filter(id__in=membership_ids).update(is_active=False, updated_by=actor)
    user.is_active = False
    user.last_logout_time = timezone.now()
    user.save(update_fields=["is_active", "last_logout_time", "updated_at"])
    source.deactivated_workspace_ids = [str(item) for item in membership_ids]
    source.deactivated_at = timezone.now()
    source.deactivated_by = actor
    source.save()
    _audit(source, actor, "account.import.deactivate", {"workspace_memberships": len(membership_ids)})
    return {"id": str(user.id), "status": "DEACTIVATED"}


@transaction.atomic
def reactivate_imported_account(user_id, actor):
    user_id = _uuid(user_id)
    user = User.objects.select_for_update().filter(pk=user_id).first()
    if user is None:
        raise ImportedAccountError("NOT_FOUND", "User not found.")
    source = UserImportAccountSource.objects.select_for_update().select_related("batch").filter(user=user).first()
    if source is None:
        raise ImportedAccountError("NOT_IMPORTED", "Only import-created accounts can be reactivated here.")
    if user.is_active:
        return {"id": str(user.id), "status": "SKIPPED", "reason": "ALREADY_ACTIVE"}

    ids = [item for item in source.deactivated_workspace_ids if item]
    WorkspaceMember.all_objects.filter(id__in=ids, member=user, deleted_at__isnull=True).update(
        is_active=True,
        updated_by=actor,
    )
    user.is_active = True
    user.last_logout_time = None
    user.save(update_fields=["is_active", "last_logout_time", "updated_at"])
    source.deactivated_workspace_ids = []
    source.deactivated_at = None
    source.deactivated_by = None
    source.save()
    _audit(source, actor, "account.import.reactivate", {"workspace_memberships": len(ids)})
    return {"id": str(user.id), "status": "REACTIVATED"}


def deactivate_imported_accounts(user_ids, actor):
    result = {"success": [], "skipped": [], "failed": []}
    for user_id in dict.fromkeys(str(item) for item in user_ids if item):
        try:
            item = deactivate_imported_account(user_id, actor)
        except ImportedAccountError as exc:
            result["failed"].append(_failure(user_id, exc.code, exc.message))
        else:
            target = "skipped" if item["status"] == "SKIPPED" else "success"
            result[target].append(item)
    return result


def clear_imported_accounts(actor, batch_id=None):
    sources = UserImportAccountSource.objects.select_related("user").order_by("created_at")
    if batch_id:
        sources = sources.filter(batch_id=_uuid(batch_id, "INVALID_BATCH_ID"))
    return deactivate_imported_accounts(list(sources.values_list("user_id", flat=True)), actor)
