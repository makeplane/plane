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
from django.conf import settings

# Module imports
from .project import ProjectOptionalBaseModel


class EntityNameEnum(models.TextChoices):
    VIEW = "VIEW", "View"
    PAGE = "PAGE", "Page"
    ISSUE = "ISSUE", "Issue"
    CYCLE = "CYCLE", "Cycle"
    MODULE = "MODULE", "Module"
    PROJECT = "PROJECT", "Project"


class UserRecentVisit(ProjectOptionalBaseModel):
    entity_identifier = models.UUIDField(null=True)
    entity_name = models.CharField(max_length=30)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_recent_visit",
    )
    visited_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Recent Visit"
        verbose_name_plural = "User Recent Visits"
        db_table = "user_recent_visits"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.entity_name} {self.user.email}"
