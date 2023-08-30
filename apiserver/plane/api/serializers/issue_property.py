# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import User, Issue, Cycle, Module, Page, IssueView, IssueProperty, IssuePropertyValue


class UserSerializer(BaseSerializer):

    class Meta:
        model = User
        fields = ["id", "display_name", "avatar",]
        read_only_fields = fields

class CycleSerializer(BaseSerializer):

    class Meta:
        model = Cycle
        fields = ["id", "name",]
        read_only_fields = fields


class ModuleSerializer(BaseSerializer):

    class Meta:
        model = Module
        fields = ["id", "name",]
        read_only_fields = fields


class PageSerializer(BaseSerializer):

    class Meta:
        model = Page
        fields = ["id", "name",]
        read_only_fields = fields


class IssueViewSerializer(BaseSerializer):

    class Meta:
        model = IssueView
        fields = ["id", "name",]
        read_only_fields = fields


class IssuePropertySerializer(BaseSerializer):
    children = serializers.SerializerMethodField()

    def get_children(self, obj):
        children = obj.children.all().prefetch_related("children")
        if children:
            serializer = IssuePropertySerializer(children, many=True)
            return serializer.data
        return None

    class Meta:
        model = IssueProperty
        fields = "__all__"
        read_only_fields = [
            "workspace",
        ]


class IssuePropertyValueSerializer(BaseSerializer):
    property_values = IssuePropertySerializer(read_only=True, many=True)

    class Meta:
        model = IssuePropertyValue
        fields = "__all__"
        read_only_fields = [
            "project",
            "workspace",
            "issue",
            "issue_property",
        ]


class IssuePropertyValueReadSerializer(BaseSerializer):
    class Meta:
        model = IssuePropertyValue
        fields = ["values", "values_uuid"]
        read_only_fields = fields


class IssuePropertyReadSerializer(BaseSerializer):
    children = serializers.SerializerMethodField()
    prop_value = serializers.SerializerMethodField()

    class Meta:
        model = IssueProperty
        fields = [
            "name",
            "type",
            "children",
            "prop_value",
            "id",
            "unit",
        ]
        read_only = fields

    def get_children(self, obj):
        children = obj.children.all().prefetch_related("children")
        if children:
            serializer = IssuePropertyReadSerializer(children, many=True)
            return serializer.data
        return None

    def get_prop_value(self, obj):
        MODEL_MAPPER = {
            "User": User,
            "Issue": Issue,
            "Cycle": Cycle,
            "Module": Module,
            "Page": Page,
            "View": IssueView,
        }

        SERIALIZER_MAPPER = {
            "User": UserSerializer,
            "Cycle": CycleSerializer, 
            "Module": ModuleSerializer,
            "Page": PageSerializer,
            "View": IssueViewSerializer,
        }

        if obj.type == "relation":
            prop_values = obj.property_values.all()
            model = MODEL_MAPPER.get(obj.unit, None)
            if model is not None:
                serializer = SERIALIZER_MAPPER.get(obj.unit, None)
                return serializer(model.objects.filter(pk__in=[(p.values_uuid) for p in prop_values]), many=True).data
            else:
                return None
        else:
            prop_values = obj.property_values.all()
            if prop_values:
                serializer = IssuePropertyValueReadSerializer(prop_values, many=True)
                return serializer.data
            return None
