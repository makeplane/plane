from rest_framework import serializers
from rest_framework.serializers import ModelSerializer

from plane.db.models.project import ProjectTemplate


class ProjectTemplateCreateUpdateSerializer(ModelSerializer):

    def create(self, validated_data):
        ...

    class Meta:
        model = ProjectTemplate
        fields = '__all__'
