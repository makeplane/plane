from rest_framework import serializers
from elasticsearch_dsl import AttrList


# Custom ListField to handle AttrList conversion
class AttrListField(serializers.ListField):
    def to_representation(self, value):
        if isinstance(value, AttrList):
            value = list(value)
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
    type_id = serializers.CharField()


# Serializer for ProjectDocument
class ProjectSearchSerializer(BaseSearchSerializer):
    name = serializers.CharField()
    id = serializers.CharField()
    identifier = serializers.CharField()
    workspace_slug = serializers.CharField()
    logo_props = serializers.JSONField()


# Serializer for CycleDocument
class CycleSearchSerializer(BaseSearchSerializer):
    name = serializers.CharField()
    id = serializers.CharField()
    project_id = serializers.CharField()
    logo_props = serializers.JSONField()
    project_identifier = serializers.CharField()
    workspace_slug = serializers.CharField()


# Serializer for ModuleDocument
class ModuleSearchSerializer(BaseSearchSerializer):
    name = serializers.CharField()
    id = serializers.CharField()
    project_id = serializers.CharField()
    logo_props = serializers.JSONField()
    project_identifier = serializers.CharField()
    workspace_slug = serializers.CharField()


# Serializer for PageDocument
class PageSearchSerializer(BaseSearchSerializer):
    name = serializers.CharField()
    id = serializers.CharField()
    project_ids = AttrListField(child=serializers.CharField())
    logo_props = serializers.JSONField()
    project_identifiers = AttrListField(child=serializers.CharField())
    workspace_slug = serializers.CharField()


# Serializer for IssueViewDocument
class IssueViewSearchSerializer(BaseSearchSerializer):
    name = serializers.CharField()
    id = serializers.CharField()
    project_id = serializers.CharField()
    logo_props = serializers.JSONField()
    project_identifier = serializers.CharField()
    workspace_slug = serializers.CharField()


# Serializer for TeamspaceDocument
class TeamspaceSearchSerializer(BaseSearchSerializer):
    name = serializers.CharField()
    id = serializers.CharField()
    workspace_slug = serializers.CharField()
    logo_props = serializers.JSONField() 