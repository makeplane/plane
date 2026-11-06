# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Work item endpoints CE lacks: the workspace list and count with PQL, archive,
dependencies and relations, work logs, intake status, roles and the workspace
state catalogue (refused: states stay per project here).

Wire format: plane-sdk 0.3.1 (WorkItem, WorkItemGroupedCountResponse,
WorkItemDependencyResponse, WorkItemWithRelationType, WorkItemWorkLog,
ProjectWorklogSummary, IntakeWorkItem, Role).
"""

import json
import uuid
from collections import Counter, defaultdict

from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from django.db.models import Q, Sum
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.api.serializers import IntakeIssueSerializer, IntakeIssueUpdateSerializer, IssueSerializer
from plane.api.views.issue import (
    guest_cannot_view_issue,
    is_project_or_workspace_admin,
    is_restricted_guest,
    visible_issue_q,
)
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import (
    CycleIssue,
    IntakeIssue,
    Issue,
    IssueAssignee,
    IssueLabel,
    IssueRelation,
    ModuleIssue,
    ProjectMember,
    WorkspaceMember,
)
from plane.nexus.models import (
    MilestoneWorkItem,
    ReleaseWorkItem,
    WorkItemCustomRelation,
    WorkItemRelationDefinition,
    WorkItemWorkLog,
)
from plane.nexus.pql import PQLError, apply_pql, pql_fields
from plane.nexus.serializers.work_item import WorkItemWorkLogSerializer, related_work_items
from plane.utils.host import base_host
from plane.utils.order_queryset import order_issue_queryset
from plane.utils.permissions import ProjectAdminPermission, WorkspaceEntityPermission, WorkspaceUserPermission

from .base import NexusAPIView, NexusProjectAPIView

# --------------------------------------------------------------------------- shared

FILTERS_UNSUPPORTED = "The structured `filters` parameter is not supported here; filter with `pql` instead."


def pql_error(exc: PQLError) -> Response:
    """The 400 the MCP's pql_failure turns into a correctable answer."""
    return Response({"error": str(exc), "pql": [str(exc)]}, status=status.HTTP_400_BAD_REQUEST)


def _uuid(value) -> str | None:
    try:
        return str(uuid.UUID(str(value)))
    except (TypeError, ValueError, AttributeError):
        return None


def _activity(request, kind: str, issue_id, project_id, requested: dict, current=None) -> None:
    issue_activity.delay(
        type=kind,
        requested_data=json.dumps(requested, cls=DjangoJSONEncoder),
        actor_id=str(request.user.id),
        issue_id=str(issue_id),
        project_id=str(project_id),
        current_instance=json.dumps(current, cls=DjangoJSONEncoder) if current is not None else None,
        epoch=int(timezone.now().timestamp()),
        notification=True,
        origin=base_host(request=request, is_app=True),
    )


def visible_work_items(user, slug: str, referenced: set[str]):
    """Work items `user` may view in the workspace, scoped like Plane's issue list.

    Drafts, archived and intake (triage) work items are left out unless the PQL
    asks about them (isDraft, isArchived, isIntake), as Plane's default manager does.
    """
    queryset = Issue.objects.filter(
        workspace__slug=slug,
        project__archived_at__isnull=True,
        project__deleted_at__isnull=True,
        id__in=Issue.objects.filter(visible_issue_q(user)).values("id"),
    )
    if "isDraft" not in referenced:
        queryset = queryset.exclude(is_draft=True)
    if "isArchived" not in referenced:
        queryset = queryset.exclude(archived_at__isnull=False)
    if "isIntake" not in referenced:
        queryset = queryset.exclude(state__group="triage")
    return queryset


def _filtered_work_items(request, slug):
    """The PQL-filtered workspace queryset, or the error Response to return."""
    if request.GET.get("filters"):
        return None, Response({"error": FILTERS_UNSUPPORTED, "pql": [FILTERS_UNSUPPORTED]}, status=400)
    raw_project = request.GET.get("project_id") or request.GET.get("project")
    project_id = _uuid(raw_project) if raw_project else None
    if raw_project and project_id is None:
        return None, NexusAPIView.error(f"project_id must be a project UUID, got {raw_project!r}.")
    pql = request.GET.get("pql")
    try:
        queryset = visible_work_items(request.user, slug, pql_fields(pql))
        queryset = apply_pql(queryset, pql, user=request.user, workspace_slug=slug)
    except PQLError as exc:
        return None, pql_error(exc)
    if project_id:
        queryset = queryset.filter(project_id=project_id)
    return queryset, None


class _IssueScoped:
    """Resolve the URL work item inside the URL project, hiding it from restricted guests."""

    def get_issue(self, request, slug, project_id, issue_id) -> Issue:
        issue = get_object_or_404(
            Issue.objects.select_related("project", "state"), workspace__slug=slug, project_id=project_id, pk=issue_id
        )
        if guest_cannot_view_issue(request.user.id, issue, slug):
            raise Http404
        return issue


def _work_item_page(view, request, queryset, default_order: str):
    for param in ("external_id", "external_source"):
        if request.GET.get(param):
            queryset = queryset.filter(**{param: request.GET[param]})
    queryset = queryset.select_related("project", "workspace", "state", "parent")
    queryset, _ = order_issue_queryset(queryset, request.GET.get("order_by") or default_order)
    return view.paginate(
        request=request,
        queryset=queryset,
        on_results=lambda rows: IssueSerializer(rows, many=True, fields=view.fields, expand=view.expand).data,
    )


# --------------------------------------------------------------------------- list and count


class WorkspaceWorkItemListEndpoint(NexusAPIView):
    """GET ~/work-items/: every work item the caller can view, filtered by PQL."""

    permission_classes = [WorkspaceEntityPermission]

    def get(self, request, slug):
        queryset, failure = _filtered_work_items(request, slug)
        if failure:
            return failure
        return _work_item_page(self, request, queryset, "-created_at")


def _through(model, column):
    def pairs(ids):
        return model.objects.filter(issue_id__in=ids).values_list("issue_id", column)

    return pairs


# group_by key -> an Issue column, or a function giving (issue_id, value) rows for many-valued keys.
GROUP_BY = {
    "state_id": "state_id",
    "state__group": "state__group",
    "priority": "priority",
    "project_id": "project_id",
    "type_id": "type_id",
    "labels__id": _through(IssueLabel, "label_id"),
    "assignees__id": _through(IssueAssignee, "assignee_id"),
    "issue_module__module_id": _through(ModuleIssue, "module_id"),
    "release_work_items__release_id": _through(ReleaseWorkItem, "release_id"),
    "cycle_id": _through(CycleIssue, "cycle_id"),
    "milestone_id": _through(MilestoneWorkItem, "milestone_id"),
    "created_by": "created_by_id",
    "target_date": "target_date",
    "start_date": "start_date",
}


def _group_key(value) -> str:
    if value is None:
        return "None"
    return value.isoformat() if hasattr(value, "isoformat") else str(value)


def _keys_by_issue(queryset, group: str) -> dict:
    """issue id -> the group keys it counts under ("None" when it has no value)."""
    source = GROUP_BY[group]
    if isinstance(source, str):
        return {issue_id: [_group_key(value)] for issue_id, value in queryset.values_list("id", source)}
    keys = {issue_id: [] for issue_id in queryset.values_list("id", flat=True)}
    for issue_id, value in source(queryset.values("id")):
        key = _group_key(value)
        if issue_id in keys and key not in keys[issue_id]:
            keys[issue_id].append(key)
    return {issue_id: values or ["None"] for issue_id, values in keys.items()}


class WorkspaceWorkItemCountEndpoint(NexusAPIView):
    """GET ~/work-items/count/: plane-sdk WorkItemGroupedCountResponse."""

    permission_classes = [WorkspaceEntityPermission]

    def get(self, request, slug):
        group_by = request.GET.get("group_by") or None
        sub_group_by = request.GET.get("sub_group_by") or None
        for name, value in (("group_by", group_by), ("sub_group_by", sub_group_by)):
            if value is not None and value not in GROUP_BY:
                return self.error(f"{name} must be one of: {', '.join(GROUP_BY)}. Got {value!r}.")
        if sub_group_by and not group_by:
            return self.error("sub_group_by can only be used together with group_by.")
        if sub_group_by and sub_group_by == group_by:
            return self.error("sub_group_by must differ from group_by.")
        queryset, failure = _filtered_work_items(request, slug)
        if failure:
            return failure

        body = {"grouped_by": group_by, "sub_grouped_by": sub_group_by, "total_count": 0, "grouped_counts": {}}
        if not group_by:
            body["total_count"] = queryset.count()
            return Response(body)

        groups = _keys_by_issue(queryset, group_by)
        subs = _keys_by_issue(queryset, sub_group_by) if sub_group_by else {}
        counts: Counter = Counter()
        sub_counts: dict = defaultdict(Counter)
        for issue_id, keys in groups.items():
            for key in keys:
                counts[key] += 1
                for sub_key in subs.get(issue_id, []):
                    sub_counts[key][sub_key] += 1
        body["total_count"] = len(groups)
        for key, count in counts.most_common():
            entry = {"count": count}
            if sub_group_by:
                entry["sub_grouped_counts"] = {sk: {"count": sc} for sk, sc in sub_counts[key].most_common()}
            body["grouped_counts"][key] = entry
        return Response(body)


# --------------------------------------------------------------------------- archive


class WorkItemArchiveEndpoint(_IssueScoped, NexusProjectAPIView):
    """POST .../work-items/<id>/archive/ and DELETE .../work-items/<id>/unarchive/ (plane/app archive rules)."""

    def post(self, request, slug, project_id, issue_id):
        issue = self.get_issue(request, slug, project_id, issue_id)
        if issue.archived_at:
            return self.error("This work item is already archived.")
        if issue.is_draft:
            return self.error("A draft work item cannot be archived.")
        if issue.state is None or issue.state.group not in ("completed", "cancelled"):
            return self.error("Can only archive completed or cancelled state group issue")
        _activity(
            request,
            "issue.activity.updated",
            issue.id,
            project_id,
            {"archived_at": str(timezone.now().date()), "automation": False},
            IssueSerializer(issue).data,
        )
        issue.archived_at = timezone.now().date()
        issue.save()
        return Response({"archived_at": str(issue.archived_at)}, status=status.HTTP_200_OK)

    def delete(self, request, slug, project_id, issue_id):
        issue = self.get_issue(request, slug, project_id, issue_id)
        if not issue.archived_at:
            return self.error("This work item is not archived.")
        _activity(
            request, "issue.activity.updated", issue.id, project_id, {"archived_at": None}, IssueSerializer(issue).data
        )
        issue.archived_at = None
        issue.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ArchivedWorkItemListEndpoint(NexusProjectAPIView):
    """GET .../archived-work-items/: plane-sdk PaginatedWorkItemResponse."""

    def get(self, request, slug, project_id):
        self.get_project()
        queryset = Issue.objects.filter(
            workspace__slug=slug, project_id=project_id, archived_at__isnull=False, is_draft=False
        )
        if is_restricted_guest(request.user.id, project_id, slug):
            queryset = queryset.filter(created_by=request.user)
        try:
            queryset = apply_pql(queryset, request.GET.get("pql"), user=request.user, workspace_slug=slug)
        except PQLError as exc:
            return pql_error(exc)
        return _work_item_page(self, request, queryset, "-archived_at")


# --------------------------------------------------------------------------- relations

# Dependency label (from the viewed work item's side) -> (stored relation_type, stored reversed).
# CE stores one row per relation: "A blocked_by B" is (issue=A, related_issue=B), and
# "B blocking A" is that same row seen from B, as the web app does.
DEPENDENCIES = {
    "blocked_by": ("blocked_by", False),
    "blocking": ("blocked_by", True),
    "start_before": ("start_before", False),
    "start_after": ("start_before", True),
    "finish_before": ("finish_before", False),
    "finish_after": ("finish_before", True),
}
DEPENDENCY_STORED = ("blocked_by", "start_before", "finish_before")
_INVERSE = {"blocked_by": "blocking", "start_before": "start_after", "finish_before": "finish_after"}

# CE's two symmetric relation types, served as built-in relation definitions with stable ids.
_DEFINITION_NS = uuid.UUID("6f1d3c52-9a43-4c1e-b6a0-5be0d1c0a7e1")
BUILTIN_RELATION_DEFINITIONS = {
    "relates_to": {
        "id": str(uuid.uuid5(_DEFINITION_NS, "relates_to")),
        "name": "Relates to",
        "outward": "relates_to",
        "inward": "relates_to",
    },
    "duplicate": {
        "id": str(uuid.uuid5(_DEFINITION_NS, "duplicate")),
        "name": "Duplicate",
        "outward": "duplicate",
        "inward": "duplicate",
    },
}
CUSTOM_STORED = tuple(BUILTIN_RELATION_DEFINITIONS)
_RELATION_ALIASES = {
    "relates to": "relates_to",
    "related to": "relates_to",
    "related": "relates_to",
    "duplicate": "duplicate",
    "duplicates": "duplicate",
    "duplicate of": "duplicate",
    "duplicated by": "duplicate",
}


def _pair(a, b) -> Q:
    return Q(issue_id=a, related_issue_id=b) | Q(issue_id=b, related_issue_id=a)


def _work_item_ids(body: dict, key: str):
    raw = body.get(key)
    if not isinstance(raw, list) or not raw:
        return None, f"{key} must be a non-empty list of work item UUIDs."
    bad = [value for value in raw if _uuid(value) is None]
    if bad:
        return None, f"{key} must contain work item UUIDs; not UUIDs: {', '.join(map(str, bad))}."
    return list(dict.fromkeys(_uuid(value) for value in raw)), None


def _norm(label) -> str:
    return " ".join(str(label or "").lower().replace("_", " ").split())


class _RelationBase(_IssueScoped, NexusProjectAPIView):
    def targets(self, request, slug, issue, ids):
        """The body's work items (in this workspace, and visible to the caller), or an
        error naming the ones that are not."""
        if str(issue.id) in ids:
            return None, "A work item cannot be related to itself."
        visible = Issue.objects.filter(visible_issue_q(request.user)).values("id")
        found = {str(i.id): i for i in Issue.issue_objects.filter(workspace__slug=slug, pk__in=ids, id__in=visible)}
        missing = [i for i in ids if i not in found]
        if missing:
            return None, f"No work item with id {', '.join(missing)} in this workspace."
        return [found[i] for i in ids], None

    def visible_q(self, request, issue) -> Q:
        visible = Issue.objects.filter(visible_issue_q(request.user)).values("id")
        return Q(issue_id=issue.id, related_issue_id__in=visible) | Q(related_issue_id=issue.id, issue_id__in=visible)

    def describe(self, pairs) -> list[dict]:
        """WorkItemWithRelationType rows for (other work item id, label from the viewed side) pairs."""
        others = {i.id: i for i in Issue.objects.filter(pk__in={o for o, _ in pairs}).select_related("project", "type")}
        items = []
        for other_id, label in pairs:
            if other_id in others:
                items.extend(related_work_items([others[other_id]], lambda _, label=label: label))
        return items

    def created(self, request, issue, project_id, relation_type, targets, activity=True, new=None) -> Response:
        """201 with every target; the activity log records only the relations actually added (`new`)."""
        logged = targets if new is None else new
        if activity and logged:
            _activity(
                request,
                "issue_relation.activity.created",
                issue.id,
                project_id,
                {"relation_type": relation_type, "issues": [str(t.id) for t in logged]},
            )
        items = related_work_items(
            Issue.objects.filter(pk__in=[t.id for t in targets]).select_related("project", "type"),
            lambda _: relation_type,
        )
        return Response(items, status=status.HTTP_201_CREATED)

    @staticmethod
    def name_of(work_item) -> str:
        return f"{work_item.project.identifier}-{work_item.sequence_id}"

    def conflict(self, issue, target, row) -> Response:
        """409 for a pair already joined by a relation of the other kind.

        The pair (issue, related_issue) holds a single row of any type, so adding a
        dependency would have to delete a relates_to/duplicate relation, and the other
        way round. That is the caller's decision, so ask for it explicitly.
        """
        kind = "dependency" if row.relation_type in DEPENDENCY_STORED else "relation"
        return self.error(
            f"{self.name_of(issue)} and {self.name_of(target)} are already linked as '{self.label(issue, row)}'. "
            f"Remove that {kind} first, then add this one.",
            code="RELATION_EXISTS",
            http_status=status.HTTP_409_CONFLICT,
        )

    def supersede(self, issue, rows) -> list[tuple]:
        """Delete relations a new one replaces; (other work item id, label) for each, to log."""
        IssueRelation.objects.filter(pk__in=[row.pk for row in rows]).delete()
        return [
            (row.related_issue_id if row.issue_id == issue.id else row.issue_id, self.label(issue, row)) for row in rows
        ]

    @staticmethod
    def label(issue, row) -> str:
        """A stored relation's label as seen from `issue` (blocked_by seen from the other side is blocking)."""
        if row.issue_id == issue.id:
            return row.relation_type
        return _INVERSE.get(row.relation_type, row.relation_type)

    def removed(self, request, issue, project_id, related_issue_id, label) -> None:
        _activity(
            request,
            "issue_relation.activity.deleted",
            issue.id,
            project_id,
            {"related_issue": str(related_issue_id), "relation_type": label},
            {"id": str(related_issue_id), "relation_type": label},
        )


class WorkItemDependencyEndpoint(_RelationBase):
    """GET/POST .../dependencies/ and DELETE .../dependencies/<related>/."""

    def get(self, request, slug, project_id, issue_id):
        issue = self.get_issue(request, slug, project_id, issue_id)
        rows = IssueRelation.objects.filter(
            self.visible_q(request, issue), relation_type__in=DEPENDENCY_STORED, workspace_id=issue.workspace_id
        )
        pairs = [
            (row.related_issue_id, row.relation_type)
            if row.issue_id == issue.id
            else (row.issue_id, _INVERSE[row.relation_type])
            for row in rows
        ]
        body = {label: [] for label in DEPENDENCIES}
        for item in self.describe(pairs):
            body[item["relation_type"]].append(item)
        return Response(body)

    def post(self, request, slug, project_id, issue_id):
        issue = self.get_issue(request, slug, project_id, issue_id)
        body = request.data if isinstance(request.data, dict) else {}
        relation_type = body.get("relation_type")
        if relation_type not in DEPENDENCIES:
            return self.error(f"relation_type must be one of: {', '.join(DEPENDENCIES)}.")
        ids, err = _work_item_ids(body, "work_item_ids")
        if err:
            return self.error(err)
        targets, err = self.targets(request, slug, issue, ids)
        if err:
            return self.error(err)
        stored, reverse = DEPENDENCIES[relation_type]
        plans = []
        for target in targets:
            source, related = (target, issue) if reverse else (issue, target)
            other = IssueRelation.objects.filter(
                issue_id=source.id, related_issue_id=related.id, relation_type__in=CUSTOM_STORED
            ).first()
            if other is not None:
                return self.conflict(issue, target, other)
            # One dependency per pair: a different one between the two is replaced.
            current = list(
                IssueRelation.objects.filter(_pair(issue.id, target.id), relation_type__in=DEPENDENCY_STORED)
            )
            wanted = (source.id, related.id, stored)
            exists = any((r.issue_id, r.related_issue_id, r.relation_type) == wanted for r in current)
            plans.append((target, source, related, [] if exists else current, not exists))
        removals = []
        with transaction.atomic():
            for _, source, related, superseded, create in plans:
                removals += self.supersede(issue, superseded)
                if create:
                    IssueRelation.objects.create(
                        issue=source,
                        related_issue=related,
                        relation_type=stored,
                        project_id=project_id,
                        workspace_id=issue.workspace_id,
                    )
        for other, label in removals:
            self.removed(request, issue, project_id, other, label)
        new = [plan[0] for plan in plans if plan[4]]
        return self.created(request, issue, project_id, relation_type, targets, new=new)

    def delete(self, request, slug, project_id, issue_id, related_issue_id):
        issue = self.get_issue(request, slug, project_id, issue_id)
        row = IssueRelation.objects.filter(
            _pair(issue.id, related_issue_id),
            self.visible_q(request, issue),
            relation_type__in=DEPENDENCY_STORED,
            workspace_id=issue.workspace_id,
        ).first()
        if row is None:
            return self.error("No dependency between these work items.", http_status=status.HTTP_404_NOT_FOUND)
        label = row.relation_type if row.issue_id == issue.id else _INVERSE[row.relation_type]
        row.delete()
        self.removed(request, issue, project_id, related_issue_id, label)
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkItemRelationEndpoint(_RelationBase):
    """GET/POST .../work-item-relations/ and DELETE .../work-item-relations/<related>/.

    Keys are relation labels: CE's symmetric relates_to and duplicate (stored in
    issue_relations, so the web app shows them), plus the outward and inward
    labels of every active workspace relation definition.
    """

    def definitions(self, issue):
        return WorkItemRelationDefinition.objects.filter(workspace_id=issue.workspace_id)

    def get(self, request, slug, project_id, issue_id):
        issue = self.get_issue(request, slug, project_id, issue_id)
        visible = self.visible_q(request, issue)
        body = {label: [] for label in CUSTOM_STORED}
        for definition in self.definitions(issue).filter(is_active=True):
            for label in _labels(definition):
                body.setdefault(label, [])
        pairs = [
            (row.related_issue_id if row.issue_id == issue.id else row.issue_id, row.relation_type)
            for row in IssueRelation.objects.filter(
                visible, relation_type__in=CUSTOM_STORED, workspace_id=issue.workspace_id
            )
        ]
        custom = WorkItemCustomRelation.objects.filter(
            visible, workspace_id=issue.workspace_id, definition__is_active=True, definition__deleted_at__isnull=True
        ).select_related("definition")
        for row in custom:
            outward, inward = _labels(row.definition)
            forward = row.issue_id == issue.id
            pairs.append((row.related_issue_id if forward else row.issue_id, outward if forward else inward))
        for item in self.describe(pairs):
            body.setdefault(item["relation_type"], []).append(item)
        return Response(body)

    def post(self, request, slug, project_id, issue_id):
        issue = self.get_issue(request, slug, project_id, issue_id)
        body = request.data if isinstance(request.data, dict) else {}
        label = _norm(body.get("relation_definition_type"))
        definition_id = _uuid(body.get("relation_definition_id"))
        definition = self.definitions(issue).filter(pk=definition_id).first() if definition_id else None
        builtin = _RELATION_ALIASES.get(label)
        if definition is None and builtin is None:
            if definition_id and definition_id not in {d["id"] for d in BUILTIN_RELATION_DEFINITIONS.values()}:
                return self.error("Relation definition not found in this workspace.", http_status=404)
            return self.error(
                "Pass relation_definition_id and relation_definition_label from the list_definitions action, "
                f"or one of the built-in relations: {', '.join(CUSTOM_STORED)}."
            )
        if definition is not None:
            outward, inward = _labels(definition)
            if not definition.is_active:
                return self.error(f"The relation definition '{definition.name}' is inactive.")
            if label not in (_norm(outward), _norm(inward)):
                return self.error(
                    f"relation_definition_type must be the definition's outward label '{outward}' "
                    f"or its inward label '{inward}'."
                )
        ids, err = _work_item_ids(body, "work_item_ids")
        if err:
            return self.error(err)
        targets, err = self.targets(request, slug, issue, ids)
        if err:
            return self.error(err)
        if definition is not None:
            reverse = label != _norm(outward)
            with transaction.atomic():
                for target in targets:
                    WorkItemCustomRelation.objects.filter(_pair(issue.id, target.id), definition=definition).delete()
                    WorkItemCustomRelation.objects.create(
                        definition=definition,
                        issue=target if reverse else issue,
                        related_issue=issue if reverse else target,
                        project_id=project_id,
                    )
            return self.created(request, issue, project_id, inward if reverse else outward, targets, activity=False)
        plans = []
        for target in targets:
            dependency = IssueRelation.objects.filter(
                issue_id=issue.id, related_issue_id=target.id, relation_type__in=DEPENDENCY_STORED
            ).first()
            if dependency is not None:
                return self.conflict(issue, target, dependency)
            # relates_to and duplicate are symmetric: one of them per pair, in either direction.
            current = list(IssueRelation.objects.filter(_pair(issue.id, target.id), relation_type__in=CUSTOM_STORED))
            exists = any(r.relation_type == builtin for r in current)
            plans.append((target, [r for r in current if r.relation_type != builtin], not exists))
        removals = []
        with transaction.atomic():
            for target, superseded, create in plans:
                removals += self.supersede(issue, superseded)
                if create:
                    IssueRelation.objects.create(
                        issue=issue,
                        related_issue=target,
                        relation_type=builtin,
                        project_id=project_id,
                        workspace_id=issue.workspace_id,
                    )
        for other, label in removals:
            self.removed(request, issue, project_id, other, label)
        new = [target for target, _, create in plans if create]
        return self.created(request, issue, project_id, builtin, targets, new=new)

    def delete(self, request, slug, project_id, issue_id, related_issue_id):
        """Remove one relation between the pair.

        This used to delete every relation the two shared, built-in and custom
        alike. plane-sdk's remove() names no relation, so a pair joined by more
        than one is refused with the list, and `?relation_definition_id=` (a
        definition's id, or a built-in one's from the definitions list) picks one.
        """
        issue = self.get_issue(request, slug, project_id, issue_id)
        rows = Q(_pair(issue.id, related_issue_id)) & self.visible_q(request, issue)
        builtin = IssueRelation.objects.filter(rows, relation_type__in=CUSTOM_STORED, workspace_id=issue.workspace_id)
        # As GET shows them: a relation under an inactive definition is not offered.
        custom = WorkItemCustomRelation.objects.filter(
            rows, workspace_id=issue.workspace_id, definition__is_active=True, definition__deleted_at__isnull=True
        ).select_related("definition")
        wanted = request.query_params.get("relation_definition_id")
        if wanted:
            wanted_id = _uuid(wanted)
            if wanted_id is None:
                return self.error("relation_definition_id must be a UUID.")
            builtin_ids = {d["id"]: key for key, d in BUILTIN_RELATION_DEFINITIONS.items()}
            if wanted_id in builtin_ids:
                builtin, custom = builtin.filter(relation_type=builtin_ids[wanted_id]), custom.none()
            else:
                builtin, custom = builtin.none(), custom.filter(definition_id=wanted_id)
        found = [(row, row.relation_type, BUILTIN_RELATION_DEFINITIONS[row.relation_type]["id"]) for row in builtin]
        for row in custom:
            outward, inward = _labels(row.definition)
            found.append((row, outward if row.issue_id == issue.id else inward, str(row.definition_id)))
        if not found:
            return self.error("No relation between these work items.", http_status=status.HTTP_404_NOT_FOUND)
        if len(found) > 1:
            listed = "; ".join(f"'{label}' (relation_definition_id {definition})" for _, label, definition in found)
            return self.error(
                f"These work items are linked by more than one relation: {listed}. Pass relation_definition_id "
                "to say which one to remove.",
                code="AMBIGUOUS_RELATION",
                http_status=status.HTTP_409_CONFLICT,
            )
        row, label, _ = found[0]
        row.delete()
        if isinstance(row, IssueRelation):
            self.removed(request, issue, project_id, related_issue_id, label)
        return Response(status=status.HTTP_204_NO_CONTENT)


def _labels(definition) -> tuple[str, str]:
    """A definition's (outward, inward) labels; a missing one falls back to the other, then the name."""
    outward = definition.outward or definition.inward or definition.name
    return outward, definition.inward or outward


# --------------------------------------------------------------------------- work logs


class WorkLogEndpoint(_IssueScoped, NexusProjectAPIView):
    """.../work-items/<id>/worklogs/[<log>/]: plane-sdk WorkItemWorkLog (duration in minutes).

    Members and admins log time; a log is changed or removed by whoever logged it
    or by a project admin.
    """

    def get(self, request, slug, project_id, issue_id):
        issue = self.get_issue(request, slug, project_id, issue_id)
        logs = WorkItemWorkLog.objects.filter(issue=issue, project_id=project_id).order_by("-created_at")
        return Response(WorkItemWorkLogSerializer(logs, many=True).data)

    def post(self, request, slug, project_id, issue_id):
        issue = self.get_issue(request, slug, project_id, issue_id)
        serializer = WorkItemWorkLogSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        log = serializer.save(issue=issue, project_id=issue.project_id, logged_by=request.user)
        return Response(WorkItemWorkLogSerializer(log).data, status=status.HTTP_201_CREATED)

    def get_log(self, request, slug, project_id, issue_id, pk):
        issue = self.get_issue(request, slug, project_id, issue_id)
        log = get_object_or_404(WorkItemWorkLog, pk=pk, issue=issue, project_id=project_id)
        if log.logged_by_id != request.user.id and not is_project_or_workspace_admin(request.user.id, project_id, slug):
            return None, Response(
                {"error": "Only the person who logged this time or a project admin can change it."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return log, None

    def patch(self, request, slug, project_id, issue_id, pk):
        log, denied = self.get_log(request, slug, project_id, issue_id, pk)
        if denied:
            return denied
        serializer = WorkItemWorkLogSerializer(log, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(WorkItemWorkLogSerializer(serializer.save()).data)

    def delete(self, request, slug, project_id, issue_id, pk):
        log, denied = self.get_log(request, slug, project_id, issue_id, pk)
        if denied:
            return denied
        log.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectWorklogSummaryEndpoint(NexusProjectAPIView):
    """GET .../projects/<id>/total-worklogs/: [{issue_id, duration}] per work item, in minutes."""

    def get(self, request, slug, project_id):
        self.get_project()
        logs = WorkItemWorkLog.objects.filter(
            workspace__slug=slug, project_id=project_id, issue__deleted_at__isnull=True
        )
        if is_restricted_guest(request.user.id, project_id, slug):
            logs = logs.filter(issue__created_by=request.user)
        totals = logs.values("issue_id").annotate(total=Sum("duration")).order_by("-total", "issue_id")
        return Response([{"issue_id": str(row["issue_id"]), "duration": row["total"]} for row in totals])


# --------------------------------------------------------------------------- intake status

INTAKE_STATUS_FIELDS = ("status", "snoozed_till", "duplicate_to", "source", "source_email")
INTAKE_STATUSES = (-2, -1, 0, 1, 2)


class IntakeStatusEndpoint(NexusProjectAPIView):
    """PATCH .../intake-issues/<issue_id>/status/: a triage decision.

    Project admins (or workspace admins in the project) only, as in the web app
    and the stock intake PATCH, which ignore status changes from anyone else.
    """

    permission_classes = [ProjectAdminPermission]

    def patch(self, request, slug, project_id, issue_id):
        project = self.get_project()
        intake_issue = get_object_or_404(
            IntakeIssue.objects.select_related("issue", "issue__state"),
            issue_id=issue_id,
            workspace__slug=slug,
            project_id=project_id,
        )
        body = request.data if isinstance(request.data, dict) else {}
        data = {key: body[key] for key in INTAKE_STATUS_FIELDS if key in body}
        if not data:
            return self.error(f"Send at least one of: {', '.join(INTAKE_STATUS_FIELDS)}.")
        new_status = data.get("status")
        if "status" in data and (isinstance(new_status, bool) or new_status not in INTAKE_STATUSES):
            return self.error("status must be -2 (pending), -1 (declined), 0 (snoozed), 1 (accepted) or 2 (duplicate).")
        if new_status == 0 and not data.get("snoozed_till"):
            return self.error("snoozed_till is required when status is 0 (snoozed).")
        if new_status == 2 and not data.get("duplicate_to"):
            return self.error("duplicate_to is required when status is 2 (duplicate).")
        if data.get("duplicate_to"):
            duplicate_to = _uuid(data["duplicate_to"])
            if duplicate_to is None or duplicate_to == str(issue_id):
                return self.error("duplicate_to must be the UUID of another work item.")
            if not Issue.objects.filter(pk=duplicate_to, workspace_id=project.workspace_id).exists():
                return self.error("duplicate_to: no such work item in this workspace.")
            data["duplicate_to"] = duplicate_to
        serializer = IntakeIssueUpdateSerializer(intake_issue, data=data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        current = IntakeIssueSerializer(intake_issue).data
        serializer.save()
        issue_activity.delay(
            type="intake.activity.created",
            requested_data=json.dumps(data, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=json.dumps(current, cls=DjangoJSONEncoder),
            epoch=int(timezone.now().timestamp()),
            notification=False,
            origin=base_host(request=request, is_app=True),
            intake=str(intake_issue.id),
        )
        intake_issue.refresh_from_db()
        return Response(IntakeIssueSerializer(intake_issue).data, status=status.HTTP_200_OK)


# --------------------------------------------------------------------------- roles

# CE has fixed roles, the same three in a workspace and in a project.
_ROLE_NS = uuid.UUID("0b8f6c1e-3f9d-4b5a-9e47-2d6c1a8e5f30")
_ROLE_LEVELS = (("admin", "Admin", 20), ("member", "Member", 15), ("guest", "Guest", 5))
_ROLE_DESCRIPTIONS = {
    ("workspace", "admin"): "Manages workspace settings, members and every project.",
    ("workspace", "member"): "Creates projects and works in the projects they belong to.",
    ("workspace", "guest"): "Views and comments where they are invited.",
    ("project", "admin"): "Manages project settings, members and features.",
    ("project", "member"): "Creates and edits work items, cycles, modules and pages.",
    ("project", "guest"): "Views the project and comments; sees only their own work items unless guests may view all.",
}
NAMESPACES = ("project", "workspace")


def role_id(namespace: str, slug: str) -> str:
    """The stable id of a CE role: the same in every workspace and every deployment."""
    return str(uuid.uuid5(_ROLE_NS, f"{namespace}:{slug}"))


def _roles(slug: str, namespace: str | None) -> list[dict]:
    counts = {
        "workspace": Counter(
            WorkspaceMember.objects.filter(workspace__slug=slug, is_active=True).values_list("role", flat=True)
        ),
        "project": Counter(
            ProjectMember.objects.filter(
                workspace__slug=slug, is_active=True, project__deleted_at__isnull=True
            ).values_list("role", flat=True)
        ),
    }
    return [
        {
            "id": role_id(ns, role_slug),
            "name": name,
            "slug": role_slug,
            "namespace": ns,
            "level": level,
            "description": _ROLE_DESCRIPTIONS[(ns, role_slug)],
            "sort_order": order,
            "is_default": True,
            "is_system": True,
            "permissions": [],
            "member_count": counts[ns][level],
        }
        for ns in NAMESPACES
        if not namespace or ns == namespace
        for order, (role_slug, name, level) in enumerate(_ROLE_LEVELS)
    ]


def static_page(request, items: list) -> dict | None:
    """Cursor-page an in-memory list in Plane's envelope (cursor is "per_page:page:is_prev"); None if invalid."""
    try:
        per_page = max(1, min(int(request.GET.get("per_page") or 20), 100))
        page = int(request.GET["cursor"].split(":")[1]) if request.GET.get("cursor") else 0
    except (ValueError, IndexError):
        return None
    if page < 0:
        return None
    total = len(items)
    rows = items[page * per_page : (page + 1) * per_page]
    return {
        "grouped_by": None,
        "sub_grouped_by": None,
        "total_count": total,
        "next_cursor": f"{per_page}:{page + 1}:0",
        "prev_cursor": f"{per_page}:{max(page - 1, 0)}:1",
        "next_page_results": (page + 1) * per_page < total,
        "prev_page_results": page > 0,
        "count": len(rows),
        "total_pages": max(1, -(-total // per_page)),
        "total_results": total,
        "extra_stats": None,
        "results": rows,
    }


class RoleEndpoint(NexusAPIView):
    """GET ~/roles/ and ~/roles/<id>/: plane-sdk PaginatedRoleResponse / Role."""

    permission_classes = [WorkspaceUserPermission]

    def get(self, request, slug, role_id=None):
        self.get_workspace()
        if role_id is not None:
            role = next((r for r in _roles(slug, None) if r["id"] == str(role_id)), None)
            if role is None:
                return self.error("Role not found.", http_status=status.HTTP_404_NOT_FOUND)
            return Response(role)
        namespace = request.GET.get("namespace") or None
        if namespace is not None and namespace not in NAMESPACES:
            return self.error("namespace must be 'workspace' or 'project'.")
        page = static_page(request, _roles(slug, namespace))
        if page is None:
            return self.error("Invalid cursor or per_page parameter.")
        return Response(page)


# --------------------------------------------------------------------------- workspace states

STATES_PER_PROJECT = "This workspace keeps states per project. Pass project_id."


class WorkspaceStateEndpoint(NexusAPIView):
    """~/states/[<id>/]: refused, since states_owned_by_workspace is false here.

    The MCP's governance.project_owns() reads code "workspace_not_managed" and
    tells the caller to pass project_id.
    """

    permission_classes = [WorkspaceUserPermission]

    def refuse(self, request, slug, state_id=None):
        return Response(
            {"code": "workspace_not_managed", "error": STATES_PER_PROJECT}, status=status.HTTP_400_BAD_REQUEST
        )

    get = post = patch = delete = refuse
