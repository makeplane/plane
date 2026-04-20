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
from django.db import transaction
from django.db.models import Count, Exists, F, OuterRef, Q, Subquery, UUIDField, Value
from django.db.models.functions import Coalesce

# Third party imports
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response

# Module imports
from plane.db.models import Page, UserFavorite, Workspace, WorkspaceMember
from plane.ee.models import Collection, CollectionMember, PageCollection, PageUser
from plane.ee.permissions import WorkspaceUserPermission, allow_permission, ROLE
from plane.ee.serializers.app.collection import (
    CollectionMemberSerializer,
    CollectionPageLiteSerializer,
    CollectionPageSearchSerializer,
    CollectionSerializer,
    PageCollectionSerializer,
)
from plane.ee.utils.page_operations import (
    assign_pages_to_collection as assign_pages_to_collection_util,
    move_collection_pages as move_collection_pages_util,
    update_page_collection_membership as update_page_collection_membership_util,
)
from plane.ee.views.base import BaseAPIView
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.utils.filters import CollectionPageFilterSet

COLLECTION_NOT_FOUND_MESSAGE = "Collection not found"
COLLECTION_MEMBER_PERMISSION_MESSAGE = "You don't have permission to manage members of this collection."
PAGE_NOT_FOUND_IN_COLLECTION_MESSAGE = "Page not found in collection"
MEMBER_NOT_FOUND_MESSAGE = "Member not found"


class CollectionAccessMixin:
    """Lookup, permission-check, and response helpers for collection views."""

    def _collections(self, slug):
        return Collection.objects.filter(workspace__slug=slug)

    def _is_owner_or_workspace_admin(self, obj, slug, user):
        return obj.owned_by_id == user.id or self.is_workspace_admin(slug, user)

    def visible_collections(self, slug, user):
        return (
            self._collections(slug)
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

    def get_collection(self, slug, collection_id):
        return self._collections(slug).filter(pk=collection_id).first()

    def get_visible_collection(self, slug, user, collection_id):
        return self.visible_collections(slug, user).filter(pk=collection_id).first()

    def get_collection_member(self, collection, member_id):
        return CollectionMember.objects.filter(pk=member_id, collection=collection).first()

    def get_page_collection(self, slug, collection, page_collection_id):
        return (
            PageCollection.objects.select_related("collection", "page")
            .filter(
                pk=page_collection_id,
                collection=collection,
                workspace__slug=slug,
            )
            .first()
        )

    def is_workspace_admin(self, slug, user):
        return WorkspaceMember.objects.filter(
            workspace__slug=slug,
            member=user,
            role=ROLE.ADMIN.value,
            is_active=True,
        ).exists()

    def can_manage_collection(self, collection, slug, user):
        return self._is_owner_or_workspace_admin(collection, slug, user)

    def save_serializer(self, serializer, success_status=status.HTTP_200_OK, **save_kwargs):
        if serializer.is_valid():
            serializer.save(**save_kwargs)
            return Response(serializer.data, status=success_status)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def error_response(self, message, response_status):
        return Response({"error": message}, status=response_status)


class CollectionPageMixin:
    """Queryset builders, validation, and mutation helpers for pages within collections."""

    ADDABLE_PAGES_DEFAULT_LIMIT = 10

    # ------------------------------------------------------------------
    # Queryset helpers
    # ------------------------------------------------------------------

    def _get_page_favorite_subquery(self, slug, user):
        return UserFavorite.objects.filter(
            user=user,
            entity_type="page",
            entity_identifier=OuterRef("pk"),
            workspace__slug=slug,
            deleted_at__isnull=True,
        )

    def _get_collection_branch_page_summary_annotations(self, slug, user):
        sub_pages_count_subquery = (
            Page.objects.filter(parent=OuterRef("id"))
            .filter(archived_at__isnull=True)
            .order_by()
            .values("parent")
            .annotate(count=Count("id"))
            .values("count")[:1]
        )

        return {
            "collection_id": Subquery(
                PageCollection.objects.filter(
                    page_id=OuterRef("pk"),
                    workspace__slug=slug,
                    deleted_at__isnull=True,
                ).values("collection_id")[:1]
            ),
            "sub_pages_count": Coalesce(Subquery(sub_pages_count_subquery), Value(0)),
            "shared_access": Subquery(
                PageUser.objects.filter(
                    page_id=OuterRef("pk"),
                    workspace__slug=slug,
                    user_id=user.id,
                    deleted_at__isnull=True,
                ).values("access")[:1]
            ),
            "is_shared": Exists(
                PageUser.objects.filter(
                    page_id=OuterRef("pk"),
                    workspace__slug=slug,
                    deleted_at__isnull=True,
                )
            ),
        }

    def _get_workspace_collection_pages_queryset(self, slug):
        return Page.objects.filter(
            workspace__slug=slug,
            is_global=True,
            access=Page.PUBLIC_ACCESS,
            archived_at__isnull=True,
            deleted_at__isnull=True,
            moved_to_page__isnull=True,
        )

    def _get_explicit_page_collection_queryset(self, slug, page_id=None, collection_id=None):
        queryset = PageCollection.objects.filter(
            page_id=OuterRef("pk") if page_id is None else page_id,
            workspace__slug=slug,
            deleted_at__isnull=True,
            collection__deleted_at__isnull=True,
        )

        if collection_id is not None:
            queryset = queryset.filter(collection_id=collection_id)

        return queryset.order_by()

    def get_collection_pages_queryset(self, slug, collection, user):
        shared_pages_queryset = PageUser.objects.filter(
            page_id=OuterRef("pk"),
            workspace__slug=slug,
            deleted_at__isnull=True,
        )
        explicit_membership_queryset = self._get_explicit_page_collection_queryset(slug)
        target_membership_queryset = explicit_membership_queryset.filter(collection_id=collection.id)

        workspace_pages_queryset = (
            self._get_workspace_collection_pages_queryset(slug)
            .annotate(
                branch_sort_order=Coalesce(
                    Subquery(target_membership_queryset.values("sort_order")[:1]),
                    F("sort_order"),
                ),
                has_direct_share=Exists(shared_pages_queryset),
                has_explicit_target_collection=Exists(target_membership_queryset),
                has_explicit_non_default_collection=Exists(
                    explicit_membership_queryset.filter(collection__is_default=False)
                ),
                is_favorite=Exists(self._get_page_favorite_subquery(slug, user)),
            )
            .filter(has_direct_share=False)
            .distinct()
            .order_by()
        )

        if collection.is_default:
            return workspace_pages_queryset.filter(has_explicit_non_default_collection=False)

        return workspace_pages_queryset.filter(has_explicit_target_collection=True)

    def get_addable_pages_queryset(self, slug, collection, user, is_workspace_admin, search_query=""):
        explicit_membership_queryset = self._get_explicit_page_collection_queryset(slug)
        queryset = self._get_workspace_collection_pages_queryset(slug).filter(parent_id__isnull=True)

        if not is_workspace_admin:
            queryset = queryset.filter(owned_by=user)

        if search_query:
            queryset = queryset.filter(name__icontains=search_query)

        if collection.is_default:
            queryset = queryset.filter(Exists(explicit_membership_queryset.filter(collection__is_default=False)))
        else:
            queryset = queryset.annotate(
                is_in_target_collection=Exists(explicit_membership_queryset.filter(collection_id=collection.id))
            ).filter(is_in_target_collection=False)

        queryset = queryset.order_by("sort_order", "created_at", "id")
        return queryset if search_query else queryset[: self.ADDABLE_PAGES_DEFAULT_LIMIT]

    def get_branch_queryset(self, slug, collection, user, queryset, parent_id=None):
        target_membership_queryset = self._get_explicit_page_collection_queryset(slug, collection_id=collection.id)

        if parent_id:
            branch_queryset = queryset.filter(parent_id=parent_id)
        else:
            eligible_page_ids_subquery = queryset.order_by().values("id")
            root_branch_filter = Q(parent_id__isnull=True) | ~Q(parent_id__in=Subquery(eligible_page_ids_subquery))
            branch_queryset = queryset.filter(root_branch_filter)

        return branch_queryset.annotate(
            branch_collection_id=Value(collection.id, output_field=UUIDField()),
            page_collection_id=Subquery(target_membership_queryset.values("id")[:1]),
            branch_sort_order=Coalesce(
                Subquery(target_membership_queryset.values("sort_order")[:1]),
                F("sort_order"),
            ),
            **self._get_collection_branch_page_summary_annotations(slug, user),
        ).order_by(F("branch_sort_order").asc(nulls_last=True), "created_at", "id")

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------

    def can_manage_page_collection(self, page, slug, user):
        return self._is_owner_or_workspace_admin(page, slug, user)

    def validate_page_can_belong_to_collection(self, page):
        if not page.is_global:
            return "invalid", f"Page {page.id} is not a workspace wiki page."

        if page.access != Page.PUBLIC_ACCESS:
            return "invalid", f"Page {page.id} must be public to be added to a collection."

        if page.archived_at or page.deleted_at or page.moved_to_page:
            return "invalid", f"Page {page.id} is not eligible to be added to a collection."

        return None, None

    def validate_page_can_be_added_to_collection(self, page, collection, slug, user):
        if not self.can_manage_page_collection(page, slug, user):
            return "forbidden", f"You don't have permission to add page {page.id} to this collection."

        error_type, error_message = self.validate_page_can_belong_to_collection(page)
        if error_type:
            return error_type, error_message

        explicit_page_collections = self._get_explicit_page_collection_queryset(slug, page_id=page.id)

        if collection.is_default:
            if not explicit_page_collections.filter(collection__is_default=False).exists():
                return "invalid", f"Page {page.id} is already in this collection."
        elif explicit_page_collections.filter(collection_id=collection.id).exists():
            return "invalid", f"Page {page.id} is already in this collection."

        return None, None

    # ------------------------------------------------------------------
    # Mutations
    # ------------------------------------------------------------------

    def assign_pages_to_collection(self, page_ids, collection_id, workspace, slug, user_id, sort_orders=None):
        return assign_pages_to_collection_util(
            page_ids=page_ids,
            collection_id=collection_id,
            workspace_id=workspace.id,
            slug=slug,
            user_id=user_id,
            sort_orders=sort_orders,
        )

    def delete_collection_with_pages(self, slug, collection):
        with transaction.atomic():
            page_ids = PageCollection.objects.filter(collection_id=collection.id, workspace__slug=slug).values_list(
                "page_id", flat=True
            )
            Page.objects.filter(id__in=page_ids, workspace__slug=slug).delete()
            collection.delete()

    def move_collection_pages(self, slug, collection_id, new_collection_id, user_id):
        return move_collection_pages_util(
            slug=slug,
            collection_id=collection_id,
            new_collection_id=new_collection_id,
            user_id=user_id,
        )

    def update_page_collection_membership(
        self,
        page_collection,
        slug,
        user_id,
        next_collection=None,
        sort_order=None,
        update_sort_order=False,
    ):
        return update_page_collection_membership_util(
            page_collection=page_collection,
            slug=slug,
            user_id=user_id,
            next_collection=next_collection,
            sort_order=sort_order,
            update_sort_order=update_sort_order,
        )


class CollectionBaseEndpoint(CollectionAccessMixin, CollectionPageMixin, BaseAPIView):
    def apply_page_filters(self, queryset, search_query):
        if search_query:
            queryset = queryset.filter(name__icontains=search_query)

        return self.filter_queryset(queryset).order_by()


class CollectionEndpoint(CollectionBaseEndpoint):
    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def get(self, request, slug, collection_id=None):
        if collection_id:
            collection = self.get_visible_collection(slug, request.user, collection_id)
            if not collection:
                return self.error_response(COLLECTION_NOT_FOUND_MESSAGE, status.HTTP_404_NOT_FOUND)
            return Response(CollectionSerializer(collection).data, status=status.HTTP_200_OK)

        collections = self.visible_collections(slug, request.user)
        return Response(CollectionSerializer(collections, many=True).data, status=status.HTTP_200_OK)

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = CollectionSerializer(data=request.data)
        return self.save_serializer(
            serializer,
            success_status=status.HTTP_201_CREATED,
            workspace=workspace,
            owned_by=request.user,
        )

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
        return self.save_serializer(serializer)

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
            return self.error_response("Default collection cannot be deleted.", status.HTTP_400_BAD_REQUEST)

        self.delete_collection_with_pages(slug, collection)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MoveCollectionPagesEndpoint(CollectionBaseEndpoint):
    permission_classes = [WorkspaceUserPermission]

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
            return self.error_response("new collection id is required.", status.HTTP_400_BAD_REQUEST)

        if str(new_collection_id) == str(collection_id):
            return self.error_response("Source and target collections must be different.", status.HTTP_400_BAD_REQUEST)

        if not self.get_collection(slug, new_collection_id):
            return self.error_response(COLLECTION_NOT_FOUND_MESSAGE, status.HTTP_404_NOT_FOUND)

        self.move_collection_pages(
            slug=slug,
            collection_id=collection_id,
            new_collection_id=new_collection_id,
            user_id=request.user.id,
        )

        return Response(status=status.HTTP_200_OK)


class CollectionMemberEndpoint(CollectionBaseEndpoint):
    permission_classes = [WorkspaceUserPermission]

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, collection_id):
        if not self.get_collection(slug, collection_id):
            return self.error_response(COLLECTION_NOT_FOUND_MESSAGE, status.HTTP_404_NOT_FOUND)

        members = CollectionMember.objects.filter(collection_id=collection_id, workspace__slug=slug)
        return Response(CollectionMemberSerializer(members, many=True).data, status=status.HTTP_200_OK)

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, collection_id):
        collection = self.get_collection(slug, collection_id)
        if not collection:
            return self.error_response(COLLECTION_NOT_FOUND_MESSAGE, status.HTTP_404_NOT_FOUND)
        if not self.can_manage_collection(collection, slug, request.user):
            return self.error_response(COLLECTION_MEMBER_PERMISSION_MESSAGE, status.HTTP_403_FORBIDDEN)

        serializer = CollectionMemberSerializer(data=request.data)
        return self.save_serializer(
            serializer,
            success_status=status.HTTP_201_CREATED,
            collection=collection,
            workspace=collection.workspace,
        )

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    def patch(self, request, slug, collection_id, pk):
        collection = self.get_collection(slug, collection_id)
        if not collection:
            return self.error_response(COLLECTION_NOT_FOUND_MESSAGE, status.HTTP_404_NOT_FOUND)
        if not self.can_manage_collection(collection, slug, request.user):
            return self.error_response(COLLECTION_MEMBER_PERMISSION_MESSAGE, status.HTTP_403_FORBIDDEN)

        member = self.get_collection_member(collection, pk)
        if not member:
            return self.error_response(MEMBER_NOT_FOUND_MESSAGE, status.HTTP_404_NOT_FOUND)

        serializer = CollectionMemberSerializer(member, data=request.data, partial=True)
        return self.save_serializer(serializer)

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    def delete(self, request, slug, collection_id, pk):
        collection = self.get_collection(slug, collection_id)
        if not collection:
            return self.error_response(COLLECTION_NOT_FOUND_MESSAGE, status.HTTP_404_NOT_FOUND)
        if not self.can_manage_collection(collection, slug, request.user):
            return self.error_response(COLLECTION_MEMBER_PERMISSION_MESSAGE, status.HTTP_403_FORBIDDEN)

        member = self.get_collection_member(collection, pk)
        if not member:
            return self.error_response(MEMBER_NOT_FOUND_MESSAGE, status.HTTP_404_NOT_FOUND)

        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PageCollectionEndpoint(CollectionBaseEndpoint):
    permission_classes = [WorkspaceUserPermission]
    filter_backends = (DjangoFilterBackend,)
    filterset_class = CollectionPageFilterSet

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def get(self, request, slug, collection_id):
        collection = self.get_visible_collection(slug, request.user, collection_id)
        if not collection:
            return self.error_response(COLLECTION_NOT_FOUND_MESSAGE, status.HTTP_404_NOT_FOUND)

        try:
            collection_queryset = self.get_collection_pages_queryset(slug, collection, request.user)
            filtered_queryset = self.apply_page_filters(
                queryset=collection_queryset,
                search_query=request.query_params.get("search", ""),
            )
        except DRFValidationError:
            return self.error_response("Invalid filters parameter", status.HTTP_400_BAD_REQUEST)

        parent_id = request.query_params.get("parent_id") or None
        queryset = self.get_branch_queryset(
            slug,
            collection,
            request.user,
            filtered_queryset,
            parent_id=parent_id,
        )

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda pages: CollectionPageLiteSerializer(pages, many=True).data,
            default_per_page=50,
            max_per_page=100,
        )

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def post(self, request, slug, collection_id):
        collection = self.get_visible_collection(slug, request.user, collection_id)
        if not collection:
            return self.error_response(COLLECTION_NOT_FOUND_MESSAGE, status.HTTP_404_NOT_FOUND)

        page_ids = request.data.get("page_ids", [])
        if not page_ids:
            return self.error_response("page_ids is required", status.HTTP_400_BAD_REQUEST)

        unique_page_ids = set(page_ids)
        pages = list(Page.objects.filter(id__in=unique_page_ids, workspace__slug=slug))
        if len(pages) != len(unique_page_ids):
            return self.error_response("One or more pages were not found.", status.HTTP_400_BAD_REQUEST)

        for page in pages:
            error_type, error_message = self.validate_page_can_be_added_to_collection(
                page=page,
                collection=collection,
                slug=slug,
                user=request.user,
            )
            if error_type == "forbidden":
                return self.error_response(error_message, status.HTTP_403_FORBIDDEN)
            if error_type == "invalid":
                return self.error_response(error_message, status.HTTP_400_BAD_REQUEST)

        workspace = Workspace.objects.get(slug=slug)
        self.assign_pages_to_collection(
            page_ids=page_ids,
            collection_id=collection_id,
            workspace=workspace,
            slug=slug,
            user_id=request.user.id,
            sort_orders=request.data.get("sort_orders"),
        )

        collection_pages = PageCollection.objects.filter(collection=collection, workspace__slug=slug)
        return Response(PageCollectionSerializer(collection_pages, many=True).data, status=status.HTTP_200_OK)

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def patch(self, request, slug, collection_id, pk):
        collection = self.get_visible_collection(slug, request.user, collection_id)
        if not collection:
            return self.error_response(COLLECTION_NOT_FOUND_MESSAGE, status.HTTP_404_NOT_FOUND)

        page_collection = self.get_page_collection(slug, collection, pk)
        if not page_collection:
            return self.error_response(PAGE_NOT_FOUND_IN_COLLECTION_MESSAGE, status.HTTP_404_NOT_FOUND)

        if not self.can_manage_page_collection(page_collection.page, slug, request.user):
            return self.error_response(
                "You don't have permission to reorder or move this page.",
                status.HTTP_403_FORBIDDEN,
            )

        error_type, error_message = self.validate_page_can_belong_to_collection(page_collection.page)
        if error_type == "invalid":
            return self.error_response(error_message, status.HTTP_400_BAD_REQUEST)

        target_collection_id = request.data.get("collection")
        target_collection = None
        if target_collection_id:
            target_collection = self.get_visible_collection(slug, request.user, target_collection_id)
            if not target_collection:
                return self.error_response("Target collection not found", status.HTTP_404_NOT_FOUND)

        page_collection, _ = self.update_page_collection_membership(
            page_collection=page_collection,
            slug=slug,
            user_id=request.user.id,
            next_collection=target_collection,
            sort_order=request.data.get("sort_order"),
            update_sort_order="sort_order" in request.data,
        )

        return Response(PageCollectionSerializer(page_collection).data, status=status.HTTP_200_OK)

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def delete(self, request, slug, collection_id, pk):
        collection = self.get_visible_collection(slug, request.user, collection_id)
        if not collection:
            return self.error_response(COLLECTION_NOT_FOUND_MESSAGE, status.HTTP_404_NOT_FOUND)

        page_collection = self.get_page_collection(slug, collection, pk)
        if not page_collection:
            return self.error_response(PAGE_NOT_FOUND_IN_COLLECTION_MESSAGE, status.HTTP_404_NOT_FOUND)

        if not self.can_manage_page_collection(page_collection.page, slug, request.user):
            return self.error_response(
                "You don't have permission to remove this page from the collection.",
                status.HTTP_403_FORBIDDEN,
            )

        page_collection.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CollectionAddablePageSearchEndpoint(CollectionBaseEndpoint):
    permission_classes = [WorkspaceUserPermission]

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def get(self, request, slug, collection_id):
        collection = self.get_visible_collection(slug, request.user, collection_id)
        if not collection:
            return self.error_response(COLLECTION_NOT_FOUND_MESSAGE, status.HTTP_404_NOT_FOUND)

        queryset = self.get_addable_pages_queryset(
            slug=slug,
            collection=collection,
            user=request.user,
            is_workspace_admin=self.is_workspace_admin(slug, request.user),
            search_query=request.query_params.get("search", "").strip(),
        )
        return Response(CollectionPageSearchSerializer(queryset, many=True).data, status=status.HTTP_200_OK)
