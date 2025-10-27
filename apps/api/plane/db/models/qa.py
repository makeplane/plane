from django.db import models
from enum import IntEnum

from django.db.models import Q

from . import BaseModel
from django.conf import settings


class TestCaseRepository(BaseModel):
    name = models.CharField(max_length=255, verbose_name="TestCaseRepository Name")
    description = models.TextField(verbose_name="TestCaseRepository Description", blank=True)

    project = models.ForeignKey('db.Project', null=True, blank=True, on_delete=models.CASCADE,
                                related_name="project_%(class)s")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="workspace_%(class)s")

    class Meta:
        db_table = "test_repository"
        ordering = ("-created_at",)


class CaseLabel(BaseModel):
    name = models.CharField(max_length=255)
    repository = models.ForeignKey(TestCaseRepository, on_delete=models.CASCADE, verbose_name="TestCaseRepository",
                                   related_name="labels")

    class Meta:
        constraints = [
            # Enforce uniqueness of project and name when project is not NULL and deleted_at is NULL
            models.UniqueConstraint(
                fields=["repository", "name"],
                condition=Q(repository__isnull=False, deleted_at__isnull=True),
                name="unique_test_label_name_when_not_deleted",
            ),
        ]
        verbose_name = "CaseLabel"
        verbose_name_plural = "CaseLabels"
        db_table = "test_labels"
        ordering = ("-created_at",)

    def __str__(self):
        return str(self.name)


class CaseModule(BaseModel):
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )
    name = models.CharField(max_length=255)
    sort_order = models.FloatField(default=65535)
    repository = models.ForeignKey(TestCaseRepository, on_delete=models.CASCADE, verbose_name="TestCaseRepository",
                                   related_name="modules")

    class Meta:
        constraints = [
            # Enforce uniqueness of project and name when project is not NULL and deleted_at is NULL
            models.UniqueConstraint(
                fields=["repository", "name"],
                condition=Q(repository__isnull=False, deleted_at__isnull=True),
                name="unique_case_module_repository_name_when_not_deleted",
            ),
        ]
        db_table = "test_modules"
        ordering = ('sort_order', "-created_at",)


class TestCase(BaseModel):
    class State(models.IntegerChoices):
        PENDING_REVIEW = 0, '待评审'
        APPROVED = 1, '已通过'
        REJECTED = 2, '已拒绝'

    class Type(models.IntegerChoices):
        FUNCTIONAL = 0, '功能测试'
        PERFORMANCE = 1, '性能测试'
        SECURITY = 2, '安全测试'
        USABILITY = 3, '可用性测试'
        COMPATIBILITY = 4, '兼容性测试'
        REGRESSION = 5, '回归测试'
        OTHER = 6, '其他'

    class Priority(models.IntegerChoices):
        LOW = 0, '低'
        MEDIUM = 1, '中'
        HIGH = 2, '高'

    name = models.CharField(max_length=255, verbose_name="TestCase Name")
    precondition = models.TextField(verbose_name="TestCase Precondition", blank=True, default='<p></p>')
    steps = models.JSONField(verbose_name="TestCase Steps", blank=True, default=dict)
    remark = models.TextField(verbose_name="TestCase Remark", blank=True, default='<p></p>')
    state = models.IntegerField(choices=State.choices, default=State.PENDING_REVIEW, verbose_name="TestCase State")
    type = models.IntegerField(choices=Type.choices, default=Type.FUNCTIONAL, verbose_name="TestCase Type")
    priority = models.IntegerField(choices=Priority.choices, default=Priority.MEDIUM, verbose_name="TestCase Priority")

    repository = models.ForeignKey(TestCaseRepository, on_delete=models.CASCADE, verbose_name="TestCaseRepository",
                                   related_name="cases")
    module = models.ForeignKey(CaseModule, on_delete=models.CASCADE, blank=True, null=True,
                               related_name="cases")
    labels = models.ManyToManyField(CaseLabel, blank=True, related_name="cases")

    class Meta:
        db_table = "test_case"
        ordering = ("-created_at",)


class TestPlan(BaseModel):
    name = models.CharField(max_length=255, verbose_name="TestPlane Name")
    begin_time = models.DateTimeField(null=True, blank=True, verbose_name="TestPlan Begin Time")
    end_time = models.DateTimeField(null=True, blank=True, verbose_name="TestPlan End Time")

    repository = models.ForeignKey(TestCaseRepository, on_delete=models.CASCADE, verbose_name="TestCaseRepository",
                                   related_name="plans")
    assignees = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="plane_assignee",
    )
    cases = models.ManyToManyField(TestCase, blank=True, related_name="plans", through="PlanCase",
                                   through_fields=("plane", "case"))

    class Meta:
        constraints = [
            # Enforce uniqueness of project and name when project is not NULL and deleted_at is NULL
            models.UniqueConstraint(
                fields=["repository", "name"],
                condition=Q(repository__isnull=False, deleted_at__isnull=True),
                name="unique_plane_repository_name_when_not_deleted",
            ),
        ]
        db_table = "test_plane"
        ordering = ("-created_at",)


class PlanCase(BaseModel):
    class State(models.IntegerChoices):
        NOT_START = 0, '未开始'
        PROGRESS = 1, '进行中'
        COMPLETED = 2, '已完成'

    case = models.ForeignKey(TestCase, on_delete=models.CASCADE, related_name="plan_cases")
    plane = models.ForeignKey(TestPlan, on_delete=models.CASCADE, related_name="plan_cases")
    state = models.IntegerField(choices=State.choices, default=State.NOT_START,
                                verbose_name="PlanCase State")

    class Meta:
        verbose_name = "PlanCase"
        verbose_name_plural = "PlanCases"
        db_table = "test_plan_cases"
        ordering = ("-created_at",)
