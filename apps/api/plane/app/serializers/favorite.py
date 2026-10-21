# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db.models import Exists, OuterRef, Q
from rest_framework import serializers

from plane.db.models import (
    UserFavorite,
    Cycle,
    Module,
    Issue,
    IssueView,
    Page,
    Project,
    ProjectMember,
    WorkspaceMember,
)


class ProjectFavoriteLiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "logo_props"]


class PageFavoriteLiteSerializer(serializers.ModelSerializer):
    project_id = serializers.SerializerMethodField()

    class Meta:
        model = Page
        fields = ["id", "name", "logo_props", "project_id"]

    def get_project_id(self, obj):
        # A page can be linked to several projects; report the one the favorite was validated against
        return self.context.get("project_id")


class CycleFavoriteLiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cycle
        fields = ["id", "name", "logo_props", "project_id"]


class ModuleFavoriteLiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ["id", "name", "logo_props", "project_id"]


class ViewFavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueView
        fields = ["id", "name", "logo_props", "project_id"]


def get_entity_model_and_serializer(entity_type):
    entity_map = {
        "cycle": (Cycle, CycleFavoriteLiteSerializer),
        "issue": (Issue, None),
        "module": (Module, ModuleFavoriteLiteSerializer),
        "view": (IssueView, ViewFavoriteSerializer),
        "page": (Page, PageFavoriteLiteSerializer),
        "project": (Project, ProjectFavoriteLiteSerializer),
        "folder": (None, None),
    }
    return entity_map.get(entity_type, (None, None))


def get_favorite_entities(entity_type, user_id, project_id):
    """
    Entities of entity_type in project_id that user_id can see: the user must be an
    active member of the (unarchived) project, private pages and views are owner-only,
    and guests without guest_view_all_features only see the pages and views they own.
    Workspace views (no project) follow the workspace view list instead: active
    workspace members see their own and public views, workspace guests only their own.
    """
    entity_model, _ = get_entity_model_and_serializer(entity_type)
    if entity_type == "view" and project_id is None:
        member = WorkspaceMember.objects.filter(
            workspace_id=OuterRef("workspace_id"), member_id=user_id, is_active=True
        )
        return IssueView.objects.filter(Exists(member), project__isnull=True).filter(
            Q(owned_by_id=user_id) | (Q(access=1) & ~Exists(member.filter(role=5)))
        )
    member = ProjectMember.objects.filter(
        project_id=project_id, member_id=user_id, is_active=True, project__archived_at__isnull=True
    )
    in_project = {
        "project": Q(id=project_id),
        "page": Q(project_pages__project_id=project_id, project_pages__deleted_at__isnull=True),
    }.get(entity_type, Q(project_id=project_id))
    entities = entity_model.objects.filter(in_project, Exists(member))

    public_access = {"page": Page.PUBLIC_ACCESS, "view": 1}.get(entity_type)
    if public_access is not None:
        restricted_guest = member.filter(role=5, project__guest_view_all_features=False)
        entities = entities.filter(Q(owned_by_id=user_id) | (Q(access=public_access) & ~Exists(restricted_guest)))
    return entities


class UserFavoriteSerializer(serializers.ModelSerializer):
    entity_data = serializers.SerializerMethodField()

    class Meta:
        model = UserFavorite
        fields = [
            "id",
            "entity_type",
            "entity_identifier",
            "entity_data",
            "name",
            "is_folder",
            "sequence",
            "parent",
            "workspace_id",
            "project_id",
        ]
        read_only_fields = ["workspace", "created_by", "updated_by"]

    def get_entity_data(self, obj):
        entity_type = obj.entity_type
        entity_identifier = obj.entity_identifier

        entity_model, entity_serializer = get_entity_model_and_serializer(entity_type)
        if entity_model and entity_serializer:
            try:
                entity = get_favorite_entities(entity_type, obj.user_id, obj.project_id).get(
                    pk=entity_identifier, workspace_id=obj.workspace_id
                )
                return entity_serializer(entity, context={"project_id": obj.project_id}).data
            except entity_model.DoesNotExist:
                return None
        return None
