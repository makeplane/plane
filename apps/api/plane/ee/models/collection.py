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
from django.conf import settings
from django.db import models
from plane.db.models.workspace import WorkspaceBaseModel


class CollectionAccess(models.IntegerChoices):
    PUBLIC = 0, "Public"
    PRIVATE = 1, "Private"


class CollectionMemberAccess(models.IntegerChoices):
    VIEW = 0, "View"
    COMMENT = 1, "Comment"
    EDIT = 2, "Edit"


class Collection(WorkspaceBaseModel):
    name = models.TextField(blank=True)
    owned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="collections")
    access = models.PositiveSmallIntegerField(default=CollectionAccess.PUBLIC, choices=CollectionAccess.choices)
    is_default = models.BooleanField(default=False)
    is_global = models.BooleanField(default=True)
    logo_props = models.JSONField(default=dict)
    sort_order = models.FloatField(default=65535)

    class Meta:
        verbose_name = "Collection"
        verbose_name_plural = "Collections"
        db_table = "collections"
        ordering = ("sort_order",)

    def __str__(self):
        return f"{self.name}"

    def save(self, *args, **kwargs):
        if self._state.adding:
            largest_sort_order = Collection.objects.filter(workspace=self.workspace).aggregate(
                largest=models.Max("sort_order")
            )["largest"]
            if largest_sort_order is not None:
                self.sort_order = largest_sort_order + 10000
        super(Collection, self).save(*args, **kwargs)


class CollectionMember(WorkspaceBaseModel):
    """
    This model is used to store the users who have access to the private collection.
    Defines the possible access levels a user can have for a private collection:
        - VIEW (0): User can only view the collection content
        - COMMENT (1): User can view and add comments to the collection
        - EDIT (2): User has full edit access to the collection
    """

    collection = models.ForeignKey(Collection, related_name="collection_members", on_delete=models.CASCADE)
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="collection_members",
    )
    access = models.PositiveSmallIntegerField(
        default=CollectionMemberAccess.VIEW, choices=CollectionMemberAccess.choices
    )

    class Meta:
        unique_together = ["collection", "member", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["collection", "member"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_collection_member",
            )
        ]
        verbose_name = "Collection Member"
        verbose_name_plural = "Collection Members"
        db_table = "collection_members"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.member.username} - {self.collection.name}"


class PageCollection(WorkspaceBaseModel):
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, related_name="page_collections")
    page = models.ForeignKey("db.Page", on_delete=models.CASCADE, related_name="page_collections")
    sort_order = models.FloatField(default=65535, blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["page"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_active_page_collection_page",
            )
        ]
        verbose_name = "Page Collection"
        verbose_name_plural = "Page Collections"
        db_table = "page_collections"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        if self._state.adding and self.sort_order in (65535, None):
            largest_sort_order = PageCollection.objects.filter(
                collection=self.collection,
                workspace=self.workspace,
            ).aggregate(largest=models.Max("sort_order"))["largest"]
            if largest_sort_order is not None:
                self.sort_order = largest_sort_order + 10000
        super(PageCollection, self).save(*args, **kwargs)

    def __str__(self):
        return f"{self.page.name} - {self.collection.name}"
