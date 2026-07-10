# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""TimelinePropagationView — DRF endpoint for Dependency Schedule Propagation.

Implements the ``{code, message}`` stable failure envelope for the 7
``PropagationErrorCode`` values (CONTEXT D-03). Deliberately does NOT use
``@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`` — see CONTEXT D-02. The
shared decorator returns ``Response({"error": "..."}, 403)`` which would
break the stable failure envelope (API-05, ERR-06).

Order of operations inside ``post``:
    1. Capture ``now = timezone.now()`` once (CONTEXT D-05a).
    2. Inline ``ProjectMember`` membership check (D-02 — GUEST excluded;
       no workspace-admin override per D-02b).
    3. Serializer parse with ``raise_exception=True`` so DRF returns its
       default 400 body (NOT envelope) for structural failures (D-04).
    4. ``transaction.atomic()`` opens. Inside:
       a. ``Issue.issue_objects.select_for_update(of=("self",)).get(...)``
          on the dragged row for race-safe stale check (D-05). Missing
          row maps to ``PERMISSION_DENIED`` (D-05c info-leak prevention).
       b. Build the cross-project-annotated ``IssueRelation`` queryset
          (D-11) and pass to ``load_precedence_graph``.
       c. Build the ``ScheduledWorkItem`` map for the active project's
          non-archived non-draft issues (D-10).
       d. Call ``propagate_move(...)``; on failure, ``_error(...)``
          translates ``PropagationErrorCode`` to HTTP status via the
          single-source-of-truth ``STATUS_BY_CODE`` table (D-03).
       e. On success, ``Issue.objects.bulk_update`` with the explicit
          ``["start_date", "target_date", "updated_at"]`` field list —
          ``auto_now`` is bypassed by ``bulk_update`` (RESEARCH Pitfall 1).
       f. Register ``issue_activity.delay`` (per moved field per issue —
          ``start_date`` and ``target_date`` logged as separate events,
          mirroring views/issue/base.py:1141-1166) and
          ``model_activity.delay`` (one event per moved issue,
          mirroring views/module/base.py:708-716) under
          ``transaction.on_commit`` so each fires ONLY on successful
          commit (CONTEXT D-07/D-08/D-09; Plan 03-03).
    5. Return success Response with the single captured ``now`` shared
       across every ``work_items[].updated_at`` (D-05f).

Operational errors (``IntegrityError``, ``OperationalError``) are NOT
caught at the view level — ``BaseAPIView.handle_exception`` returns
generic 4xx/500 responses (D-13). The 7 typed codes are domain failures;
operational failures must surface to monitoring.

Plan 03-03: audit (``issue_activity``) and webhook (``model_activity``)
tasks fire only on successful commit via ``transaction.on_commit``
registration with per-iteration default-arg capture
(``lambda inst=inst, pre=pre: ...``) to avoid the late-binding-loop-
variable trap (RESEARCH Pitfall 4). The existing
``IssueBulkUpdateDateEndpoint`` (apps/api/plane/app/views/issue/base.py:
1141-1166) calls ``.delay(...)`` synchronously BEFORE ``bulk_update`` —
a latent audit-leak bug we deliberately do NOT replicate here (API-11
keeps that endpoint untouched; backlog: migrate that endpoint to
``transaction.on_commit`` and add ``updated_at`` to its bulk_update
field list per RESEARCH Pitfall 6 / Pitfall 7).

Django 4.2 references:
    https://docs.djangoproject.com/en/4.2/ref/models/querysets/#select-for-update
    https://docs.djangoproject.com/en/4.2/topics/db/transactions/#performing-actions-after-commit
"""

# Python imports
import json

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from django.db.models import F, Q
from django.utils import timezone

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE
from plane.app.serializers import TimelinePropagationRequestSerializer
from plane.app.services.timeline_propagation import (
    MoveIntent,
    PropagationErrorCode,
    ScheduledWorkItem,
    load_precedence_graph,
    propagate_move,
)
from plane.bgtasks.issue_activities_task import issue_activity
from plane.bgtasks.webhook_task import model_activity
from plane.db.models import Issue, IssueRelation, ProjectMember
from plane.utils.host import base_host

from ..base import BaseAPIView


# Single source of truth for the wire status mapping (CONTEXT D-03). Adding a
# new PropagationErrorCode without updating this table will raise KeyError on
# the failing path, surfacing as 500 — a build-time-grade signal at runtime.
STATUS_BY_CODE: dict[PropagationErrorCode, int] = {
    PropagationErrorCode.PERMISSION_DENIED: status.HTTP_403_FORBIDDEN,
    PropagationErrorCode.SCHEDULE_CHANGED: status.HTTP_409_CONFLICT,
    PropagationErrorCode.DEPENDENCY_CYCLE: status.HTTP_422_UNPROCESSABLE_ENTITY,
    PropagationErrorCode.PROJECT_BOUNDARY_EXCEEDED: status.HTTP_422_UNPROCESSABLE_ENTITY,
    PropagationErrorCode.INCOMPLETE_SCHEDULE: status.HTTP_422_UNPROCESSABLE_ENTITY,
    PropagationErrorCode.PROPAGATION_LIMIT_EXCEEDED: status.HTTP_422_UNPROCESSABLE_ENTITY,
    PropagationErrorCode.INVALID_DATE_RANGE: status.HTTP_422_UNPROCESSABLE_ENTITY,
}


def _error(code: PropagationErrorCode, message: str) -> Response:
    """Single source of truth for the {code, message} envelope (CONTEXT D-03).

    Never inline ``status=403`` / ``status=409`` / ``status=422`` literals at a
    call site — always look up via ``STATUS_BY_CODE[code]``.
    """
    return Response(
        {"code": code.value, "message": message},
        status=STATUS_BY_CODE[code],
    )


class TimelinePropagationView(BaseAPIView):
    """Owner of the ``{code, message}`` wire contract for Dependency Schedule
    Propagation.

    Inherits ``BaseSessionAuthentication`` and ``IsAuthenticated`` from
    ``BaseAPIView``, so unauthenticated callers receive DRF's default 401
    (NOT the ``{code, message}`` envelope — that envelope is reserved for
    the 7 PropagationErrorCode values per CONTEXT D-13).
    """

    def post(self, request, slug, project_id):
        # 1. Capture ``now`` ONCE (CONTEXT D-05a). Reused for every Issue
        #    instance's ``updated_at``; one value, one assertion target.
        now = timezone.now()

        # 2. Permission FIRST (CONTEXT D-02) — mirror the inline filter shape
        #    from permissions/base.py:53-59. GUEST excluded by virtue of not
        #    being in [ADMIN, MEMBER]. No workspace-admin fallback (D-02b).
        is_member = ProjectMember.objects.filter(
            member=request.user,
            workspace__slug=slug,
            project_id=project_id,
            role__in=[ROLE.ADMIN.value, ROLE.MEMBER.value],
            is_active=True,
        ).exists()
        if not is_member:
            return _error(
                PropagationErrorCode.PERMISSION_DENIED,
                "You don't have the required permissions.",
            )

        # 3. Structural validation — DRF default 400 (NOT envelope) per D-04.
        serializer = TimelinePropagationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        # 4. Build the algorithm inputs.
        move_intent = MoveIntent(
            work_item_id=validated["work_item_id"],
            original_start_date=validated["original_start_date"],
            original_target_date=validated["original_target_date"],
            requested_start_date=validated["requested_start_date"],
            requested_target_date=validated["requested_target_date"],
        )
        expected_versions = {move_intent.work_item_id: validated["expected_updated_at"]}

        with transaction.atomic():
            # 4a. Lock the dragged row first (race-safe stale check).
            #     ``of=("self",)`` locks only the issue row, not the JOIN-side
            #     workspace/project/state rows brought in by IssueManager.
            try:
                Issue.issue_objects.select_for_update(of=("self",)).get(
                    id=move_intent.work_item_id,
                    workspace__slug=slug,
                    project_id=project_id,
                )
            except Issue.DoesNotExist:
                # CONTEXT D-05c info-leak prevention: a non-member must not
                # learn whether a work item exists. Same envelope as the
                # inline membership check above.
                return _error(
                    PropagationErrorCode.PERMISSION_DENIED,
                    "You don't have the required permissions.",
                )

            # 4b. Build the IssueRelation queryset with cross-project
            #     annotation (CONTEXT D-11). The loader filters
            #     ``relation_type='blocked_by'`` internally per Phase 1 D-04.
            relations = (
                IssueRelation.objects.filter(
                    Q(issue__project_id=project_id) | Q(related_issue__project_id=project_id),
                    workspace__slug=slug,
                    deleted_at__isnull=True,
                )
                .annotate(
                    issue_project_id=F("issue__project_id"),
                    related_project_id=F("related_issue__project_id"),
                )
                .select_related("issue", "related_issue")
            )
            graph = load_precedence_graph(relations, project_id=project_id)

            # 4c. Build the work-items map (CONTEXT D-10 belt-and-suspenders;
            #     ``Issue.issue_objects`` already excludes archived/draft/triage
            #     per db/models/issue.py:92-101).
            items = Issue.issue_objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                archived_at__isnull=True,
                is_draft=False,
            ).only(
                "id",
                "project_id",
                "start_date",
                "target_date",
                "updated_at",
                "planned_duration_working_days",
            )
            work_items_by_id = {
                i.id: ScheduledWorkItem(
                    id=i.id,
                    project_id=i.project_id,
                    start_date=i.start_date,
                    target_date=i.target_date,
                    updated_at=i.updated_at,
                    planned_duration_working_days=i.planned_duration_working_days,
                )
                for i in items
            }

            # 4d. Run the algorithm.
            result = propagate_move(graph, work_items_by_id, move_intent, expected_versions)

            # 4e. Failure path — return the {code, message} envelope. No
            #     bulk_update has been called, so all-or-nothing is satisfied
            #     trivially (API-08, TEST-15, TEST-17).
            if result.failure is not None:
                return _error(result.failure.code, result.failure.message)

            # 4f. Success path — capture pre-update snapshot (Plan 03-03 will
            #     consume this for the audit/webhook current_instance kwargs)
            #     and bulk_update the propagated rows.
            pre_update_snapshot = {upd.id: work_items_by_id[upd.id] for upd in result.updates}

            instances = []
            for upd in result.updates:
                inst = Issue(id=upd.id)
                inst.start_date = upd.start_date
                inst.target_date = upd.target_date
                inst.planned_duration_working_days = upd.planned_duration_working_days
                # MUST set explicitly — auto_now is bypassed by bulk_update
                # (RESEARCH Pitfall 1; existing IssueBulkUpdateDateEndpoint
                # omits this and is a latent bug we do NOT replicate).
                inst.updated_at = now
                instances.append(inst)

            Issue.objects.bulk_update(
                instances,
                [
                    "start_date",
                    "target_date",
                    "planned_duration_working_days",
                    "updated_at",
                ],
            )

            # Plan 03-03 — Audit + webhook fan-out. Register every ``.delay(...)``
            # under ``transaction.on_commit`` so the Celery tasks fire ONLY on
            # successful commit (CONTEXT D-07 / D-08 / D-09).
            #
            # Default-arg capture (``lambda inst=inst, pre=pre: ...``) is
            # MANDATORY — without it, every callback would close over the LAST
            # iteration's loop variable (Python late binding) and fire with
            # identical (wrong) values (RESEARCH Pitfall 4). Pinned by
            # ``test_activity_tasks_register_per_updated_issue`` asserting
            # distinct issue_ids across the patched .delay call_args_list.
            #
            # The existing ``IssueBulkUpdateDateEndpoint``
            # (views/issue/base.py:1141-1166) calls ``.delay(...)`` synchronously
            # BEFORE ``bulk_update`` — a latent audit-leak bug (RESEARCH
            # Pitfall 7) we deliberately do NOT replicate. API-11 keeps that
            # endpoint untouched; backlog item: migrate that endpoint to the
            # on_commit pattern and add ``updated_at`` to its bulk_update
            # field list (RESEARCH Pitfall 6).
            epoch = int(now.timestamp())
            origin = base_host(request=request, is_app=True)
            actor_id_str = str(request.user.id)
            project_id_str = str(project_id)

            # Per-pair issue_activity.delay (mirrors views/issue/base.py:1141-1166
            # shape). Log start_date and target_date as SEPARATE events when
            # both move; skip the event if the field didn't actually change so
            # we never emit a "moved by 0" audit row.
            for inst in instances:
                pre = pre_update_snapshot[inst.id]
                if inst.start_date != pre.start_date:
                    transaction.on_commit(
                        lambda inst=inst, pre=pre: issue_activity.delay(
                            type="issue.activity.updated",
                            requested_data=json.dumps(
                                {"start_date": str(inst.start_date)},
                                cls=DjangoJSONEncoder,
                            ),
                            current_instance=json.dumps(
                                {"start_date": str(pre.start_date)},
                                cls=DjangoJSONEncoder,
                            ),
                            issue_id=str(inst.id),
                            actor_id=actor_id_str,
                            project_id=project_id_str,
                            epoch=epoch,
                        )
                    )
                if inst.target_date != pre.target_date:
                    transaction.on_commit(
                        lambda inst=inst, pre=pre: issue_activity.delay(
                            type="issue.activity.updated",
                            requested_data=json.dumps(
                                {"target_date": str(inst.target_date)},
                                cls=DjangoJSONEncoder,
                            ),
                            current_instance=json.dumps(
                                {"target_date": str(pre.target_date)},
                                cls=DjangoJSONEncoder,
                            ),
                            issue_id=str(inst.id),
                            actor_id=actor_id_str,
                            project_id=project_id_str,
                            epoch=epoch,
                        )
                    )

            # Per-issue model_activity.delay (mirrors views/module/base.py:708-716
            # shape). One event per propagated issue, combined start+target
            # payload. ``actor_id`` is passed as the UUID (not str) to match
            # the existing module endpoint pattern.
            for inst in instances:
                pre = pre_update_snapshot[inst.id]
                transaction.on_commit(
                    lambda inst=inst, pre=pre: model_activity.delay(
                        model_name="issue",
                        model_id=str(inst.id),
                        requested_data=json.dumps(
                            {
                                "start_date": str(inst.start_date),
                                "target_date": str(inst.target_date),
                            },
                            cls=DjangoJSONEncoder,
                        ),
                        current_instance=json.dumps(
                            {
                                "start_date": str(pre.start_date),
                                "target_date": str(pre.target_date),
                            },
                            cls=DjangoJSONEncoder,
                        ),
                        actor_id=request.user.id,
                        slug=slug,
                        origin=origin,
                    )
                )

            # 5. Success Response — single captured ``now`` shared across
            #    every work_items[].updated_at (CONTEXT D-05f).
            return Response(
                {
                    "requested_work_item_id": str(move_intent.work_item_id),
                    "total_updated_count": len(result.updates),
                    "client_preview_count": validated.get("client_preview_count"),
                    "work_items": [
                        {
                            "id": str(upd.id),
                            "start_date": (upd.start_date.isoformat() if upd.start_date else None),
                            "target_date": (upd.target_date.isoformat() if upd.target_date else None),
                            "updated_at": now.isoformat(),
                            "planned_duration_working_days": upd.planned_duration_working_days,
                        }
                        for upd in result.updates
                    ],
                },
                status=status.HTTP_200_OK,
            )
