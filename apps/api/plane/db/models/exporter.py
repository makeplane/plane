# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import uuid

# Python imports
from uuid import uuid4

from django.conf import settings
from django.contrib.postgres.fields import ArrayField

# Django imports
from django.db import models

# Module imports
from .base import BaseModel
from plane.db.mixins import FiltersMixin


def generate_token():
    return uuid4().hex


class ExporterHistory(BaseModel, FiltersMixin):
    name = models.CharField(max_length=255, verbose_name="Exporter Name", null=True, blank=True)
    type = models.CharField(
        max_length=50,
        default="issue_exports",
        choices=(
            ("issue_exports", "Issue Exports"),
            ("issue_worklogs", "Issue Worklogs"),
        ),
    )
    workspace = models.ForeignKey("db.WorkSpace", on_delete=models.CASCADE, related_name="workspace_exporters")
    project = ArrayField(models.UUIDField(default=uuid.uuid4), blank=True, null=True)
    provider = models.CharField(max_length=50, choices=(("json", "json"), ("csv", "csv"), ("xlsx", "xlsx")))
    status = models.CharField(
        max_length=50,
        choices=(
            ("queued", "Queued"),
            ("processing", "Processing"),
            ("completed", "Completed"),
            ("failed", "Failed"),
        ),
        default="queued",
    )
    reason = models.TextField(blank=True)
    key = models.TextField(blank=True)
    url = models.URLField(max_length=800, blank=True, null=True)
    token = models.CharField(max_length=255, default=generate_token, unique=True)
    initiated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workspace_exporters",
    )
    filters = models.JSONField(blank=True, null=True)
    rich_filters = models.JSONField(default=dict, blank=True, null=True)
    display_filters = None

    class Meta:
        verbose_name = "Exporter"
        verbose_name_plural = "Exporters"
        db_table = "exporters"
        ordering = ("-created_at",)

    def __str__(self):
        """Return name of the service"""
        return f"{self.provider} <{self.workspace.name}>"
