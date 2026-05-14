# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import logging
import os
import uuid

# Third party
from celery import shared_task

# Django
from django.core.cache import cache
from django.db import transaction

# Module imports
from plane.app.views.workspace.lark_invite import (
    _cache_key,
    _crawl_directory,
    _tenant_access_token,
)
from plane.db.models import User, Workspace, WorkspaceMember

logger = logging.getLogger("plane.bgtasks.lark_sync_task")

DEFAULT_ROLE = 15  # 15 = Member on WorkspaceMember.ROLE_CHOICES


def sync_lark_directory(workspace_slug, role=DEFAULT_ROLE, force_refresh=False):
    """Idempotently mirror the Lark/Feishu directory into a workspace.

    For each visible contact:
      * Find-or-create a Plane User keyed by the real enterprise_email when
        available, otherwise the same synthetic `<union_id>@lark.local`
        identifier the OAuth provider uses on first sign-in.
      * Find-or-create the corresponding active WorkspaceMember row.

    Returns a stats dict for logging / API response. Safe to call repeatedly —
    re-runs are no-ops for already-synced people.
    """
    workspace = Workspace.objects.filter(slug=workspace_slug).first()
    if workspace is None:
        return {"error": f"workspace '{workspace_slug}' not found"}

    token, err = _tenant_access_token()
    if err:
        return {"error": f"tenant_access_token: {err}"}

    contacts = None if force_refresh else cache.get(_cache_key())
    if contacts is None:
        try:
            contacts = _crawl_directory(token)
            cache.set(_cache_key(), contacts, 600)
        except RuntimeError as exc:
            return {"error": str(exc)}

    user_new = user_existing = mem_new = mem_reactivated = mem_existing = 0
    skipped = 0

    for c in contacts:
        stable = c.get("union_id") or c.get("open_id")
        if not stable:
            skipped += 1
            continue
        raw_email = (c.get("enterprise_email") or c.get("email") or "").strip().lower()
        email = raw_email or f"{stable}@lark.local"

        name = c.get("name") or ""
        try:
            with transaction.atomic():
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        # username has a unique constraint and isn't auto-derived
                        # in User.save — must be set on creation
                        "username": uuid.uuid4().hex,
                        "first_name": name,
                        "last_name": "",
                        # display_name without an explicit value defaults to the
                        # email prefix in User.save; for lark.local synthetic
                        # emails that's a meaningless union_id, so set it now
                        "display_name": name or email.split("@")[0],
                        "is_password_autoset": True,
                        "is_email_verified": True,
                    },
                )
                if created:
                    user_new += 1
                else:
                    user_existing += 1
                    # Backfill name fields on accounts the OAuth provider
                    # created before we had directory access
                    update_fields = []
                    if not user.first_name and name:
                        user.first_name = name
                        update_fields.append("first_name")
                    # Always replace the email-derived placeholder display name
                    # when a real Feishu name is available
                    if name and user.display_name != name:
                        user.display_name = name
                        update_fields.append("display_name")
                    if update_fields:
                        user.save(update_fields=update_fields)

                wm, wm_created = WorkspaceMember.objects.get_or_create(
                    workspace=workspace,
                    member=user,
                    defaults={"role": role, "is_active": True},
                )
                if wm_created:
                    mem_new += 1
                elif not wm.is_active:
                    wm.is_active = True
                    wm.save(update_fields=["is_active"])
                    mem_reactivated += 1
                else:
                    mem_existing += 1
        except Exception:
            logger.exception("Lark sync failed for contact %s", stable)
            skipped += 1

    stats = {
        "workspace": workspace_slug,
        "contacts_seen": len(contacts),
        "users_created": user_new,
        "users_existing": user_existing,
        "members_created": mem_new,
        "members_reactivated": mem_reactivated,
        "members_already_active": mem_existing,
        "skipped": skipped,
        "workspace_member_total": WorkspaceMember.objects.filter(
            workspace=workspace, is_active=True
        ).count(),
    }
    logger.info("Lark sync complete: %s", stats)
    return stats


@shared_task
def sync_lark_directory_task():
    """Periodic Celery wrapper. Reads the target workspace + role from env so
    the schedule entry in celery.py stays parameter-free. No-op unless both
    LARK_AUTO_SYNC_ENABLED is truthy and LARK_DEFAULT_WORKSPACE_SLUG is set.
    """
    if (os.environ.get("LARK_AUTO_SYNC_ENABLED") or "").strip().lower() not in ("1", "true", "yes"):
        return {"skipped": "LARK_AUTO_SYNC_ENABLED not set"}

    slug = (os.environ.get("LARK_DEFAULT_WORKSPACE_SLUG") or "").strip()
    if not slug:
        return {"skipped": "LARK_DEFAULT_WORKSPACE_SLUG not set"}

    try:
        role = int(os.environ.get("LARK_DEFAULT_WORKSPACE_ROLE", DEFAULT_ROLE))
    except ValueError:
        role = DEFAULT_ROLE

    return sync_lark_directory(slug, role=role, force_refresh=True)
