# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Keep chat access in step with Plane's workspace membership. Connected in `ChatConfig.ready()`."""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from plane.app.permissions.base import ROLE
from plane.chat.models import ChannelMember, ChatGuestPermission
from plane.chat.models.channel import NAMED_KINDS
from plane.db.models import User, WorkspaceMember

# The columns whose change can end someone's time as a guest or in the workspace.
_MEMBERSHIP_FIELDS = {"role", "is_active", "deleted_at"}


def _revoke_guest_grants(**scope):
    ChatGuestPermission.objects.filter(can_open_dms=True, **scope).update(can_open_dms=False, updated_at=timezone.now())


def _end_channel_memberships(**scope):
    """Being invited back must not reopen private channels, as with Plane's project memberships.

    DMs and group DMs stay: their membership is fixed, and they are that person's own conversations.
    """
    ChannelMember.objects.filter(channel__kind__in=NAMED_KINDS, **scope).delete()


@receiver(post_save, sender=WorkspaceMember, dispatch_uid="chat_workspace_membership_changed")
def workspace_membership_changed(sender, instance, update_fields=None, **kwargs):
    """Leaving the workspace ends channel memberships; a guest's DM grant ends when they stop being an active guest.

    So demoting someone back to guest, or inviting them again, starts with no DM access until an
    admin grants it again. Plane's bulk `.update()` when an invite is re-accepted only brings people back,
    so skipping signals there is harmless; deactivating an account is handled by `account_deactivated`.
    """
    if update_fields is not None and not _MEMBERSHIP_FIELDS.intersection(update_fields):
        return
    scope = {"workspace_id": instance.workspace_id, "user_id": instance.member_id}
    if not instance.is_active or instance.deleted_at is not None:
        _end_channel_memberships(**scope)
        _revoke_guest_grants(**scope)
    elif instance.role >= ROLE.MEMBER.value:
        _revoke_guest_grants(**scope)


@receiver(post_save, sender=User, dispatch_uid="chat_account_deactivated")
def account_deactivated(sender, instance, update_fields=None, **kwargs):
    """Deactivating an account leaves every workspace, but through `bulk_update`, which sends no signal."""
    if instance.is_active or (update_fields is not None and "is_active" not in update_fields):
        return
    _end_channel_memberships(user_id=instance.pk)
    _revoke_guest_grants(user_id=instance.pk)
