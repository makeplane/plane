# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Shared query helpers for the operations dashboards, analytics and reports.

Two things live here that nothing else should re-derive: what a given user is
allowed to see, and how a semantic bucket ("QA", "blocked") becomes a set of
state ids. Both are easy to get subtly wrong in one endpoint out of twelve, and
a dashboard that quietly includes a project you were removed from is worse than
one that is missing.
"""

# Django imports
from django.db.models import Count, Q
from django.utils import timezone

# Module imports
from workspaces.db.models import Issue, IssueActivity, Project, State
from workspaces.utils.engineering_ops import get_operations_config, state_names


def visible_projects(user, slug):
    """Projects in this workspace the user is an active member of."""
    return Project.objects.filter(
        workspace__slug=slug,
        archived_at__isnull=True,
        project_projectmember__member=user,
        project_projectmember__is_active=True,
    ).distinct()


def scoped_project_ids(request, slug):
    """
    The project ids a dashboard should cover.

    Honours ``?project_id=`` (repeatable or comma-separated) but always
    intersects with what the user may see, so a guessed id buys nothing.
    """
    allowed = set(visible_projects(request.user, slug).values_list("id", flat=True))

    raw = request.query_params.getlist("project_id") or []
    if len(raw) == 1 and "," in raw[0]:
        raw = [value for value in raw[0].split(",") if value]

    if not raw:
        return list(allowed)

    requested = set()
    for value in raw:
        try:
            requested.add(_to_uuid(value))
        except (TypeError, ValueError):
            continue
    return list(allowed & requested)


def _to_uuid(value):
    import uuid

    return uuid.UUID(str(value))


def scoped_issues(project_ids):
    """Every live issue in those projects, epics excluded."""
    return Issue.issue_objects.filter(project_id__in=project_ids).exclude(type__is_epic=True)


def state_ids_for(project_ids, config, *buckets):
    """
    The state ids in those projects matching one or more semantic buckets.

    Matching is by name and case-insensitive because Workspaces states are per
    project: nine projects each have their own "QA Testing" row.
    """
    names = []
    for bucket in buckets:
        names.extend(state_names(config, bucket))
    if not names:
        return []

    query = Q()
    for name in names:
        query |= Q(name__iexact=name)

    return list(State.all_state_objects.filter(query, project_id__in=project_ids).values_list("id", flat=True))


def state_ids_by_bucket(project_ids, config, buckets):
    """``{bucket: [state ids]}`` in one query instead of one query per bucket."""
    wanted = {}
    for bucket in buckets:
        for name in state_names(config, bucket):
            wanted.setdefault(name.casefold(), []).append(bucket)

    result = {bucket: [] for bucket in buckets}
    if not wanted:
        return result

    for state_id, name in State.all_state_objects.filter(project_id__in=project_ids).values_list("id", "name"):
        for bucket in wanted.get(name.casefold(), []):
            result[bucket].append(state_id)
    return result


def dashboard_context(request, slug, buckets):
    """The config, project scope and bucket->state-id map every dashboard opens with."""
    from workspaces.db.models import Workspace

    workspace = Workspace.objects.get(slug=slug)
    config = get_operations_config(workspace.id)
    project_ids = scoped_project_ids(request, slug)
    return workspace, config, project_ids, state_ids_by_bucket(project_ids, config, buckets)


def count_by(queryset, field):
    """
    ``{value: count}`` for one field, as a plain dict.

    ``distinct`` because callers routinely pass a queryset that has already
    joined an assignee or a cycle, and a duplicated row would inflate whichever
    bucket the issue happens to be in.
    """
    return {
        row[field]: row["count"] for row in queryset.values(field).annotate(count=Count("id", distinct=True)).order_by()
    }


def overdue_filter():
    """Issues whose target date has passed and which are not finished."""
    return Q(target_date__lt=timezone.now().date()) & ~Q(state__group__in=["completed", "cancelled"])


def state_transitions(project_ids, start=None, end=None):
    """
    Every recorded state change in scope.

    Workspaces writes one ``IssueActivity`` row per state move with the state names
    in ``old_value``/``new_value`` and the ids in ``old_identifier`` /
    ``new_identifier``. That trail is the only place cycle time, QA time and
    the reopened rate can come from -- an issue's current state says nothing
    about the path it took.
    """
    queryset = IssueActivity.objects.filter(project_id__in=project_ids, field="state")
    if start:
        queryset = queryset.filter(created_at__date__gte=start)
    if end:
        queryset = queryset.filter(created_at__date__lte=end)
    return queryset


def names_for(config, *buckets):
    """The configured state names for one or more buckets, case-folded."""
    folded = set()
    for bucket in buckets:
        folded.update(name.casefold() for name in state_names(config, bucket))
    return folded
