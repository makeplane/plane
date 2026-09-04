# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from uuid import UUID, uuid4
from urllib.parse import urlparse

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import APIToken, FileAsset, ProjectMember, User, Workspace, WorkspaceMember

from .constants import BOT_TYPE_AI_AGENT
from .models import AIAccount, AIScopePolicy
from .serializers import (
    AIAccountCreateSerializer,
    AIAccountSerializer,
    AIScopePolicyInputSerializer,
    AIScopePolicySerializer,
)
from .utils import is_sole_project_admin


class AIAccountListCreateAPIEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        accounts = AIAccount.objects.filter(workspace__slug=slug).select_related(
            "bot_user", "owner"
        ).prefetch_related("scope_policies")
        serializer = AIAccountSerializer(accounts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        serializer = AIAccountCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        workspace = Workspace.objects.get(slug=slug)
        owner_membership = WorkspaceMember.objects.filter(
            workspace=workspace, member=request.user, is_active=True
        ).first()
        if owner_membership is None:
            return Response(
                {"error": "You are not a member of this workspace"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        name = serializer.validated_data["name"]
        # The bot's workspace role is capped by the owner's role
        role = min(serializer.validated_data["role"], owner_membership.role)
        host = urlparse(settings.WEB_URL or "https://plane.so").hostname or "plane.so"

        with transaction.atomic():
            bot_user = User.objects.create(
                username=f"ai_bot_{uuid4().hex[:12]}",
                email=f"ai+{uuid4().hex}@{host}",
                display_name=name,
                first_name=name,
                last_name="",
                is_bot=True,
                bot_type=BOT_TYPE_AI_AGENT,
                password=make_password(uuid4().hex),
                is_password_autoset=True,
            )
            WorkspaceMember.objects.create(
                workspace=workspace, member=bot_user, role=role
            )
            # Workspace membership inherits into all existing projects;
            # future projects are covered by the post_save signal
            ProjectMember.objects.bulk_create(
                [
                    ProjectMember(
                        project_id=project_id,
                        member=bot_user,
                        role=role,
                        workspace=workspace,
                    )
                    for project_id in workspace.workspace_project.values_list(
                        "id", flat=True
                    )
                ]
            )
            account = AIAccount.objects.create(
                workspace=workspace,
                owner=request.user,
                bot_user=bot_user,
                name=name,
                description=serializer.validated_data["description"],
            )
            token = APIToken.objects.create(
                user=bot_user,
                label=f"ai:{name}",
                user_type=1,
                is_service=True,
                workspace=workspace,
            )

        data = AIAccountSerializer(account).data
        # The token secret is returned exactly once, on creation
        data["token"] = token.token
        return Response(data, status=status.HTTP_201_CREATED)


class AIAccountDetailAPIEndpoint(BaseAPIView):
    def get_account(self, slug, pk):
        return AIAccount.objects.select_related("bot_user", "owner").prefetch_related(
            "scope_policies"
        ).get(pk=pk, workspace__slug=slug)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug, pk):
        account = self.get_account(slug, pk)
        return Response(AIAccountSerializer(account).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug, pk):
        account = self.get_account(slug, pk)
        name = request.data.get("name", account.name)
        description = request.data.get("description", account.description)
        is_active = request.data.get("is_active", account.is_active)

        bot_user = account.bot_user
        avatar_provided = "avatar" in request.data
        new_avatar_asset = None
        old_asset_id = bot_user.avatar_asset_id

        # Custom avatar for the backing bot user. The avatar rides the
        # avatar_asset FK (same model as regular user avatars): the asset is
        # uploaded as a workspace asset bound to the bot, so it is never
        # touched by the uploader's own profile-avatar replacement flow.
        # The asset is resolved and validated BEFORE anything is saved, so an
        # invalid avatar rejects the whole PATCH instead of leaving the
        # account fields half-updated.
        if avatar_provided:
            avatar_url = request.data.get("avatar") or ""
            if avatar_url:
                asset_id = avatar_url.rstrip("/").rsplit("/", 1)[-1]
                try:
                    asset_id = UUID(asset_id)
                except ValueError:
                    asset_id = None
                # Only assets uploaded for THIS bot (workspace asset with the
                # bot as entity) may be attached — anything else is rejected.
                new_avatar_asset = (
                    FileAsset.objects.filter(
                        id=asset_id,
                        workspace__slug=slug,
                        entity_type=FileAsset.EntityTypeContext.USER_AVATAR,
                        entity_identifier=str(bot_user.id),
                        is_deleted=False,
                    ).first()
                    if asset_id
                    else None
                )
                if new_avatar_asset is None:
                    return Response(
                        {"error": "Avatar asset not found"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        with transaction.atomic():
            account.name = name
            account.description = description
            account.is_active = is_active
            account.save()

            if avatar_provided:
                bot_user.avatar_asset = new_avatar_asset
                bot_user.avatar = ""
                bot_user.save(update_fields=["avatar", "avatar_asset", "updated_at"])

                # Delete the previously attached avatar asset
                if old_asset_id and old_asset_id != bot_user.avatar_asset_id:
                    FileAsset.objects.filter(id=old_asset_id).update(
                        is_deleted=True, deleted_at=timezone.now()
                    )

            # Toggling the account toggles its tokens with it
            APIToken.objects.filter(user=bot_user, is_service=True).update(
                is_active=is_active
            )
        return Response(AIAccountSerializer(account).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, pk):
        account = self.get_account(slug, pk)
        # Deleting the account removes the bot from every project; refuse when
        # the bot is the only active admin of one (same protection as removing
        # a human member)
        if is_sole_project_admin(slug, account.bot_user_id):
            return Response(
                {
                    "error": "This AI account is the only admin of some projects. Promote another member to admin before deleting it."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            APIToken.objects.filter(user=account.bot_user, is_service=True).update(
                is_active=False
            )
            WorkspaceMember.objects.filter(
                workspace__slug=slug, member=account.bot_user
            ).update(is_active=False)
            account.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AIScopePolicyAPIEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug, pk):
        account = AIAccount.objects.get(pk=pk, workspace__slug=slug)
        policies = AIScopePolicy.objects.filter(ai_account=account)
        return Response(
            AIScopePolicySerializer(policies, many=True).data, status=status.HTTP_200_OK
        )

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def put(self, request, slug, pk):
        """Replace the account's scope policies with the submitted set."""
        account = AIAccount.objects.get(pk=pk, workspace__slug=slug)
        items = request.data.get("scopes", [])
        if not isinstance(items, list):
            return Response(
                {"error": "scopes must be a list"}, status=status.HTTP_400_BAD_REQUEST
            )
        serializer = AIScopePolicyInputSerializer(data=items, many=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # All referenced projects must belong to this workspace
        project_ids = [i["project"] for i in serializer.validated_data if i["project"]]
        valid_count = account.workspace.workspace_project.filter(id__in=project_ids).count()
        if valid_count != len(set(project_ids)):
            return Response(
                {"error": "All projects must belong to this workspace"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            AIScopePolicy.objects.filter(ai_account=account).delete()
            AIScopePolicy.objects.bulk_create(
                [
                    AIScopePolicy(
                        ai_account=account,
                        project_id=item["project"],
                        resource_type=item["resource_type"],
                        action=item["action"],
                    )
                    for item in serializer.validated_data
                ]
            )
        policies = AIScopePolicy.objects.filter(ai_account=account)
        return Response(
            AIScopePolicySerializer(policies, many=True).data, status=status.HTTP_200_OK
        )
