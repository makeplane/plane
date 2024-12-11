# Module imports
from plane.ee.serializers import BaseSerializer
from plane.ee.models import Initiative, InitiativeProject, InitiativeLabel


class InitiativeSerializer(BaseSerializer):

    class Meta:
        model = Initiative
        fields = "__all__"
        read_only_fields = [
            "workspace",
        ]


class InitiativeProjectSerializer(BaseSerializer):

    class Meta:
        model = InitiativeProject
        fields = "__all__"
        read_only_fields = [
            "initiative",
            "project",
        ]


class InitiativeLabelSerializer(BaseSerializer):

    class Meta:
        model = InitiativeLabel
        fields = "__all__"
        read_only_fields = [
            "initiative",
            "label",
        ]
