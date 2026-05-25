from rest_framework import serializers

from plane.db.models import Integration, WorkspaceIntegration


class IntegrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Integration
        fields = "__all__"


class WorkspaceIntegrationSerializer(serializers.ModelSerializer):
    integration_detail = IntegrationSerializer(source="integration", read_only=True)

    class Meta:
        model = WorkspaceIntegration
        fields = "__all__"