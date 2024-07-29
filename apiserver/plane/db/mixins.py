# Django imports
from django.db import models
from django.utils import timezone

# Module imports
from plane.bgtasks.deletion_task import soft_delete_related_objects


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


class SoftDeletionManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class SoftDeleteModel(models.Model):
    """To soft delete records"""

    deleted_at = models.DateTimeField(
        verbose_name="Deleted At",
        null=True,
        blank=True,
    )

    objects = SoftDeletionManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def delete(self, using=None, soft=True, *args, **kwargs):
        if soft:
            # Soft delete the current instance
            self.deleted_at = timezone.now()
            self.save(using=using)

            soft_delete_related_objects.delay(
                self._meta.app_label,
                self._meta.model_name,
                self.pk,
                using=using,
            )

        else:
            # Perform hard delete if soft deletion is not enabled
            return super().delete(using=using, *args, **kwargs)


class AuditModel(TimeAuditModel, UserAuditModel, SoftDeleteModel):
    """To path when the record was created and last modified"""

    class Meta:
        abstract = True
