
# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import Project, ProjectIdentifier
from .base import BaseSerializer
from .user import UserLiteSerializer
from .workspace import WorkspaceLiteSerializer


class ProjectSerializer(BaseSerializer):

    workspace_detail = WorkspaceLiteSerializer(read_only=True)
    default_assignee_detail = UserLiteSerializer(read_only=True)
    project_lead_detail = UserLiteSerializer(read_only=True)
    is_favorite = serializers.BooleanField(read_only=True)
    total_members = serializers.IntegerField(read_only=True)
    total_cycles = serializers.IntegerField(read_only=True)
    total_modules = serializers.IntegerField(read_only=True)
    is_member = serializers.BooleanField(read_only=True)
    sort_order = serializers.FloatField(read_only=True)
    member_role = serializers.IntegerField(read_only=True)
    is_deployed = serializers.BooleanField(read_only=True)

    class Meta:
        model = Project
        fields = "__all__"
        read_only_fields = [
            "workspace",
        ]

    def create(self, validated_data):
        identifier = validated_data.get("identifier", "").strip().upper()
        if identifier == "":
            raise serializers.ValidationError(detail="Project Identifier is required")

        if ProjectIdentifier.objects.filter(
            name=identifier, workspace_id=self.context["workspace_id"]
        ).exists():
            raise serializers.ValidationError(detail="Project Identifier is taken")
        project = Project.objects.create(
            **validated_data, workspace_id=self.context["workspace_id"]
        )
        _ = ProjectIdentifier.objects.create(
            name=project.identifier,
            project=project,
            workspace_id=self.context["workspace_id"],
        )
        return project