# Python imports
import uuid

# Django imports
from django.db import models


class TimeAuditModel(models.Model):

    """To path when the record was created and last modified"""

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Created At",
    )
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name="Last Modified At"
    )

    class Meta:
        abstract = True


class UserAuditModel(models.Model):

    """To path when the record was created and last modified"""

    created_by = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        related_name="%(class)s_created_by",
        verbose_name="Created By",
        null=True,
    )
    updated_by = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        related_name="%(class)s_updated_by",
        verbose_name="Last Modified By",
        null=True,
    )

    class Meta:
        abstract = True


class AuditModel(TimeAuditModel, UserAuditModel):

    """To path when the record was created and last modified"""

    class Meta:
        abstract = True
