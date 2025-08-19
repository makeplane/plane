# Python imports
import uuid

# Django imports
from django.db import models
from django.conf import settings
from django.core.validators import MaxValueValidator
from django.contrib.postgres.indexes import GinIndex
from django.contrib.auth.hashers import make_password

# Module imports
from plane.db.models import ProjectBaseModel
from plane.db.models import User, WorkspaceMember, BotTypeEnum


class AutomationScopeChoices(models.TextChoices):
    """Scope choices for automation"""

    WORKITEM = "work-item", "WorkItem"


class AutomationStatusChoices(models.TextChoices):
    """Status choices for automation"""

    DRAFT = "draft", "Draft"
    PUBLISHED = "published", "Published"
    DISABLED = "disabled", "Disabled"


class NodeTypeChoices(models.TextChoices):
    """Node type choices for automation nodes"""

    TRIGGER = "trigger", "Trigger"
    ACTION = "action", "Action"
    CONDITION = "condition", "Condition"


class RunStatusChoices(models.TextChoices):
    """Status choices for automation runs"""

    PENDING = "pending", "Pending"
    RUNNING = "running", "Running"
    SUCCESS = "success", "Success"
    FAILED = "failed", "Failed"
    CANCELLED = "cancelled", "Cancelled"


class Automation(ProjectBaseModel):
    """Main automation container"""

    name = models.CharField(max_length=255, help_text="Human-readable automation name")
    description = models.TextField(blank=True, help_text="Automation description")

    # Scoping - automations can be scoped to WorkItems, Cycles, Modules, etc.
    scope = models.CharField(
        max_length=50,
        help_text="The scope defines on what entity this automation runs on (e.g., WorkItem, Cycle, Module)",  # noqa: E501
    )

    # Status and versioning
    status = models.CharField(
        max_length=20,
        choices=AutomationStatusChoices.choices,
        default=AutomationStatusChoices.DRAFT,
    )
    is_enabled = models.BooleanField(
        default=False, help_text="Whether automation is active"
    )

    # Version tracking
    current_version = models.ForeignKey(
        "AutomationVersion",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="automation_current",
    )

    # Metadata
    run_count = models.PositiveIntegerField(
        default=0, help_text="Total number of executions"
    )
    last_run_at = models.DateTimeField(null=True, blank=True)

    # Bot User
    bot_user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bot_automation",
        help_text="The bot user for this automation",
    )

    def can_execute(self):
        """Check if automation can be executed"""
        return (
            self.is_enabled
            and self.status == AutomationStatusChoices.PUBLISHED
            and self.current_version is not None
        )

    def create_new_version(self):
        """Create a new version for this automation"""
        latest_version = self.versions.order_by("-version_number").first()
        new_version_number = (
            (latest_version.version_number + 1) if latest_version else 1
        )

        return AutomationVersion.objects.create(
            automation=self,
            version_number=new_version_number,
            name=self.name,
            description=self.description,
            project=self.project,
        )

    def publish_version(self, version, user=None):
        """Publish a specific version and make it current"""
        from django.utils import timezone

        # Mark version as published
        version.is_published = True
        version.published_at = timezone.now()
        if user:
            version.published_by = user
        version.save()

        # Set as current version
        self.current_version = version
        self.status = AutomationStatusChoices.PUBLISHED
        self.save()

        return version

    @classmethod
    def active(cls):
        """Get all active (enabled and published) automations"""
        return cls.objects.filter(
            is_enabled=True,
            status=AutomationStatusChoices.PUBLISHED,
            deleted_at__isnull=True,
        )

    @classmethod
    def for_workspace(cls, workspace_id):
        """Get automations for a specific workspace"""
        return cls.objects.filter(workspace_id=workspace_id, deleted_at__isnull=True)

    @classmethod
    def for_scope(cls, scope):
        """Get automations for a specific scope key"""
        return cls.objects.filter(scope=scope, deleted_at__isnull=True)

    @property
    def nodes(self):
        return AutomationNode.objects.filter(version=self.current_version)

    @property
    def edges(self):
        return AutomationEdge.objects.filter(version=self.current_version)

    def save(self, *args, **kwargs):
        # create a bot user if not exists
        if not self.bot_user:
            # Create a automation bot
            bot = User.objects.create(
                username=f"automation-bot-{self.id}",
                display_name="Automation Bot",
                first_name="Automation",
                last_name="Bot",
                is_bot=True,
                bot_type=BotTypeEnum.AUTOMATION_BOT,
                email=f"automation-bot-{self.id}@plane.so",
                password=make_password(uuid.uuid4().hex),
                is_password_autoset=True,
            )

            from plane.app.permissions import ROLE

            # Add user to the workspace
            WorkspaceMember.objects.create(
                member=bot,
                workspace_id=self.project.workspace_id,
                role=ROLE.MEMBER.value,
                is_active=True,
            )
            self.bot_user = bot

        # set the status to draft if not set
        super().save(*args, **kwargs)

    class Meta:
        db_table = "automations"
        verbose_name = "Automation"
        verbose_name_plural = "Automations"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["project", "name"],
                condition=models.Q(deleted_at__isnull=True),
                name="automation_unique_project_name_when_not_deleted",
            )
        ]
        indexes = [
            models.Index(fields=["workspace", "status", "is_enabled"]),
            models.Index(fields=["scope"]),
        ]

    def __str__(self):
        return f"{self.name} <{self.workspace.name}>"


class AutomationVersion(ProjectBaseModel):
    """Immutable snapshot of automation configuration"""

    automation = models.ForeignKey(
        Automation, on_delete=models.CASCADE, related_name="versions"
    )
    version_number = models.PositiveIntegerField(help_text="Sequential version number")

    # Snapshot of configuration at this version
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    configuration = models.JSONField(
        default=dict,
        help_text="Complete automation configuration including nodes and edges",
    )

    # Metadata
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="published_automation_versions",
    )

    class Meta:
        db_table = "automation_versions"
        verbose_name = "Automation Version"
        verbose_name_plural = "Automation Versions"
        ordering = ("-version_number",)
        constraints = [
            models.UniqueConstraint(
                fields=["automation", "version_number"],
                condition=models.Q(deleted_at__isnull=True),
                name="automation_version_unique_automation_version_number",
            )
        ]
        indexes = [
            models.Index(fields=["automation", "version_number"]),
            models.Index(fields=["is_published", "published_at"]),
            GinIndex(
                fields=["configuration"],
                name="autover_cfg_gin",
                opclasses=["jsonb_path_ops"],
            ),
        ]

    def __str__(self):
        return f"{self.automation.name} v{self.version_number}"


class AutomationNode(ProjectBaseModel):
    """Individual node (trigger/action/condition) in automation graph"""

    version = models.ForeignKey(
        AutomationVersion, on_delete=models.CASCADE, related_name="nodes"
    )

    # Node identification
    name = models.CharField(max_length=255, help_text="Display name for the node")
    node_type = models.CharField(
        max_length=20,
        choices=NodeTypeChoices.choices,
        help_text="Type of node: trigger, action, or condition",
    )

    # Node implementation details
    handler_name = models.CharField(
        max_length=100,
        help_text="Name of the handler class (e.g., 'record_created', 'send_email')",
    )
    config = models.JSONField(
        default=dict, help_text="Node-specific configuration and parameters"
    )

    # Execution metadata
    is_enabled = models.BooleanField(default=True)

    class Meta:
        db_table = "automation_nodes"
        verbose_name = "Automation Node"
        verbose_name_plural = "Automation Nodes"
        ordering = ("created_at",)
        constraints = []
        indexes = [
            models.Index(fields=["version", "node_type"]),
            models.Index(fields=["handler_name"]),
            models.Index(
                fields=["node_type"],
                condition=models.Q(node_type="trigger"),
                name="autonode_trig_part_idx",
            ),
            GinIndex(
                fields=["config"], name="autonode_cfg_gin", opclasses=["jsonb_path_ops"]
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.node_type}) - {self.version}"


class AutomationEdge(ProjectBaseModel):
    """Simple directed connection between automation nodes"""

    version = models.ForeignKey(
        AutomationVersion, on_delete=models.CASCADE, related_name="edges"
    )

    # Edge endpoints
    source_node = models.ForeignKey(
        AutomationNode, on_delete=models.CASCADE, related_name="outgoing_edges"
    )
    target_node = models.ForeignKey(
        AutomationNode, on_delete=models.CASCADE, related_name="incoming_edges"
    )

    # Execution metadata
    execution_order = models.PositiveIntegerField(
        default=0, help_text="Order for evaluation when multiple edges from same node"
    )

    class Meta:
        db_table = "automation_edges"
        verbose_name = "Automation Edge"
        verbose_name_plural = "Automation Edges"
        ordering = ("execution_order", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["source_node", "target_node"],
                condition=models.Q(deleted_at__isnull=True),
                name="automation_edge_unique_source_target",
            ),
            models.CheckConstraint(
                check=~models.Q(source_node=models.F("target_node")),
                name="automation_edge_no_self_loops",
            ),
        ]
        indexes = [
            models.Index(fields=["version", "source_node"]),
            models.Index(fields=["version", "target_node"]),
        ]

    def __str__(self):
        return f"{self.source_node.name} -> {self.target_node.name}"


class AutomationRun(ProjectBaseModel):
    """Individual execution instance of an automation"""

    automation = models.ForeignKey(
        Automation, on_delete=models.CASCADE, related_name="runs"
    )
    version = models.ForeignKey(
        AutomationVersion, on_delete=models.CASCADE, related_name="runs"
    )

    # Trigger information
    trigger_event = models.JSONField(
        default=dict, help_text="The event that triggered this automation run"
    )
    trigger_source = models.CharField(
        max_length=100,
        blank=True,
        help_text="Source of the trigger (e.g., 'webhook', 'database', 'manual')",
    )

    # Execution status
    status = models.CharField(
        max_length=20,
        choices=RunStatusChoices.choices,
        default=RunStatusChoices.PENDING,
    )

    # Timing
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Results
    result = models.JSONField(
        default=dict,
        blank=True,
        help_text="Overall result and summary of the automation run",
    )
    error_message = models.TextField(
        blank=True, help_text="Error message if the run failed"
    )
    entity_type = models.CharField(
        max_length=255,
        blank=True,
        help_text="Source entity type (e.g., 'issue', 'page', 'project', 'workspace')",
    )
    work_item = models.ForeignKey(
        "db.Issue",
        on_delete=models.SET_NULL,
        related_name="automation_runs",
        null=True,
        blank=True,
    )

    @classmethod
    def active(cls):
        """Get runs that are currently active (pending or running)"""
        return cls.objects.filter(
            status__in=[RunStatusChoices.PENDING, RunStatusChoices.RUNNING]
        )

    @classmethod
    def completed(cls):
        """Get completed runs (success or failed)"""
        return cls.objects.filter(
            status__in=[
                RunStatusChoices.SUCCESS,
                RunStatusChoices.FAILED,
                RunStatusChoices.CANCELLED,
            ]
        )

    @classmethod
    def recent(cls, days=30):
        """Get runs from the last N days"""
        from django.utils import timezone
        from datetime import timedelta

        cutoff_date = timezone.now() - timedelta(days=days)
        return cls.objects.filter(created_at__gte=cutoff_date)

    class Meta:
        db_table = "automation_runs"
        verbose_name = "Automation Run"
        verbose_name_plural = "Automation Runs"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["automation", "status"]),
            models.Index(fields=["automation", "created_at"]),
            models.Index(fields=["version", "status"]),
            models.Index(fields=["status", "started_at"]),
            GinIndex(
                fields=["trigger_event"],
                name="autorun_trig_gin",
                opclasses=["jsonb_path_ops"],
            ),
            GinIndex(
                fields=["result"], name="autorun_res_gin", opclasses=["jsonb_path_ops"]
            ),
        ]

    def __str__(self):
        return f"{self.automation.name} run {self.id} ({self.status})"

    @property
    def duration(self):
        """Calculate run duration if both start and end times are available"""
        if self.started_at and self.completed_at:
            return self.completed_at - self.started_at
        return None


class NodeExecution(ProjectBaseModel):
    """Execution record for individual nodes within an automation run"""

    run = models.ForeignKey(
        AutomationRun, on_delete=models.CASCADE, related_name="node_executions"
    )
    node = models.ForeignKey(
        AutomationNode, on_delete=models.CASCADE, related_name="executions"
    )

    # Execution status
    status = models.CharField(
        max_length=20,
        choices=RunStatusChoices.choices,
        default=RunStatusChoices.PENDING,
    )

    # Timing
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Input/Output
    input_data = models.JSONField(
        default=dict, help_text="Input data provided to the node"
    )
    output_data = models.JSONField(
        default=dict, blank=True, help_text="Output data produced by the node"
    )

    # Error handling
    error_message = models.TextField(
        blank=True, help_text="Error message if node execution failed"
    )
    retry_count = models.PositiveIntegerField(
        default=0,
        validators=[MaxValueValidator(5)],
        help_text="Number of times this node execution was retried",
    )

    # Metadata
    execution_context = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional context about the execution environment",
    )

    class Meta:
        db_table = "node_executions"
        verbose_name = "Node Execution"
        verbose_name_plural = "Node Executions"
        ordering = ("created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["run", "node"],
                condition=models.Q(deleted_at__isnull=True),
                name="node_execution_unique_run_node",
            )
        ]
        indexes = [
            models.Index(fields=["run", "status"]),
            models.Index(fields=["run", "created_at"]),
            models.Index(fields=["node", "status"]),
            models.Index(fields=["status", "started_at"]),
            GinIndex(
                fields=["input_data"],
                name="nodeexec_in_gin",
                opclasses=["jsonb_path_ops"],
            ),
            GinIndex(
                fields=["output_data"],
                name="nodeexec_out_gin",
                opclasses=["jsonb_path_ops"],
            ),
            GinIndex(
                fields=["execution_context"],
                name="nodeexec_ctx_gin",
                opclasses=["jsonb_path_ops"],
            ),
        ]

    def __str__(self):
        return f"{self.node.name} execution in run {self.run.id} ({self.status})"

    @property
    def duration(self):
        """Calculate execution duration if both start and end times are available"""
        if self.started_at and self.completed_at:
            return self.completed_at - self.started_at
        return None


class AutomationActivity(ProjectBaseModel):
    """Activity record for automation"""

    automation = models.ForeignKey(
        Automation, on_delete=models.CASCADE, related_name="activities"
    )
    automation_version = models.ForeignKey(
        AutomationVersion,
        on_delete=models.SET_NULL,
        related_name="activities",
        null=True,
        blank=True,
    )

    automation_node = models.ForeignKey(
        AutomationNode,
        on_delete=models.SET_NULL,
        related_name="activities",
        null=True,
        blank=True,
    )
    automation_edge = models.ForeignKey(
        AutomationEdge,
        on_delete=models.SET_NULL,
        related_name="activities",
        null=True,
        blank=True,
    )

    automation_run = models.ForeignKey(
        AutomationRun,
        on_delete=models.SET_NULL,
        related_name="activities",
        null=True,
        blank=True,
    )
    node_execution = models.ForeignKey(
        NodeExecution,
        on_delete=models.SET_NULL,
        related_name="activities",
        null=True,
        blank=True,
    )

    verb = models.CharField(max_length=255, verbose_name="Action", default="created")
    field = models.CharField(
        max_length=255, verbose_name="Field Name", blank=True, null=True
    )
    old_value = models.TextField(verbose_name="Old Value", blank=True, null=True)
    new_value = models.TextField(verbose_name="New Value", blank=True, null=True)

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="automation_activities",
    )

    old_identifier = models.UUIDField(null=True)
    new_identifier = models.UUIDField(null=True)
    epoch = models.FloatField(null=True)

    class Meta:
        verbose_name = "Automation Activity"
        verbose_name_plural = "Automation Activities"
        db_table = "automation_activities"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.automation.name} - {self.verb} - {self.field}"


class ProcessedAutomationEvent(models.Model):
    """
    Track processed automation events to prevent race conditions and duplicate processing.

    This model ensures exactly-once processing of automation events by tracking
    which events from the outbox have been successfully processed by the consumer.
    """

    # Event identification
    event_id = models.UUIDField(
        unique=True, help_text="Unique identifier from the outbox event"
    )
    event_type = models.CharField(
        max_length=255,
        help_text="Type of event (e.g., 'issue.created', 'issue.updated')",
    )

    # Processing status
    PROCESSING_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    status = models.CharField(
        max_length=20,
        choices=PROCESSING_STATUS_CHOICES,
        default="pending",
        help_text="Current processing status of the event",
    )

    # Celery task tracking
    task_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Celery task ID if event was dispatched to background processing",
    )

    # Processing timestamps
    started_at = models.DateTimeField(
        null=True, blank=True, help_text="When processing started"
    )
    completed_at = models.DateTimeField(
        null=True, blank=True, help_text="When processing completed"
    )

    # Error tracking
    error_message = models.TextField(
        blank=True, help_text="Error message if processing failed"
    )
    retry_count = models.PositiveIntegerField(
        default=0, help_text="Number of times processing was retried"
    )

    # Metadata
    workspace_id = models.UUIDField(null=True)
    project_id = models.UUIDField(null=True)

    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "processed_automation_events"
        verbose_name = "Processed Automation Event"
        verbose_name_plural = "Processed Automation Events"
        ordering = ("-created_at",)

        indexes = [
            # Primary lookup for race condition prevention
            models.Index(fields=["event_id"], name="proc_evt_event_id_idx"),
            # Status-based queries for monitoring
            models.Index(fields=["status", "created_at"], name="proc_evt_status_idx"),
            # Event type analysis
            models.Index(
                fields=["event_type", "status"], name="proc_evt_type_status_idx"
            ),
            # Task tracking
            models.Index(fields=["task_id"], name="proc_evt_task_id_idx"),
            # Performance monitoring queries
            models.Index(
                fields=["status", "started_at"],
                name="proc_evt_perf_idx",
                condition=models.Q(status__in=["processing", "completed", "failed"]),
            ),
        ]

        constraints = [
            # Ensure event_id uniqueness for race condition safety
            models.UniqueConstraint(
                fields=["event_id"], name="processed_event_unique_event_id"
            ),
        ]

    def __str__(self):
        return f"ProcessedAutomationEvent {self.event_id} ({self.event_type}) - {self.status}"

    @property
    def processing_duration(self):
        """Calculate processing duration if both timestamps are available."""
        if self.started_at and self.completed_at:
            return self.completed_at - self.started_at
        return None

    @classmethod
    def mark_processing(cls, event_id: str, task_id: str = None):
        """Mark an event as currently being processed."""
        from django.utils import timezone

        return cls.objects.filter(event_id=event_id).update(
            status="processing", started_at=timezone.now(), task_id=task_id
        )

    @classmethod
    def mark_completed(cls, event_id: str):
        """Mark an event as successfully processed."""
        from django.utils import timezone

        return cls.objects.filter(event_id=event_id).update(
            status="completed", completed_at=timezone.now()
        )

    @classmethod
    def mark_failed(
        cls, event_id: str, error_message: str = None, increment_retry: bool = True
    ):
        """Mark an event as failed with optional error message."""
        from django.utils import timezone
        from django.db.models import F

        update_fields = {"status": "failed", "completed_at": timezone.now()}

        if error_message:
            update_fields["error_message"] = error_message

        if increment_retry:
            update_fields["retry_count"] = F("retry_count") + 1

        return cls.objects.filter(event_id=event_id).update(**update_fields)
