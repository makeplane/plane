# Django imports
from django.db import models, transaction
from django.utils import timezone

# Module imports
from plane.bgtasks.deletion_task import soft_delete_related_objects

#Relative imports
from .signals import post_bulk_create, post_bulk_update


class TimeAuditModel(models.Model):
    """To path when the record was created and last modified"""

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Last Modified At")

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


class BulkOperationHooks:
    def update(self, **kwargs):
        """
        Custom update method to trigger a signal with
        all the updated objs on bulk update.
        """
        rows = super().update(**kwargs)
        if rows:
            post_bulk_update.send(sender=self.__class__, model=self.model, objs=self)
        return rows

    @transaction.atomic
    def bulk_create(self, *args, **kwargs):
        """
        Custom bulk_create method to handle any pre operations
        on the model instance and also trigger a signal with all the objs.
        """
        if len(args):
            objs = args[0]
        else:
            objs = kwargs.get('objs')
        for obj in objs:
            if hasattr(obj, "pre_bulk_create"):
                obj.pre_bulk_create()

        objs = super().bulk_create(*args, **kwargs)

        post_bulk_create.send(sender=self.__class__, model=self.model, objs=objs)

        return objs


class SoftDeletionQuerySet(BulkOperationHooks, models.QuerySet):
    def delete(self, soft=True):
        if soft:
            return self.update(deleted_at=timezone.now())
        else:
            return super().delete()


class SoftDeletionManager(models.Manager):
    def get_queryset(self):
        return SoftDeletionQuerySet(self.model, using=self._db).filter(
            deleted_at__isnull=True
        )


class SoftDeleteModel(models.Model):
    """To soft delete records"""

    deleted_at = models.DateTimeField(verbose_name="Deleted At", null=True, blank=True)

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
                self._meta.app_label, self._meta.model_name, self.pk, using=using
            )

        else:
            # Perform hard delete if soft deletion is not enabled
            return super().delete(using=using, *args, **kwargs)


class AuditModel(TimeAuditModel, UserAuditModel, SoftDeleteModel):
    """To path when the record was created and last modified"""

    class Meta:
        abstract = True
