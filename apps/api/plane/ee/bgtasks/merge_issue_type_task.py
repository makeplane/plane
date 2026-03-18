# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import logging
from collections import defaultdict

from django.db import transaction
from django.db.models import Count, Q, Case, When, Value, F
from celery import shared_task, group
from django.utils import timezone as django_timezone

from plane.db.models import IssueType, ProjectIssueType, Issue, DraftIssue, Project, Workspace
from plane.ee.models import (
    IssueTypeProperty,
    IssueProperty,
    IssuePropertyOption,
    IssuePropertyValue,
    IssuePropertyActivity,
    IntakeForm,
    WorkflowWorkItemType,
)
from plane.utils.exception_logger import log_exception

logger = logging.getLogger("plane.worker")


# ============================================================================
# ORCHESTRATOR TASK
# ============================================================================


@shared_task
def move_project_issue_types_to_workspace_orchestrator():
    """Spawns a child task per workspace for parallel processing."""
    try:
        workspace_ids = list(
            Workspace.objects.filter(deleted_at__isnull=True)
            .annotate(
                enabled_project_count=Count(
                    "workspace_project",
                    filter=Q(workspace_project__is_issue_type_enabled=True, workspace_project__deleted_at__isnull=True),
                )
            )
            .filter(enabled_project_count__gte=1)
            .values_list("id", flat=True)
        )

        if not workspace_ids:
            return {"status": "success", "message": "No eligible workspaces found"}

        result = group(
            move_project_issue_types_to_workspace.s(workspace_id) for workspace_id in workspace_ids
        ).apply_async()

        return {"status": "spawned", "workspace_count": len(workspace_ids), "group_id": result.id}

    except Exception as e:
        log_exception(e)
        return {"status": "error", "message": str(e)}


# ============================================================================
# CHILD TASK
# ============================================================================


@shared_task(bind=True, max_retries=3)
def move_project_issue_types_to_workspace(self, workspace_id):
    """
    Moves all project-level issue types to workspace level for a single workspace.
    Duplicate type names are merged into the oldest record; all FK references across
    every affected model are updated before the duplicates are soft-deleted.
    """
    try:
        self.update_state(state="PROCESSING", meta={"workspace_id": workspace_id})

        with transaction.atomic():
            result = _move_workspace_issue_types(workspace_id)

        logger.info(f"Workspace {workspace_id} migration completed: {result.get('stats', {})}")
        return result

    except Exception as e:
        logger.error(f"Workspace {workspace_id} migration failed: {str(e)}")
        log_exception(e)

        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=60 * (2**self.request.retries))

        return {"status": "error", "workspace_id": workspace_id, "message": str(e)}


# ============================================================================
# CORE MIGRATION
# ============================================================================


def _move_workspace_issue_types(workspace_id):
    now = django_timezone.now()

    try:
        workspace = Workspace.objects.get(id=workspace_id, deleted_at__isnull=True)
    except Workspace.DoesNotExist:
        return {"status": "skipped", "reason": "workspace_not_found"}

    enabled_project_ids = list(
        Project.objects.filter(
            workspace_id=workspace_id, is_issue_type_enabled=True, deleted_at__isnull=True
        ).values_list("id", flat=True)
    )

    type_stats = _merge_and_move_issue_types(workspace, enabled_project_ids, now)
    property_stats = _deduplicate_workspace_properties(workspace_id, now)
    stats = {**type_stats, **property_stats}

    logger.info(
        f"[Workspace: {workspace.slug}] Migration completed — "
        f"deleted {stats.get('types_deleted', 0)} duplicate types, "
        f"merged {stats.get('properties_deleted', 0)} duplicate properties"
    )

    return {"status": "success", "workspace_id": workspace_id, "workspace_slug": workspace.slug, "stats": stats}


def _merge_and_move_issue_types(workspace, enabled_project_ids, now):
    """
    Finds IssueType records that share the same normalized name within the enabled
    projects, keeps the oldest as canonical, and remaps every FK reference to it
    across all affected models before soft-deleting the duplicates.

    Models updated:
      Simple remaps  — Issue, DraftIssue, IssueProperty, IntakeForm
      Conflict-aware — ProjectIssueType, IssueTypeProperty, WorkflowWorkItemType
                       (these have unique constraints involving the type FK)
    """
    if not enabled_project_ids:
        return {}

    # Load all type→project rows for the enabled projects
    pit_rows = list(
        ProjectIssueType.objects.filter(
            project_id__in=enabled_project_ids,
            deleted_at__isnull=True,
            issue_type__deleted_at__isnull=True,
        ).values("issue_type_id", "issue_type__name", "issue_type__created_at")
    )

    if not pit_rows:
        return {}

    # Group distinct type IDs by normalized name
    types_by_name = defaultdict(dict)  # {name: {type_id: created_at}}
    for row in pit_rows:
        name = row["issue_type__name"].lower().strip()
        tid = row["issue_type_id"]
        if tid not in types_by_name[name]:
            types_by_name[name][tid] = row["issue_type__created_at"]

    # Build {dup_type_id: canonical_type_id} — oldest per group is canonical
    type_id_remapping = {}
    for types in types_by_name.values():
        if len(types) < 2:
            continue
        ordered = sorted(types.items(), key=lambda x: x[1])
        canonical_id = ordered[0][0]
        for dup_id, _ in ordered[1:]:
            type_id_remapping[dup_id] = canonical_id

    if not type_id_remapping:
        return {}

    dup_ids = list(type_id_remapping.keys())
    logger.info(f"[Workspace: {workspace.slug}] Remapping {len(dup_ids)} duplicate type(s)")

    # ── Simple FK remaps (no unique-constraint conflict possible) ─────────────
    # Replaces each dup type_id with its canonical using a single CASE-WHEN query.
    def _bulk_remap(model, field):
        whens = [When(**{field: dup}, then=Value(can)) for dup, can in type_id_remapping.items()]
        model.objects.filter(**{f"{field}__in": dup_ids}).update(**{field: Case(*whens, default=F(field))})

    _bulk_remap(Issue, "type_id")
    _bulk_remap(DraftIssue, "type_id")
    _bulk_remap(IssueProperty, "issue_type_id")
    _bulk_remap(IntakeForm, "work_item_type_id")

    # ── Conflict-aware remaps (unique constraint: type FK + partner field) ─────
    # For each row of a dup type: if canonical already owns the same partner
    # (project / property), the row is a duplicate → soft-delete it.
    # Otherwise → reassign it to canonical.
    def _remap_with_conflict(model, type_field, partner_field):
        # Track what the canonical already owns to detect conflicts
        canonical_pairs = set(
            model.objects.filter(
                **{f"{type_field}__in": type_id_remapping.values(), "deleted_at__isnull": True}
            ).values_list(type_field, partner_field)
        )

        to_delete = []
        to_update = {}  # {row_id: canonical_type_id}

        for row in model.objects.filter(**{f"{type_field}__in": dup_ids, "deleted_at__isnull": True}).values(
            "id", type_field, partner_field
        ):
            canonical_id = type_id_remapping[row[type_field]]
            pair = (canonical_id, row[partner_field])
            if pair in canonical_pairs:
                to_delete.append(row["id"])
            else:
                to_update[row["id"]] = canonical_id
                canonical_pairs.add(pair)

        if to_delete:
            model.objects.filter(id__in=to_delete).update(deleted_at=now)

        if to_update:
            objs = model.objects.in_bulk(list(to_update.keys()))
            for obj_id, canonical_id in to_update.items():
                setattr(objs[obj_id], type_field, canonical_id)
            model.objects.bulk_update(objs.values(), [type_field], batch_size=500)

    _remap_with_conflict(ProjectIssueType, "issue_type_id", "project_id")
    _remap_with_conflict(IssueTypeProperty, "issue_type_id", "property_id")
    _remap_with_conflict(WorkflowWorkItemType, "work_item_type_id", "project_id")

    # Soft-delete the duplicate IssueTypes now that all references are remapped
    types_deleted = IssueType.objects.filter(id__in=dup_ids).update(deleted_at=now)
    logger.info(f"[Workspace: {workspace.slug}] Soft-deleted {types_deleted} duplicate type(s)")

    return {"types_deleted": types_deleted}


# ============================================================================
# PROPERTY DEDUPLICATION
# ============================================================================


def _deduplicate_workspace_properties(workspace_id, now):
    """
    Merges IssueProperty records that share the same (normalized name, property_type).
    Canonical selection priority: is_required+is_active > is_required > is_active > oldest.
    Handles the IssuePropertyOption unique constraint by remapping conflicting option
    references before soft-deleting them.
    """
    stats = {
        "properties_merged": 0,
        "properties_deleted": 0,
        "property_options_reassigned": 0,
        "property_values_updated": 0,
        "property_activities_updated": 0,
        "type_property_links_updated": 0,
    }

    all_properties = list(
        IssueProperty.objects.filter(workspace_id=workspace_id, deleted_at__isnull=True).values(
            "id", "name", "property_type", "is_required", "is_active", "created_at"
        )
    )

    if not all_properties:
        return stats

    groups = defaultdict(list)
    for prop in all_properties:
        groups[(prop["name"].lower().strip(), prop["property_type"])].append(prop)

    # Build {dup_property_id: canonical_property_id}
    property_remapping = {}
    dup_property_ids = []

    for props in groups.values():
        if len(props) < 2:
            continue

        def sort_key(p):
            return (
                not (p["is_required"] and p["is_active"]),
                not p["is_required"],
                not p["is_active"],
                p["created_at"],
            )

        sorted_props = sorted(props, key=sort_key)
        canonical_id = sorted_props[0]["id"]
        for dup in sorted_props[1:]:
            property_remapping[dup["id"]] = canonical_id
            dup_property_ids.append(dup["id"])
            stats["properties_merged"] += 1

    if not property_remapping:
        return stats

    dup_ids = list(property_remapping.keys())
    canonical_ids = set(property_remapping.values())

    # ── IssueTypeProperty: reassign links, delete conflicts ───────────────────
    canonical_type_links = defaultdict(set)
    for itp in IssueTypeProperty.objects.filter(property_id__in=canonical_ids, deleted_at__isnull=True).values(
        "property_id", "issue_type_id"
    ):
        canonical_type_links[itp["property_id"]].add(itp["issue_type_id"])

    itp_to_delete = []
    itp_updates_by_canonical = defaultdict(list)

    for itp in IssueTypeProperty.objects.filter(property_id__in=dup_ids, deleted_at__isnull=True).values(
        "id", "property_id", "issue_type_id"
    ):
        canonical_id = property_remapping[itp["property_id"]]
        if itp["issue_type_id"] in canonical_type_links[canonical_id]:
            itp_to_delete.append(itp["id"])
        else:
            itp_updates_by_canonical[canonical_id].append(itp["id"])
            canonical_type_links[canonical_id].add(itp["issue_type_id"])

    if itp_to_delete:
        IssueTypeProperty.objects.filter(id__in=itp_to_delete).update(deleted_at=now)

    for canonical_prop_id, itp_ids in itp_updates_by_canonical.items():
        IssueTypeProperty.objects.filter(id__in=itp_ids).update(property_id=canonical_prop_id)
        stats["type_property_links_updated"] += len(itp_ids)

    # ── IssuePropertyOption: remap conflicting options, reassign the rest ─────
    # (unique constraint on (name, property, deleted_at__isnull))
    for dup_id, canonical_id in property_remapping.items():
        canonical_options = dict(
            IssuePropertyOption.objects.filter(property_id=canonical_id, deleted_at__isnull=True).values_list(
                "name", "id"
            )
        )
        dup_options = list(
            IssuePropertyOption.objects.filter(property_id=dup_id, deleted_at__isnull=True).values("id", "name")
        )

        conflicting = {
            opt["id"]: canonical_options[opt["name"]] for opt in dup_options if opt["name"] in canonical_options
        }
        non_conflicting = [opt["id"] for opt in dup_options if opt["name"] not in canonical_options]

        if conflicting:
            whens = [When(value_option_id=dup_opt, then=Value(can_opt)) for dup_opt, can_opt in conflicting.items()]
            IssuePropertyValue.objects.filter(value_option_id__in=list(conflicting.keys())).update(
                value_option_id=Case(*whens, default=F("value_option_id"))
            )
            IssuePropertyOption.objects.filter(id__in=list(conflicting.keys())).update(deleted_at=now)

        if non_conflicting:
            IssuePropertyOption.objects.filter(id__in=non_conflicting).update(property_id=canonical_id)
            stats["property_options_reassigned"] += len(non_conflicting)

    # ── Remap IssuePropertyValue and IssuePropertyActivity ───────────────────
    for dup_id, canonical_id in property_remapping.items():
        stats["property_values_updated"] += IssuePropertyValue.objects.filter(
            property_id=dup_id, deleted_at__isnull=True
        ).update(property_id=canonical_id)
        stats["property_activities_updated"] += IssuePropertyActivity.objects.filter(
            property_id=dup_id, deleted_at__isnull=True
        ).update(property_id=canonical_id)

    # ── Soft-delete duplicate properties ──────────────────────────────────────
    stats["properties_deleted"] = IssueProperty.objects.filter(id__in=dup_property_ids).update(deleted_at=now)

    return stats


# ============================================================================
# Sequential version
# ============================================================================


@shared_task
def move_project_issue_types_to_workspace_sequential():
    """Sequential fallback — processes all eligible workspaces in a single task."""
    try:
        workspace_ids = list(
            Workspace.objects.filter(deleted_at__isnull=True)
            .annotate(
                enabled_project_count=Count(
                    "workspace_project",
                    filter=Q(workspace_project__is_issue_type_enabled=True, workspace_project__deleted_at__isnull=True),
                )
            )
            .filter(enabled_project_count__gte=1)
            .values_list("id", flat=True)
        )

        successful, failed, types_deleted = 0, 0, 0

        for workspace_id in workspace_ids:
            try:
                with transaction.atomic():
                    result = _move_workspace_issue_types(workspace_id)
                    if result["status"] == "success":
                        successful += 1
                        types_deleted += result.get("stats", {}).get("types_deleted", 0)
            except Exception as e:
                failed += 1
                logger.error(f"Failed workspace {workspace_id}: {e}")
                log_exception(e)

        return {
            "status": "completed",
            "total_workspaces": len(workspace_ids),
            "successful": successful,
            "failed": failed,
            "types_deleted": types_deleted,
        }

    except Exception as e:
        log_exception(e)
        return {"status": "error", "message": str(e)}
