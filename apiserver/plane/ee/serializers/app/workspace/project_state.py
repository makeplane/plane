from plane.ee.models import ProjectState
from rest_framework import serializers


class ProjectStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectState
        fields = [
            "id",
            "workspace_id",
            "name",
            "color",
            "group",
            "default",
            "description",
            "sequence",
        ]
        read_only_fields = ["workspace", "project"]
