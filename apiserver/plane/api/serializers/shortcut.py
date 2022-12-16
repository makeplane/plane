# Module imports
from .base import BaseSerializer

from plane.db.models import Shortcut


class ShortCutSerializer(BaseSerializer):
    class Meta:
        model = Shortcut
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
        ]
