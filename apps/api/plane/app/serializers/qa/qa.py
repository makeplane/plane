from collections import defaultdict

from django.db.models import Count
from django.db.models.expressions import result
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer

from plane.app.serializers import UserLiteSerializer, BaseSerializer, IssueAssigneeSerializer, ProjectDetailSerializer
from plane.db.models import TestPlan, TestCaseRepository, User, TestCase, CaseLabel, CaseModule, FileAsset, Issue, \
    CaseReviewModule, CaseReview, CaseReviewThrough, TestCaseComment, CaseReviewRecord, PlanModule
from plane.utils.qa import re_approval_case


class TestPlanCreateUpdateSerializer(ModelSerializer):
    """
    Serializer for creating a TestPlan.
    """
    cases = serializers.PrimaryKeyRelatedField(queryset=TestCase.objects.all(), many=True, required=False)

    class Meta:
        model = TestPlan
        fields = ['name', 'description', 'module', 'begin_time', 'end_time', 'repository', 'threshold', 'cases']


class CaseDetailSerializer(ModelSerializer):
    """
    Serializer for creating a TestPlan.
    """
    review = serializers.SerializerMethodField()

    def get_review(self, obj):
        return obj.review

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
        fields = ['id', 'name', 'begin_time', 'end_time', 'repository', 'assignees', 'cases', 'state', 'state_display']


class TestCaseRepositorySerializer(ModelSerializer):
    """
    Serializer for creating a TestPlan.
    """

    def create(self, validated_data):
        instance = super().create(validated_data)

        # 给每个用例库创建统一模块
        CaseReviewModule.objects.create(name='未规划用例', repository=instance, is_default=True)
        PlanModule.objects.create(name='未规划计划', repository=instance, is_default=True)
        return instance

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

    review = serializers.SerializerMethodField()

    def get_review(self, obj):
        return obj.review

    class Meta:
        model = TestCase
        fields = ['name', 'precondition', 'steps', 'remark', 'state', 'type', 'priority', 'repository', 'labels',
                  'module', 'assignee', 'issues', 'test_type']

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
        if any([
            validated_data.get('name') and validated_data['name'] != instance.name,
            validated_data.get('precondition') and validated_data['precondition'] != instance.precondition,
            validated_data.get('steps') and validated_data['steps'] != instance.steps,
        ]):
            re_approval_case(instance)
        instance = super().update(instance, validated_data)
        if labels is not None:
            instance.labels.set(labels)
        if issues is not None:
            instance.issues.set(issues)
        return instance


class CaseListSerializer(ModelSerializer):
    """用例查询"""
    issues = ...

    review = serializers.SerializerMethodField()

    def get_review(self, obj):
        return obj.review

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
    project = ProjectDetailSerializer(read_only=True)

    class Meta:
        model = Issue
        fields = "__all__"


class CaseIssueSerializer(ModelSerializer):
    issues = IssueListSerializer(many=True, read_only=True)

    class Meta:
        model = TestCase
        fields = ['id', 'issues']


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
        serializer = TestCaseCommentSerializer(qs, many=True,
                                               context={"current_depth": current_depth + 1, "max_depth": max_depth})
        return serializer.data


# ----- review------
class ReviewModuleCreateUpdateSerializer(ModelSerializer):
    class Meta:
        model = CaseReviewModule
        fields = ['name', 'repository']


class ReviewModuleDetailSerializer(ModelSerializer):
    class Meta:
        model = CaseReviewModule
        fields = '__all__'


class ReviewModuleListSerializer(ModelSerializer):
    review_count = serializers.SerializerMethodField()

    def get_review_count(self, obj: CaseReviewModule):
        return obj.reviews.count()

    class Meta:
        model = CaseReviewModule
        fields = '__all__'
        read_only_fields = ['review_count']


class ReviewCreateUpdateSerializer(ModelSerializer):
    cases = serializers.PrimaryKeyRelatedField(queryset=TestCase.objects.all(), many=True, required=False)

    def create(self, validated_data):
        cases = validated_data.pop('cases', [])
        instance = super().create(validated_data)
        for case in cases:
            CaseReviewThrough.objects.get_or_create(review=instance, case=case)
        return instance

    def update(self, instance, validated_data):
        cases = validated_data.pop('cases', None)
        instance = super().update(instance, validated_data)
        if cases is not None:
            current_ids = set(CaseReviewThrough.objects.filter(review=instance).values_list('case_id', flat=True))
            new_ids = set([c.id for c in cases])
            add_ids = new_ids - current_ids
            remove_ids = current_ids - new_ids
            if add_ids:
                for case in TestCase.objects.filter(id__in=add_ids):
                    CaseReviewThrough.objects.get_or_create(review=instance, case=case)
            if remove_ids:
                CaseReviewThrough.objects.filter(review=instance, case_id__in=remove_ids).delete()
        return instance

    class Meta:
        model = CaseReview
        fields = '__all__'


class ReviewListSerializer(ModelSerializer):
    case_count = serializers.SerializerMethodField()
    pass_rate = serializers.SerializerMethodField()
    module_name = serializers.SerializerMethodField()

    def get_case_count(self, obj: CaseReview):
        return obj.cases.count()

    def get_pass_rate(self, obj: CaseReview):
        queryset = CaseReviewThrough.objects.filter(review=obj).values('result').annotate(count=Count('result'))
        statis = {label: 0 for label in CaseReviewThrough.Result.values}

        for annotate_result in queryset:
            statis[annotate_result['result']] = annotate_result['count']
        return statis

    def get_module_name(self, obj: CaseReview):
        return obj.module.name

    class Meta:
        model = CaseReview
        exclude = ['cases']


class ReviewCaseListSerializer(ModelSerializer):
    name = serializers.SerializerMethodField()
    priority = serializers.SerializerMethodField()
    assignees = serializers.SerializerMethodField()

    def get_name(self, obj: CaseReviewThrough):
        return obj.case.name

    def get_priority(self, obj: CaseReviewThrough):
        return obj.case.priority

    def get_assignees(self, obj: CaseReviewThrough):
        return obj.review.assignees.values_list('id', flat=True)

    class Meta:
        model = CaseReviewThrough
        fields = ['id', 'name', 'priority', 'assignees', 'result', 'created_by', 'case_id']


class ReviewCaseRecordsSerializer(ModelSerializer):
    class Meta:
        model = CaseReviewRecord
        fields = '__all__'
