# Module imports
from plane.db.models import Workspace
from .base import BaseSerializer


class WorkspaceLiteSerializer(BaseSerializer):
    """
    Lightweight workspace serializer for minimal data transfer.

    Provides essential workspace identifiers including name, slug, and ID
    optimized for navigation, references, and performance-critical operations.
    """

    class Meta:
        model = Workspace
        fields = ["name", "slug", "id"]
        read_only_fields = fields
