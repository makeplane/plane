# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import logging
import re

# Third party imports
from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE
from plane.app.views.base import BaseAPIView
from plane.db.models import (
    DEFAULT_STATES,
    Project,
    ProjectIdentifier,
    ProjectMember,
    State,
    User,
    Workspace,
    WorkspaceMember,
)
from plane.license.api.permissions import InstanceAdminPermission

logger = logging.getLogger(__name__)

MAX_PROJECTS = 100
VALID_NETWORKS = {0, 2}
VALID_ROLES = {ROLE.GUEST.value, ROLE.MEMBER.value, ROLE.ADMIN.value}
DEFAULT_MEMBER_ROLE = ROLE.MEMBER.value


def _generate_unique_identifier(name, workspace_id, existing_identifiers):
    """Auto-generate a unique project identifier from name.

    Takes first 6 alphanumeric chars, uppercased.
    Appends numeric suffix on collision.
    existing_identifiers must be an uppercase-normalized set (workspace-scoped).
    Returns None if name produces no alphanumeric chars.
    """
    base = re.sub(r"[^A-Z0-9]", "", name.upper())[:6]
    if not base:
        return None
    candidate = base
    counter = 1
    while candidate in existing_identifiers:
        suffix = str(counter)
        candidate = base[: 6 - len(suffix)] + suffix
        counter += 1
        if counter > 100:
            return None
    return candidate


def _parse_comma_list(value):
    """Split a comma-separated cell value into a stripped list, ignoring empty entries."""
    if not value:
        return []
    return [v.strip() for v in str(value).split(",") if v.strip()]


def _parse_member_roles(roles_value, count):
    """Parse member_roles cell into a list of ints aligned with members list.

    Falls back to DEFAULT_MEMBER_ROLE for missing/invalid entries.
    """
    raw = _parse_comma_list(roles_value)
    result = []
    for i in range(count):
        if i < len(raw):
            try:
                role = int(raw[i])
                result.append(role if role in VALID_ROLES else DEFAULT_MEMBER_ROLE)
            except (ValueError, TypeError):
                result.append(DEFAULT_MEMBER_ROLE)
        else:
            result.append(DEFAULT_MEMBER_ROLE)
    return result


class InstanceWorkspaceProjectBulkImportEndpoint(BaseAPIView):
    """Bulk import projects into workspaces from JSON array.

    Accepts: POST { "projects": [{ "workspace_slug": str, "name": str,
                                   "description"?: str, "network"?: int,
                                   "project_leader"?: str (email),
                                   "members"?: str (comma-separated emails),
                                   "member_roles"?: str (comma-separated role ints) }] }
    Returns: { created, skipped, total_created, total_skipped }
    - project_leader not found in workspace → skipped silently, project still created
    - member not in workspace → listed in created[].skipped_members
    """

    permission_classes = [InstanceAdminPermission]

    def post(self, request):
        projects_data = request.data.get("projects", None)

        if not isinstance(projects_data, list):
            return Response(
                {"error": "Request body must contain a 'projects' list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(projects_data) == 0:
            return Response(
                {"error": "The 'projects' list must not be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(projects_data) > MAX_PROJECTS:
            return Response(
                {"error": f"Too many projects. Maximum allowed per request is {MAX_PROJECTS}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Cache workspace lookups and per-workspace identifier sets to avoid repeated DB queries
        workspace_cache = {}
        identifier_cache = {}  # workspace_id → set of existing identifiers (uppercase)

        created = []
        updated = []
        skipped = []

        for row_number, item in enumerate(projects_data, start=1):
            workspace_slug = str(item.get("workspace_slug") or "").strip()
            name = str(item.get("name") or "").strip()
            description = str(item.get("description") or "").strip()
            network_raw = item.get("network")
            project_leader_email = str(item.get("project_leader") or "").strip().lower()
            member_emails = _parse_comma_list(item.get("members"))
            member_roles = _parse_member_roles(item.get("member_roles"), len(member_emails))

            # Validate workspace_slug
            if not workspace_slug:
                skipped.append({"row_number": row_number, "workspace_slug": "", "name": name, "reason": "workspace_slug is required"})
                continue

            # Resolve workspace (cache per slug)
            if workspace_slug not in workspace_cache:
                try:
                    workspace_cache[workspace_slug] = Workspace.objects.get(slug=workspace_slug)
                except Workspace.DoesNotExist:
                    workspace_cache[workspace_slug] = None

            workspace = workspace_cache[workspace_slug]
            if workspace is None:
                skipped.append({"row_number": row_number, "workspace_slug": workspace_slug, "name": name, "reason": f"Workspace '{workspace_slug}' not found"})
                continue

            # Validate name
            if not name:
                skipped.append({"row_number": row_number, "workspace_slug": workspace_slug, "name": "", "reason": "Name is required"})
                continue
            if len(name) > 255:
                skipped.append({"row_number": row_number, "workspace_slug": workspace_slug, "name": name, "reason": "Name exceeds 255 characters"})
                continue

            # Resolve project_leader (silent skip if not found in workspace)
            project_leader_id = None
            if project_leader_email:
                leader = User.objects.filter(
                    email=project_leader_email,
                    member_workspace__workspace=workspace,
                    member_workspace__is_active=True,
                ).first()
                if leader:
                    project_leader_id = leader.id

            # Resolve member emails → workspace members only
            valid_members = []   # list of (User, role)
            skipped_members = []
            for email, role in zip(member_emails, member_roles):
                email_lower = email.lower()
                member_user = User.objects.filter(
                    email=email_lower,
                    member_workspace__workspace=workspace,
                    member_workspace__is_active=True,
                ).first()
                if member_user:
                    valid_members.append((member_user, role))
                else:
                    skipped_members.append(f"{email} not found in workspace")

            # If project already exists → update leader + members, skip creation
            existing_project = Project.objects.filter(name=name, workspace=workspace).first()
            if existing_project:
                try:
                    if project_leader_id:
                        existing_project.project_lead_id = project_leader_id
                        existing_project.updated_by = request.user
                        existing_project.save(update_fields=["project_lead_id", "updated_by"])
                        # Ensure leader has project access with admin role
                        ProjectMember.objects.update_or_create(
                            project=existing_project,
                            member_id=project_leader_id,
                            defaults={"role": ROLE.ADMIN.value},
                        )
                    for member_user, role in valid_members:
                        ProjectMember.objects.get_or_create(
                            project=existing_project,
                            member=member_user,
                            defaults={"role": role},
                        )
                    updated.append({
                        "workspace_slug": workspace_slug,
                        "name": name,
                        "identifier": existing_project.identifier,
                        "skipped_members": skipped_members,
                    })
                except Exception:
                    logger.exception("Project bulk import update failed for row %s (name=%r, workspace=%r)", row_number, name, workspace_slug)
                    skipped.append({"row_number": row_number, "workspace_slug": workspace_slug, "name": name, "reason": "Unexpected error during update — see server logs"})
                continue

            # Validate network
            network = int(network_raw) if network_raw is not None and str(network_raw).isdigit() else 2
            if network not in VALID_NETWORKS:
                network = 2

            # Build per-workspace identifier set
            if workspace.id not in identifier_cache:
                identifier_cache[workspace.id] = set(
                    Project.objects.filter(workspace=workspace).values_list("identifier", flat=True)
                )

            identifier = _generate_unique_identifier(name, workspace.id, identifier_cache[workspace.id])
            if not identifier:
                skipped.append({"row_number": row_number, "workspace_slug": workspace_slug, "name": name, "reason": "Could not generate a unique identifier from name"})
                continue

            try:
                with transaction.atomic():
                    project = Project.objects.create(
                        name=name,
                        identifier=identifier,
                        description=description,
                        network=network,
                        workspace=workspace,
                        project_lead_id=project_leader_id,
                        module_view=True,
                        created_by=request.user,
                        updated_by=request.user,
                    )

                    ProjectIdentifier.objects.create(
                        name=identifier,
                        project=project,
                        workspace=workspace,
                    )

                    # Creator as Admin
                    ProjectMember.objects.create(
                        project=project,
                        member=request.user,
                        role=ROLE.ADMIN.value,
                    )

                    # Auto-add workspace admins
                    already_added = {request.user.id}
                    workspace_admins = WorkspaceMember.objects.filter(
                        workspace=workspace,
                        role=ROLE.ADMIN.value,
                        is_active=True,
                    ).exclude(member_id__in=already_added).select_related("member")

                    for wm in workspace_admins:
                        ProjectMember.objects.get_or_create(
                            project=project,
                            member=wm.member,
                            defaults={"role": ROLE.ADMIN.value},
                        )
                        already_added.add(wm.member_id)

                    # Ensure project leader is an admin member (if not already added above)
                    if project_leader_id and project_leader_id not in already_added:
                        ProjectMember.objects.get_or_create(
                            project=project,
                            member_id=project_leader_id,
                            defaults={"role": ROLE.ADMIN.value},
                        )
                        already_added.add(project_leader_id)

                    # Add imported members (skip if already added above)
                    for member_user, role in valid_members:
                        if member_user.id not in already_added:
                            ProjectMember.objects.get_or_create(
                                project=project,
                                member=member_user,
                                defaults={"role": role},
                            )

                    # Create default states
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
                                is_system=state.get("is_system", False),
                                created_by=request.user,
                            )
                            for state in DEFAULT_STATES
                        ],
                        ignore_conflicts=True,
                    )

                # Track identifier to prevent intra-batch collisions
                identifier_cache[workspace.id].add(identifier)
                created.append({
                    "workspace_slug": workspace_slug,
                    "name": name,
                    "identifier": identifier,
                    "skipped_members": skipped_members,
                })

            except IntegrityError:
                skipped.append({"row_number": row_number, "workspace_slug": workspace_slug, "name": name, "reason": "Identifier or name already exists (concurrent creation)"})
            except Exception:
                logger.exception("Project bulk import failed for row %s (name=%r, workspace=%r)", row_number, name, workspace_slug)
                skipped.append({"row_number": row_number, "workspace_slug": workspace_slug, "name": name, "reason": "Unexpected error — see server logs"})

        return Response(
            {
                "created": created,
                "updated": updated,
                "skipped": skipped,
                "total_created": len(created),
                "total_updated": len(updated),
                "total_skipped": len(skipped),
            },
            status=status.HTTP_200_OK,
        )
