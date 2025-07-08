# Module imports
from plane.db.models import Workspace
from .base import BaseSerializer


class WorkspaceLiteSerializer(BaseSerializer):
    """Lite serializer with only required fields"""

    class Meta:
        model = Workspace
        fields = ["name", "slug", "id"]
        read_only_fields = fields
