# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date
from importlib import import_module
from types import SimpleNamespace

import pytest
from django.apps import apps as django_apps

from plane.db.models import (
    Cycle,
    Page,
    PeriodicReport,
    Project,
    User,
    Workspace,
    WorkspaceResearchSetting,
)

pytestmark = [pytest.mark.unit, pytest.mark.django_db]

DEFAULT_TIMEZONE = "Asia/Shanghai"


def test_business_timezone_model_defaults_use_asia_shanghai():
    assert User._meta.get_field("user_timezone").default == DEFAULT_TIMEZONE
    assert Workspace._meta.get_field("timezone").default == DEFAULT_TIMEZONE
    assert Project._meta.get_field("timezone").default == DEFAULT_TIMEZONE
    assert Cycle._meta.get_field("timezone").default == DEFAULT_TIMEZONE
    assert PeriodicReport._meta.get_field("timezone").default == DEFAULT_TIMEZONE
    assert WorkspaceResearchSetting._meta.get_field("timezone").default == DEFAULT_TIMEZONE


def test_timezone_migration_overwrites_existing_business_timezones():
    owner = User.objects.create(email="timezone-owner@example.com", username="timezone-owner", user_timezone="UTC")
    workspace = Workspace.objects.create(
        name="Timezone workspace",
        slug="timezone-workspace",
        owner=owner,
        timezone="Asia/Kolkata",
    )
    project = Project.objects.create(
        name="Timezone project",
        identifier="TZ",
        workspace=workspace,
        timezone="America/New_York",
    )
    cycle = Cycle.objects.create(
        name="Timezone cycle",
        workspace=workspace,
        project=project,
        owned_by=owner,
        timezone="Europe/London",
    )
    page = Page.objects.create(workspace=workspace, name="Timezone report", owned_by=owner)
    report = PeriodicReport.objects.create(
        workspace=workspace,
        project=project,
        owner=owner,
        page=page,
        report_type=PeriodicReport.ReportType.MONTHLY,
        period_key="2026-09",
        period_start=date(2026, 9, 1),
        period_end=date(2026, 9, 30),
        timezone="Pacific/Auckland",
    )
    setting = WorkspaceResearchSetting.objects.create(workspace=workspace, timezone=None)

    migration = import_module("plane.db.migrations.0144_default_business_timezone_asia_shanghai")
    schema_editor = SimpleNamespace(connection=SimpleNamespace(alias="default"))
    migration.set_business_timezones_to_asia_shanghai(django_apps, schema_editor)

    for instance in (owner, workspace, project, cycle, report, setting):
        instance.refresh_from_db()
    assert owner.user_timezone == DEFAULT_TIMEZONE
    assert workspace.timezone == DEFAULT_TIMEZONE
    assert project.timezone == DEFAULT_TIMEZONE
    assert cycle.timezone == DEFAULT_TIMEZONE
    assert report.timezone == DEFAULT_TIMEZONE
    assert setting.timezone == DEFAULT_TIMEZONE
