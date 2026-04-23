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
Permission Serializers

Serializer mixins to automatically add permission information to API responses.
"""

# Python imports
from typing import Optional, Union
from uuid import UUID

# Third party imports
from rest_framework import serializers

# Module imports
from .definitions import ResourceType, get_permission
from .context import PermissionContext
from .engine import permission_engine
from plane.db.models import Workspace
from plane.db.models.permission import PermissionScheme, RolePermissionScheme


def _get_workspace_id_from_instance(instance) -> Optional[UUID]:
    """Get workspace ID by traversing common model relationships."""
    if hasattr(instance, "workspace_id"):
        return instance.workspace_id
    if hasattr(instance, "workspace"):
        return instance.workspace.id if instance.workspace else None
    if hasattr(instance, "project"):
        return instance.project.workspace_id if instance.project else None
    return None


class PermissionListSerializer(serializers.ListSerializer):
    """ListSerializer that pre-computes a permission map for all instances in batch.

    Populates ``self.child.context["_permission_map"]`` so that each child
    serializer's ``to_representation`` can look up permissions in O(1)
    instead of issuing a separate query.
    """

    def to_representation(self, data):
        meta = getattr(self.child, "Meta", None)
        resource_type = getattr(meta, "permission_resource_type", None) if meta else None
        request = self.child.context.get("request")

        if resource_type and request and hasattr(request, "user") and request.user.is_authenticated and data:
            instance_list = list(data)
            if instance_list:
                workspace_id = _get_workspace_id_from_instance(instance_list[0])
                if not workspace_id:
                    view = self.child.context.get("view")
                    if view and hasattr(view, "workspace_id"):
                        workspace_id = view.workspace_id

                if workspace_id:
                    instance_ids = [item.id for item in instance_list]
                    perm_map = permission_engine.get_resource_permission_lists(
                        user=request.user,
                        resource_type=resource_type,
                        resource_ids=instance_ids,
                        workspace_id=workspace_id,
                    )
                    self.child.context["_permission_map"] = perm_map

        return super().to_representation(data)


class PermissionSerializerMixin:
    """Mixin that adds `_permissions` as a dict with relation and permission grants.

    Configuration via Meta:
        permission_resource_type = "project"   # Required
        include_permissions = True              # Default True

    For list views: uses PermissionListSerializer for batch efficiency.
    For detail views: computes permissions per instance.

    Output shape::

        {"relation": "admin", "permission_grants": ["project:browse", ...]}

    Users with no tuple get::

        {"relation": null, "permission_grants": []}
    """

    @classmethod
    def many_init(cls, *args, **kwargs):
        child = cls(*args, **kwargs)
        list_kwargs = {"child": child}
        list_kwargs.update(
            {
                key: value
                for key, value in kwargs.items()
                if key in serializers.LIST_SERIALIZER_KWARGS
            }
        )
        meta = getattr(cls, "Meta", None)
        list_serializer_class = getattr(meta, "list_serializer_class", PermissionListSerializer)
        return list_serializer_class(*args, **list_kwargs)

    def to_representation(self, instance):
        data = super().to_representation(instance)

        meta = getattr(self, "Meta", None)
        if not meta or not getattr(meta, "include_permissions", True):
            return data

        resource_type = getattr(meta, "permission_resource_type", None)
        if not resource_type:
            return data

        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return data

        _empty = {"relation": None, "permission_grants": []}

        # Check if permissions were pre-computed by PermissionListSerializer (list view)
        perm_map = self.context.get("_permission_map")
        if perm_map is not None:
            data["_permissions"] = perm_map.get(instance.id, _empty)
        else:
            # Single instance (detail view) — compute on the fly
            workspace_id = self._get_workspace_id(instance)
            if workspace_id:
                result = permission_engine.get_resource_permission_lists(
                    user=request.user,
                    resource_type=resource_type,
                    resource_ids=[instance.id],
                    workspace_id=workspace_id,
                )
                data["_permissions"] = result.get(instance.id, _empty)
            else:
                data["_permissions"] = _empty

        return data

    def _get_workspace_id(self, instance) -> Optional[UUID]:
        """Get workspace ID from the instance, falling back to view context."""
        workspace_id = _get_workspace_id_from_instance(instance)
        if workspace_id:
            return workspace_id

        # Fall back to view context (request is guaranteed present by caller)
        view = self.context.get("view")
        if not view:
            return None

        if hasattr(view, "workspace_id"):
            return view.workspace_id

        if hasattr(view, "kwargs"):
            workspace_slug = view.kwargs.get("slug") or view.kwargs.get("workspace_slug")
            if workspace_slug:
                try:
                    return Workspace.objects.get(slug=workspace_slug).id
                except Workspace.DoesNotExist:
                    pass

        return None


class PermissionField(serializers.SerializerMethodField):
    """
    A field that returns the user's permissions on the resource.

    Usage:
        class IssueSerializer(ModelSerializer):
            _permissions = PermissionField(resource_type=ResourceType.WORKITEM)

            class Meta:
                model = Issue
                fields = ['id', 'title', '_permissions']
    """

    def __init__(self, resource_type: Union[ResourceType, str], **kwargs):
        self.resource_type = resource_type
        kwargs["read_only"] = True
        super().__init__(**kwargs)

    def to_representation(self, instance):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return {}

        workspace_id = _get_workspace_id_from_instance(instance)

        return permission_engine.get_permissions(
            user=request.user,
            resource_type=self.resource_type,
            resource_id=instance.id,
            workspace_id=workspace_id,
        )


class CanActionField(serializers.SerializerMethodField):
    """
    A field that returns whether the user can perform a specific action.

    Usage:
        class IssueSerializer(ModelSerializer):
            can_edit = CanActionField(WorkitemPermissions.EDIT)
            can_delete = CanActionField(WorkitemPermissions.DELETE)

            class Meta:
                model = Issue
                fields = ['id', 'title', 'can_edit', 'can_delete']
    """

    def __init__(
        self,
        permission,
        **kwargs,
    ):
        from .definitions import Permission

        if not isinstance(permission, Permission):
            raise TypeError(f"CanActionField requires a Permission object, got {type(permission).__name__}")
        self.permission = permission
        kwargs["read_only"] = True
        super().__init__(**kwargs)

    def to_representation(self, instance):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return False

        workspace_id = _get_workspace_id_from_instance(instance)

        return bool(
            permission_engine.check(
                user=request.user,
                permission=self.permission,
                context=PermissionContext.resource(
                    scope_id=instance.id,
                    workspace_id=workspace_id,
                ),
            )
        )


class PermissionSchemeSerializer(serializers.ModelSerializer):
    """
    Serializer for PermissionScheme model.

    Handles validation of permission strings and prevents modification
    of system permission schemes.
    """

    class Meta:
        model = PermissionScheme
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "namespace",
            "permissions",
            "is_system",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "is_system", "created_at", "updated_at", "slug"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # namespace is writable on create, read-only on update
        if self.instance is not None:
            self.fields["namespace"].read_only = True

    def validate_permissions(self, value):
        """Validate each permission string.

        Wildcards (`*`, `<resource>:*`) are reserved for system role definitions
        in code and are not accepted in stored custom permission schemes.
        """
        from .definitions import Condition, Permission

        if not isinstance(value, list):
            raise serializers.ValidationError("Permissions must be a list")

        invalid = []
        wildcards = []
        for perm_str in value:
            if perm_str == "*" or perm_str.endswith(":*"):
                wildcards.append(perm_str)
                continue
            if "+" in perm_str:
                base, cond = perm_str.split("+", 1)
                perm = Permission.from_string(base)
                if perm is None:
                    invalid.append(perm_str)
                    continue
                try:
                    Condition(cond)
                except ValueError:
                    invalid.append(perm_str)
            else:
                perm = Permission.from_string(perm_str)
                if perm is None:
                    invalid.append(perm_str)

        if wildcards:
            raise serializers.ValidationError(
                f"Wildcard permissions are not allowed in custom schemes: {', '.join(wildcards)}"
            )
        if invalid:
            raise serializers.ValidationError(
                f"Invalid permission strings: {', '.join(invalid)}"
            )
        return value

    def validate(self, attrs):
        from plane.db.models.permission import RoleNamespace

        if self.instance and self.instance.is_system:
            raise serializers.ValidationError("System permission schemes cannot be modified")
        attrs["is_system"] = False

        # Resolve workspace id from context (set by view via serializer.save(workspace_id=...))
        workspace_id = self.context.get("workspace_id")
        namespace = attrs.get("namespace", getattr(self.instance, "namespace", None))

        # Every workspace-namespace PS must include `workspace:view`; every
        # project-namespace PS must include `project:view`. Auto-inject the
        # baseline scope-view grant so a PS always permits seeing its own scope.
        _baseline_view = {
            RoleNamespace.WORKSPACE: "workspace:view",
            RoleNamespace.PROJECT: "project:view",
        }.get(namespace)
        if "permissions" in attrs and _baseline_view:
            perms = list(attrs["permissions"])
            if _baseline_view not in perms:
                perms.append(_baseline_view)
                attrs["permissions"] = perms

        # Project-namespace PS may only hold permissions whose resource type
        # falls under the project subtree. Workspace-scope permissions (e.g.,
        # billing:view, workspace:manage) in a project PS would leak workspace
        # authority through a project-scope role. Workspace-namespace PS is
        # unrestricted by design — a workspace role can legitimately grant
        # project-scope actions across all projects in the workspace.
        if "permissions" in attrs and namespace == RoleNamespace.PROJECT:
            from plane.permissions.definitions import ResourceType
            from plane.permissions.inheritance import get_all_resource_types_under

            project_scope_types = get_all_resource_types_under(ResourceType.PROJECT)
            out_of_scope = []
            for perm_str in attrs["permissions"]:
                base = perm_str.split("+", 1)[0]
                resource_type = base.split(":", 1)[0]
                if resource_type not in project_scope_types:
                    out_of_scope.append(perm_str)
            if out_of_scope:
                raise serializers.ValidationError(
                    {
                        "permissions": (
                            "Project-namespace permission schemes cannot contain "
                            f"workspace-scope permissions: {', '.join(out_of_scope)}"
                        )
                    }
                )

        if "name" in attrs and "slug" not in attrs:
            from django.utils.text import slugify

            base_slug = slugify(attrs["name"])
            slug_candidate = base_slug
            counter = 1

            if workspace_id and namespace:
                query = PermissionScheme.objects.filter(
                    workspace_id=workspace_id, namespace=namespace,
                )
                if self.instance:
                    query = query.exclude(id=self.instance.id)
                while query.filter(slug=slug_candidate).exists():
                    slug_candidate = f"{base_slug}-{counter}"
                    counter += 1

            attrs["slug"] = slug_candidate

        return attrs


class RoleSerializer(serializers.ModelSerializer):
    """
    Serializer for Role model with PS-composition support.

    Handles:
    - permission_schemes field: accepts list of PS UUIDs for create/update
    - permissions: read-only computed field (union of all linked PS)
    - based_on: accepts a role slug string on create (clone flow), returns FK in response
    - Slug generation and uniqueness
    - System role protection
    """

    # Write: list of PS UUIDs for create/update
    permission_scheme_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        write_only=True,
    )
    # Read: nested PS data from prefetched through table
    permission_schemes = serializers.SerializerMethodField()

    # Read-only computed permissions (union of all linked PS)
    permissions = serializers.SerializerMethodField()

    # Write: accepts role slug string, resolved to FK in validate()
    based_on_slug = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        write_only=True,
    )
    # Read: FK UUID
    based_on = serializers.PrimaryKeyRelatedField(read_only=True)

    # Read: member count from annotated queryset
    member_count = serializers.SerializerMethodField()

    class Meta:
        from plane.db.models import Role

        model = Role
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "namespace",
            "permissions",
            "permission_schemes",
            "permission_scheme_ids",
            "based_on",
            "based_on_slug",
            "level",
            "is_system",
            "sort_order",
            "member_count",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "is_system",
            "created_at",
            "updated_at",
            "slug",
        ]

    def get_permission_schemes(self, instance):
        """Nested PS data from prefetched through table. No DB query if prefetched."""
        return [
            {
                "id": str(rps.permission_scheme.id),
                "name": rps.permission_scheme.name,
                "slug": rps.permission_scheme.slug,
                "namespace": rps.permission_scheme.namespace,
                "is_system": rps.permission_scheme.is_system,
            }
            for rps in instance.role_permission_schemes.all()
        ]

    def get_permissions(self, instance):
        """Union of permissions from all linked PS. Uses prefetch cache if available."""
        if instance.is_system:
            from .system_roles import get_system_role_permission_set
            perm_set = get_system_role_permission_set(instance.slug, instance.namespace)
            return {perm: True for perm in perm_set} if perm_set else {}

        all_perms: set[str] = set()
        for rps in instance.role_permission_schemes.all():
            all_perms.update(rps.permission_scheme.permissions)
        return {perm: True for perm in sorted(all_perms)}

    def get_member_count(self, instance):
        """Member count from annotated queryset. Picks workspace or project count by namespace."""
        if instance.namespace == "workspace":
            return getattr(instance, "workspace_member_count", 0)
        return getattr(instance, "project_member_count", 0)

    def validate_name(self, value):
        """Validate name is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Name cannot be empty")
        return value.strip()

    def validate(self, attrs):
        """Cross-field validation."""
        from plane.db.models import Role
        from plane.db.models.permission import RoleNamespace

        instance = self.instance
        workspace_slug = self.context.get("workspace_slug")
        workspace = Workspace.objects.get(slug=workspace_slug)

        # Check system role protection
        if instance and instance.is_system:
            allowed_fields = {"sort_order"}
            provided_fields = set(attrs.keys())
            disallowed = provided_fields - allowed_fields
            if disallowed:
                raise serializers.ValidationError(
                    f"System roles cannot be modified. Disallowed fields: {', '.join(disallowed)}"
                )

        namespace = attrs.get("namespace") or (instance.namespace if instance else RoleNamespace.WORKSPACE)

        # Resolve based_on_slug → Role FK instance
        based_on_raw = attrs.pop("based_on_slug", None)
        if based_on_raw and isinstance(based_on_raw, str) and based_on_raw.strip():
            slug_val = based_on_raw.strip()
            try:
                attrs["based_on"] = Role.objects.get(
                    slug=slug_val, namespace=namespace,
                    workspace=workspace, deleted_at__isnull=True,
                )
            except Role.DoesNotExist:
                try:
                    attrs["based_on"] = Role.objects.get(
                        slug=slug_val, namespace=namespace,
                        workspace__isnull=True, deleted_at__isnull=True,
                    )
                except Role.DoesNotExist:
                    raise serializers.ValidationError(
                        {"based_on_slug": f"Role with slug '{slug_val}' not found in namespace '{namespace}'"}
                    )

        # Handle slug generation and uniqueness
        name = attrs.get("name")
        slug = attrs.get("slug")

        if name and not slug:
            from django.utils.text import slugify

            base_slug = slugify(name)
            slug_candidate = base_slug
            counter = 1

            query = Role.objects.filter(
                workspace=workspace,
                namespace=namespace,
            )
            if instance:
                query = query.exclude(id=instance.id)

            while query.filter(slug=slug_candidate).exists():
                slug_candidate = f"{base_slug}-{counter}"
                counter += 1

            attrs["slug"] = slug_candidate

        elif slug:
            query = Role.objects.filter(
                workspace=workspace,
                namespace=namespace,
                slug=slug,
            )
            if instance:
                query = query.exclude(id=instance.id)

            if query.exists():
                raise serializers.ValidationError({"slug": "A role with this slug already exists"})

        return attrs

    def _get_valid_permissions_for_namespace(self, namespace) -> set[str]:
        """Get valid permissions for a namespace, derived from RESOURCE_ACTIONS."""
        from plane.db.models.permission import RoleNamespace
        from plane.permissions import RESOURCE_ACTIONS, Permission
        from plane.permissions.definitions import ResourceType
        from plane.permissions.inheritance import get_all_resource_types_under

        if namespace == RoleNamespace.WORKSPACE:
            valid_types = get_all_resource_types_under(ResourceType.WORKSPACE)
        else:
            valid_types = get_all_resource_types_under(ResourceType.PROJECT)

        permissions = set()
        for resource_type, actions in RESOURCE_ACTIONS.items():
            if resource_type in valid_types:
                for action in actions:
                    perm = Permission(resource_type, action)
                    permissions.add(str(perm))

        return permissions

    def _clone_system_ps_to_custom(self, source_role, workspace, namespace):
        """Clone source role's system PS into a new custom PS for this workspace.

        Returns a list of new PermissionScheme instances (already saved).
        """
        from django.utils.text import slugify

        new_ps_list = []
        source_ps_qs = RolePermissionScheme.objects.filter(
            role=source_role,
            deleted_at__isnull=True,
        ).select_related("permission_scheme").order_by("sort_order")

        for idx, rps in enumerate(source_ps_qs):
            src_ps = rps.permission_scheme
            if src_ps is None or src_ps.deleted_at is not None:
                continue

            base_slug = slugify(f"{source_role.slug}-{src_ps.slug}")
            slug_candidate = base_slug
            counter = 1
            while PermissionScheme.objects.filter(
                workspace=workspace,
                namespace=namespace,
                slug=slug_candidate,
                deleted_at__isnull=True,
            ).exists():
                slug_candidate = f"{base_slug}-{counter}"
                counter += 1

            new_ps = PermissionScheme.objects.create(
                workspace=workspace,
                namespace=namespace,
                name=f"{source_role.name} - {src_ps.name} (custom)",
                slug=slug_candidate,
                description=src_ps.description,
                permissions=list(src_ps.permissions),
                is_system=False,
                sort_order=idx,
            )
            new_ps_list.append(new_ps)

        return new_ps_list

    def _link_permission_schemes(self, role, ps_ids, workspace):
        """Validate PS IDs and create M2M links. Raises ValidationError for invalid IDs."""
        from django.db.models import Q

        schemes = PermissionScheme.objects.filter(
            Q(workspace=workspace) | Q(workspace__isnull=True, is_system=True),
            id__in=ps_ids, deleted_at__isnull=True,
        ).in_bulk()
        invalid = [str(pid) for pid in ps_ids if pid not in schemes]
        if invalid:
            raise serializers.ValidationError(
                {"permission_schemes": f"Permission schemes not found: {', '.join(invalid)}"}
            )
        RolePermissionScheme.objects.bulk_create([
            RolePermissionScheme(
                workspace=workspace, role=role,
                permission_scheme=schemes[pid], sort_order=idx,
            )
            for idx, pid in enumerate(ps_ids)
        ])

    def create(self, validated_data):
        """Create a new custom role, handling PS M2M and clone flow."""
        from django.db import transaction
        from plane.db.models import Role

        workspace_slug = self.context.get("workspace_slug")
        workspace = Workspace.objects.get(slug=workspace_slug)
        validated_data["is_system"] = False

        ps_ids = validated_data.pop("permission_scheme_ids", None)
        based_on_role = validated_data.get("based_on")

        with transaction.atomic():
            role = Role.objects.create(**validated_data, workspace=workspace)

            if ps_ids is not None:
                self._link_permission_schemes(role, ps_ids, workspace)
            elif based_on_role is not None:
                new_ps_list = self._clone_system_ps_to_custom(based_on_role, workspace, role.namespace)
                RolePermissionScheme.objects.bulk_create([
                    RolePermissionScheme(
                        workspace=workspace, role=role,
                        permission_scheme=ps, sort_order=idx,
                    )
                    for idx, ps in enumerate(new_ps_list)
                ])

        return role

    def update(self, instance, validated_data):
        """Update a role. Handles PS M2M changes and cache invalidation."""
        from django.db import transaction
        from django.utils import timezone
        from plane.db.models.permission import RoleActivity

        ps_ids = validated_data.pop("permission_scheme_ids", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if ps_ids is not None:
            with transaction.atomic():
                # Capture old PS ids before replacing
                old_ps_ids = set(
                    RolePermissionScheme.objects.filter(
                        role=instance, deleted_at__isnull=True,
                    ).values_list("permission_scheme_id", flat=True)
                )
                new_ps_ids = set(ps_ids)

                RolePermissionScheme.objects.filter(
                    role=instance, deleted_at__isnull=True,
                ).update(deleted_at=timezone.now())
                self._link_permission_schemes(instance, ps_ids, instance.workspace)

                # Record activity for PS changes
                if old_ps_ids != new_ps_ids:
                    removed = old_ps_ids - new_ps_ids
                    added = new_ps_ids - old_ps_ids
                    activities = []
                    actor_id = instance.updated_by_id
                    for ps_id in removed:
                        activities.append(
                            RoleActivity(
                                workspace_id=instance.workspace_id,
                                role=instance,
                                action=RoleActivity.Action.UPDATED,
                                field=RoleActivity.Field.PERMISSION_SCHEME,
                                old_identifier=ps_id,
                                actor_id=actor_id,
                            )
                        )
                    for ps_id in added:
                        activities.append(
                            RoleActivity(
                                workspace_id=instance.workspace_id,
                                role=instance,
                                action=RoleActivity.Action.UPDATED,
                                field=RoleActivity.Field.PERMISSION_SCHEME,
                                new_identifier=ps_id,
                                actor_id=actor_id,
                            )
                        )
                    if activities:
                        RoleActivity.objects.bulk_create(activities)

            instance._invalidate_role_cache()

        return instance


class ResourcePermissionSerializer(serializers.Serializer):
    """Serializer for ResourcePermission model."""

    id = serializers.UUIDField(read_only=True)
    subject_type = serializers.ChoiceField(choices=[("user", "User"), ("teamspace", "Teamspace")])
    subject_id = serializers.UUIDField()
    relation = serializers.CharField(max_length=50)
    resource_type = serializers.CharField(max_length=20)
    resource_id = serializers.UUIDField()
    permissions_grant = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        default=list,
    )
    permissions_deny = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        default=list,
    )
    expires_at = serializers.DateTimeField(required=False, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)

    def _validate_permission_list(self, value: list[str]) -> list[str]:
        """
        Validate a list of permission strings.

        Allows wildcards (*, resource:*) and validates specific
        permissions against the defined RESOURCE_ACTIONS configuration.
        """
        invalid = []
        for perm_str in value:
            # Allow wildcards
            if perm_str == "*" or perm_str.endswith(":*"):
                continue
            # Validate specific permissions
            if get_permission(perm_str) is None:
                invalid.append(perm_str)

        if invalid:
            raise serializers.ValidationError(f"Invalid permission strings: {', '.join(invalid)}")
        return value

    def validate_permissions_grant(self, value: list[str]) -> list[str]:
        """Validate permissions_grant field."""
        return self._validate_permission_list(value)

    def validate_permissions_deny(self, value: list[str]) -> list[str]:
        """Validate permissions_deny field."""
        return self._validate_permission_list(value)
