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
from django.db import models as db_models
from django.db.models import Exists, F, OuterRef, Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import Page, Workspace, WorkspaceMember
from plane.ee.models import Collection, CollectionMember, PageCollection
from plane.ee.permissions import WorkspaceUserPermission, allow_permission, ROLE
from plane.ee.serializers.app.collection import (
    CollectionSerializer,
    CollectionMemberSerializer,
    PageCollectionSerializer,
)
from plane.ee.views.base import BaseAPIView
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.ee.bgtasks.page_update import nested_page_update
from plane.ee.utils.page_events import PageAction, MoveActionEnum


def assign_pages_to_collection(page_ids, collection_id, workspace, slug, user_id):
    """
    Move root pages into a collection.
    - Removes the pages from any existing collection they belong to.
    - Bulk-creates PageCollection entries with incrementing sort_orders.
    - Fires nested_page_update for each page so sub-pages are cascaded in
      with sort_order=None (ordering via Page.sort_order).
    """
    # Detach pages from their current collection
    PageCollection.objects.filter(page_id__in=page_ids, workspace__slug=slug).delete()

    # Find the current largest sort_order in the target collection
    largest = (
        PageCollection.objects.filter(collection_id=collection_id, workspace__slug=slug).aggregate(
            largest=db_models.Max("sort_order")
        )["largest"]
        or 65535
    )

    PageCollection.objects.bulk_create(
        [
            PageCollection(
                page_id=page_id,
                collection_id=collection_id,
                workspace=workspace,
                sort_order=largest + (idx + 1) * 10000,
            )
            for idx, page_id in enumerate(page_ids)
        ],
        ignore_conflicts=True,
    )

    # Cascade sub-pages into the collection (sort_order=None, ordered by Page.sort_order)
    for page_id in page_ids:
        nested_page_update.delay(
            page_id=page_id,
            action=PageAction.MOVED,
            slug=slug,
            user_id=user_id,
            extra={
                "old_page_parent_id": None,
                "move_type": MoveActionEnum.COLLECTION_TO_COLLECTION.value,
                "new_entity_identifier": str(collection_id),
            },
        )


class CollectionEndpoint(BaseAPIView):

    def _visible_collections(self, slug, user):
        """Collections visible to the user: public ones + private ones they own or are a member of."""
        return (
            Collection.objects.filter(workspace__slug=slug)
            .filter(
                Q(access=0)
                | Q(owned_by=user)
                | Q(
                    collection_members__member=user,
                    collection_members__deleted_at__isnull=True,
                )
            )
            .distinct()
        )

    @allow_permission(
        level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST]
    )
    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def get(self, request, slug, collection_id=None):
        if collection_id:
            collection = self._visible_collections(slug, request.user).filter(
                pk=collection_id
            ).first()
            if not collection:
                return Response(
                    {"error": "Collection not found"}, status=status.HTTP_404_NOT_FOUND
                )

            serializer = CollectionSerializer(collection)
            return Response(serializer.data, status=status.HTTP_200_OK)

        collections = self._visible_collections(slug, request.user)
        serializer = CollectionSerializer(collections, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = CollectionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace=workspace, owned_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(
        level="WORKSPACE",
        allowed_roles=[ROLE.ADMIN],
        creator=True,
        model=Collection,
        lookup_kwarg="collection_id",
        field="owned_by",
    )
    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def patch(self, request, slug, collection_id):
        collection = Collection.objects.get(workspace__slug=slug, pk=collection_id)
        serializer = CollectionSerializer(collection, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(
        level="WORKSPACE",
        allowed_roles=[ROLE.ADMIN],
        creator=True,
        model=Collection,
        lookup_kwarg="collection_id",
        field="owned_by",
    )
    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def delete(self, request, slug, collection_id):
        collection = Collection.objects.get(workspace__slug=slug, pk=collection_id)

        if collection.is_default:
            return Response(
                {"error": "Default collection cannot be deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # get all page ids inside the collection
        page_ids = PageCollection.objects.filter(
            collection_id=collection_id, workspace__slug=slug
        ).values_list("page_id", flat=True)

        Page.objects.filter(id__in=page_ids, workspace__slug=slug).delete()

        # check page collection and page members everything should be deleted

        collection.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MoveCollectionPagesEndpoint(BaseAPIView):
    permission_classes = [WorkspaceUserPermission]

    # move pages to a different collection
    @allow_permission(
        level="WORKSPACE",
        allowed_roles=[ROLE.ADMIN],
        creator=True,
        model=Collection,
        lookup_kwarg="collection_id",
        field="owned_by",
    )
    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def post(self, request, slug, collection_id):
        new_collection_id = request.data.get("new_collection_id")

        if not new_collection_id:
            return Response(
                {"error": "new collection id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        _ = Collection.objects.get(workspace__slug=slug, pk=new_collection_id)

        # update the collection id for all pages in the collection
        PageCollection.objects.filter(
            collection_id=collection_id, workspace__slug=slug
        ).update(collection_id=new_collection_id)

        CollectionMember.objects.filter(
            collection_id=collection_id, workspace__slug=slug
        ).update(collection_id=new_collection_id)

        # delete the old collection
        Collection.objects.filter(workspace__slug=slug, pk=collection_id).delete()

        return Response(status=status.HTTP_200_OK)


class CollectionMemberEndpoint(BaseAPIView):
    permission_classes = [WorkspaceUserPermission]

    def _get_collection(self, slug, collection_id, user):
        return Collection.objects.annotate(
            is_owner=Exists(
                Collection.objects.filter(pk=OuterRef("pk"), owned_by=user)
            ),
            is_admin=Exists(
                WorkspaceMember.objects.filter(
                    workspace__slug=slug,
                    member=user,
                    role=ROLE.ADMIN.value,
                    is_active=True,
                )
            ),
        ).get(workspace__slug=slug, pk=collection_id)

    @allow_permission(
        level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST]
    )
    def get(self, request, slug, collection_id):
        Collection.objects.get(workspace__slug=slug, pk=collection_id)

        members = CollectionMember.objects.filter(
            collection_id=collection_id, workspace__slug=slug
        )
        serializer = CollectionMemberSerializer(members, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, collection_id):
        collection = self._get_collection(slug, collection_id, request.user)

        if not (collection.is_owner or collection.is_admin):
            return Response(
                {
                    "error": "You don't have permission to manage members of this collection."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = CollectionMemberSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(collection=collection, workspace=collection.workspace)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    def patch(self, request, slug, collection_id, pk):
        try:
            collection = self._get_collection(slug, collection_id, request.user)
        except Collection.DoesNotExist:
            return Response(
                {"error": "Collection not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if not (collection.is_owner or collection.is_admin):
            return Response(
                {
                    "error": "You don't have permission to manage members of this collection."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            member = CollectionMember.objects.get(pk=pk, collection=collection)
        except CollectionMember.DoesNotExist:
            return Response(
                {"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = CollectionMemberSerializer(member, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    def delete(self, request, slug, collection_id, pk):
        try:
            collection = self._get_collection(slug, collection_id, request.user)
        except Collection.DoesNotExist:
            return Response(
                {"error": "Collection not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if not (collection.is_owner or collection.is_admin):
            return Response(
                {
                    "error": "You don't have permission to manage members of this collection."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            member = CollectionMember.objects.get(pk=pk, collection=collection)
        except CollectionMember.DoesNotExist:
            return Response(
                {"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND
            )

        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PageCollectionEndpoint(BaseAPIView):
    permission_classes = [WorkspaceUserPermission]

    def _accessible_collections(self, slug, user):
        return (
            Collection.objects.filter(workspace__slug=slug)
            .filter(
                Q(access=0)
                | Q(owned_by=user)
                | Q(
                    collection_members__member=user,
                    collection_members__deleted_at__isnull=True,
                )
            )
            .distinct()
        )

    def _is_workspace_admin(self, slug, user):
        return WorkspaceMember.objects.filter(
            workspace__slug=slug,
            member=user,
            role=ROLE.ADMIN.value,
            is_active=True,
        ).exists()

    def _can_manage_collection(self, collection, slug, user):
        return collection.owned_by_id == user.id or self._is_workspace_admin(slug, user)

    def _can_add_page_to_collection(self, page, slug, user):
        return page.owned_by_id == user.id or self._is_workspace_admin(slug, user)

    def _can_reorder_page_in_collection(self, page, slug, user):
        return page.owned_by_id == user.id or self._is_workspace_admin(slug, user)

    def _can_remove_page_from_collection(self, collection, page, slug, user):
        return self._is_workspace_admin(slug, user) or page.owned_by_id == user.id

    @allow_permission(
        level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST]
    )
    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def get(self, request, slug, collection_id):
        collection = (
            self._accessible_collections(slug, request.user)
            .filter(pk=collection_id)
            .first()
        )
        if not collection:
            return Response(
                {"error": "Collection not found"}, status=status.HTTP_404_NOT_FOUND
            )

        page_collections = PageCollection.objects.filter(
            collection=collection,
            workspace__slug=slug,
            page__deleted_at__isnull=True,
        ).values("id", "page_id", "sort_order", "collection_id", parent_id=F("page__parent_id"))

        return Response(page_collections, status=status.HTTP_200_OK)

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def post(self, request, slug, collection_id):
        collection = Collection.objects.get(workspace__slug=slug, pk=collection_id)

        page_ids = request.data.get("page_ids", [])
        if not page_ids:
            return Response({"error": "page_ids is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Verify the user has permission to add each page to the collection
        pages = Page.objects.filter(id__in=page_ids, workspace__slug=slug)
        for page in pages:
            if not self._can_add_page_to_collection(page, slug, request.user):
                return Response(
                    {"error": f"You don't have permission to add page {page.id} to this collection."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        workspace = Workspace.objects.get(slug=slug)
        assign_pages_to_collection(
            page_ids=page_ids,
            collection_id=collection_id,
            workspace=workspace,
            slug=slug,
            user_id=str(request.user.id),
        )

        collection_pages = PageCollection.objects.filter(
            collection=collection, workspace__slug=slug
        )
        serializer = PageCollectionSerializer(collection_pages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def patch(self, request, slug, collection_id, pk):
        collection = self._accessible_collections(slug, request.user).filter(pk=collection_id).first()
        if not collection:
            return Response({"error": "Collection not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            page_collection = PageCollection.objects.select_related(
                "collection", "page"
            ).get(
                pk=pk,
                collection=collection,
                workspace__slug=slug,
            )
        except PageCollection.DoesNotExist:
            return Response(
                {"error": "Page not found in collection"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not self._can_reorder_page_in_collection(
            page_collection.page, slug, request.user
        ):
            return Response(
                {"error": "You don't have permission to reorder or move this page."},
                status=status.HTTP_403_FORBIDDEN,
            )

        next_collection_id = request.data.get("collection")
        next_collection = None
        if next_collection_id:
            next_collection = self._accessible_collections(slug, request.user).filter(pk=next_collection_id).first()
            if not next_collection:
                return Response({"error": "Target collection not found"}, status=status.HTTP_404_NOT_FOUND)
            page_collection.collection = next_collection

        if "sort_order" in request.data:
            page_collection.sort_order = request.data.get("sort_order")

        page_collection.updated_by = request.user
        page_collection.save(
            update_fields=["collection", "sort_order", "updated_by", "updated_at"]
        )

        # Cascade collection change to all descendants
        if next_collection:
            nested_page_update.delay(
                page_id=str(page_collection.page_id),
                action=PageAction.MOVED,
                slug=slug,
                user_id=str(request.user.id),
                extra={
                    "old_page_parent_id": None,
                    "move_type": MoveActionEnum.COLLECTION_TO_COLLECTION.value,
                    "new_entity_identifier": str(next_collection.id),
                },
            )

        serializer = PageCollectionSerializer(page_collection)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def delete(self, request, slug, collection_id, pk):
        collection = self._accessible_collections(slug, request.user).filter(pk=collection_id).first()
        if not collection:
            return Response({"error": "Collection not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            page_collection = PageCollection.objects.select_related(
                "collection", "page"
            ).get(
                pk=pk,
                collection=collection,
                workspace__slug=slug,
            )
        except PageCollection.DoesNotExist:
            return Response(
                {"error": "Page not found in collection"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not self._can_remove_page_from_collection(
            collection, page_collection.page, slug, request.user
        ):
            return Response(
                {
                    "error": "You don't have permission to remove this page from the collection."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        page_collection.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
