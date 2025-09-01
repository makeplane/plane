# Module imports
from plane.ee.serializers import BaseSerializer
from plane.db.models import Workspace


class MobileWorkspaceLiteSerializer(BaseSerializer):
    class Meta:
        model = Workspace
        fields = ["name", "slug", "id", "logo_url"]
        read_only_fields = fields
