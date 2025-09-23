# Standard library imports
from opensearchpy.helpers.utils import AttrList, AttrDict

# Third-party imports
from rest_framework import serializers


# Custom ListField to handle AttrList conversion
class AttrListField(serializers.ListField):
    def to_representation(self, value):
        if isinstance(value, AttrList):
            value = list(value)
        return super().to_representation(value)


class AttrDictField(serializers.JSONField):
    def to_representation(self, value):
        if isinstance(value, AttrDict):
            value = value.to_dict()
        return super().to_representation(value)


# Base serializer to handle AttrList conversion for ListFields
class BaseSearchSerializer(serializers.Serializer):
    pass  # No need for conversion logic here anymore


# Serializer for IssueDocument
class IssueSearchSerializer(BaseSearchSerializer):
    name = serializers.CharField()
    id = serializers.CharField()
    sequence_id = serializers.CharField()
    project_identifier = serializers.CharField()
    project_id = serializers.CharField()
    workspace_slug = serializers.CharField()
    type_id = serializers.CharField(required=False)


# Serializer for ProjectDocument
class ProjectSearchSerializer(BaseSearchSerializer):
    name = serializers.CharField()
    id = serializers.CharField()
    identifier = serializers.CharField()
    workspace_slug = serializers.CharField()
    logo_props = AttrDictField(required=False)


# Serializer for CycleDocument
class CycleSearchSerializer(BaseSearchSerializer):
    name = serializers.CharField()
    id = serializers.CharField()
    project_id = serializers.CharField()
    logo_props = AttrDictField(required=False)
    project_identifier = serializers.CharField()
    workspace_slug = serializers.CharField()


# Serializer for ModuleDocument
class ModuleSearchSerializer(BaseSearchSerializer):
    name = serializers.CharField()
    id = serializers.CharField()
    project_id = serializers.CharField()
    logo_props = AttrDictField(required=False)
    project_identifier = serializers.CharField()
    workspace_slug = serializers.CharField()


# Serializer for PageDocument
class PageSearchSerializer(BaseSearchSerializer):
    name = serializers.CharField()
    id = serializers.CharField()
    project_ids = AttrListField(child=serializers.CharField(), required=False)
    logo_props = AttrDictField(required=False)
    project_identifiers = AttrListField(child=serializers.CharField(), required=False)
    workspace_slug = serializers.CharField()
    is_global = serializers.BooleanField(required=False)


# Serializer for IssueViewDocument
class IssueViewSearchSerializer(BaseSearchSerializer):
    name = serializers.CharField()
    id = serializers.CharField()
    project_id = serializers.CharField()
    logo_props = AttrDictField(required=False)
    project_identifier = serializers.CharField()
    workspace_slug = serializers.CharField()


# Serializer for TeamspaceDocument
class TeamspaceSearchSerializer(BaseSearchSerializer):
    name = serializers.CharField()
    id = serializers.CharField()
    workspace_slug = serializers.CharField()
    logo_props = AttrDictField(required=False)


class IssueCommentSearchSerializer(BaseSearchSerializer):
    comment = serializers.SerializerMethodField()  # Change to method field
    id = serializers.CharField()
    project_id = serializers.CharField()
    project_identifier = serializers.CharField()
    workspace_slug = serializers.CharField()
    actor_id = serializers.CharField(required=False)
    issue_id = serializers.CharField(required=False)
    issue_sequence_id = serializers.IntegerField(required=False)
    issue_type_id = serializers.CharField(required=False)
    issue_name = serializers.CharField(required=False)

    def get_comment(self, obj):
        """
        Return highlighted comment snippet or truncated original comment
        """
        # Check if this is a search hit with highlighting (from preserved metadata)
        if (
            isinstance(obj, dict)
            and "_highlight" in obj
            and "comment" in obj["_highlight"]
        ):
            # Return the first highlighted fragment
            highlights = obj["_highlight"]["comment"]
            return highlights[0] if highlights else self._get_truncated_comment(obj)

        # Check if this is a raw hit object with meta.highlight
        if (
            hasattr(obj, "meta")
            and hasattr(obj.meta, "highlight")
            and "comment" in obj.meta.highlight
        ):
            # Return the first highlighted fragment
            highlights = obj.meta.highlight["comment"]
            return highlights[0] if highlights else self._get_truncated_comment(obj)

        return self._get_truncated_comment(obj)

    def _get_truncated_comment(self, obj):
        """
        Return truncated original comment as fallback
        """
        if isinstance(obj, dict):
            comment = obj.get("comment", "")
        else:
            comment = getattr(obj, "comment", "")

        if len(comment) > 150:
            return comment[:150] + "..."
        return comment
