# Liviere/plane fork: the decision register (plane/liviere/decisions). Only new tables of our own
# (liviere_decision*) and their indexes.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0125_reset_project_deploy_board_identity"),
        ("liviere", "0009_activity_skip_periods"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="DecisionArea",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("key", models.CharField(max_length=40)),
                ("name", models.CharField(max_length=100)),
                ("sort_order", models.IntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "parent",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="mechanisms",
                        to="liviere.decisionarea",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="+",
                        to="db.project",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="+",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "liviere_decision_areas",
            },
        ),
        migrations.CreateModel(
            name="Decision",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("number", models.PositiveIntegerField()),
                ("title", models.CharField(max_length=500)),
                ("rationale", models.TextField(null=True)),
                ("rejected", models.TextField(null=True)),
                ("note", models.TextField(null=True)),
                ("kind", models.CharField(max_length=20)),
                ("status", models.CharField(max_length=20)),
                ("decided_by", models.CharField(max_length=20)),
                ("confirmed", models.BooleanField(default=False)),
                ("decided_on", models.DateField(null=True)),
                ("review_on", models.DateField(null=True)),
                ("review_condition", models.CharField(max_length=500, null=True)),
                ("sources", models.JSONField(default=list)),
                ("pending_rollout", models.BooleanField(default=False)),
                ("rollout_reason", models.CharField(max_length=20, null=True)),
                ("rollout_at", models.DateTimeField(null=True)),
                ("rollout_channel", models.CharField(max_length=10, null=True)),
                ("needs_review", models.BooleanField(default=False)),
                ("estimated", models.JSONField(default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="+",
                        to="db.project",
                    ),
                ),
                (
                    "rollout_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "supersedes",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="successors",
                        to="liviere.decision",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="+",
                        to="db.workspace",
                    ),
                ),
                (
                    "area",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="+",
                        to="liviere.decisionarea",
                    ),
                ),
                (
                    "area2",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="+",
                        to="liviere.decisionarea",
                    ),
                ),
                (
                    "mechanism",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="+",
                        to="liviere.decisionarea",
                    ),
                ),
            ],
            options={
                "db_table": "liviere_decisions",
            },
        ),
        migrations.CreateModel(
            name="DecisionEvent",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("channel", models.CharField(max_length=10)),
                ("kind", models.CharField(max_length=30)),
                ("changes", models.JSONField(default=dict)),
                ("note", models.TextField(null=True)),
                ("occurred_at", models.DateTimeField()),
                (
                    "actor",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "decision",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="events",
                        to="liviere.decision",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="+",
                        to="db.project",
                    ),
                ),
            ],
            options={
                "db_table": "liviere_decision_events",
            },
        ),
        migrations.CreateModel(
            name="DecisionIssue",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                (
                    "decision",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="issue_links",
                        to="liviere.decision",
                    ),
                ),
                (
                    "issue",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="+",
                        to="db.issue",
                    ),
                ),
            ],
            options={
                "db_table": "liviere_decision_issues",
            },
        ),
        migrations.CreateModel(
            name="DecisionRelation",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                (
                    "high",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="+",
                        to="liviere.decision",
                    ),
                ),
                (
                    "low",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="+",
                        to="liviere.decision",
                    ),
                ),
            ],
            options={
                "db_table": "liviere_decision_relations",
            },
        ),
        migrations.CreateModel(
            name="DecisionSettings",
            fields=[
                (
                    "project",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        primary_key=True,
                        related_name="+",
                        serialize=False,
                        to="db.project",
                    ),
                ),
                ("enabled", models.BooleanField(default=False)),
                ("last_number", models.PositiveIntegerField(default=0)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "liviere_decision_settings",
            },
        ),
        migrations.AddConstraint(
            model_name="decisionarea",
            constraint=models.UniqueConstraint(
                condition=models.Q(("parent__isnull", True)),
                fields=("project", "key"),
                name="liviere_decision_area_unique_key",
            ),
        ),
        migrations.AddConstraint(
            model_name="decisionarea",
            constraint=models.UniqueConstraint(
                condition=models.Q(("parent__isnull", False)),
                fields=("parent", "key"),
                name="liviere_decision_mechanism_unique_key",
            ),
        ),
        migrations.AddIndex(
            model_name="decision",
            index=models.Index(fields=["project", "status"], name="liviere_decision_status"),
        ),
        migrations.AddIndex(
            model_name="decision",
            index=models.Index(fields=["project", "area"], name="liviere_decision_area"),
        ),
        migrations.AddIndex(
            model_name="decision",
            index=models.Index(fields=["project", "area2"], name="liviere_decision_area2"),
        ),
        migrations.AddIndex(
            model_name="decision",
            index=models.Index(
                condition=models.Q(("pending_rollout", True)),
                fields=["project"],
                name="liviere_decision_rollout",
            ),
        ),
        migrations.AddConstraint(
            model_name="decision",
            constraint=models.UniqueConstraint(fields=("project", "number"), name="liviere_decision_unique_number"),
        ),
        migrations.AddIndex(
            model_name="decisionevent",
            index=models.Index(fields=["decision", "occurred_at"], name="liviere_decision_event_time"),
        ),
        migrations.AddConstraint(
            model_name="decisionissue",
            constraint=models.UniqueConstraint(fields=("decision", "issue"), name="liviere_decision_issue_unique"),
        ),
        migrations.AddIndex(
            model_name="decisionrelation",
            index=models.Index(fields=["high"], name="liviere_decision_relation_high"),
        ),
        migrations.AddConstraint(
            model_name="decisionrelation",
            constraint=models.UniqueConstraint(fields=("low", "high"), name="liviere_decision_relation_unique"),
        ),
    ]
