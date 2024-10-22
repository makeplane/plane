# Module imports
from plane.app.serializers import BaseSerializer
from plane.db.models import SlackProjectSync


class SlackProjectSyncSerializer(BaseSerializer):
    class Meta:
        model = SlackProjectSync
        fields = "__all__"
        read_only_fields = [
            "project",
            "workspace",
            "workspace_integration",
        ]
