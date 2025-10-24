from django.db import models
from enum import IntEnum

from django.db.models import Q

from . import ProjectBaseModel,BaseModel




class TestCaseRepository(ProjectBaseModel):
    name = models.CharField(max_length=255, verbose_name="TestCaseRepository Name")
    description = models.TextField(verbose_name="TestCaseRepository Description", blank=True)


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
    precondition = models.TextField(verbose_name="TestCase Precondition", blank=True,default='<p></p>')
    steps = models.JSONField(verbose_name="TestCase Steps", blank=True,default=dict)
    remark = models.TextField(verbose_name="TestCase Remark", blank=True,default='<p></p>')
    state = models.IntegerField(choices=State, default=State.PENDING_REVIEW, verbose_name="TestCase State")
    type = models.IntegerField(choices=Type, default=Type.FUNCTIONAL, verbose_name="TestCase Type")
    priority = models.IntegerField(choices=Priority, default=Priority.MEDIUM, verbose_name="TestCase Priority")


    repository = models.ForeignKey(TestCaseRepository, on_delete=models.CASCADE, verbose_name="TestCaseRepository",related_name="cases")

class CaseLabel(BaseModel):
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="parent_label",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=255, blank=True)
    sort_order = models.FloatField(default=65535)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)
    repository = models.ForeignKey(TestCaseRepository, on_delete=models.CASCADE, verbose_name="TestCaseRepository",
                                   related_name="labels")

    class Meta:
        constraints = [
            # Enforce uniqueness of project and name when project is not NULL and deleted_at is NULL
            models.UniqueConstraint(
                fields=["repository", "name"],
                condition=Q(project__isnull=False, deleted_at__isnull=True),
                name="unique_repository_name_when_not_deleted",
            ),
        ]
        verbose_name = "Label"
        verbose_name_plural = "Labels"
        db_table = "labels"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        if self._state.adding:
            # Get the maximum sequence value from the database
            last_id = Label.objects.filter(project=self.project).aggregate(largest=models.Max("sort_order"))["largest"]
            # if last_id is not None
            if last_id is not None:
                self.sort_order = last_id + 10000

        super(Label, self).save(*args, **kwargs)

    def __str__(self):
        return str(self.name)



