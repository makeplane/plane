# Third party imports
from rest_framework import serializers

from django.utils import timezone

# Module imports
from plane.app.serializers.base import BaseSerializer
from plane.ee.serializers.app.description import DescriptionSerializer
from plane.db.models import (
    Page,
    Label,
    ProjectPage,
    PageLabel,
    PageVersion,
)
from plane.ee.models import PageComment, PageCommentReaction


class WorkspacePageSerializer(BaseSerializer):
    is_favorite = serializers.BooleanField(read_only=True)
    labels = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Label.objects.all()),
        write_only=True,
        required=False,
    )
    anchor = serializers.CharField(read_only=True)
    parent_id = serializers.PrimaryKeyRelatedField(
        source="parent", queryset=Page.objects.all(), required=False, allow_null=True
    )
    sub_pages_count = serializers.IntegerField(read_only=True)
    shared_access = serializers.IntegerField(read_only=True)
    is_shared = serializers.BooleanField(read_only=True)

    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "owned_by",
            "access",
            "color",
            "labels",
            "is_favorite",
            "is_locked",
            "archived_at",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "view_props",
            "logo_props",
            "anchor",
            "parent_id",
            "sub_pages_count",
            "shared_access",
            "is_shared",
        ]
        read_only_fields = ["workspace", "owned_by", "anchor", "shared_access"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["labels"] = [str(label.id) for label in instance.labels.all()]
        data["projects"] = [str(project.id) for project in instance.projects.all()]
        return data

    def create(self, validated_data):
        labels = validated_data.pop("labels", None)
        projects = validated_data.pop("projects", None)
        owned_by_id = self.context["owned_by_id"]
        description_html = self.context["description_html"]
        workspace_id = self.context["workspace_id"]

        # Get the workspace id from the project
        page = Page.objects.create(
            **validated_data,
            description_html=description_html,
            owned_by_id=owned_by_id,
            workspace_id=workspace_id,
        )

        # Create the page labels
        if labels is not None:
            PageLabel.objects.bulk_create(
                [
                    PageLabel(
                        label=label,
                        page=page,
                        workspace_id=workspace_id,
                        created_by_id=page.created_by_id,
                        updated_by_id=page.updated_by_id,
                    )
                    for label in labels
                ],
                batch_size=10,
            )

        #
        if projects is not None:
            ProjectPage.objects.bulk_create(
                [
                    ProjectPage(
                        workspace_id=page.workspace_id,
                        project_id=project,
                        page_id=page.id,
                        created_by_id=page.created_by_id,
                        updated_by_id=page.updated_by_id,
                    )
                    for project in projects
                ],
                batch_size=10,
            )

        return page

    def update(self, instance, validated_data):
        labels = validated_data.pop("labels", None)

        if labels is not None:
            PageLabel.objects.filter(page=instance).delete()
            PageLabel.objects.bulk_create(
                [
                    PageLabel(
                        label=label,
                        page=instance,
                        workspace_id=instance.workspace_id,
                        created_by_id=instance.created_by_id,
                        updated_by_id=instance.updated_by_id,
                    )
                    for label in labels
                ],
                batch_size=10,
            )

        return super().update(instance, validated_data)


class WorkspacePageDetailSerializer(BaseSerializer):
    description_html = serializers.CharField()
    is_favorite = serializers.BooleanField(read_only=True)
    anchor = serializers.CharField(read_only=True)
    sub_pages_count = serializers.IntegerField(read_only=True)
    parent_id = serializers.PrimaryKeyRelatedField(
        source="parent", queryset=Page.objects.all(), required=False, allow_null=True
    )
    shared_access = serializers.IntegerField(read_only=True)
    is_shared = serializers.BooleanField(read_only=True)

    class Meta(WorkspacePageSerializer.Meta):
        fields = WorkspacePageSerializer.Meta.fields + [
            "description_html",
            "is_description_empty",
            "anchor",
            "shared_access",
            "is_shared",
        ]


class WorkspacePageVersionSerializer(BaseSerializer):
    class Meta:
        model = PageVersion
        fields = [
            "id",
            "workspace",
            "page",
            "last_saved_at",
            "owned_by",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = ["workspace", "page"]


class WorkspacePageVersionDetailSerializer(BaseSerializer):
    class Meta:
        model = PageVersion
        fields = [
            "id",
            "workspace",
            "page",
            "last_saved_at",
            "description_html",
            "description_json",
            "description_binary",
            "owned_by",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "sub_pages_data",
        ]
        read_only_fields = ["workspace", "page"]


class WorkspacePageLiteSerializer(BaseSerializer):
    sub_pages_count = serializers.IntegerField(read_only=True)
    is_shared = serializers.BooleanField(read_only=True)

    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "access",
            "logo_props",
            "is_locked",
            "archived_at",
            "parent_id",
            "workspace",
            "sub_pages_count",
            "is_shared",
            "owned_by",
            "deleted_at",
            "is_description_empty",
            "updated_at",
            "moved_to_page",
            "moved_to_project",
        ]


class PageCommentReactionSerializer(BaseSerializer):
    class Meta:
        model = PageCommentReaction
        fields = ["id", "workspace", "comment", "actor", "reaction", "project"]
        read_only_fields = ["workspace", "comment", "actor"]


class PageCommentSerializer(BaseSerializer):
    parent_id = serializers.PrimaryKeyRelatedField(
        source="parent",
        queryset=PageComment.objects.all(),
        required=False,
        allow_null=True,
    )
    project_id = serializers.UUIDField(source="project.id", read_only=True)
    workspace_id = serializers.UUIDField(source="workspace.id", read_only=True)
    page_id = serializers.UUIDField(source="page.id", read_only=True)
    page_comment_reactions = PageCommentReactionSerializer(read_only=True, many=True)
    total_replies = serializers.IntegerField(read_only=True)
    description = DescriptionSerializer(required=False)

    class Meta:
        model = PageComment
        fields = "__all__"
        read_only_fields = ["workspace", "page"]

    def create(self, validated_data):
        description_data = validated_data.pop("description", None)
        workspace_id = self.context.get("workspace_id")
        project_id = self.context.get("project_id", None)

        if description_data:
            serializer = DescriptionSerializer(data=description_data)
            serializer.is_valid(raise_exception=True)
            description = serializer.save(
                workspace_id=workspace_id,
                project_id=project_id,
            )
            validated_data["description"] = description

        return super().create(validated_data)

    def update(self, instance, validated_data):
        description_data = validated_data.pop("description", None)

        if description_data:
            if instance.description:
                serializer = DescriptionSerializer(
                    instance.description, data=description_data, partial=True
                )
                serializer.is_valid(raise_exception=True)
                description = serializer.save()
            else:
                serializer = DescriptionSerializer(data=description_data)
                serializer.is_valid(raise_exception=True)
                description = serializer.save(
                    workspace_id=instance.workspace_id,
                    project_id=instance.project_id,
                )

            if instance.description_id != description.id:
                instance.description = description

            validated_data["edited_at"] = timezone.now()

        return super().update(instance, validated_data)
