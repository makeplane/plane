# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

# Module imports
from .base import BaseModel
from .project import ProjectBaseModel


class ProductType(BaseModel):
    """Workspace-wide list of what a product can be, with the requirements for each."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="product_types")
    name = models.CharField(max_length=255)
    logo_props = models.JSONField(default=dict)
    color = models.CharField(max_length=255, blank=True)
    sort_order = models.FloatField(default=65535)
    is_active = models.BooleanField(default=True)
    requirements_html = models.TextField(blank=True, default="<p></p>")

    def __str__(self):
        return f"{self.name} <{self.workspace_id}>"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=models.Q(deleted_at__isnull=True),
                name="product_type_unique_name_workspace_when_deleted_at_null",
            )
        ]
        verbose_name = "Product Type"
        verbose_name_plural = "Product Types"
        db_table = "product_types"
        ordering = ("sort_order", "created_at")


class ProductDetail(ProjectBaseModel):
    """
    The product part of a work item.

    It stays when the work item becomes a task again, so only the kind of the work item's type
    tells whether the item is a product now.
    """

    issue = models.OneToOneField("db.Issue", on_delete=models.CASCADE, related_name="product_detail")
    product_type = models.ForeignKey(ProductType, on_delete=models.RESTRICT, related_name="product_details")
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="owned_products", null=True
    )
    manual_progress = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    status_comment = models.CharField(max_length=500, blank=True)
    status_comment_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="product_status_comments", null=True
    )
    status_comment_at = models.DateTimeField(null=True, blank=True)
    # When the product last got a completed or cancelled state; Issue.completed_at ignores cancelled.
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Product Detail"
        verbose_name_plural = "Product Details"
        db_table = "product_details"
