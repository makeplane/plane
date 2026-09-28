# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Workflow admin views — spec §17.1, §17.2, §18.1.

Endpoints are scoped to ``/api/workspaces/:slug/projects/:project_id/workflows/``
so they live alongside the existing ``/api/`` surface and rely on
the project RBAC of ``ROLE.ADMIN`` for write actions (§18.1). The
``ENABLE_WORKFLOWS`` instance flag is intentionally NOT gated here:
the admin surface must remain available so admins can configure
workflows even before they enable enforcement on a project.
"""

# Python imports
import logging

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import (
    WorkflowCreateSerializer,
    WorkflowDraftSerializer,
    WorkflowLiteSerializer,
    WorkflowReadSerializer,
    WorkflowRevisionPublishSerializer,
    WorkflowRevisionReadSerializer,
    WorkflowUpdateSerializer,
)
from plane.app.views import BaseAPIView, BaseViewSet
from plane.db.models import (
    ProjectMember,
    Workflow,
    WorkflowRevision,
    WorkflowRevisionStatus,
)
from plane.services.workflow.errors import (
    WorkflowDefaultImmutable,
    WorkflowRevisionNotDraft,
    WorkflowRevisionPublishInvalid,
)
from plane.services.workflow.flags import instance_workflows_enabled

logger = logging.getLogger("plane.workflow")


class ProjectWorkflowListEndpoint(BaseAPIView):
    """§17.1 — ``GET``/``POST`` list/create project workflows."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        workflows = (
            Workflow.objects.filter(project_id=project_id)
            .order_by("-is_default", "-created_at")
        )
        serializer = WorkflowLiteSerializer(workflows, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    def post(self, request, slug, project_id):
        serializer = WorkflowCreateSerializer(
            data=request.data,
            context={"project_id": project_id, "request": request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        workflow = serializer.save(
            project_id=project_id,
            created_by_id=request.user.id,
            updated_by_id=request.user.id,
        )
        return Response(
            WorkflowReadSerializer(workflow).data, status=status.HTTP_201_CREATED
        )


class ProjectWorkflowDetailEndpoint(BaseAPIView):
    """§17.1 — ``GET``/``PATCH``/``DELETE`` for a single workflow."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, workflow_id):
        workflow = (
            Workflow.objects.filter(project_id=project_id, pk=workflow_id).first()
        )
        if workflow is None:
            return Response(
                {"error": "Workflow not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(
            WorkflowReadSerializer(workflow).data, status=status.HTTP_200_OK
        )

    @allow_permission([ROLE.ADMIN])
    def patch(self, request, slug, project_id, workflow_id):
        workflow = (
            Workflow.objects.filter(project_id=project_id, pk=workflow_id).first()
        )
        if workflow is None:
            return Response(
                {"error": "Workflow not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = WorkflowUpdateSerializer(
            workflow,
            data=request.data,
            partial=True,
            context={"project_id": project_id, "request": request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(updated_by_id=request.user.id)
        return Response(
            WorkflowReadSerializer(workflow).data, status=status.HTTP_200_OK
        )

    @allow_permission([ROLE.ADMIN])
    def delete(self, request, slug, project_id, workflow_id):
        workflow = (
            Workflow.objects.filter(project_id=project_id, pk=workflow_id).first()
        )
        if workflow is None:
            return Response(
                {"error": "Workflow not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if workflow.is_default:
            return Response(
                WorkflowDefaultImmutable().to_payload(),
                status=WorkflowDefaultImmutable.status_code,
            )
        workflow.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkflowDraftEndpoint(BaseAPIView):
    """§17.1 — ``POST /workflows/:id/draft/`` creates a new draft revision."""

    @allow_permission([ROLE.ADMIN])
    def post(self, request, slug, project_id, workflow_id):
        workflow = (
            Workflow.objects.filter(project_id=project_id, pk=workflow_id).first()
        )
        if workflow is None:
            return Response(
                {"error": "Workflow not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        latest = (
            WorkflowRevision.objects.filter(workflow=workflow)
            .order_by("-version")
            .first()
        )
        next_version = (latest.version + 1) if latest else 1

        # Draft uniqueness per workflow is enforced by the §7.2 partial
        # unique constraint; if a draft already exists we return it
        # so admins can keep editing instead of erroring out.
        existing_draft = (
            WorkflowRevision.objects.filter(
                workflow=workflow, status=WorkflowRevisionStatus.DRAFT
            )
            .order_by("-version")
            .first()
        )
        if existing_draft is not None:
            return Response(
                WorkflowRevisionReadSerializer(existing_draft).data,
                status=status.HTTP_200_OK,
            )

        revision = WorkflowRevision.objects.create(
            project_id=project_id,
            workflow=workflow,
            version=next_version,
            status=WorkflowRevisionStatus.DRAFT,
        )
        return Response(
            WorkflowRevisionReadSerializer(revision).data,
            status=status.HTTP_201_CREATED,
        )


class WorkflowPublishEndpoint(BaseAPIView):
    """§17.1 — ``POST /workflows/:id/publish/`` flips the current draft to published."""

    @allow_permission([ROLE.ADMIN])
    def post(self, request, slug, project_id, workflow_id):
        if not instance_workflows_enabled():
            # Soft gate: keep admin operations available even when
            # the instance flag is off, but skip publishing that
            # would silently become live the moment the flag flips
            # on. Admins can still create + edit drafts.
            return Response(
                {
                    "code": "WORKFLOW_DISABLED",
                    "detail": (
                        "ENABLE_WORKFLOWS is off; refusing to publish so a "
                        "later flag flip does not surprise tenants."
                    ),
                },
                status=status.HTTP_409_CONFLICT,
            )

        workflow = (
            Workflow.objects.filter(project_id=project_id, pk=workflow_id).first()
        )
        if workflow is None:
            return Response(
                {"error": "Workflow not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        draft = (
            WorkflowRevision.objects.filter(
                workflow=workflow, status=WorkflowRevisionStatus.DRAFT
            )
            .order_by("-version")
            .first()
        )
        if draft is None:
            raise WorkflowRevisionNotDraft(
                "No draft revision exists for this workflow."
            )

        issues = _validate_revision_for_publish(draft)
        if issues:
            raise WorkflowRevisionPublishInvalid(
                "Workflow revision has validation issues that block publishing.",
                issues=issues,
            )

        draft.status = WorkflowRevisionStatus.PUBLISHED
        from django.utils import timezone as _tz

        draft.published_at = _tz.now()
        draft.published_by_id = request.user.id
        draft.save(update_fields=["status", "published_at", "published_by"])

        return Response(
            WorkflowRevisionReadSerializer(draft).data,
            status=status.HTTP_200_OK,
        )


class WorkflowRevisionListEndpoint(BaseAPIView):
    """§17.1 — ``GET /workflows/:id/revisions/``."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, workflow_id):
        revisions = (
            WorkflowRevision.objects.filter(
                project_id=project_id, workflow_id=workflow_id
            )
            .order_by("-version")
        )
        return Response(
            WorkflowRevisionReadSerializer(revisions, many=True).data,
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _validate_revision_for_publish(revision: WorkflowRevision) -> list[dict]:
    """Return a list of §24 publish issues for ``revision``.

    The schema enforces field-level uniqueness (partial uniques on
    draft, version, state-in-revision); this function applies the
    cross-field §7.5 invariants and a few sanity checks admins
    otherwise only see at transition time.
    """
    from plane.db.models import WorkflowFlow, WorkflowFlowType

    issues: list[dict] = []
    states = list(revision.states.all())
    if not states:
        issues.append(
            {
                "code": "WORKFLOW_NO_STATES",
                "detail": "Revision has no included states.",
            }
        )
    flows = list(
        WorkflowFlow.objects.filter(revision=revision).select_related(
            "source_state", "target_state", "reject_state"
        )
    )
    state_ids = {s.id for s in states}

    # §7.5 — flows must reference states in this revision.
    for flow in flows:
        if flow.source_state_id not in state_ids:
            issues.append(
                {
                    "code": "WORKFLOW_FLOW_VALIDATION",
                    "detail": "Flow references a source state not in this revision.",
                    "flow_id": str(flow.id),
                }
            )
        if flow.target_state_id not in state_ids:
            issues.append(
                {
                    "code": "WORKFLOW_FLOW_VALIDATION",
                    "detail": "Flow references a target state not in this revision.",
                    "flow_id": str(flow.id),
                }
            )
        if flow.reject_state_id and flow.reject_state_id not in state_ids:
            issues.append(
                {
                    "code": "WORKFLOW_FLOW_VALIDATION",
                    "detail": "Flow references a reject state not in this revision.",
                    "flow_id": str(flow.id),
                }
            )
        # §7.5 — flow type ↔ reject_state invariant.
        if flow.flow_type == WorkflowFlowType.TRANSITION and flow.reject_state_id:
            issues.append(
                {
                    "code": "WORKFLOW_FLOW_VALIDATION",
                    "detail": "Transition flow must not declare a reject_state.",
                    "flow_id": str(flow.id),
                }
            )
        if flow.flow_type == WorkflowFlowType.APPROVAL and not flow.reject_state_id:
            issues.append(
                {
                    "code": "WORKFLOW_FLOW_VALIDATION",
                    "detail": "Approval flow must declare a reject_state.",
                    "flow_id": str(flow.id),
                }
            )

    # §7.5 — all active flows from a source state must share a flow type.
    by_source: dict = {}
    for flow in flows:
        if not flow.is_active:
            continue
        by_source.setdefault(flow.source_state_id, set()).add(flow.flow_type)
    for source_id, types in by_source.items():
        if len(types) > 1:
            issues.append(
                {
                    "code": "WORKFLOW_FLOW_VALIDATION",
                    "detail": (
                        "Active flows from one source state must share a flow_type "
                        "(V1 cannot mix approval and transition flows)."
                    ),
                    "source_state_id": str(source_id),
                }
            )

    if not any(s.allow_new_work_items for s in states):
        issues.append(
            {
                "code": "WORKFLOW_NO_CREATION_STATE",
                "detail": "Revision has no state flagged allow_new_work_items.",
            }
        )

    return issues
