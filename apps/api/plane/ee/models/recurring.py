# Django imports
from django.db import models
from django_celery_beat.models import PeriodicTask

# Module imports
from plane.db.models import ProjectBaseModel


class RecurringWorkitemTask(ProjectBaseModel):
    """
    A configuration that is used to create a recurring workitem.
    Stores user-defined timing and references the template.
    Keeps a one-to-one link to Celery Beat's PeriodicTask.
    """

    workitem_blueprint = models.ForeignKey(
        "ee.WorkitemTemplate",
        on_delete=models.CASCADE,
        related_name="recurring_tasks",
        help_text="Blueprint to duplicate",
    )
    start_at = models.DateTimeField(help_text="First allowed run (UTC)")
    end_at = models.DateTimeField(
        null=True, blank=True, help_text="Cut-off after which no runs occur (UTC)"
    )
    interval_seconds = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Simple repeat interval (≥ 60s). Mutually exclusive with cron_expression",
    )
    cron_expression = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="5-field standard cron. Mutually exclusive with interval_seconds",
    )
    enabled = models.BooleanField(
        default=True, help_text="Toggle to pause without deletion"
    )
    periodic_task = models.OneToOneField(
        PeriodicTask,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="recurring_workitem_task",
        help_text="Keeps Beat in sync with this row",
    )

    class Meta:
        db_table = "recurring_workitem_tasks"
        verbose_name = "Recurring Workitem Task"
        verbose_name_plural = "Recurring Workitem Tasks"
        ordering = ("-created_at",)

    def __str__(self):
        return f"<{self.workitem_blueprint.name} {self.start_at}>"

    def clean(self):
        """Validate that either interval_seconds or cron_expression is provided, not both"""
        from django.core.exceptions import ValidationError

        if self.interval_seconds is not None and self.cron_expression:
            raise ValidationError(
                "Cannot specify both interval_seconds and cron_expression"
            )

        if self.interval_seconds is None and not self.cron_expression:
            raise ValidationError(
                "Must specify either interval_seconds or cron_expression"
            )

        if self.interval_seconds is not None and self.interval_seconds < 60:
            raise ValidationError("interval_seconds must be at least 60 seconds")

    def save(self, *args, **kwargs):
        self.clean()

        # Create or update the periodic task here
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.periodic_task:
            self.periodic_task.delete()
        super().delete(*args, **kwargs)


class RecurringWorkitemTaskLog(ProjectBaseModel):
    """
    One row per execution; records status, timestamps, and the concrete Work Item produced.
    Provides audit trail for recurring workitem creation.
    """

    class TaskStatus(models.TextChoices):
        STARTED = "STARTED", "Started"
        SUCCESS = "SUCCESS", "Success"
        FAILURE = "FAILURE", "Failure"

    recurring_task = models.ForeignKey(
        RecurringWorkitemTask,
        on_delete=models.CASCADE,
        related_name="execution_logs",
        help_text="Parent schedule",
    )
    workitem = models.ForeignKey(
        "db.Issue",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="recurring_task_logs",
        help_text="Concrete item created on success",
    )
    task_id = models.CharField(max_length=50, help_text="Unique per Celery execution")
    status = models.CharField(
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.STARTED,
        help_text="State of this execution",
    )
    started_at = models.DateTimeField(auto_now_add=True, help_text="When task began")
    finished_at = models.DateTimeField(
        null=True, blank=True, help_text="When task completed or failed"
    )
    error_message = models.TextField(
        null=True, blank=True, help_text="Truncated exception or failure reason"
    )

    class Meta:
        db_table = "recurring_workitem_task_logs"
        verbose_name = "Recurring Workitem Task Log"
        verbose_name_plural = "Recurring Workitem Task Logs"
        ordering = ("-started_at",)

    def __str__(self):
        return f"<{self.recurring_task.workitem_blueprint.name} {self.status} {self.started_at}>"
