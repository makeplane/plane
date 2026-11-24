# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# "New" work items: created by somebody else in a project where the person is an active member, and not
# opened by that person yet (peek or full page, recorded as WorkItemOpen). A work item created up to the
# person's effective cutoff of its project counts as read without a row. The cutoff is the latest of:
#   - the workspace cutoff (deployment time, set by migration 0004),
#   - the time the person joined the project (ProjectMember.created_at),
#   - the person's "Mark all as read" time for the project (UnreadProjectCutoff).
# Only work items Plane lists normally count (Issue.issue_objects: no drafts, triage, archived, deleted).
# Guests see them only with guest_view_all_features; otherwise they see just their own, which never count.

# Python imports
from uuid import UUID

# Django imports
from django.db.models import Count, Exists, OuterRef, Q
from django.utils import timezone
from django.utils.dateparse import parse_datetime

# Module imports
from plane.app.permissions import ROLE
from plane.db.models import Issue, ProjectMember
from plane.liviere.models import UnreadProjectCutoff, UnreadWorkspaceCutoff, WorkItemOpen


class InvalidParams(ValueError):
    pass


def parse_project_ids(value):
    """Comma-separated project UUIDs from a query parameter or a list from a JSON body; None = all."""
    if value in (None, "", []):
        return None
    items = value.split(",") if isinstance(value, str) else value
    if not isinstance(items, (list, tuple)):
        raise InvalidParams("projects must be a list of project ids")
    try:
        return [UUID(str(item).strip()) for item in items if str(item).strip()] or None
    except ValueError:
        raise InvalidParams("projects must be a list of project ids")


def parse_before(value):
    """The `as_of` time returned by the server; never in the future."""
    if not value:
        raise InvalidParams("before is required (use as_of from the list or the count)")
    moment = parse_datetime(str(value))
    if moment is None or timezone.is_naive(moment):
        raise InvalidParams("before must be an ISO date-time with an offset")
    if moment > timezone.now():
        raise InvalidParams("before must not be in the future")
    return moment


def parse_older_than(value):
    if not value:
        return None
    moment = parse_datetime(str(value))
    if moment is None or timezone.is_naive(moment):
        raise InvalidParams("older_than must be an ISO date-time with an offset")
    return moment


def parse_per_page(value, default=50, maximum=200):
    if not value:
        return default
    try:
        per_page = int(value)
    except ValueError:
        raise InvalidParams("per_page must be a number")
    if not 1 <= per_page <= maximum:
        raise InvalidParams(f"per_page must be between 1 and {maximum}")
    return per_page


def memberships(user, workspace_id, project_ids=None):
    """Active memberships of the person in not archived projects of the workspace."""
    rows = ProjectMember.objects.filter(
        member=user,
        workspace_id=workspace_id,
        is_active=True,
        project__archived_at__isnull=True,
        project__deleted_at__isnull=True,
    )
    if project_ids is not None:
        rows = rows.filter(project_id__in=project_ids)
    return rows.select_related("project")


def can_see_others(membership):
    """A guest without guest_view_all_features sees only work items they created."""
    return membership.role > ROLE.GUEST.value or membership.project.guest_view_all_features


def project_cutoffs(user, workspace_id, rows):
    """{project_id: effective cutoff or None} for the given memberships."""
    workspace_cutoff = (
        UnreadWorkspaceCutoff.objects.filter(workspace_id=workspace_id).values_list("since", flat=True).first()
    )
    personal = dict(
        UnreadProjectCutoff.objects.filter(user=user, project_id__in=[row.project_id for row in rows]).values_list(
            "project_id", "since"
        )
    )
    cutoffs = {}
    for row in rows:
        candidates = [moment for moment in (workspace_cutoff, row.created_at, personal.get(row.project_id)) if moment]
        cutoffs[row.project_id] = max(candidates) if candidates else None
    return cutoffs


def new_work_items(user, workspace_id, project_ids=None, before=None):
    """Queryset of the person's new work items (unordered)."""
    rows = [row for row in memberships(user, workspace_id, project_ids) if can_see_others(row)]
    if not rows:
        return Issue.issue_objects.none()
    condition = Q()
    for project_id, cutoff in project_cutoffs(user, workspace_id, rows).items():
        project_condition = Q(project_id=project_id)
        if cutoff is not None:
            project_condition &= Q(created_at__gt=cutoff)
        condition |= project_condition
    items = (
        Issue.issue_objects.filter(condition, workspace_id=workspace_id)
        # NULL authors (created by the system) stay new: exclude() keeps them
        .exclude(created_by=user)
        .exclude(Exists(WorkItemOpen.objects.filter(user=user, issue_id=OuterRef("pk"))))
    )
    if before is not None:
        items = items.filter(created_at__lte=before)
    return items


def count_new_work_items(user, workspace_id, project_ids=None):
    by_project = {
        str(row["project_id"]): row["count"]
        for row in new_work_items(user, workspace_id, project_ids)
        .order_by()
        .values("project_id")
        .annotate(count=Count("id"))
    }
    return {"total": sum(by_project.values()), "by_project": by_project}


def mark_all_read(user, workspace_id, before, project_ids=None):
    """Moves the person's cutoff of the projects to `before`; returns how many new work items it cleared."""
    cleared = new_work_items(user, workspace_id, project_ids, before=before).count()
    for row in memberships(user, workspace_id, project_ids):
        cutoff, created = UnreadProjectCutoff.objects.get_or_create(
            user=user, project_id=row.project_id, defaults={"since": before}
        )
        if not created and cutoff.since < before:
            cutoff.since = before
            cutoff.save(update_fields=["since"])
    return cleared


def visible_work_item(user, project_id, issue_id):
    """The work item if the person may open it (active member; restricted guests only their own), else None."""
    row = (
        ProjectMember.objects.filter(member=user, project_id=project_id, is_active=True)
        .select_related("project")
        .first()
    )
    if row is None:
        return None
    issue = Issue.issue_objects.filter(pk=issue_id, project_id=project_id).first()
    if issue is None:
        return None
    if not can_see_others(row) and issue.created_by_id != user.id:
        return None
    return issue


def record_open(user, issue):
    WorkItemOpen.objects.get_or_create(
        user=user,
        issue=issue,
        defaults={"project_id": issue.project_id, "workspace_id": issue.workspace_id},
    )


def serialize_work_items(items):
    return [
        {
            "id": str(item.id),
            "name": item.name,
            "sequence_id": item.sequence_id,
            "priority": item.priority,
            "created_at": item.created_at.isoformat(),
            "project": {
                "id": str(item.project_id),
                "identifier": item.project.identifier,
                "name": item.project.name,
            },
            "state": (
                {
                    "id": str(item.state_id),
                    "name": item.state.name,
                    "group": item.state.group,
                    "color": item.state.color,
                }
                if item.state_id
                else None
            ),
            "created_by": (
                {
                    "id": str(item.created_by_id),
                    "display_name": item.created_by.display_name,
                    "avatar_url": item.created_by.avatar_url,
                }
                if item.created_by_id
                else None
            ),
        }
        for item in items
    ]
