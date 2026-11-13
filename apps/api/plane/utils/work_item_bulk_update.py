# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Bulk update of work items.

One code path for the REST v1 ``work-items/bulk-update/`` endpoint, the app ``bulk-operation-issues/`` endpoint and
the cycle automation rules. Everything is validated before anything is written; the writes run in one transaction;
after the commit, the activity of each changed work item is queued.

Changes (each optional, at least one):

- ``state``: state id of the project (sets ``completed_at`` like ``Issue.save``);
- ``priority``: one of ``urgent``, ``high``, ``medium``, ``low``, ``none``;
- ``labels``: label ids of the project, ADDED to the work items' labels;
- ``assignees``: active project members (member role and up), ADDED to the work items' assignees;
- ``cycle``: cycle id of the project (not archived, not completed) to move the work items to, or ``None`` to remove
  them from their cycle.
"""

# Python imports
import json
import uuid

# Django imports
from django.db import transaction
from django.utils import timezone

# Module imports
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import (
    Cycle,
    CycleIssue,
    Issue,
    IssueAssignee,
    IssueLabel,
    Label,
    ProjectMember,
    State,
)
from plane.db.models.state import StateGroup

MAX_WORK_ITEMS = 500
PRIORITIES = ("urgent", "high", "medium", "low", "none")
SUPPORTED_CHANGES = ("state", "priority", "labels", "assignees", "cycle")


class BulkUpdateError(Exception):
    """Invalid input. ``errors`` maps a field to a list of messages, ready for a 400 answer."""

    def __init__(self, errors):
        super().__init__("invalid bulk update")
        self.errors = errors


def _uuid_list(values, field, errors):
    if not isinstance(values, list):
        errors[field] = ["Expected a list of ids."]
        return []
    ids, invalid = [], []
    for value in values:
        try:
            ids.append(str(uuid.UUID(str(value))))
        except (ValueError, TypeError, AttributeError):
            invalid.append(str(value))
    if invalid:
        errors[field] = [f"Invalid ids: {invalid[:20]}"]
    return list(dict.fromkeys(ids))


def _validate(project_id, issue_ids, changes):
    errors = {}
    unknown = sorted(set(changes) - set(SUPPORTED_CHANGES))
    if unknown:
        errors["non_field_errors"] = [f"Unsupported fields: {unknown}"]
    if not any(key in changes for key in SUPPORTED_CHANGES):
        errors.setdefault("non_field_errors", []).append(f"Pass at least one of {list(SUPPORTED_CHANGES)}.")

    ids = _uuid_list(issue_ids, "work_item_ids", errors)
    if "work_item_ids" not in errors:
        if not ids:
            errors["work_item_ids"] = ["Pass at least one work item id."]
        elif len(ids) > MAX_WORK_ITEMS:
            errors["work_item_ids"] = [f"At most {MAX_WORK_ITEMS} work items per call."]

    clean = {}
    if "state" in changes:
        state_id = changes["state"]
        state = None
        if state_id:
            try:
                state = State.objects.filter(project_id=project_id, pk=uuid.UUID(str(state_id))).first()
            except (ValueError, TypeError, AttributeError):
                state = None
        if state is None:
            errors["state"] = ["State is not a state of this project."]
        clean["state"] = state

    if "priority" in changes:
        if changes["priority"] not in PRIORITIES:
            errors["priority"] = [f"Priority must be one of {list(PRIORITIES)}."]
        clean["priority"] = changes["priority"]

    if "labels" in changes:
        label_ids = _uuid_list(changes["labels"], "labels", errors)
        valid = {
            str(i) for i in Label.objects.filter(project_id=project_id, pk__in=label_ids).values_list("id", flat=True)
        }
        if "labels" not in errors and set(label_ids) - valid:
            errors["labels"] = [f"Labels {sorted(set(label_ids) - valid)} do not belong to this project."]
        clean["labels"] = label_ids

    if "assignees" in changes:
        assignee_ids = _uuid_list(changes["assignees"], "assignees", errors)
        valid = {
            str(i)
            for i in ProjectMember.objects.filter(
                project_id=project_id, is_active=True, role__gte=15, member_id__in=assignee_ids
            ).values_list("member_id", flat=True)
        }
        if "assignees" not in errors and set(assignee_ids) - valid:
            errors["assignees"] = [
                f"Assignees {sorted(set(assignee_ids) - valid)} are not active members of this project."
            ]
        clean["assignees"] = assignee_ids

    if "cycle" in changes:
        cycle = None
        if changes["cycle"] is not None:
            try:
                cycle = Cycle.objects.filter(
                    project_id=project_id, pk=uuid.UUID(str(changes["cycle"])), archived_at__isnull=True
                ).first()
            except (ValueError, TypeError, AttributeError):
                cycle = None
            if cycle is None:
                errors["cycle"] = ["Cycle is not an active cycle of this project."]
            elif cycle.end_date is not None and cycle.end_date < timezone.now():
                errors["cycle"] = ["The cycle has already been completed so no new work items can be added."]
        clean["cycle"] = cycle

    issues = []
    if not errors:
        issues = list(Issue.issue_objects.filter(project_id=project_id, pk__in=ids))
        missing = sorted(set(ids) - {str(issue.id) for issue in issues})
        if missing:
            errors["work_item_ids"] = [f"Work items not found in this project: {missing[:50]}"]

    if errors:
        raise BulkUpdateError(errors)
    return ids, clean


def bulk_update_work_items(project, issue_ids, changes, actor_id, notification=True, origin=None):
    """Apply ``changes`` to the work items ``issue_ids`` of ``project``. All or nothing.

    Returns ``{"updated": [...], "unchanged": [...]}`` (ids, in request order). Raises ``BulkUpdateError``.
    """
    project_id = project.id
    ids, clean = _validate(project_id, issue_ids, changes)
    now = timezone.now()
    epoch = int(now.timestamp())

    # per work item: requested and current values for its issue.activity.updated
    requested, current = {}, {}
    cycle_updated_records, cycle_created_records, cycle_removed = [], [], []
    changed = set()

    with transaction.atomic():
        issues = list(Issue.issue_objects.select_for_update(of=("self",)).filter(project_id=project_id, pk__in=ids))
        by_id = {str(issue.id): issue for issue in issues}

        update_fields = set()
        state = clean.get("state")
        for issue_id, issue in by_id.items():
            if state is not None and issue.state_id != state.id:
                requested.setdefault(issue_id, {})["state_id"] = str(state.id)
                current.setdefault(issue_id, {})["state_id"] = str(issue.state_id) if issue.state_id else None
                issue.state_id = state.id
                # as Issue.save does on a state change
                issue.completed_at = now if state.group == StateGroup.COMPLETED.value else None
                update_fields.update(("state", "completed_at"))
                changed.add(issue_id)
            if "priority" in clean and issue.priority != clean["priority"]:
                requested.setdefault(issue_id, {})["priority"] = clean["priority"]
                current.setdefault(issue_id, {})["priority"] = issue.priority
                issue.priority = clean["priority"]
                update_fields.add("priority")
                changed.add(issue_id)

        for field, model, key, fk in (
            ("labels", IssueLabel, "label_ids", "label_id"),
            ("assignees", IssueAssignee, "assignee_ids", "assignee_id"),
        ):
            wanted = clean.get(field)
            if not wanted:
                continue
            existing = {}
            for issue_id, other_id in model.objects.filter(issue_id__in=ids).values_list("issue_id", fk):
                existing.setdefault(str(issue_id), set()).add(str(other_id))
            to_create = []
            for issue_id in by_id:
                have = existing.get(issue_id, set())
                missing = [other for other in wanted if other not in have]
                if not missing:
                    continue
                for other in missing:
                    to_create.append(
                        model(
                            issue_id=issue_id,
                            project_id=project_id,
                            workspace_id=project.workspace_id,
                            created_by_id=actor_id,
                            updated_by_id=actor_id,
                            **{fk: other},
                        )
                    )
                requested.setdefault(issue_id, {})[key] = sorted(have | set(missing))
                current.setdefault(issue_id, {})[key] = sorted(have)
                changed.add(issue_id)
            model.objects.bulk_create(to_create, batch_size=100)

        if "cycle" in clean:
            cycle = clean["cycle"]
            links = {str(link.issue_id): link for link in CycleIssue.objects.filter(issue_id__in=ids)}
            if cycle is None:
                # one soft delete for all links (CycleIssue.delete() would queue a task per link mid-transaction)
                for link in links.values():
                    cycle_removed.append((str(link.cycle_id), str(link.issue_id)))
                    changed.add(str(link.issue_id))
                CycleIssue.objects.filter(pk__in=[link.pk for link in links.values()]).update(
                    deleted_at=now, updated_by_id=actor_id
                )
            else:
                to_update, to_create = [], []
                for issue_id in by_id:
                    link = links.get(issue_id)
                    if link is None:
                        to_create.append(
                            CycleIssue(
                                cycle_id=cycle.id,
                                issue_id=issue_id,
                                project_id=project_id,
                                workspace_id=project.workspace_id,
                                created_by_id=actor_id,
                                updated_by_id=actor_id,
                            )
                        )
                        cycle_created_records.append({"fields": {"cycle": str(cycle.id), "issue": issue_id}})
                        changed.add(issue_id)
                    elif link.cycle_id != cycle.id:
                        cycle_updated_records.append(
                            {"old_cycle_id": str(link.cycle_id), "new_cycle_id": str(cycle.id), "issue_id": issue_id}
                        )
                        link.cycle_id = cycle.id
                        link.updated_by_id = actor_id
                        to_update.append(link)
                        changed.add(issue_id)
                CycleIssue.objects.bulk_update(to_update, ["cycle_id", "updated_by_id"], batch_size=100)
                CycleIssue.objects.bulk_create(to_create, batch_size=100)

        changed_issues = [by_id[issue_id] for issue_id in by_id if issue_id in changed]
        for issue in changed_issues:
            issue.updated_at = now
            issue.updated_by_id = actor_id
        if changed_issues:
            Issue.objects.bulk_update(
                changed_issues, sorted(update_fields | {"updated_at", "updated_by"}), batch_size=100
            )

        updated_ids = [issue_id for issue_id in ids if issue_id in changed]

        def after_commit():
            common = {
                "actor_id": str(actor_id) if actor_id else None,
                "project_id": str(project_id),
                "epoch": epoch,
                "notification": notification,
                "origin": origin,
            }
            for issue_id in updated_ids:
                if issue_id in requested:
                    issue_activity.delay(
                        type="issue.activity.updated",
                        requested_data=json.dumps(requested[issue_id]),
                        current_instance=json.dumps(current[issue_id]),
                        issue_id=issue_id,
                        **common,
                    )
            if cycle_updated_records or cycle_created_records:
                issue_activity.delay(
                    type="cycle.activity.created",
                    requested_data=json.dumps({"cycles_list": updated_ids}),
                    current_instance=json.dumps(
                        {
                            "updated_cycle_issues": cycle_updated_records,
                            "created_cycle_issues": json.dumps(cycle_created_records),
                        }
                    ),
                    issue_id=None,
                    **common,
                )
            for cycle_id, issue_id in cycle_removed:
                issue_activity.delay(
                    type="cycle.activity.deleted",
                    requested_data=json.dumps({"cycle_id": cycle_id, "issues": [issue_id]}),
                    current_instance=None,
                    issue_id=issue_id,
                    **common,
                )

        transaction.on_commit(after_commit)

    return {"updated": updated_ids, "unchanged": [issue_id for issue_id in ids if issue_id not in changed]}
