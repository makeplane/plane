# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import json
from collections import defaultdict
from datetime import date, datetime

# Django imports
from django.core.serializers import serialize
from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

# Module imports
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import (
    Cycle,
    CycleIssue,
    EstimatePoint,
    Issue,
    IssueAssignee,
    IssueLabel,
    Label,
    Module,
    ModuleIssue,
    Project,
    ProjectMember,
    State,
)

# Priority values accepted by Issue.PRIORITY_CHOICES
PRIORITY_CHOICES = {"urgent", "high", "medium", "low", "none"}


class BulkIssueOperationError(Exception):
    """Raised for any validation failure. The caller maps ``message`` to a 400.

    Raised BEFORE any mutation happens, so the batch stays all-or-nothing: a
    single invalid value rejects the whole request without a partial write.
    """

    def __init__(self, message):
        self.message = message
        super().__init__(message)


def _parse_date(value):
    """Coerce a payload date (``YYYY-MM-DD`` string, ``date`` or ``None``)."""
    if value in (None, ""):
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    return datetime.strptime(str(value), "%Y-%m-%d").date()


def _as_id_set(values):
    return {str(v) for v in (values or [])}


def bulk_issue_operations(*, slug, project_id, issue_ids, properties, actor_id, origin, notification=True):
    """Validate and apply multi-field bulk operations on a set of work items.

    Semantics: scalar fields (state/priority/dates/estimate/cycle) are SET on all
    ``issue_ids``. Multi-valued fields (``assignee_ids``/``label_ids``/``module_ids``)
    are **ADDED** to the existing set (append, deduplicated) — matching Plane's
    native bulk-ops behaviour and the web store's optimistic ``uniq([...old, ...new])``.
    Keys absent from ``properties`` are left unchanged; an empty list is a no-op.

    Validation runs first and raises :class:`BulkIssueOperationError` (mapped to
    a 400 by the caller) on the first invalid value, guaranteeing atomicity. The
    application phase runs inside ``transaction.atomic``. One ``issue_activity``
    task is queued per issue for the scalar/label/assignee/date/estimate changes,
    and dedicated cycle/module activities are queued for those relations.

    Returns the list of operated issue ids (str) on success.
    """
    if not issue_ids:
        raise BulkIssueOperationError("Issue IDs are required")

    if not properties:
        raise BulkIssueOperationError("Properties are required")

    project = Project.objects.filter(workspace__slug=slug, pk=project_id).first()
    if project is None:
        raise BulkIssueOperationError("Project does not exist")

    # Scope the fetch to the project so that ids from another project (or that do
    # not exist) never resolve -> anti-leak / anti-IDOR.
    issues = list(Issue.objects.filter(workspace__slug=slug, project_id=project_id, pk__in=issue_ids))
    found_ids = {str(issue.id) for issue in issues}
    requested_ids = {str(i) for i in issue_ids}
    if found_ids != requested_ids:
        raise BulkIssueOperationError("Some work items do not belong to this project")

    # ------------------------------------------------------------------
    # Validation phase (no mutation happens here)
    # ------------------------------------------------------------------
    state_id = properties.get("state_id")
    if "state_id" in properties and state_id:
        if not State.objects.filter(project_id=project_id, pk=state_id).exists():
            raise BulkIssueOperationError("Invalid state_id for this project")

    priority = properties.get("priority")
    if "priority" in properties and priority is not None:
        if priority not in PRIORITY_CHOICES:
            raise BulkIssueOperationError("Invalid priority value")

    assignee_ids = properties.get("assignee_ids")
    if "assignee_ids" in properties and assignee_ids:
        valid_assignees = {
            str(m)
            for m in ProjectMember.objects.filter(
                project_id=project_id, member_id__in=assignee_ids, is_active=True
            ).values_list("member_id", flat=True)
        }
        if valid_assignees != _as_id_set(assignee_ids):
            raise BulkIssueOperationError("One or more assignees are not active members of this project")

    label_ids = properties.get("label_ids")
    if "label_ids" in properties and label_ids:
        valid_labels = {
            str(x) for x in Label.objects.filter(project_id=project_id, pk__in=label_ids).values_list("id", flat=True)
        }
        if valid_labels != _as_id_set(label_ids):
            raise BulkIssueOperationError("One or more labels do not belong to this project")

    module_ids = properties.get("module_ids")
    if "module_ids" in properties and module_ids:
        valid_modules = {
            str(x) for x in Module.objects.filter(project_id=project_id, pk__in=module_ids).values_list("id", flat=True)
        }
        if valid_modules != _as_id_set(module_ids):
            raise BulkIssueOperationError("One or more modules do not belong to this project")

    cycle_id = properties.get("cycle_id")
    if "cycle_id" in properties and cycle_id:
        if not Cycle.objects.filter(project_id=project_id, pk=cycle_id).exists():
            raise BulkIssueOperationError("Invalid cycle_id for this project")

    estimate_point = properties.get("estimate_point")
    if "estimate_point" in properties and estimate_point:
        if project.estimate_id is None:
            raise BulkIssueOperationError("Estimates are not enabled for this project")
        if not EstimatePoint.objects.filter(estimate_id=project.estimate_id, pk=estimate_point).exists():
            raise BulkIssueOperationError("Invalid estimate point for this project")

    # Dates: parse both, then enforce start <= target.
    has_start = "start_date" in properties
    has_target = "target_date" in properties
    raw_start = properties.get("start_date") if has_start else None
    raw_target = properties.get("target_date") if has_target else None
    try:
        new_start = _parse_date(raw_start) if has_start else None
        new_target = _parse_date(raw_target) if has_target else None
    except (ValueError, TypeError):
        raise BulkIssueOperationError("Invalid date format, expected YYYY-MM-DD")

    start_provided = has_start and raw_start not in (None, "")
    target_provided = has_target and raw_target not in (None, "")
    clearing_start = has_start and raw_start in (None, "")
    clearing_target = has_target and raw_target in (None, "")

    if start_provided and target_provided:
        if new_start > new_target:
            raise BulkIssueOperationError("Start date cannot exceed target date")
    elif start_provided and not clearing_target:
        # Only start supplied: it must stay <= each issue's existing target.
        for issue in issues:
            if issue.target_date and new_start > issue.target_date:
                raise BulkIssueOperationError("Start date cannot exceed target date")
    elif target_provided and not clearing_start:
        # Only target supplied: it must stay >= each issue's existing start.
        for issue in issues:
            if issue.start_date and issue.start_date > new_target:
                raise BulkIssueOperationError("Start date cannot exceed target date")

    # ------------------------------------------------------------------
    # Application phase
    # ------------------------------------------------------------------
    workspace_id = project.workspace_id
    now = timezone.now()
    epoch = int(now.timestamp())
    operated_ids = [str(issue.id) for issue in issues]

    scalar_fields = []
    if "state_id" in properties and state_id:
        scalar_fields.append("state")
    if "priority" in properties and priority is not None:
        scalar_fields.append("priority")
    if has_start:
        scalar_fields.append("start_date")
    if has_target:
        scalar_fields.append("target_date")
    if "estimate_point" in properties:
        scalar_fields.append("estimate_point")

    with transaction.atomic():
        # Snapshot current relations BEFORE any change (managers already exclude
        # soft-deleted rows) so the activity diff is computed from the old state.
        current_labels_map = defaultdict(list)
        for row in IssueLabel.objects.filter(issue_id__in=operated_ids).values_list("issue_id", "label_id"):
            current_labels_map[str(row[0])].append(str(row[1]))

        current_assignees_map = defaultdict(list)
        for row in IssueAssignee.objects.filter(issue_id__in=operated_ids).values_list("issue_id", "assignee_id"):
            current_assignees_map[str(row[0])].append(str(row[1]))

        current_modules_map = defaultdict(list)
        for row in ModuleIssue.objects.filter(issue_id__in=operated_ids).values_list("issue_id", "module_id"):
            current_modules_map[str(row[0])].append(str(row[1]))

        for issue in issues:
            iid = str(issue.id)
            snapshot = {
                "state_id": str(issue.state_id) if issue.state_id else None,
                "priority": issue.priority,
                "start_date": str(issue.start_date) if issue.start_date else None,
                "target_date": str(issue.target_date) if issue.target_date else None,
                "estimate_point": str(issue.estimate_point_id) if issue.estimate_point_id else None,
                "label_ids": current_labels_map.get(iid, []),
                "assignee_ids": current_assignees_map.get(iid, []),
            }

            requested = {}
            if "state_id" in properties and state_id:
                requested["state_id"] = str(state_id)
                issue.state_id = state_id
            if "priority" in properties and priority is not None:
                requested["priority"] = priority
                issue.priority = priority
            if has_start:
                requested["start_date"] = str(new_start) if new_start else None
                issue.start_date = new_start
            if has_target:
                requested["target_date"] = str(new_target) if new_target else None
                issue.target_date = new_target
            if "estimate_point" in properties:
                requested["estimate_point"] = str(estimate_point) if estimate_point else None
                issue.estimate_point_id = estimate_point
            # ADD semantics: the activity diff sees the UNION (old + new) as the
            # requested set, so the tracker logs only the added ids (no removals).
            if "label_ids" in properties:
                new_ids = [str(x) for x in (label_ids or [])]
                requested["label_ids"] = list(dict.fromkeys(current_labels_map.get(iid, []) + new_ids))
            if "assignee_ids" in properties:
                new_ids = [str(x) for x in (assignee_ids or [])]
                requested["assignee_ids"] = list(dict.fromkeys(current_assignees_map.get(iid, []) + new_ids))
            issue.updated_at = now

            if requested:
                issue_activity.delay(
                    type="issue.activity.updated",
                    requested_data=json.dumps(requested, cls=DjangoJSONEncoder),
                    actor_id=actor_id,
                    issue_id=iid,
                    project_id=str(project_id),
                    current_instance=json.dumps(snapshot, cls=DjangoJSONEncoder),
                    epoch=epoch,
                    notification=notification,
                    origin=origin,
                )

        # Scalars: one bulk_update for all issues (updated_at always bumped).
        update_fields = list(dict.fromkeys(scalar_fields + ["updated_at"]))
        Issue.objects.bulk_update(issues, update_fields, batch_size=100)

        # Labels (ADD): keep the existing rows, only insert the new ones that are
        # not already present. ignore_conflicts guards the (issue,label) partial
        # UniqueConstraint (deleted_at is null) against any race.
        if "label_ids" in properties:
            new_label_ids = [str(x) for x in (label_ids or [])]
            if new_label_ids:
                to_create = [
                    IssueLabel(
                        label_id=label,
                        issue_id=iid,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=actor_id,
                        updated_by_id=actor_id,
                    )
                    for iid in operated_ids
                    for label in new_label_ids
                    if label not in current_labels_map.get(iid, [])
                ]
                if to_create:
                    IssueLabel.objects.bulk_create(to_create, batch_size=10, ignore_conflicts=True)

        # Assignees (ADD): same append-only pattern.
        if "assignee_ids" in properties:
            new_assignee_ids = [str(x) for x in (assignee_ids or [])]
            if new_assignee_ids:
                to_create = [
                    IssueAssignee(
                        assignee_id=assignee,
                        issue_id=iid,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=actor_id,
                        updated_by_id=actor_id,
                    )
                    for iid in operated_ids
                    for assignee in new_assignee_ids
                    if assignee not in current_assignees_map.get(iid, [])
                ]
                if to_create:
                    IssueAssignee.objects.bulk_create(to_create, batch_size=10, ignore_conflicts=True)

        # Modules (ADD): only attach the modules not already linked; never detach.
        if "module_ids" in properties:
            new_module_ids = _as_id_set(module_ids)
            for iid in operated_ids:
                current = set(current_modules_map.get(iid, []))
                added = new_module_ids - current
                if added:
                    ModuleIssue.objects.bulk_create(
                        [
                            ModuleIssue(
                                issue_id=iid,
                                module_id=mid,
                                project_id=project_id,
                                workspace_id=workspace_id,
                                created_by_id=actor_id,
                                updated_by_id=actor_id,
                            )
                            for mid in added
                        ],
                        batch_size=10,
                        ignore_conflicts=True,
                    )
                    for mid in added:
                        issue_activity.delay(
                            type="module.activity.created",
                            requested_data=json.dumps({"module_id": str(mid)}),
                            actor_id=actor_id,
                            issue_id=iid,
                            project_id=str(project_id),
                            current_instance=None,
                            epoch=epoch,
                            notification=notification,
                            origin=origin,
                        )

        # Cycle (single, SET): replicate the CycleIssueViewSet.create flow for
        # assignment; soft-delete + per-cycle activity for removal (cycle_id=None).
        if "cycle_id" in properties:
            if cycle_id:
                existing = list(CycleIssue.objects.filter(~Q(cycle_id=cycle_id), issue_id__in=operated_ids))
                existing_issue_ids = {str(ci.issue_id) for ci in existing}
                already_in = {
                    str(x)
                    for x in CycleIssue.objects.filter(cycle_id=cycle_id, issue_id__in=operated_ids).values_list(
                        "issue_id", flat=True
                    )
                }
                new_issue_ids = [iid for iid in operated_ids if iid not in existing_issue_ids and iid not in already_in]
                created_records = CycleIssue.objects.bulk_create(
                    [
                        CycleIssue(
                            project_id=project_id,
                            workspace_id=workspace_id,
                            created_by_id=actor_id,
                            updated_by_id=actor_id,
                            cycle_id=cycle_id,
                            issue_id=iid,
                        )
                        for iid in new_issue_ids
                    ],
                    batch_size=10,
                )
                updated_records = []
                update_cycle_issue_activity = []
                for cycle_issue in existing:
                    old_cycle_id = cycle_issue.cycle_id
                    cycle_issue.cycle_id = cycle_id
                    updated_records.append(cycle_issue)
                    update_cycle_issue_activity.append(
                        {
                            "old_cycle_id": str(old_cycle_id),
                            "new_cycle_id": str(cycle_id),
                            "issue_id": str(cycle_issue.issue_id),
                        }
                    )
                CycleIssue.objects.bulk_update(updated_records, ["cycle_id"], batch_size=100)
                if created_records or updated_records:
                    issue_activity.delay(
                        type="cycle.activity.created",
                        requested_data=json.dumps({"cycles_list": operated_ids}),
                        actor_id=actor_id,
                        issue_id=None,
                        project_id=str(project_id),
                        current_instance=json.dumps(
                            {
                                "updated_cycle_issues": update_cycle_issue_activity,
                                "created_cycle_issues": serialize("json", created_records),
                            }
                        ),
                        epoch=epoch,
                        notification=notification,
                        origin=origin,
                    )
            else:
                current_cycle_issues = list(CycleIssue.objects.filter(issue_id__in=operated_ids))
                by_cycle = defaultdict(list)
                for cycle_issue in current_cycle_issues:
                    by_cycle[str(cycle_issue.cycle_id)].append(str(cycle_issue.issue_id))
                cycle_lookup = {str(cycle.id): cycle for cycle in Cycle.objects.filter(pk__in=by_cycle.keys())}
                CycleIssue.objects.filter(issue_id__in=operated_ids).delete()
                for cid, iids in by_cycle.items():
                    cycle = cycle_lookup.get(cid)
                    for iid in iids:
                        issue_activity.delay(
                            type="cycle.activity.deleted",
                            requested_data=json.dumps(
                                {
                                    "cycle_id": cid,
                                    "cycle_name": cycle.name if cycle else "",
                                    "issues": [iid],
                                }
                            ),
                            actor_id=actor_id,
                            issue_id=iid,
                            project_id=str(project_id),
                            current_instance=None,
                            epoch=epoch,
                            notification=notification,
                            origin=origin,
                        )

    return operated_ids
