# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.app.serializers.base import BaseSerializer
from plane.chat.models import GROUP_DM_MAX_MEMBERS, Channel, ChannelKind
from plane.db.models import Project, ProjectMember

# The description is sent with every channel in every list, so it has to stay small.
MAX_DESCRIPTION_LENGTH = 2_000


class ChannelSerializer(BaseSerializer):
    """A channel as one caller sees it. Read the instance through `views.base.annotate_channels`."""

    is_member = serializers.BooleanField(read_only=True)
    my_role = serializers.CharField(read_only=True, allow_null=True)
    last_read_message_id = serializers.UUIDField(read_only=True, allow_null=True)
    # Top-level messages after my read cursor that are not removed and not mine; 0 if I'm not a member.
    unread_count = serializers.IntegerField(read_only=True)
    last_message_at = serializers.DateTimeField(read_only=True, allow_null=True)
    member_count = serializers.IntegerField(read_only=True)
    # Who is in a DM or group DM, so the client can name it; empty for named channels.
    dm_member_ids = serializers.SerializerMethodField()

    class Meta:
        model = Channel
        fields = [
            "id",
            "workspace",
            "kind",
            "name",
            "description",
            "project",
            "archived_at",
            "created_by",
            "created_at",
            "updated_at",
            "is_member",
            "my_role",
            "last_read_message_id",
            "unread_count",
            "last_message_at",
            "member_count",
            "dm_member_ids",
        ]
        read_only_fields = fields

    def get_dm_member_ids(self, channel):
        return channel.dm_key.split(":") if channel.dm_key else []


class ChannelUpdateSerializer(BaseSerializer):
    """Renaming a public or private channel or editing its description.

    Needs `workspace_id` in the context, to keep names unique within the workspace.
    """

    class Meta:
        model = Channel
        fields = ["name", "description"]
        extra_kwargs = {"description": {"max_length": MAX_DESCRIPTION_LENGTH}}

    def validate_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError("A channel needs a name.")
        others = Channel.objects.filter(
            workspace_id=self.context["workspace_id"], kind__in=(ChannelKind.PUBLIC, ChannelKind.PRIVATE)
        ).filter(name__iexact=name)
        if self.instance is not None:
            others = others.exclude(pk=self.instance.pk)
        if others.exists():
            raise serializers.ValidationError("A channel with this name already exists.")
        return name


class ChannelCreateSerializer(ChannelUpdateSerializer):
    """Creating a public or private channel. DMs are opened through `dms/` instead.

    Also needs `user` in the context: a channel can only be linked to a project the creator is a member of.
    """

    kind = serializers.ChoiceField(
        choices=[ChannelKind.PUBLIC, ChannelKind.PRIVATE], required=False, default=ChannelKind.PUBLIC
    )
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
        required=False,
        allow_null=True,
        default=None,
        # The same message as `validate_project`, so an unknown ID and another workspace's look alike.
        error_messages={"does_not_exist": "Project not found."},
    )

    class Meta(ChannelUpdateSerializer.Meta):
        fields = ["name", "description", "kind", "project"]
        extra_kwargs = {**ChannelUpdateSerializer.Meta.extra_kwargs, "name": {"required": True}}

    def validate_project(self, project):
        if project is None:
            return None
        is_member = ProjectMember.objects.filter(
            project=project,
            workspace_id=self.context["workspace_id"],
            member=self.context["user"],
            is_active=True,
        ).exists()
        if not is_member:
            # The same message whether the project is elsewhere or just not yours, so it doesn't leak.
            raise serializers.ValidationError("Project not found.")
        return project


class DirectMessageOpenSerializer(serializers.Serializer):
    """The other people in a DM (one) or a group DM (two or more). The caller is always included.

    Listing the caller too is allowed, so the cap is the whole group's; the manager enforces the exact size.
    """

    member_ids = serializers.ListField(child=serializers.UUIDField(), min_length=1, max_length=GROUP_DM_MAX_MEMBERS)
