# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import os
import logging

import requests

# Django imports
from django.db import transaction

# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import WorkSpaceAdminPermission
from plane.app.views.base import BaseAPIView
from plane.db.models import User, Workspace, WorkspaceMember
from plane.license.utils.instance_value import get_configuration_value

logger = logging.getLogger("plane.app.views.workspace.lark_invite")

DEFAULT_MEMBER_ROLE = 15  # matches ROLE_CHOICES on WorkspaceMember; 15 = Member


def _get_lark_config():
    (client_id, client_secret, base_domain) = get_configuration_value(
        [
            {"key": "LARK_CLIENT_ID", "default": os.environ.get("LARK_CLIENT_ID")},
            {"key": "LARK_CLIENT_SECRET", "default": os.environ.get("LARK_CLIENT_SECRET")},
            {"key": "LARK_BASE_DOMAIN", "default": os.environ.get("LARK_BASE_DOMAIN", "feishu.cn")},
        ]
    )
    return client_id, client_secret, (base_domain or "feishu.cn")


def _tenant_access_token():
    client_id, client_secret, base_domain = _get_lark_config()
    if not client_id or not client_secret:
        return None, "LARK_NOT_CONFIGURED"

    url = f"https://open.{base_domain}/open-apis/auth/v3/tenant_access_token/internal"
    try:
        resp = requests.post(
            url,
            json={"app_id": client_id, "app_secret": client_secret},
            timeout=15,
        )
        resp.raise_for_status()
        body = resp.json()
    except requests.RequestException as exc:
        logger.warning("Lark tenant_access_token request failed: %s", exc)
        return None, "LARK_TOKEN_REQUEST_FAILED"

    if body.get("code", 0) != 0:
        logger.warning("Lark tenant_access_token returned non-zero code: %s", body)
        return None, body.get("msg") or "LARK_TOKEN_ERROR"

    return body.get("tenant_access_token"), None


def _lark_get(token, path, params=None, base_domain=None):
    if base_domain is None:
        _, _, base_domain = _get_lark_config()
    url = f"https://open.{base_domain}{path}"
    resp = requests.get(url, params=params or {}, headers={"Authorization": f"Bearer {token}"}, timeout=20)
    resp.raise_for_status()
    return resp.json()


def _walk_department(token, dept_id, user_id_type="open_id"):
    """Yield all users under a department, walking children iteratively.

    Lark's /users endpoint paginates by page_token; /departments/<id>/children
    lists sub-departments. Breadth-first so the modal sees the full tree the
    app is authorised to see.
    """
    queue = [dept_id]
    seen_depts = set()
    while queue:
        current = queue.pop(0)
        if current in seen_depts:
            continue
        seen_depts.add(current)

        # users directly under this department, paginate via page_token
        page_token = None
        while True:
            params = {
                "department_id": current,
                "user_id_type": user_id_type,
                "page_size": 50,
            }
            if page_token:
                params["page_token"] = page_token
            try:
                body = _lark_get(token, "/open-apis/contact/v3/users", params=params)
            except requests.RequestException as exc:
                logger.warning("Lark users fetch failed for dept %s: %s", current, exc)
                break

            if body.get("code", 0) != 0:
                # 40004 = no_dept_authority; skip silently so the other depts still resolve.
                logger.info("Lark users fetch non-zero for dept %s: %s", current, body.get("msg"))
                break

            for u in (body.get("data") or {}).get("items") or []:
                yield u

            if not (body.get("data") or {}).get("has_more"):
                break
            page_token = (body.get("data") or {}).get("page_token")
            if not page_token:
                break

        # sub-departments
        try:
            sub_body = _lark_get(
                token,
                f"/open-apis/contact/v3/departments/{current}/children",
                params={"department_id_type": "open_department_id", "page_size": 50},
            )
            for d in (sub_body.get("data") or {}).get("items") or []:
                child_id = d.get("open_department_id") or d.get("department_id")
                if child_id:
                    queue.append(child_id)
        except requests.RequestException:
            # children traversal is best-effort; missing a sub-tree shouldn't break listing
            pass


def _batch_fetch_users(token, user_open_ids, user_id_type="open_id"):
    """Lark's batch GET /users/batch supports up to 50 ids per call."""
    out = []
    for i in range(0, len(user_open_ids), 50):
        chunk = user_open_ids[i : i + 50]
        try:
            body = _lark_get(
                token,
                "/open-apis/contact/v3/users/batch",
                params=[("user_ids", uid) for uid in chunk] + [("user_id_type", user_id_type)],
            )
        except requests.RequestException as exc:
            logger.warning("Lark batch users fetch failed: %s", exc)
            continue
        if body.get("code", 0) != 0:
            continue
        out.extend((body.get("data") or {}).get("items") or [])
    return out


class LarkContactsListEndpoint(BaseAPIView):
    """Returns the union of all Lark users the app is authorised to see, used by
    the workspace "Invite from Lark" modal. No pagination — the directory is
    small enough that the client filters locally.
    """

    permission_classes = [WorkSpaceAdminPermission]

    def get(self, request, slug):
        token, err = _tenant_access_token()
        if err:
            return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)

        try:
            scopes_body = _lark_get(
                token,
                "/open-apis/contact/v3/scopes",
                params={"user_id_type": "open_id", "page_size": 100},
            )
        except requests.RequestException as exc:
            return Response({"error": f"LARK_SCOPES_FAILED: {exc}"}, status=status.HTTP_502_BAD_GATEWAY)
        if scopes_body.get("code", 0) != 0:
            return Response(
                {"error": scopes_body.get("msg") or "LARK_SCOPES_ERROR"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        data = scopes_body.get("data") or {}
        dept_ids = data.get("department_ids") or []
        direct_user_ids = data.get("user_ids") or []

        seen = set()
        contacts = []

        for dept_id in dept_ids:
            for u in _walk_department(token, dept_id):
                key = u.get("union_id") or u.get("open_id")
                if not key or key in seen:
                    continue
                seen.add(key)
                contacts.append(self._serialise(u))

        direct_users = _batch_fetch_users(token, [uid for uid in direct_user_ids if uid not in seen])
        for u in direct_users:
            key = u.get("union_id") or u.get("open_id")
            if not key or key in seen:
                continue
            seen.add(key)
            contacts.append(self._serialise(u))

        return Response({"contacts": contacts}, status=status.HTTP_200_OK)

    @staticmethod
    def _serialise(u):
        # Surface only fields the modal needs; drops mobile/employee_no so we
        # don't leak unused PII into the browser.
        return {
            "union_id": u.get("union_id"),
            "open_id": u.get("open_id"),
            "name": u.get("name") or u.get("en_name") or "",
            "en_name": u.get("en_name") or "",
            "email": u.get("email") or "",
            "enterprise_email": u.get("enterprise_email") or "",
            "avatar_url": (u.get("avatar") or {}).get("avatar_240")
            or (u.get("avatar") or {}).get("avatar_url")
            or u.get("avatar_url")
            or "",
        }


class LarkWorkspaceInviteEndpoint(BaseAPIView):
    """Batch pre-creates Plane User accounts for selected Lark contacts and adds
    them as active workspace members. Idempotent: existing users get linked,
    existing members get re-activated rather than duplicated.

    Body: {"users": [{"union_id": "on_...", "open_id": "ou_...", "name": "...",
                       "email": "...", "avatar_url": "...", "role": 15}], "role": 15}
    """

    permission_classes = [WorkSpaceAdminPermission]

    def post(self, request, slug):
        users_in = request.data.get("users") or []
        if not isinstance(users_in, list) or not users_in:
            return Response({"error": "users[] is required"}, status=status.HTTP_400_BAD_REQUEST)

        default_role = int(request.data.get("role") or DEFAULT_MEMBER_ROLE)

        requester_member = WorkspaceMember.objects.get(
            workspace__slug=slug, member=request.user, is_active=True
        )
        if default_role > requester_member.role:
            return Response(
                {"error": "Cannot invite at a role higher than your own"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.get(slug=slug)

        invited = []
        skipped = []
        errors = []

        for entry in users_in:
            union_id = entry.get("union_id")
            open_id = entry.get("open_id")
            stable_id = union_id or open_id
            if not stable_id:
                errors.append({"entry": entry, "error": "missing union_id and open_id"})
                continue

            # Prefer the real directory email when Lark exposes one — gives the
            # user a recognisable identity inside Plane. Fall back to
            # <union_id>@lark.local which matches the synthetic identifier the
            # OAuth provider hands out on first sign-in.
            email = (entry.get("enterprise_email") or entry.get("email") or "").strip().lower()
            if not email:
                email = f"{stable_id}@lark.local"

            role = int(entry.get("role") or default_role)
            if role > requester_member.role:
                errors.append({"entry": entry, "error": "role exceeds requester role"})
                continue

            try:
                with transaction.atomic():
                    user, user_created = User.objects.get_or_create(
                        email=email,
                        defaults={
                            "first_name": entry.get("name") or "",
                            "last_name": "",
                            "is_password_autoset": True,
                            "is_email_verified": True,
                        },
                    )
                    if not user.first_name and entry.get("name"):
                        user.first_name = entry.get("name") or ""
                        user.save(update_fields=["first_name"])

                    wm, wm_created = WorkspaceMember.objects.get_or_create(
                        workspace=workspace,
                        member=user,
                        defaults={"role": role, "is_active": True},
                    )
                    if not wm_created and not wm.is_active:
                        wm.is_active = True
                        wm.role = role
                        wm.save(update_fields=["is_active", "role"])

                invited.append(
                    {
                        "email": email,
                        "user_created": user_created,
                        "member_created": wm_created,
                    }
                )
            except Exception as exc:
                logger.exception("Failed to invite Lark user: %s", entry)
                errors.append({"entry": entry, "error": str(exc)})

        return Response(
            {"invited": invited, "skipped": skipped, "errors": errors},
            status=status.HTTP_200_OK,
        )
