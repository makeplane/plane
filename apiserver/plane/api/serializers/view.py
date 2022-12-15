# Module imports
from .base import BaseSerializer

from plane.db.models import View


class ViewSerializer(BaseSerializer):
    class Meta:
        model = View
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
        ]
