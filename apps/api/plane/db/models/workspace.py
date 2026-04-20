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

# Python imports
import logging
import pytz
from typing import Optional, Any
from uuid import UUID
from enum import Enum

# Django imports
from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import Q

# Module imports
from .base import BaseModel
from plane.utils.constants import RESTRICTED_WORKSPACE_SLUGS
from plane.utils.color import get_random_color
from plane.db.mixins import SoftDeletionQuerySet, SoftDeletionManager, ChangeTrackerMixin, FiltersMixin
from plane.db.signals import post_bulk_create, post_bulk_update
from plane.permissions.sync import PermissionSyncMixin

logger = logging.getLogger(__name__)


class WorkspaceRole(models.IntegerChoices):
    ADMIN = 20, "Admin"
    MEMBER = 15, "Member"
    GUEST = 5, "Guest"


ROLE_CHOICES = ((20, "Admin"), (15, "Member"), (5, "Guest"))


class ROLE(Enum):
    ADMIN = 20
    MEMBER = 15
    GUEST = 5


def get_default_props():
    return {
        "filters": {
            "priority": None,
            "state": None,
            "state_group": None,
            "assignees": None,
            "created_by": None,
            "labels": None,
            "start_date": None,
            "target_date": None,
            "subscriber": None,
        },
        "display_filters": {
            "group_by": None,
            "order_by": "-created_at",
            "type": None,
            "sub_issue": True,
            "show_empty_groups": True,
            "layout": "list",
            "calendar_date_range": "",
        },
        "display_properties": {
            "assignee": True,
            "attachment_count": True,
            "created_on": True,
            "due_date": True,
            "estimate": True,
            "key": True,
            "labels": True,
            "link": True,
            "priority": True,
            "start_date": True,
            "state": True,
            "sub_issue_count": True,
            "updated_on": True,
        },
    }


def get_default_filters():
    return {
        "priority": None,
        "state": None,
        "state_group": None,
        "assignees": None,
        "created_by": None,
        "labels": None,
        "start_date": None,
        "target_date": None,
        "subscriber": None,
    }


def get_default_display_filters():
    return {
        "display_filters": {
            "group_by": None,
            "order_by": "-created_at",
            "type": None,
            "sub_issue": True,
            "show_empty_groups": True,
            "layout": "list",
            "calendar_date_range": "",
        }
    }


def get_default_display_properties():
    return {
        "display_properties": {
            "assignee": True,
            "attachment_count": True,
            "created_on": True,
            "due_date": True,
            "estimate": True,
            "key": True,
            "labels": True,
            "link": True,
            "priority": True,
            "start_date": True,
            "state": True,
            "sub_issue_count": True,
            "updated_on": True,
        }
    }


def get_issue_props():
    return {"subscribed": True, "assigned": True, "created": True, "all_issues": True}


def slug_validator(value):
    if value in RESTRICTED_WORKSPACE_SLUGS:
        raise ValidationError("Slug is not valid")


def get_default_checklist():
    return {
        "project_created": False,
        "project_joined": False,
        "work_item_created": False,
        "team_members_invited": False,
        "page_created": False,
        "ai_chat_tried": False,
        "integration_linked": False,
        "view_created": False,
        "sticky_created": False,
    }


def get_default_tips():
    return {"mobile_app_download": False}


def get_default_explored_features():
    return {"github_integrated": False, "slack_integrated": False, "ai_chat_tried": False}


class Workspace(ChangeTrackerMixin, BaseModel):
    TRACKED_FIELDS = ["owner_id", "slug"]
    TIMEZONE_CHOICES = tuple(zip(pytz.common_timezones, pytz.common_timezones))
    SLUG_CACHE_KEY_PREFIX = "ws_slug"
    # Longer TTL is safe because save()/delete() invalidate slug cache entries on slug lifecycle changes.
    SLUG_CACHE_TTL = 10 * 60  # 10 minutes, in seconds

    name = models.CharField(max_length=80, verbose_name="Workspace Name")
    logo = models.TextField(verbose_name="Logo", blank=True, null=True)
    logo_asset = models.ForeignKey(
        "db.FileAsset",
        on_delete=models.SET_NULL,
        related_name="workspace_logo",
        blank=True,
        null=True,
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owner_workspace",
    )
    slug = models.SlugField(max_length=48, db_index=True, unique=True, validators=[slug_validator])
    organization_size = models.CharField(max_length=20, blank=True, null=True)
    timezone = models.CharField(max_length=255, default="UTC", choices=TIMEZONE_CHOICES)
    background_color = models.CharField(max_length=255, default=get_random_color)

    def __str__(self):
        """Return name of the Workspace"""
        return self.name

    @property
    def logo_url(self):
        if self.logo_asset:
            return self.logo_asset.asset_url
        if self.logo:
            return self.logo
        return None

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        old_owner_id = self.old_values.get("owner_id") if self.has_changed("owner_id") else None
        old_slug = self.old_values.get("slug") if self.has_changed("slug") else None
        with transaction.atomic():
            super().save(*args, **kwargs)
            if is_new:
                self._create_system_roles()
                self._create_default_relation_definitions()
        if is_new:
            # Defensive no-op in common case; clears potential stale mapping on slug reuse flows.
            self.invalidate_slug_cache(self.slug)
        elif old_slug and old_slug != self.slug:
            self.invalidate_slug_cache(old_slug, self.slug)
        if old_owner_id and old_owner_id != self.owner_id:
            self._resync_owner_permissions(old_owner_id, self.owner_id)

    @classmethod
    def slug_cache_key(cls, slug):
        """Return the cache key used for slug -> workspace_id lookups."""
        return f"{cls.SLUG_CACHE_KEY_PREFIX}:{slug}"

    @classmethod
    def get_cached_workspace_id(cls, slug):
        """
        Read a cached workspace ID for a slug.

        Returns raw cached value (string/UUID) or None if absent.
        """
        if not slug:
            return None
        return cache.get(cls.slug_cache_key(slug))

    @classmethod
    def set_slug_cache(cls, slug, workspace_id):
        """Cache slug -> workspace_id mapping using the model-defined TTL."""
        if slug and workspace_id:
            cache.set(cls.slug_cache_key(slug), str(workspace_id), cls.SLUG_CACHE_TTL)

    @classmethod
    def invalidate_slug_cache(cls, *slugs):
        """Delete slug-cache entries for all non-empty slugs passed in."""
        for slug in slugs:
            if slug:
                cache.delete(cls.slug_cache_key(slug))

    def _create_system_roles(self):
        """Create system Role records (workspace + project) for this workspace."""
        from plane.permissions.system_roles import create_workspace_system_roles

        create_workspace_system_roles(self.id)

    def _create_default_relation_definitions(self):
        """Create default work item relation definitions for this workspace."""
        from plane.db.models import DEFAULT_RELATION_DEFINITIONS, WorkItemRelationDefinition

        WorkItemRelationDefinition.objects.bulk_create(
            [WorkItemRelationDefinition(workspace=self, **d) for d in DEFAULT_RELATION_DEFINITIONS],
            ignore_conflicts=True,
        )

    def _resync_owner_permissions(self, old_owner_id, new_owner_id):
        """Re-sync both old and new owner so each gets their correct single relation."""
        for member in WorkspaceMember.objects.filter(
            workspace_id=self.id,
            member_id__in=[old_owner_id, new_owner_id],
            is_active=True,
            deleted_at__isnull=True,
        ):
            member._sync_to_resource_permission()

    def delete(self, using: Optional[str] = None, soft: bool = True, *args: Any, **kwargs: Any):
        """
        Override the delete method to append epoch timestamp to the slug when soft deleting.

        Args:
            using: The database alias to use for the deletion.
            soft: Whether to perform a soft delete (True) or hard delete (False).
            *args: Additional positional arguments.
            **kwargs: Additional keyword arguments.
        """
        pre_delete_slug = self.slug

        # Call the parent class's delete method first
        result = super().delete(using=using, soft=soft, *args, **kwargs)

        # If it's a soft delete and the model still exists (not hard deleted)
        if soft and hasattr(self, "deleted_at") and self.deleted_at:
            # Use the deleted_at timestamp to update the slug
            deletion_timestamp: int = int(self.deleted_at.timestamp())
            self.slug = f"{self.slug}__{deletion_timestamp}"
            self.save(update_fields=["slug"])
        else:
            # For hard delete there is no follow-up save() hook, so invalidate explicitly.
            self.invalidate_slug_cache(pre_delete_slug)

        return result

    class Meta:
        verbose_name = "Workspace"
        verbose_name_plural = "Workspaces"
        db_table = "workspaces"
        ordering = ("-created_at",)


class WorkspaceQuerySet(SoftDeletionQuerySet):
    """QuerySet for project related models that handles accessibility"""

    def accessible_to(self, user_id: UUID, slug: str):
        from plane.ee.models import TeamspaceProject, TeamspaceMember
        from plane.db.models.project import ProjectMember
        from plane.payment.flags.flag_decorator import check_workspace_feature_flag
        from plane.payment.flags.flag import FeatureFlag

        member_project_ids = ProjectMember.objects.filter(
            member_id=user_id, workspace__slug=slug, is_active=True
        ).values_list("project_id", flat=True)

        base_query = Q(project_id__in=member_project_ids)

        if check_workspace_feature_flag(feature_key=FeatureFlag.TEAMSPACES, user_id=user_id, slug=slug):
            ## Get all team ids where the user is a member
            teamspace_ids = TeamspaceMember.objects.filter(member_id=user_id, workspace__slug=slug).values_list(
                "team_space_id", flat=True
            )

            # Get all the projects in the respective teamspaces
            teamspace_project_ids = (
                TeamspaceProject.objects.filter(team_space_id__in=teamspace_ids)
                .exclude(project_id__in=member_project_ids)
                .values_list("project_id", flat=True)
            )

            return self.filter(
                Q(project_id__in=teamspace_project_ids) | base_query,
            )

        return self.filter(base_query)


class WorkspaceManager(SoftDeletionManager):
    """Manager for project related models that handles accessibility"""

    def get_queryset(self):
        return WorkspaceQuerySet(self.model, using=self._db).filter(deleted_at__isnull=True)

    def accessible_to(self, user_id: UUID, slug: str):
        return self.get_queryset().accessible_to(user_id, slug)


class WorkspaceBaseModel(BaseModel):
    workspace = models.ForeignKey("db.Workspace", models.CASCADE, related_name="workspace_%(class)s")

    objects = WorkspaceManager()

    class Meta:
        abstract = True


class WorkspaceMember(PermissionSyncMixin, ChangeTrackerMixin, BaseModel):
    """
    Workspace membership with automatic sync to ResourcePermission.

    Changes to role, is_active, or deleted_at trigger sync to keep permissions up-to-date.

    MRO: WorkspaceMember → PermissionSyncMixin → ChangeTrackerMixin → BaseModel
    Do not reorder the mixin classes.
    """

    TRACKED_FIELDS = ["role", "role_ref_id", "is_active", "deleted_at"]

    # Permission sync configuration
    PERMISSION_SUBJECT_TYPE = "user"
    PERMISSION_SUBJECT_ID_FIELD = "member_id"
    PERMISSION_RESOURCE_TYPE = "workspace"
    PERMISSION_RESOURCE_ID_FIELD = "workspace_id"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="workspace_member")
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="member_workspace",
    )
    role = models.PositiveSmallIntegerField(choices=ROLE_CHOICES, default=5)
    role_ref = models.ForeignKey(
        "db.Role",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="workspace_members",
        help_text="FK to Role. Source of truth for role assignment. Numeric role field derived from this.",
    )
    company_role = models.TextField(null=True, blank=True)
    view_props = models.JSONField(default=get_default_props)
    default_props = models.JSONField(default=get_default_props)
    issue_props = models.JSONField(default=get_issue_props)
    is_active = models.BooleanField(default=True)
    getting_started_checklist = models.JSONField(default=get_default_checklist)
    tips = models.JSONField(default=get_default_tips)
    explored_features = models.JSONField(default=get_default_explored_features)

    class Meta:
        unique_together = ["workspace", "member", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "member"],
                condition=models.Q(deleted_at__isnull=True),
                name="workspace_member_unique_workspace_member_when_deleted_at_null",
            )
        ]
        verbose_name = "Workspace Member"
        verbose_name_plural = "Workspace Members"
        db_table = "workspace_members"
        ordering = ("-created_at",)

    def __str__(self):
        """Return members of the workspace"""
        return f"{self.member.email} <{self.workspace.name}>"

    def save(self, *args, **kwargs):
        # Sync role_ref ↔ role (numeric)
        if self.role_ref_id and (self._state.adding or self.has_changed("role_ref_id")):
            # FK set → derive backward-compatible numeric role (20, 15, or 5)
            from plane.permissions.system_roles import member_role_from_role_ref

            self.role = member_role_from_role_ref(self.role_ref)
        elif self.role_ref_id and self.has_changed("role"):
            # Numeric role changed while FK is set → re-derive FK
            self._sync_role_ref_from_numeric()
        elif not self.role_ref_id and self.role:
            # Numeric set without FK (external APIs, old code paths) → derive FK
            self._sync_role_ref_from_numeric()
        super().save(*args, **kwargs)

    def _sync_role_ref_from_numeric(self):
        """Look up the system Role matching the numeric role and set role_ref.

        For role=20 (admin-level), applies plan-aware owner/admin resolution.
        """
        from plane.permissions.system_roles import role_from_member_role
        from plane.db.models.permission import Role

        if self.role == 20:
            slug = self._resolve_admin_or_owner()
        else:
            slug = role_from_member_role(self.role)

        role_obj = Role.objects.filter(
            workspace_id=self.workspace_id,
            namespace="workspace",
            slug=slug,
            is_system=True,
            deleted_at__isnull=True,
        ).first()
        if role_obj:
            self.role_ref = role_obj

    def _resolve_admin_or_owner(self):
        """Plan-aware resolution: determine if role=20 member should be 'owner' or 'admin'.

        - Free/Pro/One: all role=20 members get 'owner' (no Admin role on these plans)
        - Business/Enterprise: only Workspace.owner FK gets 'owner', rest get 'admin'
        """
        try:
            from plane.ee.models import WorkspaceLicense

            license_plan = (
                WorkspaceLicense.objects.filter(workspace_id=self.workspace_id)
                .values_list("plan", flat=True)
                .first()
            )
            if license_plan in ("FREE", "PRO", "ONE"):
                return "owner"
        except ImportError:
            pass
        except Exception:
            logger.exception(
                "Failed to look up workspace license for workspace %s; falling back to FK-owner check.",
                self.workspace_id,
            )
        # Business/Enterprise: only the FK owner gets "owner"
        try:
            owner_id = Workspace.objects.values_list("owner_id", flat=True).get(id=self.workspace_id)
            if self.member_id == owner_id:
                return "owner"
        except Workspace.DoesNotExist:
            pass
        return "admin"

    def _get_permission_relation(self):
        """Map member role to permission relation.

        Uses role_ref.slug when available, falls back to numeric mapping.
        """
        if self.role_ref_id:
            return self.role_ref.slug
        # Fallback for members without role_ref (backward compat during transition)
        from plane.permissions.system_roles import role_from_member_role

        return role_from_member_role(self.role)

    def _is_permission_active(self):
        """Active when is_active=True and not soft-deleted."""
        return self.is_active and self.deleted_at is None


def _sync_workspace_member_permissions(sender, **kwargs):
    """Sync ResourcePermission on bulk operations for WorkspaceMember."""
    objs = kwargs.get("objs")
    if not objs:
        return

    # Skip sync if no permission-relevant fields changed
    updated_fields = kwargs.get("updated_fields")
    PERMISSION_RELEVANT_FIELDS = {"role", "role_ref_id", "is_active", "deleted_at"}
    if updated_fields is not None and not updated_fields.intersection(PERMISSION_RELEVANT_FIELDS):
        return

    objs = list(objs) if hasattr(objs, "__iter__") else [objs]

    from plane.permissions.engine import PermissionEngine
    from plane.permissions.grants import Grant

    engine = PermissionEngine(use_cache=False)
    grants = []
    revoke_keys = []

    for obj in objs:
        subject_id = obj._get_permission_subject_id()
        resource_id = obj._get_permission_resource_id()
        if not subject_id or not resource_id:
            continue
        if obj._is_permission_active():
            grants.append(
                Grant(
                    subject_type=obj.PERMISSION_SUBJECT_TYPE,
                    subject_id=subject_id,
                    relation=obj._get_permission_relation(),
                    resource_type=obj.PERMISSION_RESOURCE_TYPE,
                    resource_id=resource_id,
                    workspace_id=obj._get_permission_workspace_id(),
                )
            )
        else:
            revoke_keys.append(
                (
                    obj.PERMISSION_SUBJECT_TYPE,
                    subject_id,
                    obj.PERMISSION_RESOURCE_TYPE,
                    resource_id,
                    obj._get_permission_workspace_id(),
                )
            )

    actor_id = getattr(objs[0], "updated_by_id", None) or getattr(objs[0], "created_by_id", None)
    if grants:
        engine.bulk_grant(granter=actor_id, grants=grants)
    for key in revoke_keys:
        engine.revoke(
            revoker=actor_id,
            subject_type=key[0],
            subject_id=key[1],
            resource_type=key[2],
            resource_id=key[3],
            workspace_id=key[4],
        )

    # Safety net: backfill role_ref for bulk_create paths that only set numeric role.
    # Only runs on post_bulk_create (updated_fields is None), not post_bulk_update.
    if updated_fields is None:
        needs_ref = [o for o in objs if not o.role_ref_id and o.role]
        if needs_ref:
            from plane.permissions.system_roles import get_workspace_roles_for_workspace, role_from_member_role

            ws_ids = {o.workspace_id for o in needs_ref}
            caches = {ws_id: get_workspace_roles_for_workspace(ws_id) for ws_id in ws_ids}

            # Pre-fetch plan-aware data for role=20 resolution
            admin_members = [o for o in needs_ref if o.role == 20]
            if admin_members:
                try:
                    from plane.ee.models import WorkspaceLicense

                    free_pro_one_ws_ids = set(
                        WorkspaceLicense.objects.filter(
                            workspace_id__in=ws_ids, plan__in=["FREE", "PRO", "ONE"]
                        ).values_list("workspace_id", flat=True)
                    )
                except (ImportError, Exception):
                    free_pro_one_ws_ids = set()

                owner_map = dict(
                    Workspace.objects.filter(id__in=ws_ids, deleted_at__isnull=True).values_list("id", "owner_id")
                )

            to_update = []
            for o in needs_ref:
                if o.role == 20:
                    # Plan-aware owner/admin resolution
                    if o.workspace_id in free_pro_one_ws_ids:
                        slug = "owner"
                    elif o.member_id == owner_map.get(o.workspace_id):
                        slug = "owner"
                    else:
                        slug = "admin"
                else:
                    slug = role_from_member_role(o.role)
                role_obj = caches[o.workspace_id].get(slug)
                if role_obj:
                    o.role_ref_id = role_obj.id
                    to_update.append(o)
            if to_update:
                WorkspaceMember.objects.bulk_update(to_update, ["role_ref_id"], batch_size=100)


post_bulk_create.connect(_sync_workspace_member_permissions, sender=WorkspaceMember)
post_bulk_update.connect(_sync_workspace_member_permissions, sender=WorkspaceMember)


class WorkspaceMemberInvite(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="workspace_member_invite")
    email = models.CharField(max_length=255)
    accepted = models.BooleanField(default=False)
    token = models.CharField(max_length=255)
    message = models.TextField(null=True)
    responded_at = models.DateTimeField(null=True)
    role = models.PositiveSmallIntegerField(choices=ROLE_CHOICES, default=5)
    role_ref = models.ForeignKey(
        "db.Role",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="workspace_member_invites",
    )

    class Meta:
        unique_together = ["email", "workspace", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["email", "workspace"],
                condition=models.Q(deleted_at__isnull=True),
                name="workspace_member_invite_unique_email_workspace_when_deleted_at_null",
            )
        ]
        verbose_name = "Workspace Member Invite"
        verbose_name_plural = "Workspace Member Invites"
        db_table = "workspace_member_invites"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.workspace.name} {self.email} {self.accepted}"

    def save(self, *args, **kwargs):
        # Auto-populate role_ref from numeric role if not set
        if not self.role_ref_id and self.role:
            self._sync_role_ref_from_numeric()
        super().save(*args, **kwargs)

    def _sync_role_ref_from_numeric(self):
        from plane.permissions.system_roles import role_from_member_role
        from plane.db.models.permission import Role

        slug = role_from_member_role(self.role)
        role_obj = Role.objects.filter(
            workspace_id=self.workspace_id,
            namespace="workspace",
            slug=slug,
            is_system=True,
            deleted_at__isnull=True,
        ).first()
        if role_obj:
            self.role_ref = role_obj


class Team(BaseModel):
    name = models.CharField(max_length=255, verbose_name="Team Name")
    description = models.TextField(verbose_name="Team Description", blank=True)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name="workspace_team")
    logo_props = models.JSONField(default=dict)

    def __str__(self):
        """Return name of the team"""
        return f"{self.name} <{self.workspace.name}>"

    class Meta:
        unique_together = ["name", "workspace", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "workspace"],
                condition=models.Q(deleted_at__isnull=True),
                name="team_unique_name_workspace_when_deleted_at_null",
            )
        ]
        verbose_name = "Team"
        verbose_name_plural = "Teams"
        db_table = "teams"
        ordering = ("-created_at",)


class WorkspaceTheme(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="themes")
    name = models.CharField(max_length=300)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="themes")
    colors = models.JSONField(default=dict)

    def __str__(self):
        return str(self.name) + str(self.actor.email)

    class Meta:
        unique_together = ["workspace", "name", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=models.Q(deleted_at__isnull=True),
                name="workspace_theme_unique_workspace_name_when_deleted_at_null",
            )
        ]
        verbose_name = "Workspace Theme"
        verbose_name_plural = "Workspace Themes"
        db_table = "workspace_themes"
        ordering = ("-created_at",)


class WorkspaceUserProperties(BaseModel, FiltersMixin):
    class NavigationControlPreference(models.TextChoices):
        ACCORDION = "ACCORDION", "Accordion"
        TABBED = "TABBED", "Tabbed"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="workspace_user_properties",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workspace_user_properties",
    )
    display_filters = models.JSONField(default=get_default_display_filters)
    display_properties = models.JSONField(default=get_default_display_properties)
    navigation_project_limit = models.IntegerField(default=10)
    navigation_control_preference = models.CharField(
        max_length=25,
        choices=NavigationControlPreference.choices,
        default=NavigationControlPreference.ACCORDION,
    )

    class Meta:
        unique_together = ["workspace", "user", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "user"],
                condition=models.Q(deleted_at__isnull=True),
                name="workspace_user_properties_unique_workspace_user_when_deleted_at_null",
            )
        ]
        verbose_name = "Workspace User Property"
        verbose_name_plural = "Workspace User Property"
        db_table = "workspace_user_properties"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.workspace.name} {self.user.email}"


class WorkspaceUserLink(WorkspaceBaseModel):
    title = models.CharField(max_length=255, null=True, blank=True)
    url = models.TextField()
    metadata = models.JSONField(default=dict)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owner_workspace_user_link",
    )

    class Meta:
        verbose_name = "Workspace User Link"
        verbose_name_plural = "Workspace User Links"
        db_table = "workspace_user_links"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.workspace.id} {self.url}"


class WorkspaceHomePreference(BaseModel):
    """Preference for the home page of a workspace for a user"""

    class HomeWidgetKeys(models.TextChoices):
        QUICK_LINKS = "quick_links", "Quick Links"
        RECENTS = "recents", "Recents"
        MY_STICKIES = "my_stickies", "My Stickies"
        NEW_AT_PLANE = "new_at_plane", "New at Plane"
        QUICK_TUTORIAL = "quick_tutorial", "Quick Tutorial"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="workspace_user_home_preferences",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workspace_user_home_preferences",
    )
    key = models.CharField(max_length=255)
    is_enabled = models.BooleanField(default=True)
    config = models.JSONField(default=dict)
    sort_order = models.FloatField(default=65535)

    class Meta:
        unique_together = ["workspace", "user", "key", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "user", "key"],
                condition=models.Q(deleted_at__isnull=True),
                name="workspace_user_home_preferences_unique_workspace_user_key_when_deleted_at_null",
            )
        ]
        verbose_name = "Workspace Home Preference"
        verbose_name_plural = "Workspace Home Preferences"
        db_table = "workspace_home_preferences"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.workspace.name} {self.user.email} {self.key}"


class WorkspaceUserPreference(BaseModel):
    """Preference for the workspace for a user"""

    class UserPreferenceKeys(models.TextChoices):
        VIEWS = "views", "Views"
        ACTIVE_CYCLES = "active_cycles", "Active Cycles"
        ANALYTICS = "analytics", "Analytics"
        DRAFTS = "drafts", "Drafts"
        YOUR_WORK = "your_work", "Your Work"
        ARCHIVES = "archives", "Archives"
        TEAM_SPACES = "team_spaces", "Team Spaces"
        INITIATIVES = "initiatives", "Initiatives"
        CUSTOMERS = "customers", "Customers"
        DASHBOARDS = "dashboards", "Dashboards"
        STICKIES = "stickies", "Stickies"
        RELEASES = "releases", "Releases"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="workspace_user_preferences",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workspace_user_preferences",
    )
    key = models.CharField(max_length=255)
    is_pinned = models.BooleanField(default=False)
    sort_order = models.FloatField(default=65535)

    class Meta:
        unique_together = ["workspace", "user", "key", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "user", "key"],
                condition=models.Q(deleted_at__isnull=True),
                name="workspace_user_preferences_unique_workspace_user_key_when_deleted_at_null",
            )
        ]
        verbose_name = "Workspace User Preference"
        verbose_name_plural = "Workspace User Preferences"
        db_table = "workspace_user_preferences"
        ordering = ("-created_at",)
