from rest_framework import serializers
from rest_framework.serializers import ModelSerializer

from plane.db.models.project import ProjectTemplate, Project


class ProjectSimpleSerializer(ModelSerializer):
    class Meta:
        model = Project
        fields = ['name', 'description', 'network', 'workspace', 'identifier', 'emoji', 'icon_prop',
                  'cover_image', 'cover_image_asset', 'is_template']
        read_only_fields = ['id']


class ProjectTemplateCreateUpdateSerializer(ModelSerializer):

    def create(self, validated_data):
        workspace = validated_data.pop('workspace')
        project_info = validated_data.pop('project_info')
        project_info['workspace'] = workspace.id.hex()
        # 创建项目
        serializer = ProjectSimpleSerializer(data=project_info)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # 创建模板
        project_template = ProjectTemplate.objects.create(name=validated_data['name'],
                                                          description=validated_data['description'],
                                                          project_id=serializer.data['id'])
        return project_template

    class Meta:
        model = ProjectTemplate
        fields = '__all__'


class ProjectTemplateListSerializer(ModelSerializer):
    class Meta:
        model = ProjectTemplate
        fields = '__all__'
        depth = 1

