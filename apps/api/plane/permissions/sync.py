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

"""
Permission Sync

Provides PermissionSyncMixin for models that need to automatically sync
membership changes to the ResourcePermission table via PermissionEngine.

Works with ChangeTrackerMixin (from plane.db.mixins) to detect field changes
and trigger sync on save.
"""

import logging

logger = logging.getLogger(__name__)


class PermissionSyncMixin:
    """
    Mixin to automatically sync model changes to ResourcePermission table.

    Works with ChangeTrackerMixin to detect changes and sync on save.

    Required class attributes:
        PERMISSION_SUBJECT_TYPE: str - "user" or "teamspace"
        PERMISSION_SUBJECT_ID_FIELD: str - field name for subject_id (e.g., "member_id")
        PERMISSION_RESOURCE_TYPE: str - "workspace", "project", or "teamspace"
        PERMISSION_RESOURCE_ID_FIELD: str - field name for resource_id

    Optional overrides:
        _get_permission_workspace_id(): Returns workspace_id (default: self.workspace_id)
        _get_permission_relation(): Returns relation string (default: "member")
        _is_permission_active(): Returns bool for active state (default: self.deleted_at is None)

    Example:
        class TeamspaceMember(PermissionSyncMixin, ChangeTrackerMixin, BaseModel):
            TRACKED_FIELDS = ["deleted_at"]
            PERMISSION_SUBJECT_TYPE = "user"
            PERMISSION_SUBJECT_ID_FIELD = "member_id"
            PERMISSION_RESOURCE_TYPE = "teamspace"
            PERMISSION_RESOURCE_ID_FIELD = "team_space_id"
    """

    PERMISSION_SUBJECT_TYPE: str = None
    PERMISSION_SUBJECT_ID_FIELD: str = None
    PERMISSION_RESOURCE_TYPE: str = None
    PERMISSION_RESOURCE_ID_FIELD: str = None

    def save(self, *args, **kwargs):
        from django.db import transaction

        is_new = self._state.adding

        # Capture old role_ref_id before ChangeTrackerMixin.save() resets
        # _original_values. Needed by _validate_management_authority to resolve
        # the previous role when checking demotion authority.
        original_values = getattr(self, "_original_values", None)
        self._old_role_ref_id = (
            original_values.get("role_ref_id") if original_values else None
        )
        self._is_new_record = is_new

        with transaction.atomic():
            super().save(*args, **kwargs)

            # Sync on create OR when tracked fields change
            if is_new or getattr(self, "_changes_on_save", None):
                try:
                    self._sync_to_resource_permission()
                except Exception:
                    logger.exception(
                        "Failed to sync permissions for %s (pk=%s)",
                        type(self).__name__,
                        self.pk,
                    )
                    raise

    def _get_permission_subject_id(self):
        """Get subject_id from configured field."""
        return getattr(self, self.PERMISSION_SUBJECT_ID_FIELD, None)

    def _get_permission_resource_id(self):
        """Get resource_id from configured field."""
        return getattr(self, self.PERMISSION_RESOURCE_ID_FIELD, None)

    def _get_permission_workspace_id(self):
        """Override if workspace_id is not directly available."""
        return self.workspace_id

    def _get_permission_relation(self):
        """Override for dynamic relation (e.g., based on role)."""
        return "member"

    def _is_permission_active(self):
        """Override for models with is_active field."""
        return self.deleted_at is None

    def _validate_management_authority(self, relation: str, actor_id):
        """Layer 2 defense-in-depth: block tier-violating grants.

        Applies to workspace- and project-scoped membership syncs. Checks both:
        1. can_assign_role — can the actor grant the NEW role?
        2. can_manage_role — can the actor manage the member's OLD role?
           (uses _old_role_ref_id captured in save() before ChangeTrackerMixin reset)

        Raises PermissionDenied on violation, rolling back the transaction.
        This is a safety net — views should call can_manage_role/can_assign_role first.
        """
        from rest_framework.exceptions import PermissionDenied as DRFPermissionDenied

        # Determine resource type and select the appropriate protected-slugs map
        resource_type = getattr(self, "PERMISSION_RESOURCE_TYPE", None)
        if resource_type == "workspace":
            from plane.permissions.system_roles import PROTECTED_ROLE_SLUGS
            protected_slugs = PROTECTED_ROLE_SLUGS
        elif resource_type == "project":
            from plane.permissions.system_roles import PROJECT_PROTECTED_ROLE_SLUGS
            protected_slugs = PROJECT_PROTECTED_ROLE_SLUGS
        else:
            return

        # Skip for new records — initial creation is governed by the view layer
        if getattr(self, "_is_new_record", False):
            return

        from plane.permissions.system_roles import get_workspace_role_slug

        # Resolve the OLD role slug from _old_role_ref_id (captured in save())
        old_role_slug = None
        changes = getattr(self, "_changes_on_save", None) or []
        old_role_ref_id = getattr(self, "_old_role_ref_id", None)
        if "role_ref_id" in changes and old_role_ref_id:
            from plane.db.models.permission import Role

            old_role_slug = (
                Role.objects.filter(id=old_role_ref_id, deleted_at__isnull=True)
                .values_list("slug", flat=True)
                .first()
            )

        # Check if either the new or old relation is protected
        new_is_protected = relation in protected_slugs
        old_is_protected = old_role_slug in protected_slugs

        if not new_is_protected and not old_is_protected:
            return  # Neither old nor new role is protected — no guard needed

        # Resolve actor's role
        if not actor_id:
            raise DRFPermissionDenied(
                "Management authority check failed: no actor identified for a protected role grant"
            )

        if resource_type == "workspace":
            from plane.db.models import WorkspaceMember

            actor_member = (
                WorkspaceMember.objects.select_related("role_ref")
                .filter(
                    workspace_id=self._get_permission_workspace_id(),
                    member_id=actor_id,
                    is_active=True,
                )
                .first()
            )

            if not actor_member:
                raise DRFPermissionDenied(
                    "Management authority check failed: actor is not an active workspace member"
                )

            actor_slug = get_workspace_role_slug(actor_member)

            # Bootstrapping fallback: if actor's member record doesn't yet
            # resolve to "owner", check if they are the workspace FK owner
            # (e.g. owner setting their own role_ref for the first time).
            if actor_slug != "owner":
                from plane.db.models import Workspace

                try:
                    ws_owner_id = Workspace.objects.values_list("owner_id", flat=True).get(
                        id=self._get_permission_workspace_id()
                    )
                    if actor_id == ws_owner_id:
                        actor_slug = "owner"
                except Workspace.DoesNotExist:
                    pass

        elif resource_type == "project":
            from plane.db.models import ProjectMember as PM

            actor_member = (
                PM.objects.select_related("role_ref")
                .filter(
                    project_id=self._get_permission_resource_id(),
                    member_id=actor_id,
                    is_active=True,
                )
                .first()
            )
            if actor_member:
                from plane.permissions.system_roles import get_project_role_slug
                actor_slug = get_project_role_slug(actor_member)
            else:
                # Workspace admin/owner fallback — they can manage project members
                # without being a project member themselves
                from plane.db.models import WorkspaceMember

                ws_fallback = (
                    WorkspaceMember.objects.select_related("role_ref")
                    .filter(
                        workspace_id=self._get_permission_workspace_id(),
                        member_id=actor_id,
                        is_active=True,
                    )
                    .first()
                )
                if ws_fallback:
                    ws_slug = get_workspace_role_slug(ws_fallback)
                    actor_slug = "admin" if ws_slug in ("owner", "admin") else None
                else:
                    actor_slug = None
                if not actor_slug:
                    raise DRFPermissionDenied(
                        "Management authority check failed: actor is not an active project or workspace member"
                    )

        # Check 1: can actor assign the NEW role?
        if new_is_protected:
            required = protected_slugs[relation]
            if actor_slug not in required:
                raise DRFPermissionDenied(
                    f"Management authority check failed: {actor_slug} cannot assign {relation} role"
                )

        # Check 2: can actor manage the OLD role? (only if role changed)
        if old_is_protected:
            required = protected_slugs[old_role_slug]
            if actor_slug not in required:
                raise DRFPermissionDenied(
                    f"Management authority check failed: {actor_slug} cannot manage {old_role_slug} role"
                )

    def _sync_to_resource_permission(self):
        """Sync to ResourcePermission table using PermissionEngine."""
        from plane.permissions.engine import PermissionEngine
        from plane.permissions.grants import Grant

        subject_id = self._get_permission_subject_id()
        if not subject_id:
            logger.debug("Skipping permission sync for %s: no subject_id", type(self).__name__)
            return

        resource_id = self._get_permission_resource_id()
        if not resource_id:
            logger.debug("Skipping permission sync for %s: no resource_id", type(self).__name__)
            return

        engine = PermissionEngine(use_cache=False)  # Skip cache for sync operations

        # Get the actor from AuditModel fields
        actor_id = getattr(self, "updated_by_id", None) or getattr(self, "created_by_id", None)

        if self._is_permission_active():
            # Layer 2 management authority guard (defense in depth)
            self._validate_management_authority(
                relation=self._get_permission_relation(),
                actor_id=actor_id,
            )

            # Active: grant permission (creates or updates)
            logger.debug(
                "Granting %s:%s -> %s on %s:%s",
                self.PERMISSION_SUBJECT_TYPE, subject_id,
                self._get_permission_relation(),
                self.PERMISSION_RESOURCE_TYPE, resource_id,
            )
            engine.grant(
                granter=actor_id,
                grant=Grant(
                    subject_type=self.PERMISSION_SUBJECT_TYPE,
                    subject_id=subject_id,
                    relation=self._get_permission_relation(),
                    resource_type=self.PERMISSION_RESOURCE_TYPE,
                    resource_id=resource_id,
                    workspace_id=self._get_permission_workspace_id(),
                ),
            )
        else:
            # Inactive/deleted: revoke permission (soft-deletes)
            logger.debug(
                "Revoking %s:%s on %s:%s",
                self.PERMISSION_SUBJECT_TYPE, subject_id,
                self.PERMISSION_RESOURCE_TYPE, resource_id,
            )
            engine.revoke(
                revoker=actor_id,
                subject_type=self.PERMISSION_SUBJECT_TYPE,
                subject_id=subject_id,
                resource_type=self.PERMISSION_RESOURCE_TYPE,
                resource_id=resource_id,
                workspace_id=self._get_permission_workspace_id(),
            )
