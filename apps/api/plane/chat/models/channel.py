# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Channels and their members.

A channel is public, private, a DM (two people) or a group DM (three to
`GROUP_DM_MAX_MEMBERS` people). DMs and group DMs have no name and a fixed
membership: `dm_key` holds their sorted member IDs, so the same set of people
always gets the same channel. Create them with `Channel.objects.get_or_create_dm`
or `get_or_create_group_dm`, never directly.

Every row is soft deleted (`deleted_at`), like Plane's own tables; uniqueness only
holds among rows that are not deleted.
"""

from django.core.exceptions import ValidationError
from django.db import IntegrityError, models, transaction
from django.db.models import F, Q
from django.db.models.functions import Lower

from plane.db.mixins import SoftDeletionManager
from plane.db.models import BaseModel, WorkspaceMember

__all__ = [
    "Channel",
    "ChannelKind",
    "ChannelMember",
    "ChannelMemberRole",
    "ChannelNotificationLevel",
    "GROUP_DM_MAX_MEMBERS",
]

GROUP_DM_MAX_MEMBERS = 9

_ALIVE = Q(deleted_at__isnull=True)


class ChannelKind(models.TextChoices):
    PUBLIC = "public", "Public"
    PRIVATE = "private", "Private"
    DM = "dm", "Direct message"
    GROUP_DM = "group_dm", "Group direct message"


NAMED_KINDS = (ChannelKind.PUBLIC, ChannelKind.PRIVATE)
DIRECT_KINDS = (ChannelKind.DM, ChannelKind.GROUP_DM)


class ChannelMemberRole(models.TextChoices):
    ADMIN = "admin", "Admin"
    MEMBER = "member", "Member"


class ChannelNotificationLevel(models.TextChoices):
    ALL = "all", "All messages"
    MENTIONS = "mentions", "Mentions only"
    NONE = "none", "Nothing"


class ChannelManager(SoftDeletionManager):
    def get_or_create_dm(self, workspace, user_a, user_b):
        """Return `(channel, created)` for the DM between two different workspace members."""
        return self._get_or_create_direct(workspace, ChannelKind.DM, [user_a, user_b])

    def get_or_create_group_dm(self, workspace, users):
        """Return `(channel, created)` for the group DM of exactly these workspace members."""
        return self._get_or_create_direct(workspace, ChannelKind.GROUP_DM, users)

    def _get_or_create_direct(self, workspace, kind, users):
        users = list(users)
        user_ids = sorted({str(user.pk) for user in users})
        if len(user_ids) != len(users):
            raise ValidationError("A direct message cannot include the same user twice.")
        if kind == ChannelKind.DM and len(user_ids) != 2:
            raise ValidationError("A DM has exactly 2 members.")
        if kind == ChannelKind.GROUP_DM and not 3 <= len(user_ids) <= GROUP_DM_MAX_MEMBERS:
            raise ValidationError(f"A group DM has 3 to {GROUP_DM_MAX_MEMBERS} members.")

        active_members = WorkspaceMember.objects.filter(workspace=workspace, member_id__in=user_ids, is_active=True)
        if active_members.count() != len(user_ids):
            raise ValidationError("Every member of a direct message must be an active member of the workspace.")

        dm_key = ":".join(user_ids)
        channel = self.filter(workspace=workspace, dm_key=dm_key).first()
        if channel is None:
            try:
                # One transaction, so nobody can find the channel before its members are in it.
                with transaction.atomic():
                    channel = self.create(workspace=workspace, kind=kind, dm_key=dm_key)
                    for user_id in user_ids:
                        ChannelMember.objects.create(channel=channel, user_id=user_id)
                return channel, True
            except IntegrityError:
                # Someone created the same DM concurrently; use theirs.
                channel = self.get(workspace=workspace, dm_key=dm_key)

        # Restore any member whose row was soft deleted.
        existing = {str(user_id) for user_id in channel.members.values_list("user_id", flat=True)}
        for user_id in user_ids:
            if user_id not in existing:
                try:
                    with transaction.atomic():
                        ChannelMember.objects.create(channel=channel, user_id=user_id)
                except IntegrityError:
                    pass  # Someone restored them concurrently.
        return channel, False


class Channel(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="chat_channels")
    kind = models.CharField(max_length=16, choices=ChannelKind.choices)
    # Required for public and private channels, empty for DMs and group DMs.
    name = models.CharField(max_length=80, blank=True, default="")
    description = models.TextField(blank=True, default="")
    project = models.ForeignKey(
        "db.Project", on_delete=models.SET_NULL, null=True, blank=True, related_name="chat_channels"
    )
    archived_at = models.DateTimeField(null=True, blank=True)
    # Sorted member IDs joined by ":"; set only for DMs and group DMs.
    dm_key = models.TextField(null=True, blank=True, editable=False)

    objects = ChannelManager()

    class Meta:
        db_table = "chat_channels"
        ordering = ("-created_at",)
        constraints = [
            models.CheckConstraint(
                condition=(Q(kind__in=NAMED_KINDS) & Q(name__regex=r"\S") & Q(dm_key__isnull=True))
                | (Q(kind__in=DIRECT_KINDS) & Q(name="") & Q(dm_key__isnull=False)),
                name="chat_channel_name_or_dm_key_by_kind",
            ),
            models.UniqueConstraint(
                F("workspace"),
                Lower("name"),
                condition=_ALIVE & Q(kind__in=NAMED_KINDS),
                name="chat_channel_unique_name",
            ),
            models.UniqueConstraint(
                fields=["workspace", "dm_key"],
                condition=_ALIVE & Q(dm_key__isnull=False),
                name="chat_channel_unique_dm_key",
            ),
        ]

    def __str__(self):
        return self.name or f"{self.kind}:{self.id}"

    @property
    def is_direct(self):
        return self.kind in DIRECT_KINDS


class ChannelMember(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="chat_channel_members")
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey("db.User", on_delete=models.CASCADE, related_name="chat_channel_memberships")
    role = models.CharField(max_length=16, choices=ChannelMemberRole.choices, default=ChannelMemberRole.MEMBER)
    # A read cursor, not an ownership link: "+" hides the reverse relation, so soft
    # deleting a message leaves the cursor in place instead of nulling it.
    last_read_message = models.ForeignKey(
        "chat.Message", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    notification_level = models.CharField(
        max_length=16, choices=ChannelNotificationLevel.choices, default=ChannelNotificationLevel.ALL
    )

    class Meta:
        db_table = "chat_channel_members"
        ordering = ("created_at",)
        constraints = [
            models.UniqueConstraint(fields=["channel", "user"], condition=_ALIVE, name="chat_channel_member_unique"),
        ]

    def save(self, *args, **kwargs):
        self.workspace_id = self.channel.workspace_id
        if self._state.adding and self.channel.is_direct and str(self.user_id) not in self.channel.dm_key.split(":"):
            raise ValidationError("A direct message's members are fixed when it is created.")
        super().save(*args, **kwargs)
