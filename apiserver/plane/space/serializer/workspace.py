# Module imports
from .base import BaseSerializer
from plane.db.models import (
    Workspace,
)


class WorkspaceLiteSerializer(BaseSerializer):
    class Meta:
        model = Workspace
        fields = [
            "name",
            "slug",
            "id",
        ]
        read_only_fields = fields
