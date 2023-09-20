# Third party imports
from rest_framework import serializers

# Module imports
from plane.api.serializers.base import BaseSerializer
from plane.api.serializers import UserLiteSerializer
from plane.ee.models import (
    Property,
    PropertyValue,
    PropertyTransaction,
)
from plane.db.models import (
    User,
    Issue,
    Cycle,
    Module,
    Page,
    IssueView,
)


class UserSerializer(BaseSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "display_name",
            "avatar",
        ]
        read_only_fields = fields


class CycleSerializer(BaseSerializer):
    class Meta:
        model = Cycle
        fields = [
            "id",
            "name",
        ]
        read_only_fields = fields


class ModuleSerializer(BaseSerializer):
    class Meta:
        model = Module
        fields = [
            "id",
            "name",
        ]
        read_only_fields = fields


class PageSerializer(BaseSerializer):
    class Meta:
        model = Page
        fields = [
            "id",
            "name",
        ]
        read_only_fields = fields


class IssueViewSerializer(BaseSerializer):
    class Meta:
        model = IssueView
        fields = [
            "id",
            "name",
        ]
        read_only_fields = fields


class PropertyLiteSerializer(BaseSerializer):
    class Meta:
        model = Property
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
        ]


class PropertySerializer(BaseSerializer):
    children = serializers.SerializerMethodField()

    def get_children(self, obj):
        children = obj.children.all().prefetch_related("children")
        if children:
            serializer = PropertySerializer(children, many=True)
            return serializer.data
        return []

    class Meta:
        model = Property
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "name",
        ]


class PropertyValueSerializer(BaseSerializer):
    property_values = PropertySerializer(read_only=True, many=True)

    class Meta:
        model = PropertyValue
        fields = "__all__"
        read_only_fields = [
            "project",
            "workspace",
            "issue_property",
        ]


class PropertyValueReadSerializer(BaseSerializer):
    class Meta:
        model = PropertyValue
        fields = [
            "value",
            "type",
        ]
        read_only_fields = fields


class PropertyReadSerializer(BaseSerializer):
    children = serializers.SerializerMethodField()
    prop_value = serializers.SerializerMethodField()
    prop_extra = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            "name",
            "type",
            "children",
            "prop_value",
            "id",
            "unit",
            "prop_extra",
        ]
        read_only = fields

    def get_children(self, obj):
        children = obj.children.all()
        if children:
            serializer = PropertyReadSerializer(
                children, many=True, context=self.context
            )
            return serializer.data
        return []

    def get_prop_value(self, obj):
        prop_values = obj.property_values.filter(
            entity_uuid=self.context.get("entity_uuid")
        )
        if prop_values:
            serializer = PropertyValueReadSerializer(prop_values, many=True)
            return serializer.data
        return None

    def get_prop_extra(self, obj):
        MODEL_MAPPER = {
            "user": User,
            "issue": Issue,
            "cycle": Cycle,
            "module": Module,
            "page": Page,
            "view": IssueView,
        }

        SERIALIZER_MAPPER = {
            "user": UserSerializer,
            "cycle": CycleSerializer,
            "module": ModuleSerializer,
            "page": PageSerializer,
            "view": IssueViewSerializer,
        }
        if obj.type == "relation":
            prop_values = obj.property_values.filter(
                entity_uuid=self.context.get("entity_uuid")
            )
            model = MODEL_MAPPER.get(obj.unit, None)
            if model is not None and prop_values:
                serializer = SERIALIZER_MAPPER.get(obj.unit, None)
                return serializer(
                    model.objects.filter(pk__in=[(p.value) for p in prop_values]),
                    many=True,
                ).data
            return None
        return None


class PropertyTransactionSerializer(BaseSerializer):
    actor_detail = UserLiteSerializer(read_only=True, source="actor")

    class Meta:
        model = PropertyTransaction
        fields = "__all__"
