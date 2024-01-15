# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from .issue import IssueFlatSerializer, LabelLiteSerializer
from .workspace import WorkspaceLiteSerializer
from .project import ProjectLiteSerializer
from plane.db.models import (
    Page,
    PageLog,
    PageFavorite,
    PageLabel,
    Label,
    Issue,
    Module,
)


class PageSerializer(BaseSerializer):
    is_favorite = serializers.BooleanField(read_only=True)
    label_details = LabelLiteSerializer(
        read_only=True, source="labels", many=True
    )
    labels = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Label.objects.all()),
        write_only=True,
        required=False,
    )
    project_detail = ProjectLiteSerializer(source="project", read_only=True)
    workspace_detail = WorkspaceLiteSerializer(
        source="workspace", read_only=True
    )

    class Meta:
        model = Page
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "owned_by",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["labels"] = [str(label.id) for label in instance.labels.all()]
        return data

    def create(self, validated_data):
        labels = validated_data.pop("labels", None)
        project_id = self.context["project_id"]
        owned_by_id = self.context["owned_by_id"]
        page = Page.objects.create(
            **validated_data, project_id=project_id, owned_by_id=owned_by_id
        )

        if labels is not None:
            PageLabel.objects.bulk_create(
                [
                    PageLabel(
                        label=label,
                        page=page,
                        project_id=project_id,
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
                        project_id=instance.project_id,
                        workspace_id=instance.workspace_id,
                        created_by_id=instance.created_by_id,
                        updated_by_id=instance.updated_by_id,
                    )
                    for label in labels
                ],
                batch_size=10,
            )

        return super().update(instance, validated_data)


class SubPageSerializer(BaseSerializer):
    entity_details = serializers.SerializerMethodField()

    class Meta:
        model = PageLog
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "page",
        ]

    def get_entity_details(self, obj):
        entity_name = obj.entity_name
        if entity_name == "forward_link" or entity_name == "back_link":
            try:
                page = Page.objects.get(pk=obj.entity_identifier)
                return PageSerializer(page).data
            except Page.DoesNotExist:
                return None
        return None


class PageLogSerializer(BaseSerializer):
    class Meta:
        model = PageLog
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "page",
        ]


class PageFavoriteSerializer(BaseSerializer):
    page_detail = PageSerializer(source="page", read_only=True)

    class Meta:
        model = PageFavorite
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "user",
        ]
