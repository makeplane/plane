# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import Issue


class UserCrossWorkspaceWorkItemSerializer(BaseSerializer):
    """
    Lean serializer for cross-workspace work items on the user profile page.
    Returns ID lists only for assignees/labels — frontend joins via MobX stores.
    Includes enriched workspace/project/state info via method fields.
    """

    # ID-list fields (no embedded objects — frontend joins from MobX stores)
    assignee_ids = serializers.SerializerMethodField()
    label_ids = serializers.SerializerMethodField()

    # Enriched relational fields (pre-fetched via select_related)
    _workspace = serializers.SerializerMethodField()
    _project = serializers.SerializerMethodField()
    _state = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = [
            "id",
            "name",
            "sequence_id",
            "project_id",
            "state_id",
            "parent_id",
            "start_date",
            "target_date",
            "main_task_category_id",
            "sub_task_category_id",
            "assignee_ids",
            "label_ids",
            "_workspace",
            "_project",
            "_state",
        ]
        read_only_fields = fields

    def get_assignee_ids(self, obj):
        # Uses prefetch_related("assignees") — no N+1
        return [str(u.id) for u in obj.assignees.all()]

    def get_label_ids(self, obj):
        # Uses prefetch_related("labels") — no N+1
        return [str(label.id) for label in obj.labels.all()]

    def get__workspace(self, obj):
        # Uses select_related("workspace") — no N+1
        ws = obj.workspace
        if not ws:
            return None
        return {"slug": ws.slug, "name": ws.name}

    def get__project(self, obj):
        # Uses select_related("project") — no N+1
        proj = obj.project
        if not proj:
            return None
        return {"name": proj.name, "identifier": proj.identifier}

    def get__state(self, obj):
        # Uses select_related("state") — no N+1
        state = obj.state
        if not state:
            return None
        return {"name": state.name, "color": state.color, "group": state.group}
