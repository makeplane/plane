# Module imports
from plane.ee.serializers import BaseSerializer
from plane.db.models import WorkspaceMemberInvite

# local module imports
from .workspace import MobileWorkspaceLiteSerializer


class MobileInvitationDetailsSerializer(BaseSerializer):
    workspace = MobileWorkspaceLiteSerializer(read_only=True)

    class Meta:
        model = WorkspaceMemberInvite
        fields = "__all__"
        read_only_fields = [
            "id",
            "email",
            "workspace",
            "message",
            "created_at",
            "updated_at",
        ]
