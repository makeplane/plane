# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Keep chat grants in step with Plane's workspace membership. Connected in `ChatConfig.ready()`."""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from plane.app.permissions.base import ROLE
from plane.chat.models import ChatGuestPermission
from plane.db.models import WorkspaceMember

# The columns whose change can end someone's time as a guest.
_MEMBERSHIP_FIELDS = {"role", "is_active", "deleted_at"}


@receiver(post_save, sender=WorkspaceMember, dispatch_uid="chat_revoke_guest_grants")
def revoke_guest_grants(sender, instance, update_fields=None, **kwargs):
    """A guest's DM grant ends when they stop being an active guest: promoted, deactivated or removed.

    So demoting them back to guest, or inviting them again, starts with no DM access until an
    admin grants it again. Plane's few bulk `.update()` paths (re-accepting an invite, deactivating
    an account) skip signals; revoking on the way out through `save()` covers the usual ones.
    """
    if update_fields is not None and not _MEMBERSHIP_FIELDS.intersection(update_fields):
        return
    if instance.is_active and instance.deleted_at is None and instance.role < ROLE.MEMBER.value:
        return
    ChatGuestPermission.objects.filter(
        workspace_id=instance.workspace_id, user_id=instance.member_id, can_open_dms=True
    ).update(can_open_dms=False, updated_at=timezone.now())
