# Third party imports
from rest_framework import serializers

# Module imports
from plane.ee.serializers import BaseSerializer
from plane.db.models import Page

class PageDetailAPISerializer(BaseSerializer):
    anchor = serializers.CharField(read_only=True)

    class Meta:
        model = Page
        fields = ["id", "name", "description_stripped", "created_at", "updated_at", "owned_by", "anchor", "workspace", "projects"]
        read_only_fields = ["workspace", "owned_by", "anchor"]

class PageAPISerializer(BaseSerializer):
    anchor = serializers.CharField(read_only=True)

    class Meta:
        model = Page
        fields = "__all__"
        read_only_fields = ["workspace", "owned_by", "anchor"]