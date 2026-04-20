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
Permission Models

Core database models for the RBAC + GAC permission system.
Implements the Zanzibar-style relationship-based access control.
"""

from django.db import models
from django.contrib.postgres.fields import ArrayField

from .base import BaseModel
from plane.db.mixins import ChangeTrackerMixin


class SubjectType(models.TextChoices):
    """Types of subjects that can be granted permissions."""

    USER = "user", "User"
    TEAMSPACE = "teamspace", "Teamspace"


class RoleNamespace(models.TextChoices):
    """
    Namespace for scoped roles.

    Different role definitions exist per namespace:
    - instance roles: instance-level administrative roles (workspace=NULL)
    - workspace roles: permissions for workspace-level resources
    - project roles: permissions for project and child resources
    """

    INSTANCE = "instance", "Instance"
    WORKSPACE = "workspace", "Workspace"
    PROJECT = "project", "Project"


class RoleStatus(models.TextChoices):
    """Status of a role."""

    ACTIVE = "active", "Active"
    INACTIVE = "inactive", "Inactive"


class Role(ChangeTrackerMixin, BaseModel):
    """
    Namespace-scoped role definition.

    Roles are scoped to one of three namespaces:
    - Instance roles: Instance-level administrative roles (workspace=NULL)
    - Workspace roles: Permissions for workspace-level resources
    - Project roles: Permissions for project-level resources

    System roles (admin, member, guest) exist for workspace and project namespaces.
    Instance namespace has admin role (reserved for future use).
    Custom roles can be created per workspace (enterprise feature).

    Example custom roles: "QA Lead", "Designer", "Contractor"
    """

    TRACKED_FIELDS = [
        "name",
        "description",
        "level",
        "status",
        "sort_order",
        "based_on_id",
        "deleted_at",
    ]

    # NULL for instance-level roles, set for workspace/project roles
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="roles",
        null=True,
        blank=True,
    )

    # Namespace this role applies to
    namespace = models.CharField(
        max_length=20,
        choices=RoleNamespace.choices,
        default=RoleNamespace.WORKSPACE,
        db_index=True,
        help_text="Whether this role is for instance, workspace, or project-level resources",
    )

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    description = models.TextField(blank=True, default="")

    # Numeric level for role comparison (higher = more permissions)
    # System roles: instance_admin=30, owner=25, admin=20, member=15, guest=5
    level = models.PositiveSmallIntegerField(default=10)

    # System roles cannot be deleted or have permissions modified
    is_system = models.BooleanField(default=False)

    based_on = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="derived_roles",
    )

    # Role status (inactive roles are not used in permission checks)
    status = models.CharField(
        max_length=20,
        choices=RoleStatus.choices,
        default=RoleStatus.ACTIVE,
    )

    # Display order for UI
    sort_order = models.PositiveIntegerField(default=65535)

    # M2M to PermissionScheme via through table
    permission_schemes = models.ManyToManyField(
        "db.PermissionScheme",
        through="db.RolePermissionScheme",
        related_name="roles",
        blank=True,
    )

    class Meta:
        db_table = "roles"
        constraints = [
            # For workspace/project roles: unique per workspace (active only)
            models.UniqueConstraint(
                fields=["workspace", "namespace", "slug"],
                condition=models.Q(workspace__isnull=False, deleted_at__isnull=True),
                name="unique_workspace_namespace_slug",
            ),
            # For instance roles: unique globally (active only, workspace=NULL)
            models.UniqueConstraint(
                fields=["namespace", "slug"],
                condition=models.Q(workspace__isnull=True, deleted_at__isnull=True),
                name="unique_instance_namespace_slug",
            ),
        ]
        ordering = ["namespace", "sort_order", "name"]
        indexes = [
            models.Index(fields=["workspace", "is_system"]),
            models.Index(fields=["workspace", "namespace"]),
            models.Index(fields=["namespace", "slug"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.namespace})"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new or getattr(self, "_changes_on_save", None):
            self._invalidate_role_cache()
            self._record_activity(is_new=is_new)

    def _record_activity(self, is_new):
        from plane.db.models.permission import RoleActivity

        actor_id = self.created_by_id if is_new else self.updated_by_id
        RoleActivity.track_role_changes(self, actor_id=actor_id, is_new=is_new)

    def _invalidate_role_cache(self):
        """Invalidate the cached permissions for this role and affected users."""
        from django.core.cache import cache
        from plane.permissions.definitions import WORKSPACE_RESOURCE_TYPES, PROJECT_RESOURCE_TYPES

        # 1. Delete role-level cache (existing behavior)
        if self.workspace_id:
            cache_key = f"role_perms:{self.workspace_id}:{self.namespace}:{self.slug}"
        else:
            cache_key = f"role_perms:instance:{self.namespace}:{self.slug}"
        cache.delete(cache_key)

        # Also invalidate the valid-slugs cache so new/deleted roles are recognized
        if self.workspace_id:
            cache.delete(f"custom_role_slugs:{self.workspace_id}:{self.namespace}")

        # 2. Invalidate user-level caches for all users assigned this role.
        # When a custom role's permission set changes, users with that role
        # would otherwise see stale cached results until PERMISSION_CACHE_TTL
        # expires. Incrementing their version counter forces a cache miss.
        affected_users_qs = ResourcePermission.objects.filter(
            relation=self.slug,
            subject_type="user",
        )

        if self.workspace_id:
            affected_users_qs = affected_users_qs.filter(workspace_id=self.workspace_id)
        else:
            affected_users_qs = affected_users_qs.filter(workspace_id__isnull=True)

        if self.namespace == RoleNamespace.WORKSPACE:
            affected_users_qs = affected_users_qs.filter(
                resource_type__in=[str(resource_type) for resource_type in WORKSPACE_RESOURCE_TYPES]
            )
        elif self.namespace == RoleNamespace.PROJECT:
            affected_users_qs = affected_users_qs.filter(
                resource_type__in=[str(resource_type) for resource_type in PROJECT_RESOURCE_TYPES]
            )

        affected_user_ids = affected_users_qs.values_list("subject_id", flat=True).distinct()
        from plane.permissions.cache import bulk_invalidate_cache_for_users
        bulk_invalidate_cache_for_users(affected_user_ids)


class PermissionScheme(ChangeTrackerMixin, BaseModel):
    """
    A named, reusable collection of permissions.

    Roles are composed of one or more PermissionSchemes.
    Effective permissions = union of all PS in the role.

    System PS (is_system=True, workspace=NULL) are shipped by Plane and
    map 1:1 to system roles. Custom PS are created per workspace by admins.
    """

    TRACKED_FIELDS = [
        "name",
        "description",
        "permissions",
        "sort_order",
        "deleted_at",
    ]

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="permission_schemes",
        null=True,
        blank=True,
    )

    namespace = models.CharField(
        max_length=20,
        choices=RoleNamespace.choices,
        default=RoleNamespace.WORKSPACE,
        db_index=True,
    )

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100)
    description = models.TextField(blank=True, default="")

    permissions = ArrayField(
        models.CharField(max_length=100),
        default=list,
        help_text="List of permission strings like 'workitem:edit', 'project:*', 'workitem:delete+creator'",
    )

    is_system = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=65535)

    class Meta:
        db_table = "permission_schemes"
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "namespace", "slug"],
                condition=models.Q(workspace__isnull=False, deleted_at__isnull=True),
                name="unique_workspace_ps_namespace_slug",
            ),
            models.UniqueConstraint(
                fields=["namespace", "slug"],
                condition=models.Q(workspace__isnull=True, deleted_at__isnull=True),
                name="unique_system_ps_namespace_slug",
            ),
        ]
        ordering = ["namespace", "sort_order", "name"]
        indexes = [
            models.Index(fields=["workspace", "is_system"]),
            models.Index(fields=["workspace", "namespace"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.namespace})"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new or getattr(self, "_changes_on_save", None):
            self._record_activity(is_new=is_new)

    def _record_activity(self, is_new):
        actor_id = self.created_by_id if is_new else self.updated_by_id
        PermissionSchemeActivity.track_changes(self, actor_id=actor_id, is_new=is_new)


class RolePermissionScheme(BaseModel):
    """
    M2M join table: which PermissionSchemes compose a Role.

    A role's effective permissions = union of all linked PS permissions.
    """

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="role_permission_schemes",
        null=True,
        blank=True,
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name="role_permission_schemes",
    )
    permission_scheme = models.ForeignKey(
        PermissionScheme,
        on_delete=models.CASCADE,
        related_name="role_permission_schemes",
    )
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "role_permission_schemes"
        constraints = [
            models.UniqueConstraint(
                fields=["role", "permission_scheme"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_active_role_permission_scheme",
            ),
        ]
        ordering = ["sort_order"]

    def __str__(self):
        return f"{self.role.name} <- {self.permission_scheme.name}"


class ResourcePermission(BaseModel):
    """
    Core permission grant model - the Zanzibar relationship tuple.

    This single table handles ALL permission grants:
    - User -> Workspace membership
    - User -> Project membership
    - User -> Specific issue access (GAC)
    - Teamspace -> Project access (resolved via link relations)

    The tuple is: (subject_type, subject_id, relation, resource_type, resource_id)

    subject_type is "user" or "teamspace". The relation field stores the
    role slug (e.g., "admin", "member", "contributor", or a custom role slug).

    Examples:
    - (user, uuid1, admin, workspace, uuid2) - User is admin of workspace
    - (user, uuid1, contributor, project, uuid3) - User is contributor on project
    - (teamspace, uuid4, member, project, uuid5) - Teamspace grants member access to project
    """

    # NULL for instance-level permissions, set for workspace/project-level
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="resource_permissions",
        null=True,
        blank=True,
    )

    # === SUBJECT (Who) ===
    subject_type = models.CharField(
        max_length=20,
        choices=SubjectType.choices,
        default=SubjectType.USER,
    )
    subject_id = models.UUIDField(
        db_index=True,
        help_text="ID of the user or teamspace",
    )

    # === RELATION (What relationship/role) ===
    # System roles: 'owner', 'admin', 'member', 'contributor', 'commenter', 'guest'
    # Can also be a custom role slug
    relation = models.CharField(
        max_length=50,
        db_index=True,
        help_text="The role/relation name (admin, member, guest, or custom role slug)",
    )

    # === RESOURCE (To what) ===
    resource_type = models.CharField(
        max_length=50,
        db_index=True,
    )
    resource_id = models.UUIDField(
        db_index=True,
        help_text="ID of the resource (workspace, project, issue, etc.)",
    )

    # === METADATA ===
    granted_by = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="permissions_granted",
    )

    # Expiration for temporary access
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this permission expires (null = never)",
    )

    # === INLINE PERMISSION OVERRIDES (GAC) ===
    # These allow fine-grained permission overrides on specific resources
    # NULL means "inherit from role", explicit values override

    # Additional permissions granted beyond what the relation provides
    permissions_grant = ArrayField(
        models.CharField(max_length=50),
        default=list,
        blank=True,
        help_text="Additional permissions granted on this resource",
    )

    # Permissions explicitly denied (takes precedence over grants)
    permissions_deny = ArrayField(
        models.CharField(max_length=50),
        default=list,
        blank=True,
        help_text="Permissions explicitly denied on this resource",
    )

    # Condition for conditional access (JSON)
    # Example: {"created_by": "self"} - can only access own items
    condition = models.JSONField(
        null=True,
        blank=True,
        help_text="JSON condition for conditional access",
    )

    class Meta:
        db_table = "resource_permissions"
        constraints = [
            models.UniqueConstraint(
                fields=["subject_type", "subject_id", "resource_type", "resource_id"],
                condition=models.Q(deleted_at__isnull=True),
                name="resource_permission_unique_active_tuple",
            )
        ]
        indexes = [
            # (subject_type, subject_id) and (subject_type, subject_id, resource_type)
            # are NOT indexed here — they are covered by the prefix of the
            # resource_permission_unique_active_tuple unique constraint index.
            #
            # Fast lookup: "who has access to resource Y?" (active only)
            models.Index(
                fields=["resource_type", "resource_id"],
                condition=models.Q(deleted_at__isnull=True),
                name="idx_rp_resource_active",
            ),
            # Fast lookup: "all permissions in workspace" (active only)
            models.Index(
                fields=["workspace", "resource_type"],
                condition=models.Q(deleted_at__isnull=True),
                name="idx_rp_ws_restype_active",
            ),
            # Fast lookup: "all permissions with specific relation" (active only)
            models.Index(
                fields=["workspace", "relation"],
                condition=models.Q(deleted_at__isnull=True),
                name="idx_rp_ws_relation_active",
            ),
            # Expiration lookup (active only)
            models.Index(
                fields=["expires_at"],
                condition=models.Q(expires_at__isnull=False, deleted_at__isnull=True),
                name="idx_rp_expires_active",
            ),
            # Covers link relation prefetch queries
            models.Index(
                fields=["resource_type", "resource_id", "subject_type"],
                condition=models.Q(deleted_at__isnull=True),
                name="idx_rp_res_subjtype_active",
            ),
        ]

    def __str__(self):
        return f"{self.subject_type}:{self.subject_id} -> {self.relation} -> {self.resource_type}:{self.resource_id}"

    @property
    def is_expired(self) -> bool:
        """Check if this permission has expired."""
        if self.expires_at is None:
            return False
        from django.utils import timezone

        return timezone.now() > self.expires_at


class PermissionAuditLog(BaseModel):
    """
    Audit log for permission changes.

    Tracks who granted/revoked what permissions to whom.
    Important for security auditing and compliance.
    """

    class ActionType(models.TextChoices):
        GRANT = "grant", "Grant"
        REVOKE = "revoke", "Revoke"
        MODIFY = "modify", "Modify"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="permission_audit_logs",
        null=True,
        blank=True,
    )

    # What action was performed
    action = models.CharField(max_length=20, choices=ActionType.choices)

    # Who performed the action
    actor = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="permission_actions",
    )

    # The subject of the permission change
    subject_type = models.CharField(max_length=20, choices=SubjectType.choices)
    subject_id = models.UUIDField()

    # The resource affected
    resource_type = models.CharField(max_length=50)
    resource_id = models.UUIDField()

    # The relation/role before and after
    relation_before = models.CharField(max_length=50, null=True, blank=True)
    relation_after = models.CharField(max_length=50, null=True, blank=True)

    # Additional context
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "permission_audit_logs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["workspace", "action"]),
            models.Index(fields=["actor", "created_at"]),
            models.Index(fields=["resource_type", "resource_id"]),
        ]

    def __str__(self):
        return f"{self.action}: {self.subject_type}:{self.subject_id} on {self.resource_type}:{self.resource_id}"


class RoleActivity(BaseModel):
    """
    Audit log for role lifecycle and field-level changes.

    Every create, update (per-field), and delete on a Role produces one or more
    RoleActivity rows. For updates, each changed field gets its own row so the
    full history is queryable per-field.
    """

    class Action(models.TextChoices):
        CREATED = "created", "Created"
        UPDATED = "updated", "Updated"
        DELETED = "deleted", "Deleted"

    class Field(models.TextChoices):
        # Scalar fields on Role
        NAME = "name", "Name"
        DESCRIPTION = "description", "Description"
        LEVEL = "level", "Level"
        STATUS = "status", "Status"
        SORT_ORDER = "sort_order", "Sort Order"
        BASED_ON = "based_on", "Based On"
        # M2M changes (tracked from view layer)
        PERMISSION_SCHEME = "permission_scheme", "Permission Scheme"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="role_activities",
        null=True,
        blank=True,
    )
    role = models.ForeignKey(
        "db.Role",
        on_delete=models.CASCADE,
        related_name="activities",
    )
    action = models.CharField(max_length=20, choices=Action.choices)
    field = models.CharField(
        max_length=50,
        choices=Field.choices,
        null=True,
        blank=True,
    )
    old_value = models.TextField(null=True, blank=True)
    new_value = models.TextField(null=True, blank=True)
    old_identifier = models.UUIDField(null=True, blank=True)
    new_identifier = models.UUIDField(null=True, blank=True)
    actor = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="role_activities",
    )

    class Meta:
        verbose_name = "Role Activity"
        verbose_name_plural = "Role Activities"
        db_table = "role_activities"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["role", "-created_at"]),
            models.Index(fields=["workspace", "-created_at"]),
        ]

    def __str__(self):
        if self.field:
            return f"{self.action} {self.field} on {self.role_id}"
        return f"{self.action} role {self.role_id}"

    @classmethod
    def track_role_changes(cls, role, actor_id, is_new=False):
        """
        Create activity records from the Role's ChangeTrackerMixin state.

        Call after role.save(). For new roles, creates a single "created" record.
        For updates, creates one record per changed field.
        For deletes, call track_role_delete() instead.
        """
        activities = []

        if is_new:
            activities.append(
                cls(
                    workspace_id=role.workspace_id,
                    role=role,
                    action=cls.Action.CREATED,
                    actor_id=actor_id,
                )
            )
        else:
            changed = getattr(role, "_changes_on_save", [])
            old_values = getattr(role, "_original_values", {})
            for field_name in changed:
                # Skip deleted_at — handled by track_role_delete
                if field_name == "deleted_at":
                    continue
                # Map FK attname to the Field choice key
                choice_key = field_name.removesuffix("_id")
                if not cls.Field.__members__.get(choice_key.upper()):
                    continue

                old_val = old_values.get(field_name)
                new_val = getattr(role, field_name)

                activity = cls(
                    workspace_id=role.workspace_id,
                    role=role,
                    action=cls.Action.UPDATED,
                    field=choice_key,
                    actor_id=actor_id,
                )

                # For UUID FK fields, store in identifier columns
                if field_name.endswith("_id"):
                    activity.old_identifier = old_val
                    activity.new_identifier = new_val
                else:
                    activity.old_value = str(old_val) if old_val is not None else None
                    activity.new_value = str(new_val) if new_val is not None else None

                activities.append(activity)

        if activities:
            cls.objects.bulk_create(activities)
        return activities

    @classmethod
    def track_role_delete(cls, role, actor_id):
        """Record a single 'deleted' activity for a soft-deleted role."""
        return cls.objects.create(
            workspace_id=role.workspace_id,
            role=role,
            action=cls.Action.DELETED,
            actor_id=actor_id,
        )


class PermissionSchemeActivity(BaseModel):
    """
    Audit log for permission scheme lifecycle and field-level changes.

    Every create, update (per-field), and delete on a PermissionScheme produces
    one or more PermissionSchemeActivity rows. For updates, each changed field
    gets its own row so the full history is queryable per-field.
    """

    class Action(models.TextChoices):
        CREATED = "created", "Created"
        UPDATED = "updated", "Updated"
        DELETED = "deleted", "Deleted"

    class Field(models.TextChoices):
        NAME = "name", "Name"
        DESCRIPTION = "description", "Description"
        PERMISSIONS = "permissions", "Permissions"
        SORT_ORDER = "sort_order", "Sort Order"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="permission_scheme_activities",
        null=True,
        blank=True,
    )
    permission_scheme = models.ForeignKey(
        "db.PermissionScheme",
        on_delete=models.CASCADE,
        related_name="activities",
    )
    action = models.CharField(max_length=20, choices=Action.choices)
    field = models.CharField(
        max_length=50,
        choices=Field.choices,
        null=True,
        blank=True,
    )
    old_value = models.TextField(null=True, blank=True)
    new_value = models.TextField(null=True, blank=True)
    actor = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="permission_scheme_activities",
    )

    class Meta:
        verbose_name = "Permission Scheme Activity"
        verbose_name_plural = "Permission Scheme Activities"
        db_table = "permission_scheme_activities"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["permission_scheme", "-created_at"]),
            models.Index(fields=["workspace", "-created_at"]),
        ]

    def __str__(self):
        if self.field:
            return f"{self.action} {self.field} on {self.permission_scheme_id}"
        return f"{self.action} permission scheme {self.permission_scheme_id}"

    @classmethod
    def track_changes(cls, scheme, actor_id, is_new=False):
        """
        Create activity records from the PermissionScheme's ChangeTrackerMixin state.

        Call after scheme.save(). For new schemes, creates a single "created" record.
        For updates, creates one record per changed field.
        For deletes, call track_delete() instead.
        """
        activities = []

        if is_new:
            activities.append(
                cls(
                    workspace_id=scheme.workspace_id,
                    permission_scheme=scheme,
                    action=cls.Action.CREATED,
                    actor_id=actor_id,
                )
            )
        else:
            changed = getattr(scheme, "_changes_on_save", [])
            old_values = getattr(scheme, "_original_values", {})
            for field_name in changed:
                if field_name == "deleted_at":
                    continue
                if not cls.Field.__members__.get(field_name.upper()):
                    continue

                old_val = old_values.get(field_name)
                new_val = getattr(scheme, field_name)

                activities.append(
                    cls(
                        workspace_id=scheme.workspace_id,
                        permission_scheme=scheme,
                        action=cls.Action.UPDATED,
                        field=field_name,
                        old_value=str(old_val) if old_val is not None else None,
                        new_value=str(new_val) if new_val is not None else None,
                        actor_id=actor_id,
                    )
                )

        if activities:
            cls.objects.bulk_create(activities)
        return activities

    @classmethod
    def track_delete(cls, scheme, actor_id):
        """Record a single 'deleted' activity for a soft-deleted permission scheme."""
        return cls.objects.create(
            workspace_id=scheme.workspace_id,
            permission_scheme=scheme,
            action=cls.Action.DELETED,
            actor_id=actor_id,
        )

