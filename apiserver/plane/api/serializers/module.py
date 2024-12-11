# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import (
    User,
    Module,
    ModuleLink,
    ModuleMember,
    ModuleIssue,
    ProjectMember,
)


class ModuleSerializer(BaseSerializer):
    members = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(
            queryset=User.objects.values_list("id", flat=True)
        ),
        write_only=True,
        required=False,
    )
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
            "id",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "deleted_at",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["members"] = [str(member.id) for member in instance.members.all()]
        return data

    def validate(self, data):
        if (
            data.get("start_date", None) is not None
            and data.get("target_date", None) is not None
            and data.get("start_date", None) > data.get("target_date", None)
        ):
            raise serializers.ValidationError("Start date cannot exceed target date")

        if data.get("members", []):
            data["members"] = ProjectMember.objects.filter(
                project_id=self.context.get("project_id"), member_id__in=data["members"]
            ).values_list("member_id", flat=True)

        return data

    def create(self, validated_data):
        members = validated_data.pop("members", None)

        project_id = self.context["project_id"]
        workspace_id = self.context["workspace_id"]

        module_name = validated_data.get("name")
        if module_name:
            # Lookup for the module name in the module table for that project
            if Module.objects.filter(name=module_name, project_id=project_id).exists():
                raise serializers.ValidationError(
                    {"error": "Module with this name already exists"}
                )

        module = Module.objects.create(**validated_data, project_id=project_id)
        if members is not None:
            ModuleMember.objects.bulk_create(
                [
                    ModuleMember(
                        module=module,
                        member_id=str(member),
                        project_id=project_id,
                        workspace_id=workspace_id,
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
        members = validated_data.pop("members", None)
        module_name = validated_data.get("name")
        if module_name:
            # Lookup for the module name in the module table for that project
            if (
                Module.objects.filter(name=module_name, project=instance.project)
                .exclude(id=instance.id)
                .exists()
            ):
                raise serializers.ValidationError(
                    {"error": "Module with this name already exists"}
                )

        if members is not None:
            ModuleMember.objects.filter(module=instance).delete()
            ModuleMember.objects.bulk_create(
                [
                    ModuleMember(
                        module=instance,
                        member_id=str(member),
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


class ModuleIssueSerializer(BaseSerializer):
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


class ModuleLiteSerializer(BaseSerializer):
    class Meta:
        model = Module
        fields = "__all__"
