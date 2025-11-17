from rest_framework import serializers
from rest_framework.serializers import ModelSerializer

from plane.app.serializers import UserLiteSerializer, BaseSerializer, IssueAssigneeSerializer, ProjectDetailSerializer
from plane.db.models import TestPlan, TestCaseRepository, User, TestCase, CaseLabel, CaseModule, FileAsset, Issue, TestCaseComment


class TestPlanCreateUpdateSerializer(ModelSerializer):
    """
    Serializer for creating a TestPlan.
    """
    assignees = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), many=True, required=False)
    cases = serializers.PrimaryKeyRelatedField(queryset=TestCase.objects.all(), many=True, required=False)

    class Meta:
        model = TestPlan
        fields = ['name', 'begin_time', 'end_time', 'repository', 'assignees', 'cases']


class CaseDetailSerializer(ModelSerializer):
    """
    Serializer for creating a TestPlan.
    """

    class Meta:
        model = TestCase
        fields = '__all__'


class TestPlanDetailSerializer(ModelSerializer):
    """
    Serializer for creating a TestPlan.
    """
    assignees = UserLiteSerializer(many=True, read_only=True)
    cases = CaseDetailSerializer(many=True, read_only=True)


    class Meta:
        model = TestPlan
        fields = ['id', 'name', 'begin_time', 'end_time', 'repository', 'assignees', 'cases', 'state','state_display']


class TestCaseRepositorySerializer(ModelSerializer):
    """
    Serializer for creating a TestPlan.
    """

    class Meta:
        model = TestCaseRepository
        fields = ['name', 'description', 'project', 'workspace']


class TestCaseRepositoryDetailSerializer(ModelSerializer):
    """
    Serializer for creating a TestPlan.
    """

    created_by = UserLiteSerializer(read_only=True)

    class Meta:
        model = TestCaseRepository
        fields = '__all__'
        depth = 1


class CaseLabelSerializer(ModelSerializer):
    """
    Serializer for creating a TestPlan.
    """

    class Meta:
        model = CaseLabel
        fields = '__all__'


class CaseCreateUpdateSerializer(ModelSerializer):
    labels = serializers.PrimaryKeyRelatedField(queryset=CaseLabel.objects.all(), many=True, required=False)
    issues = serializers.PrimaryKeyRelatedField(queryset=Issue.objects.all(), many=True, required=False)

    class Meta:
        model = TestCase
        fields = ['name', 'precondition', 'steps', 'remark', 'state', 'type', 'priority', 'repository', 'labels',
                  'module', 'assignee', 'issues','test_type']

    def create(self, validated_data):
        labels = validated_data.pop('labels', [])
        issues = validated_data.pop('issues', [])
        instance = super().create(validated_data)
        if labels:
            instance.labels.set(labels)
        if issues:
            instance.issues.set(issues)
        return instance

    def update(self, instance, validated_data):
        labels = validated_data.pop('labels', None)
        issues = validated_data.pop('issues', None)
        instance = super().update(instance, validated_data)
        if labels is not None:
            instance.labels.set(labels)
        if issues is not None:
            instance.issues.set(issues)
        return instance




class CaseListSerializer(ModelSerializer):
    """用例查询"""
    issues = ...


    class Meta:
        model = TestCase
        fields = '__all__'
        depth = 1


class CaseModuleCreateUpdateSerializer(ModelSerializer):
    """创建和更新用例"""

    class Meta:
        model = CaseModule
        fields = ['name', 'sort_order', 'parent', 'repository']


class CaseModuleListSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = CaseModule
        fields = [
            'id',
            'name',
            'sort_order',
            'created_at',
            'updated_at',
            'children',  # 递归显示所有子节点
            'repository'
        ]

    def get_children(self, obj):
        """
        递归获取所有子节点
        """
        # 获取直接子节点（未删除的）
        direct_children = obj.children.filter(deleted_at__isnull=True).order_by('sort_order')

        # 使用相同的序列化器递归序列化子节点
        serializer = CaseModuleListSerializer(direct_children, many=True, context=self.context)
        return serializer.data


class CaseLabelCreateSerializer(serializers.ModelSerializer):
    """"""

    class Meta:
        model = CaseLabel
        fields = ['name', 'repository']


class CaseLabelListSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseLabel
        fields = '__all__'

# 新增：测试用例附件序列化器（复用 FileAsset）
class CaseAttachmentSerializer(BaseSerializer):
    asset_url = serializers.CharField(read_only=True)

    class Meta:
        model = FileAsset
        fields = "__all__"
        read_only_fields = [
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "workspace",
            "project",
            "case",
            'size',
            'storage_metadata',
            'attributesz',
        ]



class IssueListSerializer(BaseSerializer):
    project = ProjectDetailSerializer( read_only=True)

    class Meta:
        model = Issue
        fields = "__all__"

class CaseIssueSerializer(ModelSerializer):
    issues = IssueListSerializer(many=True, read_only=True)

    class Meta:
        model = TestCase
        fields = ['id','issues']


class TestCaseCommentSerializer(ModelSerializer):
    children = serializers.SerializerMethodField()
    creator_name = serializers.CharField(source="creator.display_name", read_only=True)

    class Meta:
        model = TestCaseComment
        fields = "__all__"

    def get_children(self, obj):
        current_depth = int(self.context.get("current_depth", 1))
        max_depth = int(self.context.get("max_depth", 5))
        if current_depth >= max_depth:
            return []
        qs = obj.children.filter(deleted_at__isnull=True).order_by("created_at")
        serializer = TestCaseCommentSerializer(qs, many=True, context={"current_depth": current_depth + 1, "max_depth": max_depth})
        return serializer.data
