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

# Django imports
from django.db import models

# Module imports
from plane.db.models import ProjectOptionalBaseModel
from plane.ee.models import IssueProperty, IssuePropertyOption


class DraftIssuePropertyValue(ProjectOptionalBaseModel):
    draft_issue = models.ForeignKey("db.DraftIssue", on_delete=models.CASCADE, related_name="draft_issue_properties")
    property = models.ForeignKey(IssueProperty, on_delete=models.CASCADE, related_name="draft_issue_values")
    value_text = models.TextField(blank=True)
    value_boolean = models.BooleanField(default=False)
    value_decimal = models.FloatField(default=0)
    value_datetime = models.DateTimeField(blank=True, null=True)
    value_uuid = models.UUIDField(blank=True, null=True)
    value_option = models.ForeignKey(
        IssuePropertyOption,
        on_delete=models.CASCADE,
        related_name="draft_issue_property_values",
        blank=True,
        null=True,
    )

    class Meta:
        ordering = ["-created_at"]
        db_table = "draft_issue_property_values"

    def __str__(self):
        return f"{self.property.display_name}"
