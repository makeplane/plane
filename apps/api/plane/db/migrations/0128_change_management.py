import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0127_emailingestlog"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ------------------------------------------------------------------
        # ChangeRequest
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name="ChangeRequest",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("created_by", models.ForeignKey(
                    null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="%(class)s_created_by", to=settings.AUTH_USER_MODEL,
                    verbose_name="Created By",
                )),
                ("updated_by", models.ForeignKey(
                    null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="%(class)s_updated_by", to=settings.AUTH_USER_MODEL,
                    verbose_name="Last Modified By",
                )),
                ("id", models.UUIDField(
                    db_index=True, default=uuid.uuid4, editable=False,
                    primary_key=True, serialize=False, unique=True,
                )),
                ("workspace", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="workspace_%(class)s", to="db.workspace",
                )),
                ("project", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="project_%(class)s", to="db.project",
                )),
                ("sequence_number", models.PositiveBigIntegerField(default=1, verbose_name="Sequence Number")),
                ("number", models.CharField(
                    db_index=True, help_text="Display identifier, e.g. CHG-WINJIT-#00001",
                    max_length=30, unique=True, verbose_name="Change Number",
                )),
                ("type", models.CharField(
                    choices=[("normal", "Normal"), ("standard", "Standard")],
                    default="normal", max_length=20,
                )),
                ("state", models.CharField(
                    choices=[
                        ("new", "New"), ("assess", "Assess"), ("authorize", "Authorize"),
                        ("scheduled", "Scheduled"), ("implement", "Implement"),
                        ("review", "Review"), ("closed", "Closed"), ("cancelled", "Cancelled"),
                    ],
                    db_index=True, default="new", max_length=20,
                )),
                ("priority", models.CharField(
                    choices=[
                        ("1_critical", "Critical"), ("2_high", "High"),
                        ("3_moderate", "Moderate"), ("4_low", "Low"),
                    ],
                    default="3_moderate", max_length=20,
                )),
                ("risk", models.CharField(
                    choices=[
                        ("1_critical", "Critical"), ("2_high", "High"),
                        ("3_moderate", "Moderate"), ("4_low", "Low"),
                    ],
                    default="3_moderate", max_length=20,
                )),
                ("impact", models.CharField(
                    choices=[("1_high", "High"), ("2_medium", "Medium"), ("3_low", "Low")],
                    default="2_medium", max_length=20,
                )),
                ("category", models.CharField(
                    choices=[
                        ("hardware", "Hardware"), ("software", "Software"),
                        ("network", "Network"), ("security", "Security"),
                        ("database", "Database"), ("application", "Application"),
                        ("other", "Other"),
                    ],
                    default="other", max_length=20,
                )),
                ("short_description", models.CharField(max_length=500)),
                ("description_html", models.TextField(blank=True, default="<p></p>")),
                ("service", models.CharField(blank=True, max_length=255, null=True, verbose_name="Affected Service")),
                ("configuration_item", models.CharField(
                    blank=True, max_length=255, null=True, verbose_name="Configuration Item",
                )),
                ("conflict_status", models.CharField(
                    choices=[
                        ("no_conflicts", "No Conflicts"), ("conflicts_detected", "Conflicts Detected"),
                        ("not_run", "Not Run"), ("running", "Running"),
                    ],
                    default="not_run", max_length=20,
                )),
                ("conflict_last_run", models.DateTimeField(blank=True, null=True)),
                ("requested_by", models.ForeignKey(
                    null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="requested_changes", to=settings.AUTH_USER_MODEL,
                )),
                ("assigned_to", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="assigned_changes", to=settings.AUTH_USER_MODEL,
                )),
                ("assignment_group", models.CharField(blank=True, max_length=255, null=True)),
                ("justification", models.TextField(blank=True, null=True)),
                ("implementation_plan", models.TextField(blank=True, null=True)),
                ("risk_and_impact_analysis", models.TextField(blank=True, null=True)),
                ("backout_plan", models.TextField(blank=True, null=True)),
                ("test_plan", models.TextField(blank=True, null=True)),
                ("planned_start_date", models.DateTimeField(blank=True, null=True)),
                ("planned_end_date", models.DateTimeField(blank=True, null=True)),
                ("actual_start_date", models.DateTimeField(blank=True, null=True)),
                ("actual_end_date", models.DateTimeField(blank=True, null=True)),
                ("cab_required", models.BooleanField(default=False)),
                ("cab_date", models.DateTimeField(blank=True, null=True)),
                ("cab_delegate", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="cab_delegated_changes", to=settings.AUTH_USER_MODEL,
                )),
                ("cab_recommendation", models.TextField(blank=True, null=True)),
                ("close_code", models.CharField(
                    blank=True, choices=[
                        ("successful", "Successful"), ("successful_with_issues", "Successful with Issues"),
                        ("unsuccessful", "Unsuccessful"), ("skipped", "Skipped"),
                    ],
                    max_length=30, null=True,
                )),
                ("close_notes", models.TextField(blank=True, null=True)),
                ("on_hold", models.BooleanField(default=False)),
                ("on_hold_reason", models.TextField(blank=True, null=True)),
            ],
            options={
                "verbose_name": "Change Request",
                "verbose_name_plural": "Change Requests",
                "db_table": "change_requests",
                "ordering": ("-created_at",),
            },
        ),
        # ------------------------------------------------------------------
        # ChangeApproval
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name="ChangeApproval",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("created_by", models.ForeignKey(
                    null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="%(class)s_created_by", to=settings.AUTH_USER_MODEL,
                    verbose_name="Created By",
                )),
                ("updated_by", models.ForeignKey(
                    null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="%(class)s_updated_by", to=settings.AUTH_USER_MODEL,
                    verbose_name="Last Modified By",
                )),
                ("id", models.UUIDField(
                    db_index=True, default=uuid.uuid4, editable=False,
                    primary_key=True, serialize=False, unique=True,
                )),
                ("change_request", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="approvals", to="db.changerequest",
                )),
                ("approver", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="change_approvals", to=settings.AUTH_USER_MODEL,
                )),
                ("approval_level", models.CharField(
                    choices=[("peer_review", "Peer Review"), ("cab", "CAB")],
                    max_length=20,
                )),
                ("status", models.CharField(
                    choices=[("pending", "Pending"), ("approved", "Approved"), ("rejected", "Rejected")],
                    default="pending", max_length=20,
                )),
                ("comments", models.TextField(blank=True, null=True)),
                ("decided_at", models.DateTimeField(blank=True, null=True)),
            ],
            options={
                "verbose_name": "Change Approval",
                "verbose_name_plural": "Change Approvals",
                "db_table": "change_approvals",
                "ordering": ("-created_at",),
            },
        ),
        # ------------------------------------------------------------------
        # ChangeTask
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name="ChangeTask",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("created_by", models.ForeignKey(
                    null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="%(class)s_created_by", to=settings.AUTH_USER_MODEL,
                    verbose_name="Created By",
                )),
                ("updated_by", models.ForeignKey(
                    null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="%(class)s_updated_by", to=settings.AUTH_USER_MODEL,
                    verbose_name="Last Modified By",
                )),
                ("id", models.UUIDField(
                    db_index=True, default=uuid.uuid4, editable=False,
                    primary_key=True, serialize=False, unique=True,
                )),
                ("change_request", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="tasks", to="db.changerequest",
                )),
                ("task_type", models.CharField(
                    choices=[("implement", "Implement"), ("post_implementation_review", "Post-Implementation Review")],
                    max_length=40,
                )),
                ("state", models.CharField(
                    choices=[
                        ("open", "Open"), ("in_progress", "In Progress"),
                        ("closed", "Closed"), ("cancelled", "Cancelled"),
                    ],
                    default="open", max_length=20,
                )),
                ("assigned_to", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="change_tasks", to=settings.AUTH_USER_MODEL,
                )),
                ("description", models.TextField(blank=True, null=True)),
                ("closed_at", models.DateTimeField(blank=True, null=True)),
            ],
            options={
                "verbose_name": "Change Task",
                "verbose_name_plural": "Change Tasks",
                "db_table": "change_tasks",
                "ordering": ("created_at",),
            },
        ),
        # ------------------------------------------------------------------
        # ChangeActivity
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name="ChangeActivity",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("created_by", models.ForeignKey(
                    null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="%(class)s_created_by", to=settings.AUTH_USER_MODEL,
                    verbose_name="Created By",
                )),
                ("updated_by", models.ForeignKey(
                    null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="%(class)s_updated_by", to=settings.AUTH_USER_MODEL,
                    verbose_name="Last Modified By",
                )),
                ("id", models.UUIDField(
                    db_index=True, default=uuid.uuid4, editable=False,
                    primary_key=True, serialize=False, unique=True,
                )),
                ("change_request", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="activities", to="db.changerequest",
                )),
                ("actor", models.ForeignKey(
                    null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="change_activities", to=settings.AUTH_USER_MODEL,
                )),
                ("verb", models.CharField(
                    choices=[
                        ("state_changed", "State Changed"), ("approved", "Approved"),
                        ("rejected", "Rejected"), ("field_updated", "Field Updated"),
                        ("commented", "Commented"), ("task_completed", "Task Completed"),
                    ],
                    max_length=30,
                )),
                ("field", models.CharField(blank=True, max_length=100, null=True)),
                ("old_value", models.TextField(blank=True, null=True)),
                ("new_value", models.TextField(blank=True, null=True)),
                ("comment", models.TextField(blank=True, null=True)),
            ],
            options={
                "verbose_name": "Change Activity",
                "verbose_name_plural": "Change Activities",
                "db_table": "change_activities",
                "ordering": ("-created_at",),
            },
        ),
    ]
