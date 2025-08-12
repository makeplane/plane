import json

# Django imports
from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError
from django_celery_beat.models import PeriodicTask, CrontabSchedule

# Module imports
from plane.db.models import ProjectBaseModel


class RecurringWorkitemTask(ProjectBaseModel):
    """
    A configuration that is used to create a recurring workitem.
    Stores user-defined timing and references the template.
    Keeps a one-to-one link to Celery Beat's PeriodicTask.
    """

    # Constants for interval types
    INTERVAL_DAILY = "daily"
    INTERVAL_WEEKLY = "weekly"
    INTERVAL_MONTHLY = "monthly"
    INTERVAL_YEARLY = "yearly"

    INTERVAL_CHOICES = [
        (INTERVAL_DAILY, "Daily"),
        (INTERVAL_WEEKLY, "Weekly"),
        (INTERVAL_MONTHLY, "Monthly"),
        (INTERVAL_YEARLY, "Yearly"),
    ]

    # Celery task name constant
    CELERY_TASK_NAME = (
        "plane.ee.bgtasks.recurring_work_item_task.create_work_item_from_template"
    )

    # Cron expression constants
    CRON_WILDCARD = "*"
    CRON_FIELDS_COUNT = 5

    # Day of week conversion (Python weekday to cron)
    # Python: 0=Monday, 6=Sunday
    # Cron: 0=Sunday, 6=Saturday
    PYTHON_SUNDAY = 6
    CRON_SUNDAY = 0

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
    interval_type = models.CharField(
        max_length=20,
        default=INTERVAL_MONTHLY,
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
        on_delete=models.SET_NULL,
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
        """Validate required fields"""
        if not self.cron_expression:
            raise ValidationError("cron_expression is required")
        if not self.start_at:
            raise ValidationError("start_at is required")

    @classmethod
    def generate_cron_expression(cls, start_at, interval_type):
        """
        Generate cron expression based on start_at datetime and interval_type.

        Args:
            start_at (datetime): The datetime when the task should start
            interval_type (str): One of 'second', 'daily', 'week', 'month', 'year'

        Returns:
            str: Cron expression in format "minute hour day month day_of_week"

        Raises:
            ValidationError: If interval_type is invalid
        """
        if not start_at:
            return None

        # Validate interval type
        valid_intervals = [choice[0] for choice in cls.INTERVAL_CHOICES]
        if interval_type not in valid_intervals:
            raise ValidationError(
                f"Invalid interval_type: {interval_type}. Must be one of {valid_intervals}"
            )

        # Extract datetime components for cron-based intervals
        minute = start_at.minute
        hour = start_at.hour
        day = start_at.day
        month = start_at.month

        # Convert Python weekday to cron format
        cron_day_of_week = cls._convert_python_weekday_to_cron(start_at.weekday())

        # Generate cron expression based on interval type
        if interval_type == cls.INTERVAL_DAILY:
            return f"{minute} {hour} {cls.CRON_WILDCARD} {cls.CRON_WILDCARD} {cls.CRON_WILDCARD}"
        elif interval_type == cls.INTERVAL_WEEKLY:
            return f"{minute} {hour} {cls.CRON_WILDCARD} {cls.CRON_WILDCARD} {cron_day_of_week}"
        elif interval_type == cls.INTERVAL_MONTHLY:
            return f"{minute} {hour} {day} {cls.CRON_WILDCARD} {cls.CRON_WILDCARD}"
        elif interval_type == cls.INTERVAL_YEARLY:
            return f"{minute} {hour} {day} {month} {cls.CRON_WILDCARD}"

    @classmethod
    def _convert_python_weekday_to_cron(cls, python_weekday):
        """Convert Python weekday (0=Monday, 6=Sunday) to cron format (0=Sunday, 6=Saturday)"""
        return (
            cls.CRON_SUNDAY
            if python_weekday == cls.PYTHON_SUNDAY
            else python_weekday + 1
        )

    def save(self, *args, **kwargs):
        """Override save to generate cron expression and manage PeriodicTask synchronization"""
        # Auto-generate cron expression from interval_type and start_at
        if self.interval_type and self.start_at:
            self.cron_expression = self.generate_cron_expression(
                self.start_at, self.interval_type
            )

        self.clean()

        # Detect if we should skip syncing (e.g., during soft delete)
        skip_sync = (
            getattr(self, "_skip_periodic_sync", False)
            or getattr(self, "deleted_at", None) is not None
        )

        super().save(*args, **kwargs)

        if not skip_sync:
            self._sync_periodic_task()

    def delete(self, *args, **kwargs):
        """Override delete to clean up associated PeriodicTask and avoid re-sync during soft delete"""
        # Ensure save() doesn't attempt to re-sync during soft delete
        self._skip_periodic_sync = True

        # If there is an associated periodic task, delete it and null out the relation on this instance
        if self.periodic_task_id is not None:
            try:
                self.periodic_task.delete()
            except PeriodicTask.DoesNotExist:
                pass
            finally:
                # Null local relation to avoid "unsaved related object" on save during soft delete
                self.periodic_task = None

        return super().delete(*args, **kwargs)

    def _sync_periodic_task(self):
        """Create or update the associated PeriodicTask for Beat scheduling"""
        task_name = self._generate_task_name()
        task_args, task_kwargs = self._prepare_task_arguments()

        cron_schedule = self._get_or_create_cron_schedule()

        if self.periodic_task:
            self._update_existing_periodic_task(
                task_name, task_args, task_kwargs, cron_schedule
            )
        else:
            self._create_new_periodic_task(
                task_name, task_args, task_kwargs, cron_schedule
            )

    def _generate_task_name(self):
        """Generate a unique task name for the periodic task"""
        return f"rwit-{self.pk}-{self.workitem_blueprint.name}"

    def _prepare_task_arguments(self):
        """Prepare arguments for the celery task"""
        task_args = []
        task_kwargs = {"recurring_workitem_task_id": str(self.pk)}
        return json.dumps(task_args), json.dumps(task_kwargs)

    def _update_existing_periodic_task(
        self, task_name, task_args, task_kwargs, cron_schedule
    ):
        """Update an existing PeriodicTask"""
        periodic_task = self.periodic_task
        periodic_task.name = task_name
        periodic_task.task = self.CELERY_TASK_NAME
        periodic_task.args = task_args
        periodic_task.kwargs = task_kwargs
        periodic_task.enabled = self.enabled
        periodic_task.start_time = self.start_at
        periodic_task.expires = self.end_at
        periodic_task.crontab = cron_schedule
        periodic_task.interval = None
        periodic_task.save()

    def _create_new_periodic_task(
        self, task_name, task_args, task_kwargs, cron_schedule
    ):
        """Create a new PeriodicTask"""
        periodic_task = PeriodicTask.objects.create(
            name=task_name,
            task=self.CELERY_TASK_NAME,
            args=task_args,
            kwargs=task_kwargs,
            enabled=self.enabled,
            start_time=self.start_at,
            expires=self.end_at,
            crontab=cron_schedule,
            interval=None,
        )
        self.periodic_task = periodic_task
        super().save(update_fields=["periodic_task"])

    def _get_or_create_cron_schedule(self):
        """Get or create CrontabSchedule for cron-based scheduling"""
        if not self.cron_expression:
            return None

        cron_parts = self._parse_cron_expression()
        project_timezone = self.project.timezone

        schedule, created = CrontabSchedule.objects.get_or_create(
            minute=cron_parts["minute"],
            hour=cron_parts["hour"],
            day_of_month=cron_parts["day_of_month"],
            month_of_year=cron_parts["month_of_year"],
            day_of_week=cron_parts["day_of_week"],
            timezone=project_timezone,
        )
        return schedule

    def _parse_cron_expression(self):
        """Parse cron expression into components"""
        parts = self.cron_expression.split()
        if len(parts) != self.CRON_FIELDS_COUNT:
            raise ValidationError(f"Invalid cron expression: {self.cron_expression}")

        return {
            "minute": parts[0],
            "hour": parts[1],
            "day_of_month": parts[2],
            "month_of_year": parts[3],
            "day_of_week": parts[4],
        }

    def enable(self):
        """Enable the recurring task"""
        self.enabled = True
        self.save()

    def disable(self):
        """Disable the recurring task"""
        self.enabled = False
        self.save()

    def get_next_run_time(self):
        """Get the next scheduled run time"""
        if self.periodic_task:
            return self.periodic_task.get_next_run_time()
        return None

    def _detect_interval_type_from_cron(self):
        """
        Detect interval type from cron expression pattern.

        Returns:
            str: One of 'daily', 'week', 'month', 'year', or None if pattern doesn't match
        """
        if not self.cron_expression:
            return None

        try:
            cron_parts = self._parse_cron_expression()
        except ValidationError:
            return None

        # Check patterns to determine interval type
        if self._is_daily_pattern(cron_parts):
            return self.INTERVAL_DAILY
        elif self._is_weekly_pattern(cron_parts):
            return self.INTERVAL_WEEKLY
        elif self._is_monthly_pattern(cron_parts):
            return self.INTERVAL_MONTHLY
        elif self._is_yearly_pattern(cron_parts):
            return self.INTERVAL_YEARLY

        return None

    def _is_daily_pattern(self, cron_parts):
        """Check if cron pattern represents daily recurrence"""
        return (
            cron_parts["day_of_month"] == self.CRON_WILDCARD
            and cron_parts["month_of_year"] == self.CRON_WILDCARD
            and cron_parts["day_of_week"] == self.CRON_WILDCARD
        )

    def _is_weekly_pattern(self, cron_parts):
        """Check if cron pattern represents weekly recurrence"""
        return (
            cron_parts["day_of_month"] == self.CRON_WILDCARD
            and cron_parts["month_of_year"] == self.CRON_WILDCARD
            and cron_parts["day_of_week"] != self.CRON_WILDCARD
        )

    def _is_monthly_pattern(self, cron_parts):
        """Check if cron pattern represents monthly recurrence"""
        return (
            cron_parts["day_of_month"] != self.CRON_WILDCARD
            and cron_parts["month_of_year"] == self.CRON_WILDCARD
            and cron_parts["day_of_week"] == self.CRON_WILDCARD
        )

    def _is_yearly_pattern(self, cron_parts):
        """Check if cron pattern represents yearly recurrence"""
        return (
            cron_parts["day_of_month"] != self.CRON_WILDCARD
            and cron_parts["month_of_year"] != self.CRON_WILDCARD
            and cron_parts["day_of_week"] == self.CRON_WILDCARD
        )

    @property
    def schedule_description(self):
        """Get a human-readable description of the schedule"""
        if not self.cron_expression:
            return "No schedule configured"

        interval_type = self._detect_interval_type_from_cron()

        if interval_type == self.INTERVAL_DAILY:
            return (
                f"Every day at {self.start_at.strftime('%H:%M')}"
                if self.start_at
                else "Every day"
            )
        elif interval_type == self.INTERVAL_WEEKLY:
            return (
                f"Every week on {self.start_at.strftime('%A')} at {self.start_at.strftime('%H:%M')}"
                if self.start_at
                else f"Cron: {self.cron_expression}"
            )
        elif interval_type == self.INTERVAL_MONTHLY:
            return (
                f"Every month on day {self.start_at.day} at {self.start_at.strftime('%H:%M')}"
                if self.start_at
                else f"Cron: {self.cron_expression}"
            )
        elif interval_type == self.INTERVAL_YEARLY:
            return (
                f"Every year on {self.start_at.strftime('%B %d')} at {self.start_at.strftime('%H:%M')}"
                if self.start_at
                else f"Cron: {self.cron_expression}"
            )
        else:
            return f"Cron: {self.cron_expression}"


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

    @property
    def duration(self):
        """Get the duration of the task execution"""
        if self.finished_at and self.started_at:
            return self.finished_at - self.started_at
        return None


class RecurringWorkItemTaskActivity(ProjectBaseModel):
    """
    One row per execution; records status, timestamps, and the concrete Work Item produced.
    Provides audit trail for recurring workitem creation.
    """

    recurring_workitem_task = models.ForeignKey(
        RecurringWorkitemTask,
        on_delete=models.CASCADE,
        related_name="recurring_workitem_task_activities",
    )
    recurring_workitem_task_log = models.ForeignKey(
        RecurringWorkitemTaskLog,
        on_delete=models.CASCADE,
        related_name="recurring_workitem_task_activities",
        blank=True,
        null=True,
    )
    verb = models.CharField(max_length=255, verbose_name="Action", default="created")
    field = models.CharField(
        max_length=255, verbose_name="Field Name", blank=True, null=True
    )
    property = models.ForeignKey(
        "ee.IssueProperty",
        on_delete=models.CASCADE,
        related_name="recurring_workitem_task_activities",
        blank=True,
        null=True,
    )
    old_value = models.TextField(verbose_name="Old Value", blank=True, null=True)
    new_value = models.TextField(verbose_name="New Value", blank=True, null=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="recurring_workitem_task_activities",
    )
    old_identifier = models.UUIDField(null=True)
    new_identifier = models.UUIDField(null=True)
    epoch = models.FloatField(null=True)

    class Meta:
        verbose_name = "Recurring Workitem Task Activity"
        verbose_name_plural = "Recurring Workitem Task Activities"
        db_table = "recurring_workitem_task_activities"
        ordering = ("-created_at",)

    def __str__(self):
        """Return recurring workitem task log of the activity"""
        return str(self.recurring_workitem_task_log)
