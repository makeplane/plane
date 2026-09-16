# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import re

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import (
    DEFAULT_STATES,
    Project,
    ProjectIdentifier,
    ProjectMember,
    ResearchProjectProfile,
    State,
)
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)
from plane.research.utils.capabilities import NAV_PROJECTS
from plane.research.utils.errors import (
    ResearchErrorCode,
    research_conflict,
    research_error,
    research_not_found,
    research_permission_denied,
)
from plane.research.utils.org import is_workspace_admin
from plane.research.utils.settings import get_workspace_research_settings
from plane.research.views.base import ResearchAPIView, parse_date, resolve_user

PROJECT_ADMIN_ROLE = 20
PROJECT_MEMBER_ROLE = 15


class ActiveProjectExists(Exception):
    """Raised inside the creation transaction when the owner is already busy."""


def identifier_from(name, fallback="RSP"):
    letters = re.sub(r"[^A-Za-z0-9]", "", name or "").upper()
    return (letters or fallback)[:8] or fallback


def unique_identifier(workspace, base):
    candidate = base
    suffix = 0
    while Project.objects.filter(workspace=workspace, identifier=candidate).exists():
        suffix += 1
        candidate = f"{base[:6]}{suffix}"[:12]
    return candidate


def unique_project_name(workspace, base):
    """Project names are unique per workspace upstream; keep them unique here."""
    candidate = base
    suffix = 1
    while Project.objects.filter(workspace=workspace, name=candidate).exists():
        suffix += 1
        candidate = f"{base} ({suffix})"
    return candidate


def profile_queryset(workspace):
    return (
        ResearchProjectProfile.objects.filter(workspace=workspace)
        .select_related("project", "owner", "org_unit")
        .order_by("-created_at")
    )


def serialize_profile(profile):
    project = profile.project
    return {
        "id": str(project.id),
        "name": project.name,
        "identifier": project.identifier,
        "is_research_project": True,
        "archived_at": project.archived_at,
        "research": {
            "id": str(profile.id),
            "project": str(profile.project_id),
            "owner": str(profile.owner_id),
            "org_unit": str(profile.org_unit_id) if profile.org_unit_id else None,
            "research_type": profile.research_type,
            "workflow_status": profile.workflow_status,
            "started_at": profile.started_at,
            "expected_end_at": profile.expected_end_at,
            "completed_at": profile.completed_at,
            "is_active": profile.is_active,
        },
    }


class ResearchProjectListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/projects/``"""

    nav_capability = NAV_PROJECTS

    def get(self, request, slug):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error

        queryset = profile_queryset(workspace)
        if request.GET.get("owner"):
            queryset = queryset.filter(owner_id=request.GET["owner"])
        if request.GET.get("org_unit"):
            queryset = queryset.filter(org_unit_id=request.GET["org_unit"])
        if request.GET.get("workflow_status"):
            queryset = queryset.filter(workflow_status=str(request.GET["workflow_status"]).upper())
        if request.GET.get("research_type"):
            queryset = queryset.filter(research_type=str(request.GET["research_type"]).upper())
        if str(request.GET.get("mine", "")).lower() in ("1", "true"):
            queryset = queryset.filter(owner=request.user)

        profiles = list(queryset)
        return Response(
            {"results": [serialize_profile(profile) for profile in profiles], "count": len(profiles)},
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error

        settings_map = get_workspace_research_settings(workspace)
        is_admin = is_workspace_admin(request.user, workspace.id)
        requested_owner = resolve_user(request.data.get("owner")) if request.data.get("owner") else None
        if request.data.get("owner") and requested_owner is None:
            return research_error(ResearchErrorCode.USER_NOT_FOUND, "Owner not found.")
        owner = requested_owner or request.user

        if not is_admin and owner.id != request.user.id:
            return research_permission_denied()
        if not request.user.research_org_memberships.exists() and not is_admin:
            return research_permission_denied()

        org_unit = None
        if request.data.get("org_unit"):
            from plane.db.models import OrgUnit

            org_unit = OrgUnit.objects.filter(workspace=workspace, pk=request.data["org_unit"]).first()
            if org_unit is None:
                return research_error(ResearchErrorCode.ORG_UNIT_NOT_FOUND, "Org unit not found.")

        research_type = str(request.data.get("research_type") or "RESEARCH_PROJECT").strip().upper()
        if research_type not in ResearchProjectProfile.ResearchType.values:
            return research_error(ResearchErrorCode.PROJECT_NOT_FOUND, "Unknown research type.")

        started_at, error = parse_date(request.data.get("started_at"), "started_at")
        if error:
            return error
        expected_end_at, error = parse_date(request.data.get("expected_end_at"), "expected_end_at")
        if error:
            return error

        requested_name = str(request.data.get("name") or "").strip()
        name = unique_project_name(
            workspace,
            requested_name or f"{owner.display_name or owner.email} 科研项目",
        )
        identifier = unique_identifier(workspace, identifier_from(request.data.get("identifier") or name))

        try:
            with transaction.atomic():
                # lock the owner's profiles so two concurrent requests cannot
                # both pass the "one active project per owner" check (P0-PRJ-02)
                existing = (
                    ResearchProjectProfile.objects.select_for_update()
                    .filter(
                        workspace=workspace,
                        owner=owner,
                        is_active=True,
                        workflow_status=ResearchProjectProfile.WorkflowStatus.ACTIVE,
                    )
                    .first()
                )
                if existing is not None and not settings_map["allow_multiple_projects"]:
                    raise ActiveProjectExists()
                project = Project.objects.create(
                    workspace=workspace,
                    name=name,
                    identifier=identifier,
                    network=2,
                    created_by=request.user,
                )
                ProjectIdentifier.objects.create(
                    name=project.identifier,
                    project=project,
                    workspace=workspace,
                )
                State.objects.bulk_create(
                    [
                        State(
                            name=state["name"],
                            color=state["color"],
                            project=project,
                            sequence=state["sequence"],
                            workspace=workspace,
                            group=state["group"],
                            default=state.get("default", False),
                            created_by=request.user,
                        )
                        for state in DEFAULT_STATES
                    ]
                )
                # role mapping: owner -> Admin, the creator keeps admin rights
                ProjectMember.objects.create(
                    project=project,
                    member=owner,
                    role=PROJECT_ADMIN_ROLE,
                    created_by=request.user,
                )
                if owner.id != request.user.id:
                    ProjectMember.objects.create(
                        project=project,
                        member=request.user,
                        role=PROJECT_ADMIN_ROLE,
                        created_by=request.user,
                    )
                profile = ResearchProjectProfile.objects.create(
                    project=project,
                    workspace=workspace,
                    owner=owner,
                    org_unit=org_unit,
                    research_type=research_type,
                    started_at=started_at or timezone.localdate(),
                    expected_end_at=expected_end_at,
                    created_by=request.user,
                )
        except ActiveProjectExists:
            return research_conflict(
                ResearchErrorCode.PROJECT_ALREADY_EXISTS,
                "This research owner already has an active research project.",
            )
        except IntegrityError:
            return research_conflict(
                ResearchErrorCode.PROJECT_ALREADY_EXISTS,
                "This research owner already has an active research project.",
            )

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.PROJECT_CREATE,
            resource_type=ResearchResourceType.PROJECT_PROFILE,
            resource_id=profile.id,
            org_unit=org_unit,
            actor=request.user,
            metadata={
                "project": str(project.id),
                "owner": str(owner.id),
                "research_type": research_type,
            },
            request=request,
        )
        return Response(serialize_profile(profile), status=status.HTTP_201_CREATED)


class ResearchProjectDetailEndpoint(ResearchAPIView):
    """``GET``/``PATCH /api/research/workspaces/<slug>/projects/<project_id>/``"""

    nav_capability = NAV_PROJECTS

    def _get_profile(self, workspace, project_id):
        return profile_queryset(workspace).filter(project_id=project_id).first()

    def get(self, request, slug, project_id):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        profile = self._get_profile(workspace, project_id)
        if profile is None:
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")
        return Response(serialize_profile(profile), status=status.HTTP_200_OK)

    def patch(self, request, slug, project_id):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        profile = self._get_profile(workspace, project_id)
        if profile is None:
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")

        is_admin = is_workspace_admin(request.user, workspace.id)
        if not is_admin and profile.owner_id != request.user.id:
            return research_permission_denied()

        fields = []
        if "org_unit" in request.data:
            from plane.db.models import OrgUnit

            unit_id = request.data.get("org_unit")
            if unit_id:
                unit = OrgUnit.objects.filter(workspace=workspace, pk=unit_id).first()
                if unit is None:
                    return research_error(ResearchErrorCode.ORG_UNIT_NOT_FOUND, "Org unit not found.")
            profile.org_unit_id = unit_id
            fields.append("org_unit")
        if "research_type" in request.data:
            research_type = str(request.data.get("research_type") or "").upper()
            if research_type not in ResearchProjectProfile.ResearchType.values:
                return research_error(ResearchErrorCode.PROJECT_NOT_FOUND, "Unknown research type.")
            profile.research_type = research_type
            fields.append("research_type")
        for field in ("started_at", "expected_end_at", "completed_at"):
            if field in request.data:
                value, error = parse_date(request.data.get(field), field)
                if error:
                    return error
                setattr(profile, field, value)
                fields.append(field)
        if "workflow_status" in request.data:
            requested = str(request.data.get("workflow_status") or "").upper()
            if requested not in ResearchProjectProfile.WorkflowStatus.values:
                return research_error(ResearchErrorCode.PROJECT_NOT_FOUND, "Unknown workflow status.")
            profile.workflow_status = requested
            profile.is_active = requested == ResearchProjectProfile.WorkflowStatus.ACTIVE
            fields.extend(["workflow_status", "is_active"])
        if "owner" in request.data:
            if not is_admin:
                return research_permission_denied()
            new_owner = resolve_user(request.data.get("owner"))
            if new_owner is None:
                return research_error(ResearchErrorCode.USER_NOT_FOUND, "Owner not found.")
            previous_owner = profile.owner_id
            profile.owner = new_owner
            fields.append("owner")
            record_audit_event(
                workspace=workspace,
                action=ResearchAuditAction.PROJECT_OWNER_CHANGE,
                resource_type=ResearchResourceType.PROJECT_PROFILE,
                resource_id=profile.id,
                actor=request.user,
                metadata={"from": str(previous_owner), "to": str(new_owner.id)},
                request=request,
            )

        if fields:
            profile.save(update_fields=[*fields, "updated_at"])
        return Response(serialize_profile(profile), status=status.HTTP_200_OK)


class ResearchProjectArchiveEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/projects/<project_id>/archive/``"""

    nav_capability = NAV_PROJECTS

    def post(self, request, slug, project_id):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        profile = profile_queryset(workspace).filter(project_id=project_id).first()
        if profile is None:
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")
        is_admin = is_workspace_admin(request.user, workspace.id)
        if not is_admin and profile.owner_id != request.user.id:
            return research_permission_denied()

        profile.workflow_status = ResearchProjectProfile.WorkflowStatus.ARCHIVED
        profile.is_active = False
        profile.save(update_fields=["workflow_status", "is_active", "updated_at"])
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.PROJECT_ARCHIVE,
            resource_type=ResearchResourceType.PROJECT_PROFILE,
            resource_id=profile.id,
            org_unit=profile.org_unit,
            actor=request.user,
            metadata={"project": str(profile.project_id)},
            request=request,
        )
        return Response(serialize_profile(profile), status=status.HTTP_200_OK)


class ResearchProjectRestoreEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/projects/<project_id>/restore/``"""

    nav_capability = NAV_PROJECTS

    def post(self, request, slug, project_id):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        profile = profile_queryset(workspace).filter(project_id=project_id).first()
        if profile is None:
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")
        is_admin = is_workspace_admin(request.user, workspace.id)
        if not is_admin and profile.owner_id != request.user.id:
            return research_permission_denied()

        settings_map = get_workspace_research_settings(workspace)
        conflict = ResearchProjectProfile.objects.filter(
            workspace=workspace,
            owner_id=profile.owner_id,
            is_active=True,
            workflow_status=ResearchProjectProfile.WorkflowStatus.ACTIVE,
        ).exclude(pk=profile.pk)
        if conflict.exists() and not settings_map["allow_multiple_projects"]:
            return research_conflict(
                ResearchErrorCode.PROJECT_ALREADY_EXISTS,
                "This research owner already has an active research project.",
            )

        profile.workflow_status = ResearchProjectProfile.WorkflowStatus.ACTIVE
        profile.is_active = True
        profile.save(update_fields=["workflow_status", "is_active", "updated_at"])
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.PROJECT_RESTORE,
            resource_type=ResearchResourceType.PROJECT_PROFILE,
            resource_id=profile.id,
            org_unit=profile.org_unit,
            actor=request.user,
            metadata={"project": str(profile.project_id)},
            request=request,
        )
        return Response(serialize_profile(profile), status=status.HTTP_200_OK)
