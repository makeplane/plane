# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from .issue import IssueFlatSerializer, LabelSerializer
from .workspace import WorkspaceLiteSerializer
from .project import ProjectLiteSerializer
from plane.db.models import Page, PageBlock, PageFavorite, PageLabel, Label


class PageBlockSerializer(BaseSerializer):
    issue_detail = IssueFlatSerializer(source="issue", read_only=True)

    class Meta:
        model = PageBlock
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "page",
        ]


class PageSerializer(BaseSerializer):
    is_favorite = serializers.BooleanField(read_only=True)
    label_details = LabelSerializer(read_only=True, source="labels", many=True)
    labels_list = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Label.objects.all()),
        write_only=True,
        required=False,
    )
    blocks = PageBlockSerializer(read_only=True, many=True)
    project_detail = ProjectLiteSerializer(source="project", read_only=True)
    workspace_detail = WorkspaceLiteSerializer(source="workspace", read_only=True)

    class Meta:
        model = Page
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "owned_by",
        ]

    def create(self, validated_data):
        labels = validated_data.pop("labels_list", None)
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
        labels = validated_data.pop("labels_list", None)
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
