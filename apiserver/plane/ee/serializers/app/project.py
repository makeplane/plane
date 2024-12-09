# Module imports
from plane.app.serializers.base import BaseSerializer
from plane.ee.models import ProjectAttribute
from rest_framework import serializers


class ProjectAttributeSerializer(BaseSerializer):
    state_id = serializers.UUIDField(required=False)

    class Meta:
        model = ProjectAttribute
        fields = [
            "state_id",
            "priority",
            "start_date",
            "target_date",
        ]
