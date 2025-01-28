# Third party imports
from rest_framework import serializers

# Module imports
from plane.ee.serializers import BaseSerializer
from plane.db.models import User, PageVersion, IssueView, Page, Label
from plane.ee.models import (
    TeamSpace,
    TeamSpaceMember,
    TeamSpaceComment,
    TeamSpaceCommentReaction,
    TeamSpaceUserProperty,
    TeamSpaceActivity,
)
from plane.utils.issue_filters import issue_filters


class TeamSpaceSerializer(BaseSerializer):
    lead_id = serializers.PrimaryKeyRelatedField(
        source="lead",
        queryset=User.objects.all(),
        required=False,
        allow_null=True,
    )
    project_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
    )

    class Meta:
        model = TeamSpace
        fields = [
            "id",
            "name",
            "description_json",
            "description_html",
            "logo_props",
            "lead_id",
            "project_ids",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "workspace",
        ]


class TeamSpaceMemberSerializer(BaseSerializer):

    class Meta:
        model = TeamSpaceMember
        fields = "__all__"


class TeamSpaceViewSerializer(BaseSerializer):
    is_team_view = serializers.BooleanField(read_only=True)
    is_favorite = serializers.BooleanField(read_only=True)
    anchor = serializers.CharField(read_only=True)
    team = serializers.UUIDField(read_only=True)

    class Meta:
        model = IssueView
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "query",
            "owned_by",
            "access",
            "is_locked",
        ]

    def create(self, validated_data):
        query_params = validated_data.get("filters", {})
        if bool(query_params):
            validated_data["query"] = issue_filters(query_params, "POST")
        else:
            validated_data["query"] = {}
        return IssueView.objects.create(**validated_data)

    def update(self, instance, validated_data):
        query_params = validated_data.get("filters", {})
        if bool(query_params):
            validated_data["query"] = issue_filters(query_params, "POST")
        else:
            validated_data["query"] = {}
        validated_data["query"] = issue_filters(query_params, "PATCH")
        return super().update(instance, validated_data)


class TeamSpacePageSerializer(BaseSerializer):
    is_favorite = serializers.BooleanField(read_only=True)
    labels = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Label.objects.all()),
        write_only=True,
        required=False,
    )
    # Many to many
    label_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
    )
    project_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
    )
    anchor = serializers.CharField(read_only=True)
    team = serializers.UUIDField(read_only=True)

    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "owned_by",
            "access",
            "color",
            "labels",
            "parent",
            "is_favorite",
            "is_locked",
            "archived_at",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "view_props",
            "logo_props",
            "label_ids",
            "project_ids",
            "anchor",
            "team",
        ]
        read_only_fields = [
            "workspace",
            "owned_by",
            "anchor",
        ]

    def create(self, validated_data):
        workspace_id = self.context["workspace_id"]
        owned_by_id = self.context["owned_by_id"]
        description_html = self.context["description_html"]

        # Create the page
        return Page.objects.create(
            **validated_data,
            description_html=description_html,
            owned_by_id=owned_by_id,
            workspace_id=workspace_id,
        )


class TeamSpacePageDetailSerializer(TeamSpacePageSerializer):

    class Meta:
        model = Page
        fields = TeamSpacePageSerializer.Meta.fields + [
            "description_html",
        ]


class TeamSpacePageVersionSerializer(BaseSerializer):
    class Meta:
        model = PageVersion
        fields = [
            "id",
            "workspace",
            "page",
            "last_saved_at",
            "owned_by",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "workspace",
            "page",
        ]


class TeamSpacePageVersionDetailSerializer(BaseSerializer):
    class Meta:
        model = PageVersion
        fields = [
            "id",
            "workspace",
            "page",
            "last_saved_at",
            "description_html",
            "description_json",
            "description_binary",
            "owned_by",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "workspace",
            "page",
        ]


class TeamSpaceCommentSerializer(BaseSerializer):

    class Meta:
        model = TeamSpaceComment
        fields = "__all__"
        read_only_fields = [
            "id",
            "workspace",
            "team_space",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class TeamSpaceCommentReactionSerializer(BaseSerializer):
    class Meta:
        model = TeamSpaceCommentReaction
        fields = [
            "id",
            "reaction",
            "actor",
        ]
        read_only_fields = [
            "workspace",
            "team_space",
            "comment",
            "actor",
            "deleted_at",
        ]


class TeamSpaceUserPropertySerializer(BaseSerializer):
    class Meta:
        model = TeamSpaceUserProperty
        fields = "__all__"
        read_only_fields = ["workspace", "team_space", "user"]


class TeamSpaceActivitySerializer(BaseSerializer):
    team = serializers.UUIDField(read_only=True, source="team_space_id")

    class Meta:
        model = TeamSpaceActivity
        fields = "__all__"
