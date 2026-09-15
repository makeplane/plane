# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Stage workflow endpoints (§5.2).

Every endpoint resolves the stage through the research ACL first, then calls
the rule engines in ``research/services``. Views never inline a business rule.
"""

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import (
    MATERIAL_TYPES_BY_STAGE,
    Page,
    ProjectPage,
    ResearchProjectProfile,
    ResearchStageInstance,
    ResearchStageRequirement,
    StageMaterial,
    StageType,
)
from plane.research.serializers import (
    ResearchStageInstanceSerializer,
    ResearchStageRequirementSerializer,
    StageMaterialSerializer,
    StageMaterialVersionSerializer,
    StageTransitionSerializer,
)
from plane.research.services.stage_gate import (
    GATE_SPECS,
    PASS_PHASE,
    SUBMIT_PHASE,
    evaluate_stage_gate,
    resolve_requirements,
)
from plane.research.services.stage_service import (
    EDITABLE_STAGE_STATUSES,
    StageRuleError,
    ensure_stage_instances,
    enter_stage,
    material_is_editable,
    pass_stage,
    reopen_stage,
    return_stage,
    snapshot_material,
    submit_stage,
)
from plane.research.utils.acl import build_actor_context, check_access
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)
from plane.research.utils.errors import (
    ResearchErrorCode,
    research_conflict,
    research_error,
    research_not_found,
    research_permission_denied,
)
from plane.research.utils.org import is_workspace_admin
from plane.research.utils.stages import material_resource, stage_resource
from plane.research.views.base import ResearchAPIView

MANAGING_SECTION = "stages"


def profile_for(workspace, project_id):
    return (
        ResearchProjectProfile.objects.filter(workspace=workspace, project_id=project_id)
        .select_related("project", "owner")
        .first()
    )


def stage_rule_error_response(exc: StageRuleError):
    payload = {"error_code": exc.error_code, "message": exc.message}
    if "blockers" in exc.extra:
        payload["blockers"] = exc.extra["blockers"]
    if "blocked_stage" in exc.extra:
        payload["blocked_stage"] = exc.extra["blocked_stage"]
    if "gate" in exc.extra:
        payload["gate"] = exc.extra["gate"]
    return Response(payload, status=exc.http_status)


def review_payload(instance):
    """Reviewer state, submitted reviews and the frozen summary (§5.3)."""
    from plane.research.services.review_rules import reviewer_state, review_summary, valid_reviews

    reviews = valid_reviews(instance)
    return {
        "reviewers": reviewer_state(instance),
        "reviews": [
            {
                "id": str(review.id),
                "reviewer": str(review.reviewer_id),
                "reviewer_detail": {
                    "id": str(review.reviewer_id),
                    "display_name": review.reviewer.display_name,
                    "email": review.reviewer.email,
                }
                if review.reviewer
                else None,
                "reviewer_role": review.reviewer_role,
                "recommendation": review.recommendation,
                "score": float(review.score) if review.score is not None else None,
                "comment": review.comment,
                "revision_no": review.revision_no,
                "submitted_at": review.submitted_at,
            }
            for review in reviews
        ],
        "summary": review_summary(instance),
    }


def serialize_material(material, *, actor):
    data = StageMaterialSerializer(material).data
    data["can_edit"] = material_is_editable(material)
    page = material.page
    data["page_detail"] = (
        {
            "id": str(page.id),
            "name": page.name,
            "description_json": page.description_json,
            "description_html": page.description_html,
        }
        if page is not None
        else None
    )
    return data


def serialize_stage(instance, *, actor, material_list=None, include_materials=True):
    data = ResearchStageInstanceSerializer(instance).data
    data["is_editable"] = instance.status in EDITABLE_STAGE_STATUSES
    if include_materials:
        materials = material_list
        if materials is None:
            materials = list(
                instance.materials.filter(deleted_at__isnull=True).select_related("page", "owner")
            )
        data["materials"] = [serialize_material(material, actor=actor) for material in materials]
    return data


class ResearchProjectStageListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/projects/<project_id>/stages/``"""

    def get(self, request, slug, project_id):
        workspace, error = self.get_workspace(section=MANAGING_SECTION)
        if error:
            return error
        profile = profile_for(workspace, project_id)
        if profile is None:
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")

        instances, created = ensure_stage_instances(workspace, profile, request.user)
        context = build_actor_context(request.user, workspace.id)
        visible = [
            item for item in instances if check_access(request.user, "view", stage_resource(item), context=context)
        ]
        if not visible:
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")

        current = next(
            (item for item in visible if item.status in ("IN_PROGRESS", "SUBMITTED", "NEEDS_REVISION")),
            None,
        )
        results = [serialize_stage(item, actor=request.user) for item in visible]
        return Response(
            {
                "results": results,
                "count": len(results),
                "created": created,
                "current_stage": current.stage if current else None,
                "project": str(profile.project_id),
                "workflow_status": profile.workflow_status,
                "stage_sequence": list(StageType.values),
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug, project_id):
        workspace, error = self.get_workspace(section=MANAGING_SECTION)
        if error:
            return error
        profile = profile_for(workspace, project_id)
        if profile is None:
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")
        if profile.owner_id != request.user.id and not is_workspace_admin(request.user, workspace):
            return research_permission_denied()

        instances = list(
            ResearchStageInstance.objects.filter(project_id=project_id, deleted_at__isnull=True)
        )
        if instances:
            return research_conflict(
                ResearchErrorCode.STAGE_INSTANCES_EXIST,
                "Stage instances already exist for this project.",
            )

        instances, _ = ensure_stage_instances(workspace, profile, request.user)
        first = next((item for item in instances if item.stage == StageType.PRE_OPENING.value), None)
        if first is not None:
            try:
                enter_stage(first, request.user, request)
            except StageRuleError as exc:
                return stage_rule_error_response(exc)
        results = [serialize_stage(item, actor=request.user) for item in instances]
        return Response({"results": results, "count": len(results)}, status=status.HTTP_201_CREATED)


class ResearchStageEndpointMixin:
    """Shared resolution helpers for the single stage endpoints."""

    def resolve_stage(self, request, workspace, stage_id, action="view"):
        instance = (
            ResearchStageInstance.objects.filter(
                workspace=workspace,
                pk=stage_id,
                deleted_at__isnull=True,
            )
            .select_related("project", "org_unit")
            .first()
        )
        if instance is None:
            return None, research_not_found(ResearchErrorCode.STAGE_NOT_FOUND, "Stage not found.")
        context = build_actor_context(request.user, workspace.id)
        if not check_access(
            request.user, action, stage_resource(instance, with_reviewers=True), context=context
        ):
            if action == "view":
                return None, research_not_found(ResearchErrorCode.STAGE_NOT_FOUND, "Stage not found.")
            return None, research_permission_denied()
        return instance, None


class ResearchStageDetailEndpoint(ResearchStageEndpointMixin, ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/stages/<stage_id>/``"""

    def get(self, request, slug, stage_id):
        workspace, error = self.get_workspace(section=MANAGING_SECTION)
        if error:
            return error
        instance, error = self.resolve_stage(request, workspace, stage_id)
        if error:
            return error

        context = build_actor_context(request.user, workspace.id)
        materials = [
            material
            for material in instance.materials.filter(deleted_at__isnull=True).select_related("page", "owner")
            if check_access(
                request.user,
                "view",
                material_resource(material, stage=instance, with_reviewers=True),
                context=context,
            )
        ]
        transitions = list(instance.transitions.select_related("actor")[:50])
        data = serialize_stage(instance, actor=request.user, material_list=materials)
        data["gate"] = evaluate_stage_gate(instance, SUBMIT_PHASE)
        data["gate_pass"] = evaluate_stage_gate(instance, PASS_PHASE)
        data["transitions"] = StageTransitionSerializer(transitions, many=True).data
        data["review"] = review_payload(instance)
        data["required_materials"] = list(MATERIAL_TYPES_BY_STAGE.get(instance.stage, ()))
        return Response(data, status=status.HTTP_200_OK)


class ResearchStageGateEndpoint(ResearchStageEndpointMixin, ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/stages/<stage_id>/gate/``"""

    def get(self, request, slug, stage_id):
        workspace, error = self.get_workspace(section=MANAGING_SECTION)
        if error:
            return error
        instance, error = self.resolve_stage(request, workspace, stage_id)
        if error:
            return error
        phase = str(request.GET.get("phase") or SUBMIT_PHASE).lower()
        if phase not in (SUBMIT_PHASE, PASS_PHASE):
            return research_error(
                ResearchErrorCode.STAGE_REQUIREMENT_INVALID,
                "phase must be submit or pass.",
            )
        return Response(evaluate_stage_gate(instance, phase), status=status.HTTP_200_OK)


class ResearchStageTransitionsEndpoint(ResearchStageEndpointMixin, ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/stages/<stage_id>/transitions/``"""

    def get(self, request, slug, stage_id):
        workspace, error = self.get_workspace(section=MANAGING_SECTION)
        if error:
            return error
        instance, error = self.resolve_stage(request, workspace, stage_id)
        if error:
            return error
        transitions = list(instance.transitions.select_related("actor")[:100])
        return Response(
            {
                "results": StageTransitionSerializer(transitions, many=True).data,
                "count": len(transitions),
            },
            status=status.HTTP_200_OK,
        )


class ResearchStageActionEndpoint(ResearchStageEndpointMixin, ResearchAPIView):
    """Base class for the four state transitions plus the admin exception flow."""

    action_name = None
    required_access = "review"

    def perform(self, request, instance):
        raise NotImplementedError

    def post(self, request, slug, stage_id):
        workspace, error = self.get_workspace(section=MANAGING_SECTION)
        if error:
            return error
        instance, error = self.resolve_stage(request, workspace, stage_id, action=self.required_access)
        if error:
            return error
        try:
            self.perform(request, instance)
        except StageRuleError as exc:
            return stage_rule_error_response(exc)
        instance.refresh_from_db()
        return Response(
            serialize_stage(instance, actor=request.user, include_materials=False),
            status=status.HTTP_200_OK,
        )


class ResearchStageEnterEndpoint(ResearchStageActionEndpoint):
    """``POST .../stages/<stage_id>/enter/``"""

    required_access = "edit"

    def perform(self, request, instance):
        enter_stage(instance, request.user, request)


class ResearchStageSubmitEndpoint(ResearchStageActionEndpoint):
    """``POST .../stages/<stage_id>/submit/``"""

    required_access = "edit"

    def perform(self, request, instance):
        submit_stage(instance, request.user, request)


class ResearchStageReturnEndpoint(ResearchStageActionEndpoint):
    """``POST .../stages/<stage_id>/return/``"""

    def perform(self, request, instance):
        return_stage(instance, request.user, request.data.get("reason"), request)


class ResearchStagePassEndpoint(ResearchStageActionEndpoint):
    """``POST .../stages/<stage_id>/pass/``"""

    def perform(self, request, instance):
        pass_stage(instance, request.user, request)


class ResearchStageReopenEndpoint(ResearchStageActionEndpoint):
    """``POST .../stages/<stage_id>/reopen/`` — platform administrators only."""

    required_access = "view"

    def post(self, request, slug, stage_id):
        workspace, error = self.get_workspace(section=MANAGING_SECTION)
        if error:
            return error
        if not is_workspace_admin(request.user, workspace):
            return research_permission_denied()
        instance, error = self.resolve_stage(request, workspace, stage_id)
        if error:
            return error
        try:
            reopen_stage(
                instance,
                request.user,
                request.data.get("reason"),
                confirm=str(request.data.get("confirm", "")).lower() in ("1", "true", "yes"),
                request=request,
            )
        except StageRuleError as exc:
            return stage_rule_error_response(exc)
        instance.refresh_from_db()
        return Response(
            serialize_stage(instance, actor=request.user, include_materials=False),
            status=status.HTTP_200_OK,
        )


class ResearchStageMaterialListCreateEndpoint(ResearchStageEndpointMixin, ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/stages/<stage_id>/materials/``"""

    def get(self, request, slug, stage_id):
        workspace, error = self.get_workspace(section=MANAGING_SECTION)
        if error:
            return error
        instance, error = self.resolve_stage(request, workspace, stage_id)
        if error:
            return error
        context = build_actor_context(request.user, workspace.id)
        materials = [
            material
            for material in instance.materials.filter(deleted_at__isnull=True).select_related("page", "owner")
            if check_access(
                request.user,
                "view",
                material_resource(material, stage=instance, with_reviewers=True),
                context=context,
            )
        ]
        return Response(
            {
                "results": [serialize_material(material, actor=request.user) for material in materials],
                "count": len(materials),
                "required_materials": list(MATERIAL_TYPES_BY_STAGE.get(instance.stage, ())),
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug, stage_id):
        workspace, error = self.get_workspace(section=MANAGING_SECTION)
        if error:
            return error
        instance, error = self.resolve_stage(request, workspace, stage_id, action="edit")
        if error:
            return error
        if instance.status not in EDITABLE_STAGE_STATUSES:
            return research_conflict(
                ResearchErrorCode.MATERIAL_READ_ONLY,
                "Materials can only be added while the stage is in progress.",
            )

        material_type = str(request.data.get("material_type") or "").upper()
        allowed = MATERIAL_TYPES_BY_STAGE.get(instance.stage, ())
        if material_type not in allowed:
            return research_error(
                ResearchErrorCode.MATERIAL_TYPE_INVALID,
                "material_type is not part of this stage material set.",
            )
        if StageMaterial.objects.filter(
            stage_instance=instance, material_type=material_type, deleted_at__isnull=True
        ).exists():
            return research_conflict(
                ResearchErrorCode.MATERIAL_TYPE_INVALID,
                "This material already exists for the stage.",
            )

        page = None
        try:
            with transaction.atomic():
                page = Page.objects.create(
                    workspace=workspace,
                    name=str(request.data.get("title") or material_type)[:255],
                    description_json=request.data.get("description_json") or {"type": "doc", "content": []},
                    description_html=request.data.get("description_html") or "<p></p>",
                    owned_by=request.user,
                    access=Page.PRIVATE_ACCESS,
                    created_by=request.user,
                )
                ProjectPage.objects.create(
                    project_id=instance.project_id,
                    page=page,
                    workspace=workspace,
                    created_by=request.user,
                )
                material = StageMaterial.objects.create(
                    stage_instance=instance,
                    material_type=material_type,
                    page=page,
                    status=StageMaterial.Status.DRAFT,
                    is_required=material_type in allowed,
                    owner=request.user,
                    visibility=str(request.data.get("visibility") or "DIRECT_ADVISOR").upper(),
                    created_by=request.user,
                )
                snapshot_material(material, request.user, change_source="MANUAL", reason="material created")
        except IntegrityError:
            return research_conflict(
                ResearchErrorCode.MATERIAL_TYPE_INVALID,
                "This material already exists for the stage.",
            )

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.STAGE_MATERIAL_CREATE,
            resource_type=ResearchResourceType.STAGE_MATERIAL,
            resource_id=material.id,
            org_unit=instance.org_unit,
            actor=request.user,
            metadata={"stage": instance.stage, "material_type": material_type},
            request=request,
        )
        return Response(serialize_material(material, actor=request.user), status=status.HTTP_201_CREATED)


class ResearchStageMaterialDetailEndpoint(ResearchAPIView):
    """``GET``/``PATCH /api/research/workspaces/<slug>/materials/<material_id>/``"""

    def _load(self, request, workspace, material_id):
        material = (
            StageMaterial.objects.filter(
                stage_instance__workspace=workspace, pk=material_id, deleted_at__isnull=True
            )
            .select_related("page", "owner", "stage_instance")
            .first()
        )
        if material is None:
            return None, research_not_found(ResearchErrorCode.MATERIAL_NOT_FOUND, "Material not found.")
        return material, None

    def get(self, request, slug, material_id):
        workspace, error = self.get_workspace(section=MANAGING_SECTION)
        if error:
            return error
        material, error = self._load(request, workspace, material_id)
        if error:
            return error
        context = build_actor_context(request.user, workspace.id)
        if not check_access(
            request.user, "view", material_resource(material, with_reviewers=True), context=context
        ):
            return research_not_found(ResearchErrorCode.MATERIAL_NOT_FOUND, "Material not found.")
        data = serialize_material(material, actor=request.user)
        data["stage"] = serialize_stage(material.stage_instance, actor=request.user, include_materials=False)
        return Response(data, status=status.HTTP_200_OK)

    def patch(self, request, slug, material_id):
        workspace, error = self.get_workspace(section=MANAGING_SECTION)
        if error:
            return error
        material, error = self._load(request, workspace, material_id)
        if error:
            return error
        if not material_is_editable(material):
            return research_conflict(
                ResearchErrorCode.MATERIAL_READ_ONLY,
                "This material is read only in the current stage state.",
            )
        if not can_edit_material(request.user, workspace, material):
            return research_permission_denied()

        page = material.page
        if page is not None:
            if "title" in request.data:
                page.name = str(request.data.get("title") or "")[:255]
            if "description_json" in request.data and request.data.get("description_json") is not None:
                page.description_json = request.data["description_json"]
            if "description_html" in request.data and request.data.get("description_html") is not None:
                page.description_html = request.data["description_html"]
            page.save()
        if "visibility" in request.data and request.data.get("visibility"):
            material.visibility = str(request.data["visibility"]).upper()
        if material.status == StageMaterial.Status.REJECTED:
            # editing a rejected material puts it back into the work queue
            material.status = StageMaterial.Status.DRAFT
        material.save()
        version = snapshot_material(
            material,
            request.user,
            change_source="MANUAL",
            reason=str(request.data.get("reason") or "")[:500],
        )

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.STAGE_MATERIAL_UPDATE,
            resource_type=ResearchResourceType.STAGE_MATERIAL,
            resource_id=material.id,
            org_unit=material.stage_instance.org_unit,
            actor=request.user,
            metadata={
                "material_type": material.material_type,
                "version_no": version.version_no,
                "changed": version.diff_summary.get("changed", []),
            },
            request=request,
        )
        return Response(serialize_material(material, actor=request.user), status=status.HTTP_200_OK)


def can_edit_material(actor, workspace, material) -> bool:
    """Material editors: the material owner, the project research owner, admins."""
    if is_workspace_admin(actor, workspace):
        return True
    if material.owner_id == actor.id:
        return True
    return (
        ResearchProjectProfile.objects.filter(
            project_id=material.stage_instance.project_id,
            owner_id=actor.id,
        ).exists()
    )


class ResearchStageMaterialSubmitEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/materials/<material_id>/submit/``"""

    def post(self, request, slug, material_id):
        workspace, error = self.get_workspace(section=MANAGING_SECTION)
        if error:
            return error
        material = (
            StageMaterial.objects.filter(
                stage_instance__workspace=workspace, pk=material_id, deleted_at__isnull=True
            )
            .select_related("page", "owner", "stage_instance")
            .first()
        )
        if material is None:
            return research_not_found(ResearchErrorCode.MATERIAL_NOT_FOUND, "Material not found.")
        if not material_is_editable(material):
            return research_conflict(
                ResearchErrorCode.MATERIAL_READ_ONLY,
                "This material is read only in the current stage state.",
            )
        if not can_edit_material(request.user, workspace, material):
            return research_permission_denied()

        material.status = StageMaterial.Status.SUBMITTED
        material.submitted_at = timezone.now()
        material.save(update_fields=["status", "submitted_at", "updated_at"])
        version = snapshot_material(material, request.user, change_source="MANUAL", reason="material submitted")

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.STAGE_MATERIAL_SUBMIT,
            resource_type=ResearchResourceType.STAGE_MATERIAL,
            resource_id=material.id,
            org_unit=material.stage_instance.org_unit,
            actor=request.user,
            metadata={"material_type": material.material_type, "version_no": version.version_no},
            request=request,
        )
        return Response(serialize_material(material, actor=request.user), status=status.HTTP_200_OK)


class ResearchStageMaterialVersionsEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/materials/<material_id>/versions/``"""

    def get(self, request, slug, material_id):
        workspace, error = self.get_workspace(section=MANAGING_SECTION)
        if error:
            return error
        material = (
            StageMaterial.objects.filter(
                stage_instance__workspace=workspace, pk=material_id, deleted_at__isnull=True
            )
            .select_related("stage_instance")
            .first()
        )
        if material is None:
            return research_not_found(ResearchErrorCode.MATERIAL_NOT_FOUND, "Material not found.")
        context = build_actor_context(request.user, workspace.id)
        if not check_access(request.user, "view", material_resource(material), context=context):
            return research_not_found(ResearchErrorCode.MATERIAL_NOT_FOUND, "Material not found.")
        versions = list(material.versions.select_related("created_by"))
        return Response(
            {
                "results": StageMaterialVersionSerializer(versions, many=True).data,
                "count": len(versions),
            },
            status=status.HTTP_200_OK,
        )


class ResearchStageRequirementEndpoint(ResearchAPIView):
    """``GET``/``PATCH /api/research/workspaces/<slug>/stage-requirements/``"""

    def get(self, request, slug):
        workspace, error = self.get_workspace(section=MANAGING_SECTION)
        if error:
            return error
        stage = request.GET.get("stage")
        org_unit_id = request.GET.get("org_unit") or None
        stages = [stage] if stage else list(StageType.values)
        rows = []
        for stage_code in stages:
            if stage_code not in StageType.values:
                return research_error(
                    ResearchErrorCode.STAGE_REQUIREMENT_INVALID,
                    "Unknown stage.",
                )
            effective = resolve_requirements(workspace, stage_code, org_unit_id)
            for code, requirement in effective.items():
                rows.append(
                    {
                        "stage": stage_code,
                        "code": code,
                        "requirement_type": requirement.requirement_type,
                        "threshold": requirement.threshold,
                        "is_blocking": requirement.is_blocking,
                        "is_active": requirement.is_active,
                        "direction": requirement.direction,
                        "source": requirement.source,
                        "label_key": requirement.label_key,
                        "applies_to": list(requirement.phases),
                        "material_types": list(MATERIAL_TYPES_BY_STAGE.get(stage_code, ())),
                    }
                )
        configured = list(
            ResearchStageRequirement.objects.filter(workspace=workspace, deleted_at__isnull=True).order_by(
                "stage", "sort_order"
            )
        )
        return Response(
            {
                "results": rows,
                "count": len(rows),
                "configured": ResearchStageRequirementSerializer(configured, many=True).data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, slug):
        workspace, error = self.get_workspace(section=MANAGING_SECTION)
        if error:
            return error
        if not is_workspace_admin(request.user, workspace):
            return research_permission_denied()

        items = request.data.get("items")
        if not isinstance(items, list) or not items:
            return research_error(
                ResearchErrorCode.STAGE_REQUIREMENT_INVALID,
                "items must be a non-empty list of requirement overrides.",
            )

        updated = []
        for entry in items:
            stage_code = str(entry.get("stage") or "").upper()
            code = str(entry.get("code") or "").strip()
            if stage_code not in StageType.values or not code:
                return research_error(
                    ResearchErrorCode.STAGE_REQUIREMENT_INVALID,
                    "Each item needs a valid stage and code.",
                )
            requirement_type = str(entry.get("requirement_type") or "").upper()
            if requirement_type not in ResearchStageRequirement.RequirementType.values:
                known = next(
                    (
                        spec.requirement_type
                        for spec in GATE_SPECS.get(stage_code, ())
                        if spec.code == code
                    ),
                    None,
                )
                if known is None and code != "review_rule":
                    return research_error(
                        ResearchErrorCode.STAGE_REQUIREMENT_INVALID,
                        f"Unknown requirement code {code} for {stage_code}.",
                    )
                requirement_type = known or "REVIEW_RULE"
            org_unit_id = entry.get("org_unit") or None
            defaults = {
                "requirement_type": requirement_type,
                "threshold": entry.get("threshold"),
                "is_blocking": bool(entry.get("is_blocking", True)),
                "is_active": bool(entry.get("is_active", True)),
                "sort_order": entry.get("sort_order", 65535),
            }
            if defaults["threshold"] is not None:
                try:
                    defaults["threshold"] = int(defaults["threshold"])
                except (TypeError, ValueError):
                    return research_error(
                        ResearchErrorCode.STAGE_REQUIREMENT_INVALID,
                        "threshold must be an integer.",
                    )
            row, _ = ResearchStageRequirement.objects.update_or_create(
                workspace=workspace,
                stage=stage_code,
                code=code,
                org_unit_id=org_unit_id,
                defaults=defaults,
            )
            updated.append(row)

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.STAGE_REQUIREMENT_UPDATE,
            resource_type=ResearchResourceType.STAGE_REQUIREMENT,
            resource_id=None,
            actor=request.user,
            metadata={"codes": [f"{row.stage}:{row.code}" for row in updated]},
            request=request,
        )
        return Response(
            {
                "results": ResearchStageRequirementSerializer(updated, many=True).data,
                "count": len(updated),
            },
            status=status.HTTP_200_OK,
        )


class ResearchStageRequirementDetailEndpoint(ResearchAPIView):
    """``PATCH``/``DELETE /api/research/workspaces/<slug>/stage-requirements/<pk>/``"""

    def _load(self, workspace, pk):
        return ResearchStageRequirement.objects.filter(workspace=workspace, pk=pk, deleted_at__isnull=True).first()

    def patch(self, request, slug, pk):
        workspace, error = self.get_workspace(section=MANAGING_SECTION)
        if error:
            return error
        if not is_workspace_admin(request.user, workspace):
            return research_permission_denied()
        row = self._load(workspace, pk)
        if row is None:
            return research_not_found(
                ResearchErrorCode.STAGE_REQUIREMENT_NOT_FOUND,
                "Requirement not found.",
            )
        if "threshold" in request.data:
            value = request.data.get("threshold")
            if value is None:
                row.threshold = None
            else:
                try:
                    row.threshold = int(value)
                except (TypeError, ValueError):
                    return research_error(
                        ResearchErrorCode.STAGE_REQUIREMENT_INVALID,
                        "threshold must be an integer.",
                    )
        if "is_blocking" in request.data:
            row.is_blocking = bool(request.data.get("is_blocking"))
        if "is_active" in request.data:
            row.is_active = bool(request.data.get("is_active"))
        if "sort_order" in request.data:
            row.sort_order = request.data.get("sort_order")
        row.save()
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.STAGE_REQUIREMENT_UPDATE,
            resource_type=ResearchResourceType.STAGE_REQUIREMENT,
            resource_id=row.id,
            actor=request.user,
            metadata={"stage": row.stage, "code": row.code, "threshold": row.threshold, "is_active": row.is_active},
            request=request,
        )
        return Response(ResearchStageRequirementSerializer(row).data, status=status.HTTP_200_OK)

    def delete(self, request, slug, pk):
        workspace, error = self.get_workspace(section=MANAGING_SECTION)
        if error:
            return error
        if not is_workspace_admin(request.user, workspace):
            return research_permission_denied()
        row = self._load(workspace, pk)
        if row is None:
            return research_not_found(
                ResearchErrorCode.STAGE_REQUIREMENT_NOT_FOUND,
                "Requirement not found.",
            )
        row.is_active = False
        row.deleted_at = timezone.now()
        row.save(update_fields=["is_active", "deleted_at", "updated_at"])
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.STAGE_REQUIREMENT_UPDATE,
            resource_type=ResearchResourceType.STAGE_REQUIREMENT,
            resource_id=row.id,
            actor=request.user,
            metadata={"stage": row.stage, "code": row.code, "deactivated": True},
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
