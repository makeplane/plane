# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Rules of products, shared by the app API and the public API."""

# Python imports
import time

# Third party imports
from crum import get_current_user
from rest_framework import serializers

# Django imports
from django.utils import timezone

# Module imports
from plane.db.models import (
    CycleIssue,
    Issue,
    IssueActivity,
    ModuleIssue,
    ProductDetail,
    ProductType,
    Project,
    ProjectMember,
    WorkItemKind,
)
from plane.utils.work_item_types import get_product_work_item_type

TASK = "task"
PRODUCT = WorkItemKind.PRODUCT.value
MEMBER_ROLE = 15
CLOSED_GROUPS = ("completed", "cancelled")


class ProductInputSerializer(serializers.Serializer):
    """The product part of a work item as clients send it."""

    product_type_id = serializers.PrimaryKeyRelatedField(
        source="product_type", queryset=ProductType.objects.all(), required=False
    )
    owner_id = serializers.UUIDField(required=False)
    manual_progress = serializers.IntegerField(min_value=0, max_value=100, required=False, allow_null=True)
    status_comment = serializers.CharField(max_length=500, required=False, allow_blank=True)


def kind_of(issue):
    """task, meeting or product; a missing type and the types without a kind mean a task."""
    return (issue.type.kind if issue.type_id and issue.type else None) or TASK


def is_product(issue):
    return kind_of(issue) == PRODUCT


def has_products(issue_ids, project_id):
    return Issue.objects.filter(pk__in=list(issue_ids), project_id=project_id, type__kind=PRODUCT).exists()


def sync_closed_at(issue):
    closed = bool(issue.state and issue.state.group in CLOSED_GROUPS)
    ProductDetail.objects.filter(issue_id=issue.pk).update(closed_at=timezone.now() if closed else None)


def detach_product_children(issue_ids):
    """
    Unlink the work items of the given products. Call it in the transaction that deletes them.

    all_objects keeps archived and draft children from being lost with the product.
    """
    children = list(
        Issue.all_objects.filter(parent_id__in=list(issue_ids), parent__type__kind=PRODUCT).select_related(
            "parent", "project"
        )
    )
    if not children:
        return
    Issue.all_objects.filter(pk__in=[child.pk for child in children]).update(parent=None)
    actor = get_current_user()
    actor_id = actor.pk if actor is not None and actor.is_authenticated else None
    IssueActivity.objects.bulk_create(
        [
            IssueActivity(
                issue_id=child.pk,
                actor_id=actor_id,
                verb="updated",
                field="parent",
                old_value=f"{child.project.identifier}-{child.parent.sequence_id}",
                new_value="",
                old_identifier=child.parent_id,
                new_identifier=None,
                project_id=child.project_id,
                workspace_id=child.workspace_id,
                comment="updated the parent issue to",
                epoch=int(time.time()),
            )
            for child in children
            if child.deleted_at is None
        ],
        batch_size=100,
    )


def error(field, message):
    return serializers.ValidationError({field: [message]})


def clean_work_item(attrs, instance, project_id, tasks_only=False):
    """
    Check the kind, the parent and the product part of a work item being saved.

    Replaces "kind" in attrs by the type to store. Drafts and intake pass tasks_only.
    """
    current = kind_of(instance) if instance else TASK
    requested_type = attrs.pop("type", None) if attrs.get("type") is not None else None
    kind = attrs.pop("kind", None)
    product = attrs.get("product")

    if requested_type is not None:
        workspace_id = Project.objects.values_list("workspace_id", flat=True).get(pk=project_id)
        if requested_type.workspace_id != workspace_id:
            raise error("type_id", "The type does not exist in this workspace.")
        if requested_type.kind == WorkItemKind.MEETING:
            raise error("type_id", "Meetings are not available.")
        if requested_type.kind:
            kind = kind or requested_type.kind
        elif current == TASK and kind in (None, TASK):
            # A plain type of the workspace keeps working as before.
            attrs["type"] = requested_type

    target = kind or current
    if tasks_only and target == PRODUCT:
        raise error("kind", "Only a task can be created here.")
    if target != current:
        attrs["type"] = None
        _check_conversion(instance, target, project_id)
        if target == PRODUCT:
            workspace_id = Project.objects.values_list("workspace_id", flat=True).get(pk=project_id)
            attrs["type"] = get_product_work_item_type(workspace_id)
    elif current == PRODUCT:
        # "type_id": null would silently turn the product into a task.
        attrs.pop("type", None)

    parent = attrs.get("parent")
    if instance is not None and parent is not None and parent.pk == instance.pk:
        raise error("parent_id", "A work item cannot be its own parent.")

    if target != PRODUCT:
        if product:
            raise error("product", "Only a product has product fields.")
        attrs.pop("product", None)
        return attrs

    if parent is not None:
        raise error("parent_id", "A product cannot have a parent.")
    if attrs.get("estimate_point") is not None or attrs.get("point") is not None:
        raise error("estimate_point", "A product cannot be estimated.")
    if attrs.get("is_draft"):
        raise error("is_draft", "A product cannot be a draft.")
    _check_fields(attrs, instance, project_id, required=target != current)
    if target != current:
        # An estimate given while it was a task has no meaning for a product.
        attrs["estimate_point"] = None
        attrs["point"] = None
        attrs.setdefault("product", {})
    return attrs


def _check_conversion(instance, target, project_id):
    if target == PRODUCT:
        enabled = Project.objects.filter(pk=project_id, workspace__is_team_structure_enabled=True).exists()
        if not enabled:
            raise error("kind", "Products are not enabled in this workspace.")
        user = get_current_user()
        # Guests may edit the work items they created, but not make products of them.
        if not _is_project_writer(project_id, user.pk if user is not None else None):
            raise error("kind", "Only project members can create products.")
        if instance is None:
            return
        if instance.parent_id:
            raise error("kind", "A work item with a parent cannot become a product.")
        if CycleIssue.objects.filter(issue=instance).exists() or ModuleIssue.objects.filter(issue=instance).exists():
            raise error("kind", "Remove the work item from its cycle and modules first.")
        if instance.issue_intake.exclude(status=1).exists():
            raise error("kind", "Accept the work item from intake first.")
    elif instance is not None and Issue.objects.filter(parent=instance).exists():
        raise error("kind", "Unlink the work items of the product first.")


def _is_project_writer(project_id, user_id):
    return ProjectMember.objects.filter(
        project_id=project_id, member_id=user_id, role__gte=MEMBER_ROLE, is_active=True
    ).exists()


def _check_fields(attrs, instance, project_id, required):
    """`required` is set when the work item becomes a product now."""
    product = attrs.get("product") or {}
    detail = ProductDetail.objects.filter(issue=instance).first() if instance else None

    dates = {
        name: attrs[name] if name in attrs else getattr(instance, name, None) for name in ("start_date", "target_date")
    }
    if required or "start_date" in attrs or "target_date" in attrs:
        for name, value in dates.items():
            if value is None:
                raise error(name, "A product needs this date.")
    if dates["start_date"] and dates["target_date"] and dates["start_date"] > dates["target_date"]:
        raise error("target_date", "Start date cannot exceed target date")

    product_type = product.get("product_type")
    if product_type is not None:
        kept = detail is not None and detail.product_type_id == product_type.pk
        in_workspace = Project.objects.filter(pk=project_id, workspace_id=product_type.workspace_id).exists()
        if not in_workspace or not (product_type.is_active or kept):
            raise error("product_type_id", "The product type is not available.")
    elif required and detail is None:
        raise error("product_type_id", "A product needs a type.")

    owner_id = product.get("owner_id")
    if owner_id is not None:
        # An owner who left may stay until another one is chosen.
        kept = detail is not None and detail.owner_id == owner_id
        if not kept and not _is_project_writer(project_id, owner_id):
            raise error("owner_id", "The owner must be a member of the project.")
    elif required and (detail is None or detail.owner_id is None):
        raise error("owner_id", "A product needs an owner.")


def save_product(issue, product):
    """Store the product part given by clean_work_item. None means it was not sent."""
    if product is None:
        return
    detail = ProductDetail.objects.filter(issue=issue).first()
    if detail is None:
        detail = ProductDetail(issue=issue, project_id=issue.project_id)
    if "status_comment" in product and product["status_comment"] != detail.status_comment:
        user = get_current_user()
        detail.status_comment_by_id = user.pk if user is not None and user.is_authenticated else None
        detail.status_comment_at = timezone.now()
    for name, value in product.items():
        setattr(detail, name, value)
    if detail.closed_at is None and issue.state and issue.state.group in CLOSED_GROUPS:
        detail.closed_at = timezone.now()
    if "product_type" in product:
        # Deleting a type takes the same lock.
        product["product_type"] = ProductType.objects.select_for_update().filter(pk=product["product_type"].pk).first()
        if product["product_type"] is None:
            raise error("product_type_id", "The product type is not available.")
        detail.product_type = product["product_type"]
    detail.save()
    # The reverse one-to-one may be cached as missing.
    issue._state.fields_cache.pop("product_detail", None)


def represent_product(issue, with_progress=True):
    """The product part of a work item as clients read it, None for other kinds."""
    from plane.utils.product_progress import indicator, progress_of

    if not is_product(issue):
        return None
    detail = getattr(issue, "product_detail", None)
    if detail is None:
        return None
    data = {
        "product_type_id": str(detail.product_type_id),
        "owner_id": str(detail.owner_id) if detail.owner_id else None,
        "manual_progress": detail.manual_progress,
        "status_comment": detail.status_comment,
        "status_comment_by": str(detail.status_comment_by_id) if detail.status_comment_by_id else None,
        "status_comment_at": detail.status_comment_at,
        "closed_at": detail.closed_at,
    }
    if not with_progress:
        return data
    counts = progress_of(issue.pk)
    progress = detail.manual_progress if detail.manual_progress is not None else counts["percent"]
    data.update(
        total_tasks=counts["total"],
        completed_tasks=counts["completed"],
        calculated_progress=counts["percent"],
        progress=progress,
        indicator=indicator(
            state_group=issue.state.group if issue.state else None,
            start_date=issue.start_date,
            target_date=issue.target_date,
            progress=progress,
            has_overdue_tasks=counts["overdue"] > 0,
            today=counts["today"],
        ),
    )
    return data


class WorkItemKindMixin(serializers.Serializer):
    """Adds the kind and the product part to a work item serializer, for reading and writing."""

    kind = serializers.ChoiceField(choices=[TASK, PRODUCT], required=False, write_only=True)
    product = ProductInputSerializer(required=False, write_only=True)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Absent when the client asked for other fields only.
        if "kind" in self.fields:
            data["kind"] = kind_of(instance)
            if data["kind"] == PRODUCT:
                # Progress takes queries of its own, so a list gets the stored fields only.
                data["product"] = represent_product(instance, with_progress=self.parent is None)
        return data
