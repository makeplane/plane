# Third Party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from .user import UserSerializer
from .project import ProjectSerializer
from .workspace import WorkSpaceSerializer
from .issue import IssueStateSerializer

from plane.db.models import (
    User,
    Module,
    ModuleMember,
    ModuleIssue,
    ModuleLink,
    ModuleFavorite,
)


class ModuleWriteSerializer(BaseSerializer):
    members_list = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.all()),
        write_only=True,
        required=False,
    )

    project_detail = ProjectSerializer(source="project", fields=("id", "name", "cover_image", "icon_prop", "emoji", "description"), read_only=True)
    workspace_detail = WorkSpaceSerializer(
        source="workspace",
        fields=("id", "name", "slug"),
        read_only=True,
    ) 

    class Meta:
        model = Module
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        members = validated_data.pop("members_list", None)

        project = self.context["project"]

        module = Module.objects.create(**validated_data, project=project)

        if members is not None:
            ModuleMember.objects.bulk_create(
                [
                    ModuleMember(
                        module=module,
                        member=member,
                        project=project,
                        workspace=project.workspace,
                        created_by=module.created_by,
                        updated_by=module.updated_by,
                    )
                    for member in members
                ],
                batch_size=10,
                ignore_conflicts=True,
            )

        return module

    def update(self, instance, validated_data):
        members = validated_data.pop("members_list", None)

        if members is not None:
            ModuleMember.objects.filter(module=instance).delete()
            ModuleMember.objects.bulk_create(
                [
                    ModuleMember(
                        module=instance,
                        member=member,
                        project=instance.project,
                        workspace=instance.project.workspace,
                        created_by=instance.created_by,
                        updated_by=instance.updated_by,
                    )
                    for member in members
                ],
                batch_size=10,
                ignore_conflicts=True,
            )

        return super().update(instance, validated_data)


class ModuleFlatSerializer(BaseSerializer):
    class Meta:
        model = Module
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class ModuleIssueSerializer(BaseSerializer):
    module_detail = ModuleFlatSerializer(read_only=True, source="module")
    issue_detail = ProjectSerializer(source="issue", fields=("id", "name", "cover_image", "icon_prop", "emoji", "description"), read_only=True)
    sub_issues_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ModuleIssue
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "module",
        ]


class ModuleLinkSerializer(BaseSerializer):
    created_by_detail = UserSerializer(
        source="created_by",
        fields=("id", "first_name", "last_name", "avatar", "is_bot", "display_name"),
        read_only=True,
    )

    class Meta:
        model = ModuleLink
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "module",
        ]

    # Validation if url already exists
    def create(self, validated_data):
        if ModuleLink.objects.filter(
            url=validated_data.get("url"), module_id=validated_data.get("module_id")
        ).exists():
            raise serializers.ValidationError(
                {"error": "URL already exists for this Issue"}
            )
        return ModuleLink.objects.create(**validated_data)


class ModuleSerializer(BaseSerializer):
    project_detail = ProjectSerializer(source="project", fields=("id", "name", "cover_image", "icon_prop", "emoji", "description"), read_only=True)
    lead_detail = UserSerializer(
        source="lead",
        fields=("id", "first_name", "last_name", "avatar", "is_bot", "display_name"),
        read_only=True,
    )
    members_detail = UserSerializer(
        source="members",
        fields=("id", "first_name", "last_name", "avatar", "is_bot", "display_name"),
        read_only=True,
        many=True,
    )
    link_module = ModuleLinkSerializer(read_only=True, many=True)
    is_favorite = serializers.BooleanField(read_only=True)
    total_issues = serializers.IntegerField(read_only=True)
    cancelled_issues = serializers.IntegerField(read_only=True)
    completed_issues = serializers.IntegerField(read_only=True)
    started_issues = serializers.IntegerField(read_only=True)
    unstarted_issues = serializers.IntegerField(read_only=True)
    backlog_issues = serializers.IntegerField(read_only=True)

    class Meta:
        model = Module
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class ModuleFavoriteSerializer(BaseSerializer):
    module_detail = ModuleFlatSerializer(source="module", read_only=True)

    class Meta:
        model = ModuleFavorite
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "user",
        ]
