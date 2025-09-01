import json

from django.utils import timezone

from plane.db.models import Page
from plane.ee.models import PageUser
from plane.ee.views.base import BaseViewSet
from plane.payment.flags.flag import FeatureFlag
from plane.app.serializers import PageUserSerializer
from plane.ee.permissions.page import WorkspacePagePermission
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.bgtasks.page_update import PageAction, nested_page_update

from rest_framework import status
from rest_framework.response import Response


class WorkspacePageUserViewSet(BaseViewSet):
    serializer_class = PageUserSerializer
    model = PageUser
    permission_classes = [WorkspacePagePermission]

    @check_feature_flag(FeatureFlag.SHARED_PAGES)
    def create(self, request, slug, page_id):
        page = Page.objects.get(id=page_id, workspace__slug=slug)
        user_id = request.user.id
        if page.parent_id is not None:
            return Response(
                {"detail": "You can only share the root page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page.access == Page.PUBLIC_ACCESS:
            return Response(
                {"detail": "You can only share the private page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        owner_id = page.owned_by_id

        # remove owner from the requested users
        requested_user_map = {
            str(user["user_id"]): user["access"]
            for user in request.data
            if str(user["user_id"]) != str(owner_id)
        }
        requested_user_ids = set(requested_user_map.keys())

        existing_users = PageUser.objects.filter(page_id=page_id, workspace__slug=slug)
        existing_user_map = {str(pu.user_id): pu for pu in existing_users}
        existing_user_ids = set(existing_user_map.keys())

        # 1. Users to create (in request but not in existing)
        new_user_ids = requested_user_ids - existing_user_ids
        users_to_create = [
            PageUser(
                user_id=user_id,
                page_id=page_id,
                access=requested_user_map[user_id],
                workspace_id=page.workspace_id,
                created_by_id=user_id,
                updated_by_id=user_id,
            )
            for user_id in new_user_ids
        ]
        PageUser.objects.bulk_create(users_to_create, batch_size=10)

        # 2. Users to delete (in existing but not in request)
        deleted_user_ids = existing_user_ids - requested_user_ids
        if deleted_user_ids:
            PageUser.objects.filter(
                page_id=page_id, user_id__in=deleted_user_ids, workspace__slug=slug
            ).delete()

        # 3. Users to update access
        common_user_ids = requested_user_ids & existing_user_ids
        users_to_update = []
        for user_id in common_user_ids:
            existing = existing_user_map[user_id]
            new_access = requested_user_map[user_id]
            if existing.access != new_access:
                existing.access = new_access
                existing.updated_by = request.user
                existing.updated_at = timezone.now()
                users_to_update.append(existing)

        if users_to_update:
            PageUser.objects.bulk_update(
                users_to_update, ["access", "updated_by", "updated_at"]
            )

        # Fire shared and unshared events if needed
        if users_to_create or users_to_update:
            create_user_access = [
                {"user_id": str(user.user_id), "access": user.access}
                for user in users_to_create
            ]
            update_user_access = [
                {"user_id": str(user.user_id), "access": user.access}
                for user in users_to_update
            ]
            nested_page_update.delay(
                page_id=page.id,
                action=PageAction.SHARED,
                slug=slug,
                user_id=user_id,
                extra=json.dumps(
                    {
                        "create_user_access": create_user_access,
                        "update_user_access": update_user_access,
                    }
                ),
            )

        if deleted_user_ids:
            nested_page_update.delay(
                page_id=page_id,
                action=PageAction.UNSHARED,
                slug=slug,
                user_id=user_id,
                extra=json.dumps({"user_ids": list(deleted_user_ids)}),
            )

        return Response(status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.SHARED_PAGES)
    def list(self, request, slug, page_id):
        shared_pages = PageUser.objects.filter(page_id=page_id, workspace__slug=slug)
        serializer = PageUserSerializer(shared_pages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.SHARED_PAGES)
    def destroy(self, request, slug, page_id, user_id):
        page_user = PageUser.objects.filter(
            page_id=page_id, user_id=user_id, workspace__slug=slug
        ).first()

        if not page_user:
            return Response(
                {"detail": "Page user not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if request.user.id == user_id:
            page_user.delete()
            nested_page_update.delay(
                page_id=page_id,
                action=PageAction.UNSHARED,
                slug=slug,
                user_id=request.user.id,
                extra=json.dumps({"user_ids": list(user_id)}),
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
