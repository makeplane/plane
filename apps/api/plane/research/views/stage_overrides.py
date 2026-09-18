# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Administrator emergency material override (P1-OPN-07).

A submitted material is read only for its author, but a platform administrator
may correct it in an emergency. The reason is mandatory and the change lands as
an ``ADMIN_OVERRIDE`` version next to the author's own history.
"""

from rest_framework import status
from rest_framework.response import Response

from plane.db.models import StageMaterial, StageMaterialVersion
from plane.research.services.stage_service import snapshot_material
from plane.research.utils.acl import build_actor_context, check_access
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)
from plane.research.utils.errors import (
    ResearchErrorCode,
    research_error,
    research_not_found,
    research_permission_denied,
)
from plane.research.utils.org import is_workspace_admin
from plane.research.utils.stages import material_resource
from plane.research.views.base import ResearchAPIView
from plane.research.views.stages import serialize_material

SECTION = "stages"


class ResearchStageMaterialOverrideEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/materials/<material_id>/override/``"""

    def post(self, request, slug, material_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        if not is_workspace_admin(request.user, workspace):
            return research_permission_denied()
        material = (
            StageMaterial.objects.filter(
                stage_instance__workspace=workspace,
                pk=material_id,
                deleted_at__isnull=True,
            )
            .select_related("page", "owner", "stage_instance")
            .first()
        )
        if material is None:
            return research_not_found(ResearchErrorCode.MATERIAL_NOT_FOUND, "Material not found.")
        context = build_actor_context(request.user, workspace.id)
        if not check_access(request.user, "view", material_resource(material, with_reviewers=True), context=context):
            return research_not_found(ResearchErrorCode.MATERIAL_NOT_FOUND, "Material not found.")

        reason = str(request.data.get("reason") or "").strip()
        if not reason:
            return research_error(
                ResearchErrorCode.STAGE_REASON_REQUIRED,
                "An override needs a reason.",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        page = material.page
        if page is not None:
            if "title" in request.data:
                page.name = str(request.data.get("title") or "")[:255]
            if request.data.get("description_json") is not None:
                page.description_json = request.data["description_json"]
            if request.data.get("description_html") is not None:
                page.description_html = request.data["description_html"]
            page.save()
        if request.data.get("visibility"):
            material.visibility = str(request.data["visibility"]).upper()
        material.save()

        version = snapshot_material(
            material,
            request.user,
            change_source=StageMaterialVersion.ChangeSource.ADMIN_OVERRIDE,
            reason=reason,
        )
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.STAGE_MATERIAL_OVERRIDE,
            resource_type=ResearchResourceType.STAGE_MATERIAL,
            resource_id=material.id,
            org_unit=material.stage_instance.org_unit,
            actor=request.user,
            metadata={
                "material_type": material.material_type,
                "version_no": version.version_no,
                "reason": reason[:500],
            },
            request=request,
        )
        return Response(serialize_material(material, actor=request.user), status=status.HTTP_200_OK)
