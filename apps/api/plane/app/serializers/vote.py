# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import IssueVote
from plane.app.serializers import BaseSerializer
from plane.app.serializers.user import UserLiteSerializer


class IssueVoteSerializer(BaseSerializer):
    actor_detail = UserLiteSerializer(read_only=True, source="actor")

    def validate(self, attrs):
        vote_value = attrs.get("vote")
        if vote_value not in (-1, 1):
            raise serializers.ValidationError("Vote must be 1 (upvote) or -1 (downvote).")
        return attrs

    def create(self, validated_data):
        issue_id = self.context.get("issue_id")
        project_id = self.context.get("project_id")
        user = self.context.get("user")
        vote_value = validated_data.get("vote", 1)
        issue_vote = IssueVote.log_issue_vote(
            issue_id=issue_id,
            user=user,
            project_id=project_id,
            vote_value=vote_value,
        )
        return issue_vote

    class Meta:
        model = IssueVote
        fields = (
            "id",
            "issue",
            "vote",
            "project",
            "actor",
            "created_at",
            "actor_detail",
        )
        read_only_fields = (
            "id",
            "issue",
            "project",
            "actor",
            "created_at",
            "actor_detail",
        )
