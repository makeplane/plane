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

# Type imports
from typing import Any

# Django imports
from django.db import models, transaction
from django.utils import timezone

# Module imports
from plane.bgtasks.deletion_task import soft_delete_related_objects

# Relative imports
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
        # Check if this is a soft deletion (deleted_at is being set)
        is_soft_delete = "deleted_at" in kwargs and kwargs["deleted_at"] is not None

        if is_soft_delete:
            # Capture PKs before update to handle soft deletion case
            # where self queryset will become empty after deleted_at is set
            deleted_pks = list(self.values_list("pk", flat=True))

        rows = super().update(**kwargs)
        if rows:
            if is_soft_delete:
                # Use all_objects to get unfiltered queryset including soft-deleted records
                objs = self.model.all_objects.filter(pk__in=deleted_pks)
            else:
                # For regular updates, use the current queryset
                objs = self
            post_bulk_update.send(
                sender=self.model,
                model=self.model,
                objs=objs,
                updated_fields=set(kwargs.keys()),
            )
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
            objs = kwargs.get("objs")
        for obj in objs:
            if hasattr(obj, "pre_bulk_create"):
                obj.pre_bulk_create()

        objs = super().bulk_create(*args, **kwargs)

        post_bulk_create.send(sender=self.model, model=self.model, objs=objs)

        return objs


class SoftDeletionQuerySet(BulkOperationHooks, models.QuerySet):
    def delete(self, soft=True):
        if soft:
            return self.update(deleted_at=timezone.now())
        else:
            return super().delete()


class SoftDeletionManager(models.Manager):
    def get_queryset(self):
        return SoftDeletionQuerySet(self.model, using=self._db).filter(deleted_at__isnull=True)


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

            soft_delete_related_objects.delay(self._meta.app_label, self._meta.model_name, self.pk, using=using)

        else:
            # Perform hard delete if soft deletion is not enabled
            return super().delete(using=using, *args, **kwargs)


class AuditModel(TimeAuditModel, UserAuditModel, SoftDeleteModel):
    """To path when the record was created and last modified"""

    class Meta:
        abstract = True


def get_default_pql_filter_state() -> dict:
    return {
        # The default state for pql_filters can be an empty string or a default PQL query saved by the frontend.
        # with custom editor tags for user pill etc.
        "json": {},
        # This field is used to store the stripped version of the pql filter without any editor tags,
        # which can be used for backend processing and validation.
        "stripped": "",
    }

def get_default_filters():
    return {
        "priority": None,
        "state": None,
        "state_group": None,
        "assignees": None,
        "created_by": None,
        "labels": None,
        "start_date": None,
        "target_date": None,
        "subscriber": None,
    }


class FilterMethod(models.TextChoices):
    """
    Filter methods for cycle user properties.
    """
    RICH_FILTERS = "rich_filters", "Rich Filters"
    PQL_FILTERS = "pql_filters", "PQL Filters"
    AI_FILTERS = "ai_filters", "AI Filters"


def get_default_display_filters():
    return {
        "group_by": None,
        "order_by": "-created_at",
        "type": None,
        "sub_issue": True,
        "show_empty_groups": True,
        "layout": "list",
        "calendar_date_range": "",
    }

class FiltersMixin(models.Model):
    """
    Mixin that validates pql_filters contains valid PQL syntax before saving.

    Apply to any model that has a ``pql_filters`` TextField. Validation runs in
    both ``clean()`` (for form / admin integration) and ``save()`` (to guard
    direct ``.save()`` calls that bypass ``full_clean()``).

    Usage::

        class MyModel(FiltersMixin, SomeBaseModel):
            pql_filters = models.JSONField(default=get_default_pql_filter_state)
    """

    pql_filters = models.JSONField(default=get_default_pql_filter_state)
    rich_filters = models.JSONField(default=dict)
    filters = models.JSONField(default=get_default_filters)
    last_used_filter = models.CharField(max_length=255, default=FilterMethod.RICH_FILTERS)
    display_filters = models.JSONField(default=get_default_display_filters)

    class Meta:
        abstract = True


class ChangeTrackerMixin:
    """
    A mixin to track changes in model fields between initialization and save.

    This mixin captures the initial state of model fields when the instance is
    created and provides utilities to detect which fields have changed.

    Usage:
        To track specific fields, define a TRACKED_FIELDS list on your model:

        class MyModel(ChangeTrackerMixin, models.Model):
            TRACKED_FIELDS = ['field1', 'field2', 'field3']
            field1 = models.CharField(max_length=100)
            field2 = models.IntegerField()
            field3 = models.BooleanField()

        If TRACKED_FIELDS is not defined, all non-deferred fields will be tracked.

    Properties:
        changed_fields: A list of field names that have changed since initialization.
        old_values: A dictionary mapping field names to their original values.

    Methods:
        has_changed(field_name): Check if a specific field has changed.

    Notes:
        - Deferred fields (from .defer() or .only()) are automatically excluded
          from tracking to avoid triggering database queries.
        - Field values are captured in __init__, so changes are tracked relative
          to the initial state when the instance was loaded from the database.
    """

    _original_values: dict[str, Any]

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self._original_values = {}
        self._track_fields()

    def _track_fields(self) -> None:
        """
        Capture the initial values of fields to track.

        This method stores the current values of fields that should be tracked.
        If TRACKED_FIELDS is defined on the model, only those fields are tracked.
        Otherwise, all non-deferred fields are tracked. Deferred fields are
        automatically excluded to prevent unnecessary database queries.
        """
        deferred_fields = self.get_deferred_fields()
        tracked_fields = getattr(self, "TRACKED_FIELDS", None)
        if tracked_fields:
            for field in tracked_fields:
                if field not in deferred_fields:
                    self._original_values[field] = getattr(self, field)
        else:
            for field in self._meta.fields:
                if field.attname not in deferred_fields:
                    self._original_values[field.attname] = getattr(self, field.attname)

    def has_changed(self, field_name: str) -> bool:
        """
        Check if a specific field has changed since initialization.

        Args:
            field_name (str): The name of the field to check.

        Returns:
            bool: True if the field has changed, False otherwise. Returns False
                  if the field was not being tracked or is deferred.
        """
        if field_name not in self._original_values:
            return False
        return self._original_values[field_name] != getattr(self, field_name)

    @property
    def changed_fields(self) -> list[str]:
        """
        Get a list of all fields that have changed since initialization.

        Returns:
            list[str]: A list of field names that have different values than
                       when the instance was initialized. Returns an empty list
                       if no fields have changed.
        """
        changed = []
        for field, old_val in self._original_values.items():
            new_val = getattr(self, field)
            if old_val != new_val:
                changed.append(field)
        return changed

    @property
    def old_values(self) -> dict[str, Any]:
        """
        Get a dictionary of the original field values from initialization.

        Returns:
            dict: A dictionary mapping field names to their original values
                  as they were when the instance was initialized. Only includes
                  fields that are being tracked (either via TRACKED_FIELDS or
                  all non-deferred fields).
        """
        return self._original_values

    def save(self, *args: Any, **kwargs: Any) -> None:
        """
        Override save to automatically capture changed fields and reset tracking.

        Before saving, the current changed_fields are captured and stored in
        _changes_on_save. After saving, the tracked fields are reset so
        that subsequent saves correctly detect changes relative to the last
        saved state, not the original load-time state.

        Models that need to access the changed fields after save (e.g., for
        syncing related models) can use self._changes_on_save.
        """
        self._changes_on_save = self.changed_fields
        super().save(*args, **kwargs)
        self._reset_tracked_fields()

    def _reset_tracked_fields(self) -> None:
        """
        Reset the tracked field values to the current state.

        This is called automatically after save() to ensure that subsequent
        saves correctly detect changes relative to the last saved state,
        rather than the original load-time state.
        """
        self._original_values = {}
        self._track_fields()
