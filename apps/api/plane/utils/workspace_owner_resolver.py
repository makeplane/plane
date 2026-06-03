# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Workspace owner resolution for god-mode creation paths.

Owner precedence: explicit choice (owner_id / owner_email) > General
Director. The acting instance admin is never an implicit fallback —
unresolvable owners are an error so the admin is never silently made
owner/member of business workspaces.
"""

from plane.db.models import User
from plane.utils.general_director import (
    AmbiguousGeneralDirector,
    get_general_director_user,
)


class WorkspaceOwnerResolutionError(Exception):
    """Owner could not be resolved — surface as a 400 to the caller."""


def resolve_workspace_owner(owner_id=None, owner_email=None):
    """Return the User who should own a god-mode-created workspace.

    Raises WorkspaceOwnerResolutionError when the explicit owner is
    invalid or when no explicit owner is given and the GD is missing
    or ambiguous.
    """
    if owner_id:
        user = User.objects.filter(pk=owner_id, is_active=True).first()
        if user is None:
            raise WorkspaceOwnerResolutionError(
                "owner_id does not resolve to an active user."
            )
        return user

    if owner_email:
        user = User.objects.filter(
            email__iexact=str(owner_email).strip(), is_active=True
        ).first()
        if user is None:
            raise WorkspaceOwnerResolutionError(
                f"owner_email '{owner_email}' does not resolve to an active user."
            )
        return user

    try:
        gd_user = get_general_director_user()
    except AmbiguousGeneralDirector as e:
        raise WorkspaceOwnerResolutionError(
            "Ambiguous General Director — multiple active staff hold the GD "
            "grade. Fix staff data or pick an owner explicitly."
        ) from e

    if gd_user is None:
        raise WorkspaceOwnerResolutionError(
            "No General Director found — provide an explicit workspace owner."
        )
    return gd_user
