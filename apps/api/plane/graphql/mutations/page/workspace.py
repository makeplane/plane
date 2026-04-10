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

# Python imports
import base64
from typing import Optional

# Third-party imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry imports
from strawberry.permission import PermissionExtension
from strawberry.scalars import JSON
from strawberry.types import Info

# Module imports
from plane.db.models import Page, ProjectMember, WorkspaceMember
from plane.ee.models import Collection, PageCollection
from plane.graphql.helpers import get_workspace_async
from plane.graphql.permissions.workspace import WorkspacePermission
from plane.graphql.types.pages import PageType
from plane.graphql.utils.roles import Roles


@sync_to_async
def get_workspace_member(slug: str, user_id: str):
    try:
        return WorkspaceMember.objects.get(workspace__slug=slug, member_id=user_id, is_active=True)
    except WorkspaceMember.DoesNotExist:
        return None


@sync_to_async
def get_project_member(slug: str, project: str, user_id: str):
    try:
        return ProjectMember.objects.get(workspace__slug=slug, project_id=project, member_id=user_id, is_active=True)
    except ProjectMember.DoesNotExist:
        return None


@sync_to_async
def get_last_page_in_workspace(workspace_slug: str):
    return (
        Page.objects.filter(workspace__slug=workspace_slug, is_global=True, parent__isnull=True)
        .order_by("-sort_order")
        .first()
    )


@strawberry.type
class WorkspacePageMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[WorkspacePermission([Roles.ADMIN, Roles.MEMBER])])]
    )
    async def create_workspace_page(
        self,
        info: Info,
        slug: str,
        name: Optional[str] = "",
        description_html: Optional[str] = "",
        logo_props: Optional[JSON] = {},
        access: int = 2,
        description_binary: Optional[str] = None,
    ) -> PageType:
        workspace = await get_workspace_async(slug=slug)

        if description_binary is not None:
            description_binary = base64.b64decode(description_binary)

        sort_order = Page.DEFAULT_SORT_ORDER

        # get the last page in the workspace
        last_page = await get_last_page_in_workspace(workspace_slug=slug)
        if last_page:
            sort_order = last_page.sort_order + sort_order

        page = await sync_to_async(Page.objects.create)(
            workspace=workspace,
            name=name,
            description_html=description_html,
            description_binary=description_binary,
            logo_props=logo_props,
            access=access,
            owned_by=info.context.user,
            sort_order=sort_order,
            is_global=True,
        )

        # If the page is public, add it to the workspace default collection.
        if access == Page.PUBLIC_ACCESS:
            default_collection = await sync_to_async(Collection.objects.filter)(
                workspace=workspace, is_default=True, is_global=True, access=0
            )
            default_collection = await sync_to_async(default_collection.first)()
            if default_collection:
                await sync_to_async(PageCollection.objects.create)(
                    page=page,
                    collection=default_collection,
                    workspace=workspace,
                    created_by=info.context.user,
                    updated_by=info.context.user,
                )

        return page

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[WorkspacePermission(roles=[Roles.ADMIN, Roles.MEMBER])])]
    )
    async def updateWorkspacePage(
        self,
        info: Info,
        slug: str,
        id: strawberry.ID,
        name: Optional[str] = None,
        description_html: Optional[str] = None,
        logo_props: Optional[JSON] = None,
        access: Optional[int] = None,
    ) -> PageType:
        page = await sync_to_async(Page.objects.get)(id=id)
        if name is not None:
            page.name = name
        if description_html is not None:
            page.description_html = description_html
        if logo_props is not None:
            page.logo_props = logo_props
        if access is not None:
            page.access = access
        await sync_to_async(page.save)()
        return page
