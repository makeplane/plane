# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import (
    Page,
    PageLog,
    PageLabel,
    Label,
    ProjectPage,
    Project,
    PageVersion,
)


class PageSerializer(BaseSerializer):
    is_favorite = serializers.BooleanField(read_only=True)
    labels = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Label.objects.all()),
        write_only=True,
        required=False,
    )
    # Many to many
    label_ids = serializers.ListField(child=serializers.UUIDField(), required=False)
    project_ids = serializers.ListField(child=serializers.UUIDField(), required=False)
    anchor = serializers.CharField(read_only=True)
    parent_id = serializers.PrimaryKeyRelatedField(
        source="parent", queryset=Page.objects.all(), required=False, allow_null=True
    )
    sub_pages_count = serializers.IntegerField(read_only=True)

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
            "label_ids",
            "project_ids",
            "anchor",
            "external_id",
            "external_source",
            "parent_id",
            "sub_pages_count",
        ]
        read_only_fields = ["workspace", "owned_by", "anchor"]

    def create(self, validated_data):
        labels = validated_data.pop("labels", None)
        project_id = self.context["project_id"]
        owned_by_id = self.context["owned_by_id"]
        description = self.context["description"]
        description_binary = self.context["description_binary"]
        description_html = self.context["description_html"]

        # Get the workspace id from the project
        project = Project.objects.get(pk=project_id)

        # Create the page
        page = Page.objects.create(
            **validated_data,
            description=description,
            description_binary=description_binary,
            description_html=description_html,
            owned_by_id=owned_by_id,
            workspace_id=project.workspace_id,
        )

        # Create the project page
        ProjectPage.objects.create(
            workspace_id=page.workspace_id,
            project_id=project_id,
            page_id=page.id,
            created_by_id=page.created_by_id,
            updated_by_id=page.updated_by_id,
        )

        # Create page labels
        if labels is not None:
            PageLabel.objects.bulk_create(
                [
                    PageLabel(
                        label=label,
                        page=page,
                        workspace_id=page.workspace_id,
                        created_by_id=page.created_by_id,
                        updated_by_id=page.updated_by_id,
                    )
                    for label in labels
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


class PageDetailSerializer(PageSerializer):
    description_html = serializers.CharField()
    is_favorite = serializers.BooleanField(read_only=True)
    parent_id = serializers.PrimaryKeyRelatedField(
        source="parent", queryset=Page.objects.all(), required=False, allow_null=True
    )

    class Meta(PageSerializer.Meta):
        fields = PageSerializer.Meta.fields + ["description_html"]


class PageLiteSerializer(BaseSerializer):
    project_ids = serializers.ListField(child=serializers.UUIDField(), required=False)
    sub_pages_count = serializers.IntegerField(read_only=True)

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
            "project_ids",
            "sub_pages_count",
            "owned_by",
            "deleted_at",
            "is_description_empty",
            "updated_at",
            "moved_to_page",
            "moved_to_project",
        ]


class PageLogSerializer(BaseSerializer):
    class Meta:
        model = PageLog
        fields = "__all__"
        read_only_fields = ["workspace", "page"]


class PageVersionSerializer(BaseSerializer):
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


class PageVersionDetailSerializer(BaseSerializer):
    class Meta:
        model = PageVersion
        fields = [
            "id",
            "workspace",
            "page",
            "last_saved_at",
            "description_binary",
            "description_html",
            "description_json",
            "owned_by",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "sub_pages_data",
        ]
        read_only_fields = ["workspace", "page"]
