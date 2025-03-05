# Django imports
from rest_framework import serializers

# Module imports
from plane.app.serializers import BaseSerializer
from plane.ee.models import Template, WorkitemTemplate


class TemplateSerializer(BaseSerializer):
    class Meta:
        model = Template
        fields = "__all__"


class WorkitemTemplateSerializer(BaseSerializer):
    class Meta:
        model = WorkitemTemplate
        fields = "__all__"


class WorkitemTemplateDataSerializer(BaseSerializer):
    """Serializer for WorkitemTemplate data"""

    class Meta:
        model = WorkitemTemplate
        fields = [
            "id",
            "name",
            "description_html",
            "priority",
            "parent",
            "state",
            "assignees",
            "labels",
            "type",
            "modules",
            "properties",
            "workspace",
            "project",
        ]
        read_only_fields = fields


class TemplateDataSerializer(BaseSerializer):
    template_data = serializers.SerializerMethodField()

    class Meta:
        model = Template
        fields = [
            "id",
            "name",
            "description_html",
            "template_type",
            "workspace",
            "project",
            "template_data",
            "created_at",
            "updated_at",
        ]

    def get_template_data(self, obj):
        if obj.template_data:
            if obj.template_type == Template.TemplateType.WORKITEM:
                return WorkitemTemplateDataSerializer(obj.template_data[0]).data
        return {}
