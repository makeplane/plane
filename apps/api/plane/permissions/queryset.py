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

"""AuthorizationQuerySetMixin — the canonical .authorized_for() listing verb.

Adds two methods to any queryset class it's mixed into:

    queryset.authorized_for(request, permission)
        Filter rows to what the caller may view under `permission`. Uses the
        model's PermissionMeta to find the scope + FK + condition fields.
        Applies the engine's workspace-admin fast path, then the accessible-
        resources-with-conditions primitive, then builds an OR'd Q across
        unconditional and conditional buckets.

    queryset.authorization_not_required(request)
        Explicit bypass for genuinely public listings. Sets the same request
        flag as .authorized_for() so AuthorizedListingView's finalize_response
        check passes.

Both methods set `request._authorized_for_called = True`.
"""

from django.db.models import Q

from plane.permissions.context import PermissionContext
from plane.permissions.definitions import Permission
from plane.permissions.engine.core import permission_engine
from plane.permissions.meta import resolve_condition_field, resolve_scope_spec


class AuthorizationQuerySetMixin:
    """Listing-authorization methods for Django QuerySet classes."""

    def authorized_for(self, request, permission: Permission):
        """Narrow the queryset to rows the caller can view under `permission`."""
        request._authorized_for_called = True
        user = request.user
        workspace_id = request.workspace_id

        # Resolve the scope spec FIRST — before the admin fast path — so
        # misconfiguration (missing PermissionMeta, permission not in
        # scope_map) surfaces as PermissionConfigurationError regardless of
        # the caller's role. Otherwise admins would silently bypass the
        # validation and the misconfig would only show up for non-admins.
        spec = resolve_scope_spec(self.model, permission)

        # Workspace-scope fast path: owner/admin wildcard grants bypass the
        # per-project tuple walk. This is the common case for admin actions.
        if permission_engine.check(
            user=user,
            permission=permission,
            context=PermissionContext.workspace(workspace_id),
        ):
            return self

        accessible = permission_engine.get_accessible_resources_with_conditions(
            user=user,
            permission=permission,
            scope_resource_type=spec.resource_type,
            workspace_id=workspace_id,
        )

        if not accessible:
            return self.none()

        unconditional_ids = [ar.resource_id for ar in accessible if ar.is_unconditional()]
        conditional = [ar for ar in accessible if not ar.is_unconditional()]

        q = Q()
        matched_any = False

        if unconditional_ids:
            q |= Q(**{f"{spec.fk}__in": unconditional_ids})
            matched_any = True

        for ar in conditional:
            # Conditions on one relation are OR'd: `+creator` AND `+lead` on the
            # same role means access applies when the user is the creator OR
            # the lead. Matches engine/resolver.py:172.
            cond_q = Q()
            for condition in ar.conditions:
                field = resolve_condition_field(self.model, condition)
                cond_q |= Q(**{field: user})
            q |= Q(**{spec.fk: ar.resource_id}) & cond_q
            matched_any = True

        if not matched_any:
            return self.none()

        return self.filter(q)

    def authorization_not_required(self, request):
        """Explicit bypass for public listings with no per-row authorization.

        Sets request._authorized_for_called = True so AuthorizedListingView
        passes its check. Call sites are searchable: grep for the method name
        to audit every bypass.
        """
        request._authorized_for_called = True
        return self
