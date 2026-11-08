# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json
import re

from rest_framework import serializers

from plane.app.serializers.base import BaseSerializer
from plane.chat.models import Message
from plane.utils.content_validator import validate_html_content

# Slack's limit. Plane's 10 MB limit for descriptions is far beyond what a chat message needs.
MAX_BODY_HTML_LENGTH = 40_000
MAX_BODY_JSON_BYTES = 200_000

# Markup that renders as nothing: empty paragraphs, line breaks, non-breaking spaces, whitespace.
# Attributes count too: packages/editor's empty paragraph is `<p class="editor-paragraph-block"></p>`.
_BLANK_MARKUP = re.compile(r"</?p\b[^>]*>|<br\b[^>]*>|&nbsp;|\s", re.IGNORECASE)

# JSON can carry these in a string, but Postgres's jsonb refuses them.
_NOT_STORABLE_IN_JSONB = re.compile("[\x00\ud800-\udfff]")


def _storable_in_jsonb(value):
    pending = [value]
    while pending:
        item = pending.pop()
        if isinstance(item, dict):
            pending.extend(item.keys())
            pending.extend(item.values())
        elif isinstance(item, list):
            pending.extend(item)
        elif isinstance(item, str) and _NOT_STORABLE_IN_JSONB.search(item):
            return False
    return True


class MessageSerializer(BaseSerializer):
    """A message, or a removed message's tombstone (empty body, `removed_at` set).

    Read the instance through `views.base.annotate_messages`.
    """

    reply_count = serializers.IntegerField(read_only=True)
    last_reply_at = serializers.DateTimeField(read_only=True, allow_null=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "workspace",
            "channel",
            "sender",
            "sender_agent",
            "body_html",
            "body_json",
            "body_stripped",
            "parent",
            "reply_count",
            "last_reply_at",
            "edited_at",
            "removed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class MessageWriteSerializer(serializers.Serializer):
    """The body of a new or edited message. `parent_id` (a top-level message in the channel) makes it a reply."""

    body_html = serializers.CharField(max_length=MAX_BODY_HTML_LENGTH, trim_whitespace=False)
    body_json = serializers.JSONField(required=False, default=dict)
    parent_id = serializers.UUIDField(required=False, allow_null=True, default=None)

    def validate_body_html(self, value):
        is_valid, error, clean_html = validate_html_content(value)
        if not is_valid:
            raise serializers.ValidationError(error or "HTML content is not valid")
        clean_html = clean_html if clean_html is not None else value
        if not _BLANK_MARKUP.sub("", clean_html):
            raise serializers.ValidationError("A message can't be empty.")
        return clean_html

    def validate_body_json(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("body_json must be an object.")
        if len(json.dumps(value)) > MAX_BODY_JSON_BYTES:
            raise serializers.ValidationError("body_json is too large.")
        if not _storable_in_jsonb(value):
            raise serializers.ValidationError("body_json contains characters that can't be stored.")
        return value


class MessageEditSerializer(MessageWriteSerializer):
    """Editing changes the body only; a message never moves between threads."""

    parent_id = None
