# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import Workspace
from .base import BaseSerializer


class WorkspaceLiteSerializer(BaseSerializer):
    """
    Lightweight workspace serializer for minimal data transfer.

    Provides essential workspace identifiers including name, slug, and ID
    optimized for navigation, references, and performance-critical operations.
    """

    class Meta:
        model = Workspace
        fields = ["name", "slug", "id"]
        read_only_fields = fields


class WorkspaceFeatureSerializer(serializers.Serializer):
    """Serializer for workspace-level feature flags on Community Edition."""

    project_grouping = serializers.BooleanField(read_only=True)
    initiatives = serializers.BooleanField(read_only=True)
    teams = serializers.BooleanField(read_only=True)
    customers = serializers.BooleanField(read_only=True)
    wiki = serializers.BooleanField(read_only=True)
    pi = serializers.BooleanField(read_only=True)
    work_item_types = serializers.BooleanField(read_only=True)
    releases = serializers.BooleanField(read_only=True)
    states_owned_by_workspace = serializers.BooleanField(read_only=True)

    def to_representation(self, instance):
        return {
            "project_grouping": False,
            "initiatives": False,
            "teams": False,
            "customers": False,
            "wiki": False,
            "pi": False,
            "work_item_types": False,
            "releases": False,
            "states_owned_by_workspace": False,
        }
