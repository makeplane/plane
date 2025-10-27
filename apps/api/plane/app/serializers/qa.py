from rest_framework import serializers
from rest_framework.serializers import ModelSerializer

from plane.app.serializers import UserLiteSerializer
from plane.db.models import TestPlan, TestCaseRepository, User, TestCase, CaseLabel, CaseModule


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
        fields = ['id', 'name', 'begin_time', 'end_time', 'repository', 'assignees', 'cases']


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

    class Meta:
        model = TestCaseRepository
        fields = '__all__'


class CaseLabelSerializer(ModelSerializer):
    """
    Serializer for creating a TestPlan.
    """

    class Meta:
        model = TestCase
        fields = '__all__'


class CaseCreateUpdateSerializer(ModelSerializer):
    """创建和更新用例"""
    labels = serializers.PrimaryKeyRelatedField(queryset=CaseLabel.objects.all(), many=True, required=False)

    class Meta:
        model = TestCase
        fields = ['name', 'precondition', 'steps', 'remark', 'state', 'type', 'priority', 'repository', 'labels',
                  'module']


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
            'children'  # 递归显示所有子节点
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

