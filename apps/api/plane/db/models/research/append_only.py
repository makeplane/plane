# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Base classes for append-only research tables.

Stage transitions, material versions, review revisions, experiment versions and
integration call logs have no update or delete semantics: once written they are
the evidence of what happened. The restriction is enforced at three layers -
the queryset rejects bulk writes, the model rejects instance writes, and every
foreign key to a business object uses ``PROTECT`` so no cascade can remove the
history (P1-STG-10, P1-REV-07, P1-EXP-09, T-02).
"""

import uuid

from django.db import models


class AppendOnlyQuerySet(models.QuerySet):
    """Reject bulk updates and deletes on append-only tables."""

    def update(self, **kwargs):
        raise TypeError("Append-only records cannot be updated.")

    def delete(self, *args, **kwargs):
        raise TypeError("Append-only records cannot be deleted.")

    def _raw_delete(self, using=None, keep_parents=False):
        raise TypeError("Append-only records cannot be deleted.")


class AppendOnlyManager(models.Manager.from_queryset(AppendOnlyQuerySet)):
    pass


class AppendOnlyModel(models.Model):
    """Mixin for tables that only ever grow.

    The model deliberately does not extend ``BaseModel``: there is no
    ``deleted_at`` (an append-only row is never soft deleted either) and no
    ``updated_by``, because no row is ever updated.
    """

    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At", db_index=True)

    objects = AppendOnlyManager()

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise TypeError("Append-only records cannot be updated.")
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise TypeError("Append-only records cannot be deleted.")

    def __str__(self):
        return str(self.id)
