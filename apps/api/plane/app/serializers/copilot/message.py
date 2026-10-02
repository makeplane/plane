# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Max characters of a user message, to keep transcripts and prompts bounded.
MESSAGE_MAX_LENGTH = 4000


class CopilotMessageCreateSerializer(serializers.Serializer):
    content = serializers.CharField(allow_blank=False, trim_whitespace=True, max_length=MESSAGE_MAX_LENGTH)
