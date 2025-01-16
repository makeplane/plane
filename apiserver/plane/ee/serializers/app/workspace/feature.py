from rest_framework import serializers
from plane.ee.models import WorkspaceFeature


class WorkspaceFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkspaceFeature
        fields = "__all__"
