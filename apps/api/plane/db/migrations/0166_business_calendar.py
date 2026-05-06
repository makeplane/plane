# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Generated migration — rename to next sequential number at PR merge time if conflict detected.

import django.contrib.postgres.fields
import django.db.models.deletion
import django.utils.timezone
import uuid

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0165_register_worklog_reminder_periodic_task"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="WorkSchedule",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(null=True, blank=True)),
                (
                    "id",
                    models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, unique=True, db_index=True),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="work_schedules",
                        to="db.workspace",
                    ),
                ),
                ("name", models.CharField(max_length=100)),
                (
                    "week_pattern",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.BooleanField(),
                        default=list,
                        help_text="Mon–Sun work flags. True = working day.",
                        size=7,
                    ),
                ),
                ("timezone", models.CharField(default="Asia/Ho_Chi_Minh", max_length=64)),
                ("is_default", models.BooleanField(default=False)),
                ("country_code", models.CharField(default="VN", max_length=2)),
            ],
            options={
                "verbose_name": "Work Schedule",
                "verbose_name_plural": "Work Schedules",
                "db_table": "work_schedules",
            },
        ),
        migrations.CreateModel(
            name="Holiday",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(null=True, blank=True)),
                (
                    "id",
                    models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, unique=True, db_index=True),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "schedule",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="holidays",
                        to="db.workschedule",
                    ),
                ),
                ("date", models.DateField()),
                ("name", models.CharField(max_length=200)),
            ],
            options={
                "verbose_name": "Holiday",
                "verbose_name_plural": "Holidays",
                "db_table": "work_schedule_holidays",
            },
        ),
        migrations.CreateModel(
            name="DayOverride",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(null=True, blank=True)),
                (
                    "id",
                    models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, unique=True, db_index=True),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "schedule",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="overrides",
                        to="db.workschedule",
                    ),
                ),
                ("date", models.DateField()),
                (
                    "type",
                    models.CharField(
                        choices=[("WORKDAY", "Work day"), ("HOLIDAY", "Holiday")],
                        max_length=10,
                    ),
                ),
                ("reason", models.CharField(blank=True, max_length=200)),
                (
                    "swap_with_date",
                    models.DateField(
                        blank=True,
                        help_text="Paired date in the swap arrangement — audit/display only.",
                        null=True,
                    ),
                ),
            ],
            options={
                "verbose_name": "Day Override",
                "verbose_name_plural": "Day Overrides",
                "db_table": "work_schedule_day_overrides",
            },
        ),
        # Unique constraints
        migrations.AddConstraint(
            model_name="workschedule",
            constraint=models.UniqueConstraint(
                condition=models.Q(is_default=True),
                fields=["workspace", "is_default"],
                name="unique_default_schedule_per_workspace",
            ),
        ),
        migrations.AlterUniqueTogether(
            name="holiday",
            unique_together={("schedule", "date")},
        ),
        migrations.AlterUniqueTogether(
            name="dayoverride",
            unique_together={("schedule", "date")},
        ),
        # Indexes
        migrations.AddIndex(
            model_name="holiday",
            index=models.Index(fields=["schedule", "date"], name="holiday_schedule_date_idx"),
        ),
        migrations.AddIndex(
            model_name="dayoverride",
            index=models.Index(fields=["schedule", "date"], name="override_schedule_date_idx"),
        ),
    ]
