# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Questimus fork change (QUESTIMUS-30): move a work item to another project.

POST /api/workspaces/<slug>/projects/<project_id>/issues/<issue_id>/move/
body: {"target_project_id": "<uuid>"}

Moves the issue — and every descendant of its subtree — into the destination
project inside a single transaction guarded by advisory locks on BOTH the
source and the destination project (the same lock pattern Issue.save uses for
sequence allocation; both keys taken in sorted order to avoid deadlocks).
"""

# Python imports
import json

# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.core.exceptions import ValidationError
from django.core.serializers.json import DjangoJSONEncoder
from django.db import connection, transaction
from django.db.models import Count, Max, OuterRef, Q, Subquery, UUIDField, Value
from django.db.models.functions import Coalesce
from django.utils import timezone

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import IssueSerializer
from plane.bgtasks.issue_activities_task import issue_activity
from plane.bgtasks.issue_version_sync import create_issue_version, get_related_data
from plane.bgtasks.webhook_task import model_activity
from plane.db.models import (
    CommentReaction,
    CycleIssue,
    Description,
    DescriptionVersion,
    FileAsset,
    GithubCommentSync,
    GithubIssueSync,
    IntakeIssue,
    Issue,
    IssueActivity,
    IssueAssignee,
    IssueBlocker,
    IssueComment,
    IssueDescriptionVersion,
    IssueLabel,
    IssueLink,
    IssueMention,
    IssueReaction,
    IssueRelation,
    IssueSequence,
    IssueSubscriber,
    IssueVote,
    IssueVersion,
    Label,
    ModuleIssue,
    Notification,
    Project,
    ProjectMember,
    State,
    UserFavorite,
    UserRecentVisit,
)
# Questimus fork change (QUESTIMUS-30): IssueAttachment is a legacy model not
# re-exported from plane.db.models (attachments live in FileAsset here), so
# import it from its defining module.
from plane.db.models.issue import IssueAttachment
from plane.db.models.issue_type import ProjectIssueType
from plane.utils.exception_logger import log_exception
from plane.utils.host import base_host
from plane.utils.uuid import convert_uuid_to_integer

from .. import BaseAPIView


def _chunked(ids, size=10000):
    """Yield successive fixed-size chunks from a list of ids.

    Keeps IN-lists below the PostgreSQL bind-parameter limit for very large
    subtrees (adversarial review F1).
    """
    ids = list(ids)
    for start in range(0, len(ids), size):
        yield ids[start : start + size]


def _collect_descendant_ids(root_id):
    """Return [root, ...descendants] with parents before their children.

    Soft-deleted children are included: they belong to the tree and must move
    with it (a soft-deleted child left behind would keep a parent_id pointing
    into the destination project). Their rows are simply re-pointed like any
    other moved row.
    """
    moving = [root_id]
    seen = {root_id}
    frontier = [root_id]
    while frontier:
        children = Issue.all_objects.filter(parent_id__in=frontier).values_list("id", flat=True)
        new = [child_id for child_id in children if child_id not in seen]
        moving.extend(new)
        seen.update(new)
        frontier = new
    return moving


def _annotate_issue_queryset(issues):
    """Add the queryset annotations IssueSerializer's read-only fields need.

    The serializer declares cycle_id/sub_issues_count/attachment_count/link_count
    (and label_ids/assignee_ids/module_ids) as fields sourced from instance
    attributes; without these annotations the fields are silently omitted from
    the response (DRF SkipField). Annotate so the move response matches the
    list/detail payload shape (mirrors IssueViewSet.apply_annotations and
    partial_update's ArrayAgg annotations).
    """
    return (
        issues.annotate(
            cycle_id=Subquery(
                CycleIssue.objects.filter(issue=OuterRef("id"), deleted_at__isnull=True).values("cycle_id")[:1]
            )
        )
        .annotate(
            link_count=Subquery(
                IssueLink.objects.filter(issue=OuterRef("id")).values("issue").annotate(count=Count("id")).values("count")
            )
        )
        .annotate(
            attachment_count=Subquery(
                FileAsset.objects.filter(issue_id=OuterRef("id"), entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT)
                .values("issue_id")
                .annotate(count=Count("id"))
                .values("count")
            )
        )
        .annotate(
            sub_issues_count=Subquery(
                Issue.issue_objects.filter(parent=OuterRef("id")).values("parent").annotate(count=Count("id")).values("count")
            )
        )
        .annotate(
            label_ids=Coalesce(
                ArrayAgg(
                    "labels__id",
                    distinct=True,
                    filter=Q(~Q(labels__id__isnull=True) & Q(label_issue__deleted_at__isnull=True)),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            )
        )
        .annotate(
            assignee_ids=Coalesce(
                ArrayAgg(
                    "assignees__id",
                    distinct=True,
                    filter=Q(
                        ~Q(assignees__id__isnull=True)
                        & Q(assignees__member_project__is_active=True)
                        & Q(issue_assignee__deleted_at__isnull=True)
                    ),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            )
        )
        .annotate(
            module_ids=Coalesce(
                ArrayAgg(
                    "issue_module__module_id",
                    distinct=True,
                    filter=Q(
                        ~Q(issue_module__module_id__isnull=True)
                        & Q(issue_module__module__archived_at__isnull=True)
                        & Q(issue_module__deleted_at__isnull=True)
                    ),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            )
        )
    )


def _remap_state(issue, target_project_id):
    """Resolve the destination state for a moved issue.

    Order: same-name state in the destination (case-insensitive) -> the
    destination default state -> the first non-triage destination state.
    Uses State.objects (excludes soft-deleted rows and triage states) so a
    soft-deleted source state can never be re-pointed to.
    """
    if issue.state_id is not None:
        same_name = State.objects.filter(
            project_id=target_project_id, name__iexact=issue.state.name
        ).first()
        if same_name is not None:
            return same_name
    return (
        State.objects.filter(project_id=target_project_id, default=True).first()
        or State.objects.filter(project_id=target_project_id).first()
    )


class IssueMoveEndpoint(BaseAPIView):
    """Move a work item (and its subtree) into another project of the workspace."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, issue_id):
        # --- Payload -------------------------------------------------------
        # A JSON non-object body (list/str) makes request.data a non-dict;
        # guard so .get cannot raise an unhandled AttributeError (500).
        payload = request.data if isinstance(request.data, dict) else {}
        target_project_id = payload.get("target_project_id", None)
        if not target_project_id:
            return Response(
                {"error": "target_project_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            target_project = Project.objects.get(pk=target_project_id)
        except (Project.DoesNotExist, ValidationError, ValueError):
            return Response(
                {"error": "target_project_id is not valid"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Adversarial review F3: same archive/deletion guard for the target.
        if target_project.archived_at is not None or target_project.deleted_at is not None:
            return Response(
                {"error": "Target project is archived or deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- Source project -------------------------------------------------
        source_project = Project.objects.filter(pk=project_id, workspace__slug=slug).first()
        if source_project is None:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        # Adversarial review F3: archived/deleted projects would silently bury
        # the moved issues (IssueManager excludes archived projects).
        if source_project.archived_at is not None or source_project.deleted_at is not None:
            return Response(
                {"error": "Source project is archived or deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Single-workspace fork: cross-workspace targets are not allowed.
        if target_project.workspace_id != source_project.workspace_id:
            return Response(
                {"error": "Cannot move issues across workspaces"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if target_project.id == source_project.id:
            return Response(
                {"error": "Target project must be different from the source project"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        current_instance = None

        with transaction.atomic():
            # Destination-project advisory lock (same pattern as Issue.save):
            # only one move per destination project may allocate sequences at a
            # time. The source-project lock is taken as well (in sorted order to
            # avoid deadlocks) so two concurrent moves of the same issue to
            # different destinations cannot interleave (review REAL-5).
            with connection.cursor() as cursor:
                for lock_key in sorted(
                    [
                        convert_uuid_to_integer(source_project.id),
                        convert_uuid_to_integer(target_project.id),
                    ]
                ):
                    cursor.execute("SELECT pg_advisory_xact_lock(%s)", [lock_key])

            # --- Authorization + state re-validation under the locks -----------
            # (security review: a concurrent move can relocate the same issue
            # between the pre-checks and this point; everything below must be
            # decided against the post-lock state of the database.)
            if not ProjectMember.objects.filter(
                project_id=target_project.id,
                member=request.user,
                role__gte=15,
                is_active=True,
            ).exists():
                return Response(
                    {"error": "You don't have the required permissions."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            issue = _annotate_issue_queryset(
                Issue.all_objects.filter(
                    pk=issue_id, project_id=project_id, workspace__slug=slug, deleted_at__isnull=True
                )
            ).first()
            if issue is None:
                return Response({"error": "Issue not found"}, status=status.HTTP_404_NOT_FOUND)

            if issue.archived_at is not None:
                return Response(
                    {"error": "Archived issues cannot be moved"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if IntakeIssue.objects.filter(issue_id=issue.id).exists():
                return Response(
                    {"error": "Issues submitted through intake cannot be moved"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # The destination must have at least one non-triage state; otherwise
            # the state remap has nothing to resolve to and a moved issue would
            # end up state-less while keeping its completed_at (review REAL-6).
            if not State.objects.filter(project_id=target_project.id).exists():
                return Response(
                    {"error": "Destination project does not have any states configured"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            current_instance = json.dumps(IssueSerializer(issue).data, cls=DjangoJSONEncoder)

            moving_ids = _collect_descendant_ids(issue.id)
            moved_issues = list(
                Issue.all_objects.select_related("state").filter(pk__in=moving_ids)
            )

            # Type availability for the destination is project-scoped; resolve
            # it once instead of per issue (review S3).
            dest_type_ids = set(
                ProjectIssueType.objects.filter(
                    project_id=target_project.id, deleted_at__isnull=True
                ).values_list("issue_type_id", flat=True)
            )
            dest_default_type_id = (
                ProjectIssueType.objects.filter(
                    project_id=target_project.id, is_default=True, deleted_at__isnull=True
                )
                .values_list("issue_type_id", flat=True)
                .first()
            )

            # Performance review: resolve remapped states and sort-order bases
            # for the whole subtree ONCE instead of 2 aggregate queries per
            # moved issue inside the lock hold.
            new_states = [_remap_state(m, target_project.id) for m in moved_issues]
            sort_base = {}
            for state in set(new_states):
                if state is None:
                    continue
                largest = Issue.objects.filter(
                    project_id=target_project.id, state=state
                ).aggregate(largest=Max("sort_order"))["largest"]
                sort_base[state.id] = (
                    largest + 10000 if largest is not None else 65535.0
                )
            next_sequence = (
                IssueSequence.objects.filter(project_id=target_project.id).aggregate(
                    largest=Max("sequence")
                )["largest"]
                or 0
            ) + 1

            for moving, new_state in zip(moved_issues, new_states):
                # 4. State remap (completed_at syncs via Issue.save's _sync_completed_at)

                # 7. Type remap: only types linked to the destination project stay
                new_type_id = moving.type_id
                if new_type_id is not None and new_type_id not in dest_type_ids:
                    new_type_id = dest_default_type_id

                # 2. Sequence reassignment: next in line (counter seeded from
                # the max above; the advisory lock serializes allocation)
                new_sequence = next_sequence
                next_sequence += 1

                # 9. sort_order recomputed per destination project + state
                new_sort_order = sort_base[new_state.id] if new_state else 65535.0
                if new_state is not None:
                    sort_base[new_state.id] = new_sort_order + 10000

                is_root = moving.pk == issue.pk
                moving.state = new_state
                moving.type_id = new_type_id
                moving.project_id = target_project.id
                moving.sequence_id = new_sequence
                moving.sort_order = new_sort_order
                moving.estimate_point_id = None
                update_fields = [
                    "project_id",
                    "sequence_id",
                    "state_id",
                    "type_id",
                    "sort_order",
                    "estimate_point",
                ]
                if is_root:
                    # 3. The subtree root detaches from its non-moving parent.
                    moving.parent_id = None
                    update_fields.append("parent_id")
                moving.save(update_fields=update_fields)

                # New destination sequence row; the old source row is kept.
                IssueSequence.objects.create(
                    issue=moving, sequence=new_sequence, project=target_project
                )

            root = next(m for m in moved_issues if m.pk == issue.pk)

            # 5. Labels: workspace-level labels are kept as-is. Project labels
            #    of the source project travel with the moved items via CLONES:
            #    a destination Label row is created with the same name/color
            #    and only the moved issues' bridge rows are re-pointed to it —
            #    the original label row stays behind, so source issues that
            #    share the label keep it (security review: re-pointing the
            #    shared row stripped the label from non-moved source issues).
            #    If the destination already has a same-named label, the moved
            #    issues are merged onto it instead (no duplicates). Labels are
            #    processed parents-first so child clones can re-attach to
            #    their travelling parent clone (adversarial review F2).
            source_label_ids = list(
                IssueLabel.objects.filter(issue_id__in=moving_ids)
                .filter(label__project_id=source_project.id, label__deleted_at__isnull=True)
                .values_list("label_id", flat=True)
            )
            source_labels = {l.pk: l for l in Label.objects.filter(pk__in=source_label_ids)}
            # Parents-first ordering within the travelling label set.
            ordered_label_ids = []
            placed = set()
            while len(ordered_label_ids) < len(source_label_ids):
                progressed = False
                for sid in source_label_ids:
                    if sid in placed:
                        continue
                    parent_id = source_labels[sid].parent_id
                    if parent_id is None or parent_id not in source_label_ids or parent_id in placed:
                        ordered_label_ids.append(sid)
                        placed.add(sid)
                        progressed = True
                if not progressed:
                    # Cycle guard: append whatever is left.
                    ordered_label_ids.extend(sid for sid in source_label_ids if sid not in placed)
                    break
            label_id_map = {}
            for source_label_id in ordered_label_ids:
                source_label = source_labels[source_label_id]
                twin = Label.objects.filter(
                    project_id=target_project.id, deleted_at__isnull=True, name=source_label.name
                ).first()
                if twin is not None:
                    # Merge onto the destination twin (adversarial review F5:
                    # dedupe any bridges already pointing at the twin first).
                    IssueLabel.objects.filter(issue_id__in=moving_ids, label_id=twin.id).delete()
                    label_id_map[source_label_id] = twin.id
                    IssueLabel.objects.filter(issue_id__in=moving_ids, label_id=source_label_id).update(
                        label_id=twin.id
                    )
                else:
                    # Clone into the destination; keep the hierarchy when the
                    # parent label is also travelling.
                    clone = Label.objects.create(
                        workspace_id=target_project.workspace_id,
                        project_id=target_project.id,
                        name=source_label.name,
                        description=source_label.description,
                        color=source_label.color,
                        parent_id=label_id_map.get(source_label.parent_id),
                    )
                    label_id_map[source_label_id] = clone.id
                    IssueLabel.objects.filter(issue_id__in=moving_ids, label_id=source_label_id).update(
                        label_id=clone.id
                    )
            IssueLabel.objects.filter(issue_id__in=moving_ids).update(project_id=target_project.id)

            # 6. Assignees: keep only active destination members (role >= 15).
            kept_assignee_ids = set(
                ProjectMember.objects.filter(
                    project_id=target_project.id, role__gte=15, is_active=True
                )
                .exclude(member_id__isnull=True)
                .values_list("member_id", flat=True)
            )
            IssueAssignee.objects.filter(issue_id__in=moving_ids).exclude(
                assignee_id__in=kept_assignee_ids
            ).delete()
            IssueAssignee.objects.filter(issue_id__in=moving_ids).update(
                project_id=target_project.id
            )

            # 8. Cycle / module bridges are project-scoped: drop them.
            CycleIssue.objects.filter(issue_id__in=moving_ids).delete()
            ModuleIssue.objects.filter(issue_id__in=moving_ids).delete()

            # 10. Relations/blockers survive only when both sides end up in the
            #     destination (co-moving or already there).
            dest_issue_ids = set(
                Issue.all_objects.filter(
                    project_id=target_project.id, deleted_at__isnull=True
                ).values_list("id", flat=True)
            )
            kept_ids = set(moving_ids) | dest_issue_ids
            relation_rows = IssueRelation.objects.filter(
                Q(issue_id__in=moving_ids) | Q(related_issue_id__in=moving_ids)
            )
            relation_rows.exclude(
                Q(issue_id__in=kept_ids) & Q(related_issue_id__in=kept_ids)
            ).delete()
            relation_rows.filter(
                Q(issue_id__in=kept_ids) & Q(related_issue_id__in=kept_ids)
            ).update(project_id=target_project.id)

            blocker_rows = IssueBlocker.objects.filter(
                Q(block_id__in=moving_ids) | Q(blocked_by_id__in=moving_ids)
            )
            blocker_rows.exclude(
                Q(block_id__in=kept_ids) & Q(blocked_by_id__in=kept_ids)
            ).delete()
            blocker_rows.filter(
                Q(block_id__in=kept_ids) & Q(blocked_by_id__in=kept_ids)
            ).update(project_id=target_project.id)

            # 10. Related rows follow the issue: bulk project_id update
            #     (workspace unchanged). IssueSequence is excluded on purpose:
            #     the old source rows are kept as historical records (item 2)
            #     and the new destination rows are already project-scoped.
            #     Chunked: IN-lists stay below the PostgreSQL bind-parameter
            #     limit for very large subtrees (adversarial review F1).
            for model in (
                IssueActivity,
                IssueComment,
                IssueLink,
                IssueAttachment,
                IssueSubscriber,
                IssueReaction,
                IssueVote,
                IssueMention,
                IssueVersion,
                IssueDescriptionVersion,
                GithubIssueSync,
            ):
                for chunk in _chunked(moving_ids):
                    model.objects.filter(issue_id__in=chunk).update(project_id=target_project.id)
            CommentReaction.objects.filter(comment__issue_id__in=moving_ids).update(
                project_id=target_project.id
            )
            GithubCommentSync.objects.filter(comment__issue_id__in=moving_ids).update(
                project_id=target_project.id
            )

            # Comment description / description-versions (nullable project).
            comment_description_ids = IssueComment.objects.filter(
                issue_id__in=moving_ids
            ).values_list("description_id", flat=True)
            Description.objects.filter(pk__in=comment_description_ids).update(
                project_id=target_project.id
            )
            DescriptionVersion.objects.filter(description_id__in=comment_description_ids).update(
                project_id=target_project.id
            )

            # File assets bound to issues / their comments.
            FileAsset.objects.filter(
                Q(
                    entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                    issue_id__in=moving_ids,
                )
                | Q(
                    entity_type=FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
                    issue_id__in=moving_ids,
                )
                | Q(
                    entity_type=FileAsset.EntityTypeContext.COMMENT_DESCRIPTION,
                    comment__issue_id__in=moving_ids,
                )
            ).update(project_id=target_project.id)

            # Favorites / recent visits / notifications keyed by issue id.
            UserFavorite.objects.filter(entity_identifier__in=moving_ids).update(
                project_id=target_project.id
            )
            UserRecentVisit.objects.filter(
                entity_identifier__in=moving_ids, entity_name="issue"
            ).update(project_id=target_project.id)
            Notification.objects.filter(
                entity_identifier__in=moving_ids, entity_name="issue"
            ).update(project_id=target_project.id)

            # 11. Move activity row (created against the destination project).
            IssueActivity.objects.create(
                project_id=target_project.id,
                workspace_id=target_project.workspace_id,
                issue_id=root.id,
                verb="updated",
                field="project",
                old_value=str(source_project.id),
                new_value=str(target_project.id),
                actor=request.user,
                epoch=int(timezone.now().timestamp()),
            )

        # 11. Activity/webhook/version side effects run AFTER the transaction
        #     has committed: a failure here must never turn a completed move
        #     into a 500 (the user would retry an already-moved issue and hit
        #     404s). Log and return the success response regardless
        #     (error-handling review).
        requested_data = json.dumps(request.data, cls=DjangoJSONEncoder)
        try:
            issue_activity.delay(
                type="issue.activity.updated",
                requested_data=requested_data,
                actor_id=str(request.user.id),
                issue_id=str(root.id),
                project_id=str(target_project.id),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=base_host(request=request, is_app=True),
            )
            model_activity.delay(
                model_name="issue",
                model_id=str(root.id),
                requested_data=request.data,
                current_instance=current_instance,
                actor_id=request.user.id,
                slug=slug,
                origin=base_host(request=request, is_app=True),
            )
            # Version history: IssueVersion.log_issue_version is broken upstream
            # (never passes project/workspace and silently swallows the error);
            # create_issue_version only builds the row (the sync task bulk-creates
            # it), so persist the constructed instance here (review REAL-2).
            _version = create_issue_version(root, get_related_data([root.id]))
            if _version is not None:
                _version.save()
        except Exception as e:
            log_exception(e)

        root = _annotate_issue_queryset(
            Issue.all_objects.filter(pk=root.id, deleted_at__isnull=True)
        ).first()
        serializer = IssueSerializer(root)
        # Adversarial review F4: the frontend removes EVERY moved item from its
        # source store, so enumerate the subtree for it.
        response_data = serializer.data
        response_data["moved_ids"] = [str(mid) for mid in moving_ids]
        return Response(response_data, status=status.HTTP_200_OK)
