# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from .workspace_project_join import process_workspace_project_invitations


def post_user_auth_workflow(user, is_signup, request):
    process_workspace_project_invitations(user=user)
    if is_signup:
        redeem_signup_invite_code(user, request)


def signup_invite_code(request):
    """Read the invite code from a signup request (form or JSON body)."""
    if request is None:
        return ""
    value = ""
    if hasattr(request, "POST"):
        value = request.POST.get("invite_code") or ""
    if not value and hasattr(request, "data") and hasattr(request.data, "get"):
        value = request.data.get("invite_code") or ""
    return str(value).strip()


def redeem_signup_invite_code(user, request):
    """Place a self-registered account inside the public workspace.

    Blocks are already refused by the signup gate; a failure here only means
    the seat could not be created, which must never invalidate the account
    that was just created.
    """
    code = signup_invite_code(request)
    if not code:
        return None
    try:
        from plane.research.services.accounts import register_with_invite_code

        return register_with_invite_code(user, code, request=request)
    except Exception as exc:  # noqa: BLE001 - signup must stay successful
        import logging

        logging.getLogger("plane.authentication").warning(
            "Invite code redemption failed for %s: %s", getattr(user, "email", "?"), exc
        )
        return None
