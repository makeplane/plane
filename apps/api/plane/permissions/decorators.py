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
Permission Decorators

Decorators for checking permissions in views and methods.
Provides a clean, declarative way to enforce permissions.
"""

import logging
from functools import wraps
from typing import Optional, Callable, Union

from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission

from .definitions import ResourceType, Permission
from .context import PermissionContext, PermissionScopeType
from .engine import permission_engine

logger = logging.getLogger(__name__)


def can(
    permission: Permission,
    resource_param: str = None,
    project_param: str = "project_id",
    scope_param_type: Optional[Union[ResourceType, str]] = None,
    message: str = None,
    defer_conditions: bool = False,
):
    """
    Decorator to check if the current user has permission to perform an action.

    Usage:
        @can(WorkitemPermissions.VIEW, resource_param='pk')
        def retrieve(self, request, pk):
            ...

        @can(WorkitemPermissions.EDIT, resource_param='pk')
        def partial_update(self, request, pk):
            ...

        @can(ProjectPermissions.MANAGE, resource_param='pk')
        def update_project_settings(self, request, pk):
            ...

        # scope_param_type - resource_param is a parent ID
        @can(WorkitemPermissions.REACT, resource_param='issue_id',
             scope_param_type=ResourceType.WORKITEM)
        def create_reaction(self, request, issue_id):
            ...

    Args:
        permission: A Permission object (e.g., WorkitemPermissions.EDIT)
        resource_param: Name of the URL/kwarg parameter containing resource ID
        project_param: Name of the URL/kwarg parameter containing project ID
        scope_param_type: Explicit scope or resource type. Supported scope values:
                         workspace|project|teamspace. For resource scopes, pass a
                         ResourceType (e.g., ResourceType.WORKITEM).
        message: Custom error message for permission denied
        defer_conditions: When True, conditional grants (e.g., +creator) pass the gate
                         and store conditions on request._permission_conditions for the
                         view to filter via queryset. Views MUST call
                         get_permission_conditions(request) to consume them; unconsumed
                         conditions trigger PermissionDenied in finalize_response.

    Creator-based permissions:
        For actions that should be allowed for resource creators (e.g., delete own issue),
        use conditional grants in system_roles.py (Permission & Condition.CREATOR) instead
        of decorator parameters. The permission engine evaluates these automatically via
        the engine's role permission resolution path.

        For creator-only business rules (e.g., only the creator can edit a view, even
        admin cannot override), use inline checks in the view method itself.

    Security note (Zanzibar-compliant):
        Membership is verified via direct tuple lookup in the permission engine.
        This prevents removed users from accessing resources they created.
        The creator is computed from the created_by field (no extra tuples stored).

    The decorator delegates ALL permission logic to the permission engine:
    1. Extract the resource_id from the view's kwargs or attributes
    2. Get the workspace_id from context
    3. Call permission_engine.check()
    4. Raise PermissionDenied if the user lacks permission
    """
    # Validate that permission is a Permission object
    if not isinstance(permission, Permission):
        raise TypeError(
            f"@can decorator requires a Permission object (e.g., WorkitemPermissions.EDIT), "
            f"got {type(permission).__name__}: {permission}"
        )

    # Extract resource_type for logging and error messages
    resource_type = permission.resource_type

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(view_instance, request, *args, **kwargs):
            # Get resource ID
            resource_id, resolved_param = _get_resource_id(view_instance, kwargs, resource_param, resource_type)

            if resource_id is None:
                logger.warning("[PERM] DENIED — cannot determine resource_id for %s", permission)
                raise PermissionDenied(message or "Cannot determine resource for permission check")

            # Get workspace ID
            workspace_id = _get_workspace_id(view_instance)

            # Build explicit permission context
            context = _build_permission_context(
                resource_id=resource_id,
                resolved_param=resolved_param,
                scope_param_type=scope_param_type,
                workspace_id=workspace_id,
                project_id=kwargs.get(project_param),
                permission_resource_type=resource_type,
            )

            # Delegate ALL logic to the permission engine
            allowed, deny_message = _check_and_stamp(
                request, view_instance, permission, context, defer_conditions
            )

            if allowed:
                return func(view_instance, request, *args, **kwargs)

            logger.warning("[PERM] DENIED %s for user %s on resource %s", permission, request.user.id, resource_id)
            raise PermissionDenied(message or deny_message)

        return wrapper

    return decorator


def get_permission_conditions(request) -> tuple:
    """
    Return deferred permission conditions and mark them as consumed.

    Views using @can(..., defer_conditions=True) MUST call this to retrieve
    conditions. Unconsumed conditions trigger a security error in finalize_response.

    Usage:
        conditions = get_permission_conditions(request)
        if 'creator' in conditions:
            queryset = queryset.filter(created_by=request.user)
    """
    conditions = getattr(request, "_permission_conditions", ())
    request._conditions_consumed = True
    return conditions


def require_permission(
    permission: Permission,
    resource_param: str = None,
):
    """
    Simplified decorator for permission checks.

    Alias for @can() with sensible defaults.

    Usage:
        @require_permission(WorkitemPermissions.EDIT, resource_param='issue_id')
        def update_issue(self, request, issue_id):
            ...
    """
    return can(permission=permission, resource_param=resource_param)


def _get_resource_id(
    view_instance,
    kwargs: dict,
    resource_param: Optional[str],
    resource_type: Union[ResourceType, str],
) -> tuple[Optional[str], Optional[str]]:
    """
    Extract the resource ID from the view context.

    Returns (resource_id, resolved_param_name) tuple.
    resolved_param_name indicates which param was used (for parent-level detection).
    """
    # 1. Try explicit parameter
    if resource_param:
        if resource_param in kwargs:
            return kwargs[resource_param], resource_param
        if hasattr(view_instance, resource_param):
            return getattr(view_instance, resource_param), resource_param
        return None, None

    # 2. Try pk from kwargs
    if "pk" in kwargs:
        return kwargs["pk"], "pk"

    # 3. Fallback to parent_field from resource hierarchy
    from .inheritance import RESOURCE_HIERARCHY

    config = RESOURCE_HIERARCHY.get(str(resource_type))
    if config:
        parent_field = config.get("parent_field")
        if parent_field:
            if parent_field in kwargs:
                return kwargs[parent_field], parent_field
            if hasattr(view_instance, parent_field):
                value = getattr(view_instance, parent_field)
                if value is not None:
                    return value, parent_field

    return None, None


def _get_workspace_id(
    view_instance,
) -> Optional[str]:
    """Extract the workspace ID from the view context."""
    # Try request.workspace_id first (set by WorkspaceResolverMiddleware)
    request = getattr(view_instance, "request", None)
    if request and getattr(request, "workspace_id", None):
        return request.workspace_id

    # Fallback: try view attributes
    for attr in ["workspace_id", "workspace"]:
        if hasattr(view_instance, attr):
            value = getattr(view_instance, attr)
            if value:
                if hasattr(value, "id"):
                    return value.id
                return value

    return None


def _context_for_type(type_str, resource_id, workspace_id, project_id):
    """Map a resource/scope type string to the appropriate PermissionContext."""
    if type_str == "workspace":
        return PermissionContext.workspace(resource_id)
    if type_str == "project":
        return PermissionContext.project(resource_id, workspace_id=workspace_id)
    if type_str == "teamspace":
        return PermissionContext.teamspace(resource_id, workspace_id=workspace_id)
    return PermissionContext.resource(
        scope_id=resource_id,
        workspace_id=workspace_id,
        project_id=project_id,
        resource_type=type_str,
    )


def _build_permission_context(
    resource_id,
    resolved_param: Optional[str],
    scope_param_type: Optional[Union[ResourceType, str]],
    workspace_id,
    project_id,
    permission_resource_type: Union[ResourceType, str],
) -> PermissionContext:
    """Build PermissionContext from decorator inputs.

    Resolution order:
    1. Explicit scope_param_type override (for parent-scope lookups)
    2. RESOURCE_HIERARCHY parent_field match → parent scope context
    3. Default → resource context using permission's resource_type
    """
    # 1. Explicit override
    if scope_param_type:
        return _context_for_type(str(scope_param_type), resource_id, workspace_id, project_id)

    # 2. If resolved_param matches the parent_field, the ID is the parent
    from .inheritance import RESOURCE_HIERARCHY

    config = RESOURCE_HIERARCHY.get(str(permission_resource_type))
    if config and resolved_param == config.get("parent_field"):
        return _context_for_type(str(config["parent"]), resource_id, workspace_id, project_id)

    # 3. The ID is the resource itself
    return PermissionContext.resource(
        scope_id=resource_id,
        workspace_id=workspace_id,
        project_id=project_id,
        resource_type=str(permission_resource_type),
    )


def _check_and_stamp(request, view_instance, permission, context, defer_conditions=False):
    """
    Run permission engine check and stamp result on request.

    Returns (allowed: bool, deny_message: str | None).
    """
    resource_type = permission.resource_type

    # Extract model for condition evaluation (only for direct resource checks
    # where context resource_type matches permission's target)
    resource_model = None
    if context.scope_type == PermissionScopeType.RESOURCE and (
        context.resource_type is None or context.resource_type == str(resource_type)
    ):
        resource_model = getattr(view_instance, "model", None)

    result = permission_engine.check(
        user=request.user,
        permission=permission,
        context=context,
        resource_model=resource_model,
        defer_conditions=defer_conditions,
    )

    if defer_conditions and result.allowed:
        request._permission_conditions = result.conditions
        request._conditions_consumed = not result.conditions
        return True, None
    elif result:
        request._permission_conditions = ()
        request._conditions_consumed = True
        return True, None

    return False, f"You don't have permission to {permission.action} this {permission.resource_type}"


class PermissionMixin:
    """
    Mixin for ViewSets to add permission checking methods.

    Usage:
        class IssueViewSet(PermissionMixin, ModelViewSet):
            @can(WorkitemPermissions.EDIT, resource_param='pk')
            def update(self, request, pk):
                ...

            def list(self, request, project_id):
                # Boolean check (no raise)
                if self.has_permission(WorkitemPermissions.VIEW, project_id):
                    ...

                # Raising check
                self.check_can(WorkitemPermissions.EDIT, pk)
    """

    def has_permission(
        self,
        permission: Permission,
        context: PermissionContext,
    ) -> bool:
        """
        Check if the current user has permission. Returns True/False without raising.

        Args:
            permission: A Permission object (e.g., IntakePermissions.VIEW)
            context: Explicit permission context.
        """
        return bool(
            permission_engine.check(
                user=self.request.user,
                permission=permission,
                context=context,
            )
        )

    def check_can(
        self,
        permission: Permission,
        context: PermissionContext,
    ) -> bool:
        """
        Check if the current user has permission. Raises PermissionDenied if not.

        Same as has_permission() but raises instead of returning False.
        """
        if not self.has_permission(permission, context):
            raise PermissionDenied(f"You don't have permission to {permission.action} this {permission.resource_type}")
        return True

    def get_user_permissions(
        self,
        resource_type: Union[ResourceType, str],
        resource_id,
        workspace_id=None,
    ) -> dict[str, bool]:
        """
        Get all permissions for the current user on a resource.
        """
        if workspace_id is None:
            workspace_id = getattr(self, "workspace_id", None)

        return permission_engine.get_permissions(
            user=self.request.user,
            resource_type=resource_type,
            resource_id=resource_id,
            workspace_id=workspace_id,
        )

    def get_accessible_resources(
        self,
        resource_type: Union[ResourceType, str],
        workspace_id=None,
        permission: Optional[Union[Permission, str]] = None,
        include_relations: bool = False,
    ) -> Union[list, dict]:
        """
        Get all resource IDs of a type that the current user can access.

        Useful for filtering querysets in list views.

        Args:
            resource_type: Type of resources to find (e.g., "project")
            workspace_id: Optional workspace ID (will use self.workspace_id if not provided)
            permission: Permission to check (e.g., WorkitemPermissions.VIEW or "issue:view").
                       This can differ from resource_type - query project tuples but check
                       issue:view permission. Defaults to "{resource_type}:view".
            include_relations: If True, return dict mapping resource_id to relation

        Returns:
            List of resource IDs if include_relations=False
            Dict of {resource_id: relation} if include_relations=True

        Example:
            # Get projects where user can view issues
            project_ids = self.get_accessible_resources(
                "project",
                permission=WorkitemPermissions.VIEW,
            )

            # Get with relations for role-specific filtering
            project_relations = self.get_accessible_resources(
                "project",
                permission=WorkitemPermissions.VIEW,
                include_relations=True,
            )
            guest_projects = [pid for pid, rel in project_relations.items() if rel == "guest"]
        """
        if workspace_id is None:
            workspace_id = getattr(self, "workspace_id", None)
            if workspace_id is None:
                workspace_id = getattr(self.request, "workspace_id", None)

        if workspace_id is None:
            raise ValueError(
                "workspace_id is required for get_accessible_resources(). "
                "Set self.workspace_id or ensure request.workspace_id is available."
            )

        return permission_engine.get_accessible_resources(
            user=self.request.user,
            resource_type=resource_type,
            workspace_id=workspace_id,
            permission=permission,
            include_relations=include_relations,
        )


class HasResourcePermission(BasePermission):
    """
    DRF permission class that reads permission config from view's action_permissions.

    Usage:
        class IssueViewSet(ModelViewSet):
            permission_classes = [IsAuthenticated, HasResourcePermission]

            action_permissions = {
                'list': {'permission': WorkitemPermissions.VIEW},
                'create': {'permission': WorkitemPermissions.CREATE},
                'retrieve': {'permission': WorkitemPermissions.VIEW},
                'update': {'permission': WorkitemPermissions.EDIT},
                'partial_update': {'permission': WorkitemPermissions.EDIT},
                'destroy': {'permission': WorkitemPermissions.DELETE},
            }

    Config options per action:
        - permission: Permission object (required)
        - resource_param: URL param name for scope/resource ID
        - scope: one of resource|project|workspace|teamspace (optional; inferred from resource_param when omitted)
        - defer_conditions: Store conditions on request instead of evaluating (default: False)
    """

    message = "You don't have permission to perform this action."

    def has_permission(self, request, view) -> bool:
        """
        Check if the user has permission to perform the action.

        Resolution:
        1. Anonymous users -> False
        2. No action_permissions config -> False (fail-closed, misconfiguration)
        3. No config for this action -> False (fail-closed)
        4. Extract resource context and delegate to permission_engine.check()
        """
        if request.user.is_anonymous:
            return False

        # Get action_permissions config from view
        action_permissions = getattr(view, "action_permissions", None)
        if not action_permissions:
            logger.error(
                "HasResourcePermission on %s.%s but no action_permissions defined — denying access (fail-closed)",
                type(view).__module__,
                type(view).__name__,
            )
            return False  # No config = deny (fail-closed)

        # Get current action
        action = getattr(view, "action", None)
        if not action:
            # Fallback for non-ViewSet views
            action = self._get_action_from_method(request.method)

        # Get config for this action
        config = action_permissions.get(action)
        if not config:
            logger.error("No action_permissions config for action '%s' — denying access (fail-closed)", action)
            return False  # No config for this action = deny (fail-closed)

        # Extract required Permission object
        perm = config.get("permission")

        if not perm or not isinstance(perm, Permission):
            logger.error(
                "Invalid action_permissions config for action '%s': "
                "missing or invalid 'permission' — denying access (fail-closed)",
                action,
            )
            return False  # Invalid config = deny (fail-closed)

        # Extract resource_id and workspace_id using shared helpers
        resource_id, resolved_param = _get_resource_id(
            view, view.kwargs, config.get("resource_param"), perm.resource_type
        )
        workspace_id = _get_workspace_id(view)

        if resource_id is None:
            logger.warning("Cannot determine resource_id for action '%s' with permission '%s'", action, perm)
            return False  # Can't determine resource

        # Map explicit scope override: "resource" and None mean "infer from hierarchy"
        explicit_scope = config.get("scope")
        scope_param_type = explicit_scope if explicit_scope and explicit_scope != "resource" else None

        project_id = view.kwargs.get("project_id")
        context = _build_permission_context(
            resource_id=resource_id,
            resolved_param=resolved_param,
            scope_param_type=scope_param_type,
            workspace_id=workspace_id,
            project_id=project_id,
            permission_resource_type=perm.resource_type,
        )

        defer_conditions = config.get("defer_conditions", False)

        allowed, deny_message = _check_and_stamp(
            request, view, perm, context, defer_conditions
        )

        if allowed:
            return True

        self.message = deny_message
        return False

    def _get_action_from_method(self, method: str) -> str:
        """Map HTTP method to action name for non-ViewSet views."""
        method_map = {
            "GET": "retrieve",
            "POST": "create",
            "PUT": "update",
            "PATCH": "partial_update",
            "DELETE": "destroy",
        }
        return method_map.get(method.upper(), "retrieve")
