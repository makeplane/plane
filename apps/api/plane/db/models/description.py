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
from plane.utils.html_processor import strip_tags
from .project import ProjectOptionalBaseModel


class Description(ProjectOptionalBaseModel):
    description_json = models.JSONField(default=dict, blank=True)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_binary = models.BinaryField(null=True)
    description_stripped = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Description"
        verbose_name_plural = "Descriptions"
        db_table = "descriptions"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        # Strip the html tags using html parser
        self.description_stripped = (
            None
            if (self.description_html == "" or self.description_html is None)
            else strip_tags(self.description_html)
        )
        super(Description, self).save(*args, **kwargs)


class DescriptionVersion(ProjectOptionalBaseModel):
    """
    DescriptionVersion is a model used to store historical versions of a Description.
    """

    description = models.ForeignKey("db.Description", on_delete=models.CASCADE, related_name="versions")
    description_json = models.JSONField(default=dict, blank=True)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_binary = models.BinaryField(null=True)
    description_stripped = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Description Version"
        verbose_name_plural = "Description Versions"
        db_table = "description_versions"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        # Strip the html tags using html parser
        self.description_stripped = (
            None
            if (self.description_html == "" or self.description_html is None)
            else strip_tags(self.description_html)
        )
        super(DescriptionVersion, self).save(*args, **kwargs)
