# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import logging
from dataclasses import dataclass, field
from uuid import UUID

# Django imports
from django.db import transaction

# Module imports
from plane.db.models.project import ROLE
from plane.db.models.workspace import ROLE as WORKSPACE_ROLE, Workspace
from plane.authentication.models import GroupMapping, GroupSyncConfig
from plane.db.models import (
    Project,
    ProjectMember,
    ProjectMemberSource,
    WorkspaceMember,
)
from plane.payment.bgtasks.member_sync_task import member_sync_task

logger = logging.getLogger("plane.authentication")


@dataclass
class SyncResult:
    """Result of a group sync operation."""

    user_id: UUID
    workspace_id: UUID
    added_to_workspace: bool = False
    projects_added: list[UUID] = field(default_factory=list)
    projects_removed: list[UUID] = field(default_factory=list)
    projects_unchanged: list[UUID] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    @property
    def success(self) -> bool:
        return len(self.errors) == 0


class GroupSyncService:
    """
    Provider-agnostic service for syncing user project memberships based on IdP groups.

    This service handles the core sync logic:
    - Adding users to projects based on group mappings
    - Optionally removing users when they leave groups (if auto_remove is enabled)
    - Respecting role precedence (highest role wins)
    - Never auto-removing manually added members
    - Never removing the last admin from a project
    """

    def sync_user_memberships(
        self,
        user_id: UUID,
        workspace_id: UUID,
        groups: list[str],
    ) -> SyncResult:
        """
        Sync a user's project memberships based on their IdP groups.

        If the user is not a workspace member but has groups that map to projects,
        they will be added to the workspace first with Member role.

        Args:
            user_id: The Plane user ID
            workspace_id: The workspace ID
            groups: List of group names from the identity provider

        Returns:
            SyncResult with details of changes made
        """
        result = SyncResult(user_id=user_id, workspace_id=workspace_id)

        try:
            # Get sync config for workspace
            config = GroupSyncConfig.objects.filter(
                workspace_id=workspace_id,
                is_enabled=True,
            ).first()

            if not config:
                logger.debug(
                    "Group sync not enabled for workspace",
                    extra={"workspace_id": str(workspace_id)},
                )
                return result

            # Get all group mappings for this workspace
            mappings = GroupMapping.objects.filter(
                workspace_id=workspace_id,
            ).select_related("project")

            # Build mapping lookup: group_name -> list of (project_id, role)
            group_to_projects = self._build_group_mapping_lookup(mappings)

            # Determine which projects user should be in based on their groups
            target_memberships = self._calculate_target_memberships(groups, group_to_projects)

            # If user has no matching groups, check if we need to remove memberships
            if not target_memberships:
                # If auto_remove is disabled, nothing to do
                if not config.auto_remove:
                    logger.debug(
                        "No matching group mappings for user",
                        extra={
                            "user_id": str(user_id),
                            "workspace_id": str(workspace_id),
                            "groups": groups,
                        },
                    )
                    return result

                # Check if user has any synced memberships that need removal
                current_synced = self._get_current_synced_memberships(user_id, workspace_id)
                if not current_synced:
                    logger.debug(
                        "No matching group mappings and no synced memberships to remove",
                        extra={
                            "user_id": str(user_id),
                            "workspace_id": str(workspace_id),
                            "groups": groups,
                        },
                    )
                    return result

                # Remove all synced memberships since user has no matching groups
                with transaction.atomic():
                    for project_id in current_synced:
                        removed = self._remove_from_project(user_id, project_id)
                        if removed:
                            result.projects_removed.append(project_id)

                logger.info(
                    "Group sync completed - removed memberships for user with no matching groups",
                    extra={
                        "user_id": str(user_id),
                        "workspace_id": str(workspace_id),
                        "removed": len(result.projects_removed),
                    },
                )
                return result

            # Perform sync
            with transaction.atomic():
                # Check if user is a workspace member, add them if not
                if not self._is_workspace_member(user_id, workspace_id):
                    added_to_workspace = self._add_to_workspace(user_id, workspace_id)
                    if added_to_workspace:
                        result.added_to_workspace = True
                        logger.info(
                            "Added user to workspace via group sync",
                            extra={
                                "user_id": str(user_id),
                                "workspace_id": str(workspace_id),
                            },
                        )

                # Get user's current group-synced memberships
                current_synced = self._get_current_synced_memberships(user_id, workspace_id)

                # Add to new projects
                for project_id, role in target_memberships.items():
                    if project_id not in current_synced:
                        added = self._add_to_project(user_id, project_id, role)
                        if added:
                            result.projects_added.append(project_id)
                    else:
                        result.projects_unchanged.append(project_id)

                # Remove from projects if auto_remove is enabled
                # Note: We only remove from projects, not from workspace
                if config.auto_remove:
                    for project_id in current_synced:
                        if project_id not in target_memberships:
                            removed = self._remove_from_project(user_id, project_id)
                            if removed:
                                result.projects_removed.append(project_id)

            logger.info(
                "Group sync completed",
                extra={
                    "user_id": str(user_id),
                    "workspace_id": str(workspace_id),
                    "groups_count": len(groups),
                    "added_to_workspace": result.added_to_workspace,
                    "added": len(result.projects_added),
                    "removed": len(result.projects_removed),
                },
            )

        except Exception as e:
            logger.exception(
                "Error during group sync",
                extra={
                    "user_id": str(user_id),
                    "workspace_id": str(workspace_id),
                    "error": str(e),
                },
            )
            result.errors.append(str(e))

        return result

    def _is_workspace_member(self, user_id: UUID, workspace_id: UUID) -> bool:
        """Check if user is an active workspace member."""
        return WorkspaceMember.objects.filter(
            member_id=user_id,
            workspace_id=workspace_id,
            is_active=True,
        ).exists()

    def _add_to_workspace(
        self,
        user_id: UUID,
        workspace_id: UUID,
    ) -> bool:
        """
        Add user to workspace with Member role via group sync.

        Returns True if user was added, False if they were already a member.
        """
        # Check if user already exists (including inactive)
        existing = WorkspaceMember.all_objects.filter(
            member_id=user_id,
            workspace_id=workspace_id,
        ).first()
        workspace = Workspace.objects.get(id=workspace_id)

        if existing:
            if existing.is_active:
                # Already an active member
                return False
            # Reactivate the membership
            existing.is_active = True
            existing.deleted_at = None
            existing.save(update_fields=["is_active", "deleted_at", "updated_at"])
            logger.info(
                "Reactivated workspace membership via group sync",
                extra={
                    "user_id": str(user_id),
                    "workspace_id": str(workspace_id),
                },
            )
            member_sync_task.delay(workspace.slug)
            return True

        # Add user as workspace member with Member role
        WorkspaceMember.objects.create(
            member_id=user_id,
            workspace_id=workspace_id,
            role=WORKSPACE_ROLE.MEMBER.value,
        )

        # Sync the membership
        member_sync_task.delay(workspace.slug)

        return True

    def _build_group_mapping_lookup(
        self,
        mappings,
    ) -> dict[str, list[tuple[UUID, int]]]:
        """
        Build a lookup from group name to list of (project_id, role).

        A single group can map to multiple projects.
        """
        lookup: dict[str, list[tuple[UUID, int]]] = {}
        for mapping in mappings:
            if mapping.idp_group_name not in lookup:
                lookup[mapping.idp_group_name] = []
            lookup[mapping.idp_group_name].append((mapping.project_id, mapping.default_role))
        return lookup

    def _calculate_target_memberships(
        self,
        user_groups: list[str],
        group_to_projects: dict[str, list[tuple[UUID, int]]],
    ) -> dict[UUID, int]:
        """
        Calculate target project memberships based on user's groups.

        If user belongs to multiple groups that map to the same project,
        they get the highest role among all mappings.

        Returns:
            Dict of project_id -> highest_role
        """
        target: dict[UUID, int] = {}

        for group_name in user_groups:
            if group_name not in group_to_projects:
                continue

            for project_id, role in group_to_projects[group_name]:
                if project_id not in target:
                    target[project_id] = role
                else:
                    # Take the higher role (higher number = more permissions)
                    target[project_id] = max(target[project_id], role)

        return target

    def _get_current_synced_memberships(
        self,
        user_id: UUID,
        workspace_id: UUID,
    ) -> set[UUID]:
        """Get project IDs where user was added via group sync."""
        return set(
            ProjectMember.objects.filter(
                member_id=user_id,
                workspace_id=workspace_id,
                source=ProjectMemberSource.GROUP_SYNC,
                is_active=True,
            ).values_list("project_id", flat=True)
        )

    def _add_to_project(
        self,
        user_id: UUID,
        project_id: UUID,
        role: int,
    ) -> bool:
        """
        Add user to project via group sync.

        Returns True if user was added, False if they were already a member.
        """
        # Check if user is already a member (via any source)
        existing = ProjectMember.objects.filter(
            member_id=user_id,
            project_id=project_id,
        ).first()

        if existing:
            if not existing.is_active:
                existing.is_active = True
                existing.source = ProjectMemberSource.GROUP_SYNC
                existing.save(update_fields=["is_active", "source"])
                logger.debug(
                    "User activated in project",
                    extra={
                        "user_id": str(user_id),
                        "project_id": str(project_id),
                    },
                )
                return True
            else:
                # User already in project - don't modify their membership
                logger.debug(
                    "User already in project, skipping",
                    extra={
                        "user_id": str(user_id),
                        "project_id": str(project_id),
                    },
                )
                return False

        # Get project to access workspace_id
        project = Project.objects.get(id=project_id)

        # Add user to project
        ProjectMember.objects.create(
            member_id=user_id,
            project_id=project_id,
            workspace_id=project.workspace_id,
            role=role,
            source=ProjectMemberSource.GROUP_SYNC,
        )

        logger.info(
            "Added user to project via group sync",
            extra={
                "user_id": str(user_id),
                "project_id": str(project_id),
                "role": role,
            },
        )
        return True

    def _remove_from_project(
        self,
        user_id: UUID,
        project_id: UUID,
    ) -> bool:
        """
        Remove user from project if they were added via group sync.

        Returns True if user was removed, False otherwise.

        Rules:
        - Only remove if source is GROUP_SYNC
        - Never remove the last admin from a project
        """
        membership = ProjectMember.objects.filter(
            member_id=user_id,
            project_id=project_id,
            source=ProjectMemberSource.GROUP_SYNC,
            is_active=True,
        ).first()

        if not membership:
            return False

        # Check if this is the last admin
        if membership.role == ROLE.ADMIN:  # Admin role
            admin_count = ProjectMember.objects.filter(
                project_id=project_id,
                role=ROLE.ADMIN,
                is_active=True,
            ).count()

            if admin_count <= 1:
                logger.warning(
                    "Cannot remove last admin from project",
                    extra={
                        "user_id": str(user_id),
                        "project_id": str(project_id),
                    },
                )
                return False

        # Soft delete the membership
        membership.delete()

        logger.info(
            "Removed user from project via group sync",
            extra={
                "user_id": str(user_id),
                "project_id": str(project_id),
            },
        )
        return True

    def get_user_synced_projects(
        self,
        user_id: UUID,
        workspace_id: UUID,
    ) -> list[dict]:
        """
        Get list of projects where user was added via group sync.

        Useful for displaying to users which projects they have access to
        via their IdP groups.
        """
        memberships = ProjectMember.objects.filter(
            member_id=user_id,
            workspace_id=workspace_id,
            source=ProjectMemberSource.GROUP_SYNC,
            is_active=True,
        ).select_related("project")

        return [
            {
                "project_id": str(m.project_id),
                "project_name": m.project.name,
                "role": m.role,
            }
            for m in memberships
        ]
