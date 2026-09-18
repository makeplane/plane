# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import re
import uuid

from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import (
    DEFAULT_STATES,
    MentorBinding,
    OrgUnitMember,
    Project,
    ProjectIdentifier,
    ProjectMember,
    ResearchProjectProfile,
    ResearchUserProfile,
    State,
    WorkspaceMember,
)
from plane.research.utils.acl import managing_org_units_for, models_q_expired
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
from plane.research.utils.org import active_membership_q, is_workspace_admin
from plane.research.utils.roles import configured_main_pi_id
from plane.research.services.stage_service import ensure_stage_instances
from plane.research.views.base import ResearchAPIView, parse_date, parse_uuid, resolve_user

PROJECT_ADMIN_ROLE = 20
PROJECT_MEMBER_ROLE = 15
CULTIVATION_PROJECT_TYPES = frozenset(
    (
        ResearchProjectProfile.ResearchType.PHD,
        ResearchProjectProfile.ResearchType.MASTER,
        ResearchProjectProfile.ResearchType.POSTDOC,
    )
)


class ActiveProjectExists(Exception):
    """Raised inside the creation transaction when the owner is already busy."""


def is_cultivation_project(research_type):
    return research_type in CULTIVATION_PROJECT_TYPES


def active_cultivation_projects(workspace, owner, *, exclude_profile_id=None):
    queryset = ResearchProjectProfile.objects.filter(
        workspace=workspace,
        owner=owner,
        research_type__in=CULTIVATION_PROJECT_TYPES,
        is_active=True,
        workflow_status=ResearchProjectProfile.WorkflowStatus.ACTIVE,
    )
    if exclude_profile_id is not None:
        queryset = queryset.exclude(pk=exclude_profile_id)
    return queryset


def lock_cultivation_owner(workspace, owner):
    """Lock a stable owner row so an empty profile set is still serialised."""
    from plane.db.models import User

    return User.objects.select_for_update().get(pk=owner.pk)


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
        .prefetch_related("project__project_projectmember")
        .order_by("-created_at")
    )


def visible_profile_queryset(workspace, user):
    """Research metadata visible without granting Plane project write access."""
    today = timezone.localdate()
    managed_unit_ids = managing_org_units_for(user, workspace.id, today)
    advised_owner_ids = MentorBinding.objects.filter(
        workspace=workspace,
        mentor=user,
        deleted_at__isnull=True,
        effective_from__lte=today,
    ).filter(models_q_expired(today)).values_list("mentee_id", flat=True)
    is_main_pi = configured_main_pi_id(workspace) == user.id

    visibility = (
        Q(owner=user)
        | Q(
            project__project_projectmember__member=user,
            project__project_projectmember__is_active=True,
            project__project_projectmember__deleted_at__isnull=True,
        )
        | Q(owner_id__in=advised_owner_ids)
        | Q(org_unit_id__in=managed_unit_ids)
    )
    if is_main_pi:
        return profile_queryset(workspace)
    return profile_queryset(workspace).filter(visibility).distinct()


def can_read_project_research_metadata(workspace, user, profile):
    """Project-level gate used by metadata aggregations.

    Team members, owners, effective mentors, the organisation management chain,
    and the configured main PI may enter the project's research surfaces. A
    public Plane network alone does not expose research metadata.
    """
    today = timezone.localdate()
    if profile.owner_id == user.id:
        return True
    if ProjectMember.objects.filter(
        project_id=profile.project_id,
        member=user,
        is_active=True,
        deleted_at__isnull=True,
    ).exists():
        return True
    if MentorBinding.objects.filter(
        workspace=workspace,
        mentor=user,
        mentee_id=profile.owner_id,
        deleted_at__isnull=True,
        effective_from__lte=today,
    ).filter(models_q_expired(today)).exists():
        return True
    if profile.org_unit_id in managing_org_units_for(user, workspace.id, today):
        return True
    return configured_main_pi_id(workspace) == user.id


def effective_primary_membership(workspace, owner):
    return (
        OrgUnitMember.objects.filter(
            active_membership_q(),
            workspace=workspace,
            user=owner,
            is_primary=True,
        )
        .select_related("org_unit")
        .first()
    )


def validate_project_org_unit(workspace, owner, requested_unit, *, can_override=False):
    """Resolve an owner's true primary unit and reject client-side spoofing."""
    primary = effective_primary_membership(workspace, owner)
    if requested_unit is None:
        return (primary.org_unit if primary else None), None
    if can_override:
        return requested_unit, None
    if primary is None or primary.org_unit_id != requested_unit.id:
        return None, research_permission_denied(
            "The selected organisation is not the owner's active primary assignment."
        )
    return requested_unit, None


def serialize_profile(profile):
    project = profile.project
    prefetched_members = getattr(project, "_prefetched_objects_cache", {}).get(
        "project_projectmember"
    )
    if prefetched_members is None:
        collaborators = ProjectMember.objects.filter(
            project=project,
            is_active=True,
            deleted_at__isnull=True,
            role__in=(PROJECT_ADMIN_ROLE, PROJECT_MEMBER_ROLE),
        ).exclude(member_id=profile.owner_id)
    else:
        collaborators = [
            member
            for member in prefetched_members
            if member.is_active
            and member.deleted_at is None
            and member.role in (PROJECT_ADMIN_ROLE, PROJECT_MEMBER_ROLE)
            and member.member_id != profile.owner_id
        ]
    return {
        "id": str(project.id),
        "name": project.name,
        "identifier": project.identifier,
        "is_research_project": True,
        "archived_at": project.archived_at,
        "collaborator_ids": sorted(str(member.member_id) for member in collaborators),
        "research": {
            "id": str(profile.id),
            "project": str(profile.project_id),
            "owner": str(profile.owner_id),
            "owner_detail": {
                "id": str(profile.owner_id),
                "email": profile.owner.email,
                "first_name": profile.owner.first_name,
                "last_name": profile.owner.last_name,
                "display_name": profile.owner.display_name,
                "avatar": profile.owner.avatar,
                "avatar_url": profile.owner.avatar_url,
                "is_active": profile.owner.is_active,
            },
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

        queryset = visible_profile_queryset(workspace, request.user)
        owner_id, error = parse_uuid(request.GET.get("owner"), "owner")
        if error:
            return error
        org_unit_id, error = parse_uuid(request.GET.get("org_unit"), "org_unit")
        if error:
            return error
        date_from, error = parse_date(request.GET.get("date_from"), "date_from")
        if error:
            return error
        date_to, error = parse_date(request.GET.get("date_to"), "date_to")
        if error:
            return error
        if date_from and date_to and date_from > date_to:
            return research_error(
                ResearchErrorCode.ORG_MEMBER_INVALID,
                "date_from must not be after date_to.",
            )
        if owner_id:
            queryset = queryset.filter(owner_id=owner_id)
        if org_unit_id:
            queryset = queryset.filter(org_unit_id=org_unit_id)
        if date_from:
            queryset = queryset.filter(started_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(started_at__lte=date_to)
        if request.GET.get("workflow_status"):
            queryset = queryset.filter(workflow_status=str(request.GET["workflow_status"]).upper())
        if request.GET.get("research_type"):
            queryset = queryset.filter(research_type=str(request.GET["research_type"]).upper())
        if str(request.GET.get("mine", "")).lower() in ("1", "true"):
            queryset = queryset.filter(owner=request.user)

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda profiles: [serialize_profile(profile) for profile in profiles],
            default_per_page=50,
            max_per_page=100,
        )

    def post(self, request, slug):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error

        is_admin = is_workspace_admin(request.user, workspace.id)
        requested_owner = resolve_user(request.data.get("owner")) if request.data.get("owner") else None
        if request.data.get("owner") and requested_owner is None:
            return research_error(ResearchErrorCode.USER_NOT_FOUND, "Owner not found.")
        owner = requested_owner or request.user

        if not is_admin and owner.id != request.user.id:
            return research_permission_denied()
        has_org_relation = OrgUnitMember.objects.filter(
            active_membership_q(), workspace=workspace, user=request.user
        ).exists()
        has_research_profile = ResearchUserProfile.objects.filter(
            user=request.user,
            deleted_at__isnull=True,
        ).exists()
        if not (has_org_relation or has_research_profile) and not is_admin:
            return research_permission_denied()

        org_unit = None
        if request.data.get("org_unit"):
            from plane.db.models import OrgUnit

            org_unit = OrgUnit.objects.filter(workspace=workspace, pk=request.data["org_unit"]).first()
            if org_unit is None:
                return research_error(ResearchErrorCode.ORG_UNIT_NOT_FOUND, "Org unit not found.")
        org_unit, org_error = validate_project_org_unit(
            workspace,
            owner,
            org_unit,
            can_override=is_admin,
        )
        if org_error:
            return org_error

        research_type = str(request.data.get("research_type") or "RESEARCH_PROJECT").strip().upper()
        if research_type not in ResearchProjectProfile.ResearchType.values:
            return research_error(ResearchErrorCode.PROJECT_NOT_FOUND, "Unknown research type.")
        raw_collaborators = request.data.get("collaborator_ids") or []
        if not isinstance(raw_collaborators, list):
            return research_error(
                ResearchErrorCode.PROJECT_NOT_FOUND,
                "collaborator_ids must be a list of user IDs.",
            )
        try:
            collaborator_ids = {uuid.UUID(str(value)) for value in raw_collaborators}
        except (TypeError, ValueError, AttributeError):
            return research_error(
                ResearchErrorCode.USER_NOT_FOUND,
                "One or more collaborators were not found.",
            )
        if collaborator_ids and is_cultivation_project(research_type):
            return research_error(
                ResearchErrorCode.PROJECT_NOT_FOUND,
                "Collaborators can only be added to team research projects.",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        collaborator_memberships = list(
            WorkspaceMember.objects.filter(
                workspace=workspace,
                member_id__in=collaborator_ids,
                member__is_active=True,
                is_active=True,
                deleted_at__isnull=True,
                role__in=(PROJECT_ADMIN_ROLE, PROJECT_MEMBER_ROLE),
            ).select_related("member")
        )
        if len(collaborator_memberships) != len(collaborator_ids):
            return research_permission_denied(
                "Every collaborator must be an active workspace member."
            )

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
                if is_cultivation_project(research_type):
                    lock_cultivation_owner(workspace, owner)
                existing = active_cultivation_projects(workspace, owner).select_for_update().first()
                if is_cultivation_project(research_type) and existing is not None:
                    raise ActiveProjectExists()
                project = Project.objects.create(
                    workspace=workspace,
                    name=name,
                    identifier=identifier,
                    network=0,
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
                existing_project_member_ids = {owner.id, request.user.id}
                ProjectMember.objects.bulk_create(
                    [
                        ProjectMember(
                            project=project,
                            workspace=workspace,
                            member=membership.member,
                            role=PROJECT_MEMBER_ROLE,
                            created_by=request.user,
                        )
                        for membership in collaborator_memberships
                        if membership.member_id not in existing_project_member_ids
                    ]
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
                if is_cultivation_project(research_type):
                    ensure_stage_instances(workspace, profile, request.user)
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
                "collaborator_count": len(collaborator_ids),
            },
            request=request,
        )
        return Response(serialize_profile(profile), status=status.HTTP_201_CREATED)


class ResearchProjectDetailEndpoint(ResearchAPIView):
    """``GET``/``PATCH /api/research/workspaces/<slug>/projects/<project_id>/``"""

    nav_capability = NAV_PROJECTS

    def _get_profile(self, workspace, project_id):
        return visible_profile_queryset(workspace, self.request.user).filter(project_id=project_id).first()

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

        with transaction.atomic():
            profile = ResearchProjectProfile.objects.select_for_update().get(
                pk=profile.pk,
                workspace=workspace,
            )
            requested_owner = profile.owner
            was_cultivation_project = is_cultivation_project(profile.research_type)
            requested_type = profile.research_type
            requested_status = profile.workflow_status
            if "owner" in request.data:
                if not is_admin:
                    return research_permission_denied()
                requested_owner = resolve_user(request.data.get("owner"))
                if requested_owner is None:
                    return research_error(ResearchErrorCode.USER_NOT_FOUND, "Owner not found.")
                # Keep the organisation scope tied to the new owner's primary
                # assignment unless the system/workspace administrator also
                # sends an explicit override below.
                if "org_unit" not in request.data:
                    primary = effective_primary_membership(workspace, requested_owner)
                    profile.org_unit = primary.org_unit if primary else None
            if "research_type" in request.data:
                requested_type = str(request.data.get("research_type") or "").upper()
                if requested_type not in ResearchProjectProfile.ResearchType.values:
                    return research_error(ResearchErrorCode.PROJECT_NOT_FOUND, "Unknown research type.")
            if "workflow_status" in request.data:
                requested_status = str(request.data.get("workflow_status") or "").upper()
                if requested_status not in ResearchProjectProfile.WorkflowStatus.values:
                    return research_error(ResearchErrorCode.PROJECT_NOT_FOUND, "Unknown workflow status.")
            if (
                requested_status == ResearchProjectProfile.WorkflowStatus.ACTIVE
                and is_cultivation_project(requested_type)
            ):
                lock_cultivation_owner(workspace, requested_owner)
                if active_cultivation_projects(
                    workspace,
                    requested_owner,
                    exclude_profile_id=profile.id,
                ).select_for_update().exists():
                    return research_conflict(
                        ResearchErrorCode.PROJECT_ALREADY_EXISTS,
                        "This research owner already has an active cultivation project.",
                    )

            fields = []
            if "owner" in request.data and "org_unit" not in request.data:
                fields.append("org_unit")
            if "org_unit" in request.data:
                from plane.db.models import OrgUnit

                unit_id = request.data.get("org_unit")
                if unit_id:
                    unit = OrgUnit.objects.filter(workspace=workspace, pk=unit_id).first()
                    if unit is None:
                        return research_error(ResearchErrorCode.ORG_UNIT_NOT_FOUND, "Org unit not found.")
                else:
                    unit = None
                unit, org_error = validate_project_org_unit(
                    workspace,
                    requested_owner,
                    unit,
                    can_override=is_admin,
                )
                if org_error:
                    return org_error
                profile.org_unit = unit
                fields.append("org_unit")
            if "research_type" in request.data:
                profile.research_type = requested_type
                fields.append("research_type")
            for field in ("started_at", "expected_end_at", "completed_at"):
                if field in request.data:
                    value, error = parse_date(request.data.get(field), field)
                    if error:
                        return error
                    setattr(profile, field, value)
                    fields.append(field)
            if "workflow_status" in request.data:
                profile.workflow_status = requested_status
                profile.is_active = requested_status == ResearchProjectProfile.WorkflowStatus.ACTIVE
                fields.extend(["workflow_status", "is_active"])
            if "owner" in request.data:
                previous_owner = profile.owner_id
                profile.owner = requested_owner
                fields.append("owner")
                record_audit_event(
                    workspace=workspace,
                    action=ResearchAuditAction.PROJECT_OWNER_CHANGE,
                    resource_type=ResearchResourceType.PROJECT_PROFILE,
                    resource_id=profile.id,
                    actor=request.user,
                    metadata={"from": str(previous_owner), "to": str(requested_owner.id)},
                    request=request,
                )

            if fields:
                profile.save(update_fields=[*fields, "updated_at"])
            if is_cultivation_project(profile.research_type) and not was_cultivation_project:
                ensure_stage_instances(workspace, profile, request.user)
        return Response(serialize_profile(profile), status=status.HTTP_200_OK)


class ResearchProjectArchiveEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/projects/<project_id>/archive/``"""

    nav_capability = NAV_PROJECTS

    def post(self, request, slug, project_id):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        profile = visible_profile_queryset(workspace, request.user).filter(project_id=project_id).first()
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
        profile = visible_profile_queryset(workspace, request.user).filter(project_id=project_id).first()
        if profile is None:
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")
        is_admin = is_workspace_admin(request.user, workspace.id)
        if not is_admin and profile.owner_id != request.user.id:
            return research_permission_denied()

        with transaction.atomic():
            profile = ResearchProjectProfile.objects.select_for_update().get(pk=profile.pk)
            if is_cultivation_project(profile.research_type):
                lock_cultivation_owner(workspace, profile.owner)
                conflict = active_cultivation_projects(
                    workspace,
                    profile.owner,
                    exclude_profile_id=profile.id,
                ).select_for_update()
                if conflict.exists():
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
