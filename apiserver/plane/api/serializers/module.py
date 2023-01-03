# Third Party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from .user import UserLiteSerializer
from .project import ProjectSerializer
from .issue import IssueStateSerializer

from plane.db.models import User, Module, ModuleMember, ModuleIssue, ModuleLink


class LinkCreateSerializer(serializers.Serializer):

    url = serializers.CharField(required=True)
    title = serializers.CharField(required=False)


class ModuleWriteSerializer(BaseSerializer):

    members_list = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.all()),
        write_only=True,
        required=False,
    )
    links_list = serializers.ListField(
        child=LinkCreateSerializer(),
        write_only=True,
        required=False,
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
        links = validated_data.pop("links_list", None)

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

        if links is not None:
            ModuleLink.objects.bulk_create(
                [
                    ModuleLink(
                        module=module,
                        project=project,
                        workspace=project.workspace,
                        created_by=module.created_by,
                        updated_by=module.updated_by,
                        title=link.get("title", None),
                        url=link.get("url", None),
                    )
                    for link in links
                ],
                batch_size=10,
                ignore_conflicts=True,
            )

        return module

    def update(self, instance, validated_data):

        members = validated_data.pop("members_list", None)
        links = validated_data.pop("links_list", None)

        if members is not None:
            ModuleIssue.objects.filter(module=instance).delete()
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

        if links is not None:
            ModuleLink.objects.filter(module=instance).delete()
            ModuleLink.objects.bulk_create(
                [
                    ModuleLink(
                        module=instance,
                        project=instance.project,
                        workspace=instance.project.workspace,
                        created_by=instance.created_by,
                        updated_by=instance.updated_by,
                        title=link.get("title", None),
                        url=link.get("url", None),
                    )
                    for link in links
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
    issue_detail = IssueStateSerializer(read_only=True, source="issue")

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

    created_by_detail = UserLiteSerializer(read_only=True, source="created_by")

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
        ]


class ModuleSerializer(BaseSerializer):

    project_detail = ProjectSerializer(read_only=True, source="project")
    lead_detail = UserLiteSerializer(read_only=True, source="lead")
    members_detail = UserLiteSerializer(read_only=True, many=True, source="members")
    issue_module = ModuleIssueSerializer(read_only=True, many=True)
    link_module = ModuleLinkSerializer(read_only=True, many=True)

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