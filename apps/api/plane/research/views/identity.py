# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import IdentityMapping, OrgUnitMember, Workspace
from plane.research.serializers import IdentityMappingSerializer
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)
from plane.research.utils.capabilities import build_research_capabilities
from plane.research.utils.config import oidc_configured, oidc_settings, research_module_enabled
from plane.research.utils.errors import (
    ResearchErrorCode,
    research_error,
    research_not_found,
    research_permission_denied,
)
from plane.research.utils.org import effective_mentee_ids, effective_mentor_ids, is_workspace_admin
from plane.research.utils.roles import ADMIN_ROLES, admin_roles, is_research_admin
from plane.research.utils.settings import workspace_research_enabled, workspace_research_sections
from plane.research.views.base import ResearchAPIView, resolve_user


class ResearchIdentityMeEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/identity/me/``

    Everything the frontend needs to decide whether to render the research
    navigation and which sections the caller may use (P0-UI-06, v2.5.0).

    ``sections`` says which surfaces exist in this workspace,
    ``capabilities`` says which of them this caller may reach: the menu is the
    intersection of both and the API enforces exactly the same list.
    """

    def get(self, request, slug):
        workspace, error = self.get_workspace(require_enabled=False)
        if error:
            return error

        memberships = OrgUnitMember.objects.filter(
            workspace=workspace,
            user=request.user,
        ).select_related("org_unit")
        today = timezone.localdate()
        org_units = [
            {
                "org_unit": str(membership.org_unit_id),
                "org_unit_name": membership.org_unit.name if membership.org_unit else None,
                "org_role": membership.org_role,
                "is_primary": membership.is_primary,
            }
            for membership in memberships
            if membership.is_effective(today)
        ]

        mapping = IdentityMapping.objects.filter(user=request.user).order_by("-last_login_at").first()
        config = oidc_settings()
        roles_held = admin_roles(request.user)
        profile = getattr(request.user, "research_profile", None)
        capabilities = build_research_capabilities(request.user, workspace)
        workspaces = list(
            Workspace.objects.filter(
                workspace_member__member=request.user,
                workspace_member__is_active=True,
                workspace_member__deleted_at__isnull=True,
            )
            .order_by("slug")
            .values_list("slug", flat=True)
        )

        return Response(
            {
                "module_enabled": research_module_enabled(),
                "workspace_enabled": workspace_research_enabled(workspace),
                "sections": workspace_research_sections(workspace),
                "capabilities": capabilities,
                "user": {
                    "id": str(request.user.id),
                    "is_workspace_admin": is_workspace_admin(request.user, workspace.id),
                    "is_research_admin": is_research_admin(request.user, workspace.id),
                    "is_system_admin": bool(roles_held),
                    "research_level": capabilities["level"],
                    "admin_roles": roles_held,
                    "admin_role_catalog": list(ADMIN_ROLES),
                    "workspaces": workspaces,
                    "is_research_owner": bool(org_units),
                    "profile": profile.category if profile is not None else None,
                    "student_no": profile.student_no if profile is not None else None,
                    "org_units": org_units,
                    "mentor_ids": [str(user_id) for user_id in effective_mentor_ids(request.user, workspace.id)],
                    "mentee_ids": [str(user_id) for user_id in effective_mentee_ids(request.user, workspace.id)],
                },
                "identity": {
                    "provider": mapping.provider if mapping else None,
                    "subject": mapping.subject if mapping else None,
                    "employee_id": mapping.employee_id if mapping else None,
                    "configured": oidc_configured(),
                    "provider_name": config["provider"] if oidc_configured() else None,
                },
            },
            status=status.HTTP_200_OK,
        )


class ResearchIdentityMappingListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/identity/mappings/`` (admin only)."""

    def get(self, request, slug):
        workspace, error = self.get_workspace(section="org")
        if error:
            return error
        if not is_research_admin(request.user, workspace.id):
            return research_permission_denied()

        mappings = IdentityMapping.objects.all().select_related("user")
        if request.GET.get("user"):
            mappings = mappings.filter(user_id=request.GET["user"])
        if request.GET.get("employee_id"):
            mappings = mappings.filter(employee_id=request.GET["employee_id"])
        if request.GET.get("status"):
            mappings = mappings.filter(status=str(request.GET["status"]).upper())
        if request.GET.get("provider"):
            mappings = mappings.filter(provider=request.GET["provider"])
        data = list(mappings.order_by("-created_at"))
        return Response(
            {"results": IdentityMappingSerializer(data, many=True).data, "count": len(data)},
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug):
        workspace, error = self.get_workspace(section="org")
        if error:
            return error
        if not is_research_admin(request.user, workspace.id):
            return research_permission_denied()

        user = resolve_user(request.data.get("user") or request.data.get("email"))
        if user is None:
            return research_error(ResearchErrorCode.USER_NOT_FOUND, "User not found.")

        subject = str(request.data.get("subject") or "").strip()
        if not subject:
            return research_error(
                ResearchErrorCode.IDENTITY_SUBJECT_REQUIRED,
                "The identity subject is required.",
            )

        provider = str(request.data.get("provider") or oidc_settings()["provider"]).strip()
        if IdentityMapping.objects.filter(provider=provider, subject=subject).exists():
            return research_error(
                ResearchErrorCode.IDENTITY_MAPPING_EXISTS,
                "This subject is already mapped.",
            )
        if IdentityMapping.objects.filter(provider=provider, user=user).exists():
            return research_error(
                ResearchErrorCode.IDENTITY_MAPPING_EXISTS,
                "This user already has an identity mapping for the provider.",
            )

        mapping = IdentityMapping.objects.create(
            provider=provider,
            subject=subject,
            user=user,
            email_snapshot=request.data.get("email_snapshot") or user.email,
            employee_id=request.data.get("employee_id") or None,
            status=IdentityMapping.Status.ACTIVE,
        )
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.IDENTITY_BIND,
            resource_type=ResearchResourceType.IDENTITY_MAPPING,
            resource_id=mapping.id,
            actor=request.user,
            metadata={"provider": provider, "user": str(user.id), "manual": True},
            request=request,
        )
        return Response(IdentityMappingSerializer(mapping).data, status=status.HTTP_201_CREATED)


class ResearchIdentityMappingDetailEndpoint(ResearchAPIView):
    """``DELETE /api/research/workspaces/<slug>/identity/mappings/<pk>/`` (admin only)."""

    def delete(self, request, slug, pk):
        workspace, error = self.get_workspace(section="org")
        if error:
            return error
        if not is_research_admin(request.user, workspace.id):
            return research_permission_denied()

        mapping = IdentityMapping.objects.filter(pk=pk).select_related("user").first()
        if mapping is None:
            return research_not_found(
                ResearchErrorCode.IDENTITY_MAPPING_NOT_FOUND,
                "Identity mapping not found.",
            )

        mapping.status = IdentityMapping.Status.REVOKED
        mapping.deleted_at = timezone.now()
        mapping.save(update_fields=["status", "deleted_at", "updated_at"])
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.IDENTITY_UNBIND,
            resource_type=ResearchResourceType.IDENTITY_MAPPING,
            resource_id=mapping.id,
            actor=request.user,
            metadata={"provider": mapping.provider, "user": str(mapping.user_id)},
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
