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

from django.db import models
from django.db.models import Q

from .project import ProjectOptionalBaseModel


class Label(ProjectOptionalBaseModel):
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="parent_label",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=255, blank=True)
    sort_order = models.FloatField(default=65535)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        constraints = [
            # Enforce uniqueness of name when project is NULL and deleted_at is NULL
            models.UniqueConstraint(
                fields=["name"],
                condition=Q(project__isnull=True, deleted_at__isnull=True),
                name="unique_name_when_project_null_and_not_deleted",
            ),
            # Enforce uniqueness of project and name when project is not NULL and deleted_at is NULL
            models.UniqueConstraint(
                fields=["project", "name"],
                condition=Q(project__isnull=False, deleted_at__isnull=True),
                name="unique_project_name_when_not_deleted",
            ),
        ]
        verbose_name = "Label"
        verbose_name_plural = "Labels"
        db_table = "labels"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        if self._state.adding:
            # Get the maximum sequence value from the database
            last_id = Label.objects.filter(project=self.project).aggregate(largest=models.Max("sort_order"))["largest"]
            # if last_id is not None
            if last_id is not None:
                self.sort_order = last_id + 10000

        super(Label, self).save(*args, **kwargs)

    def __str__(self):
        return str(self.name)
