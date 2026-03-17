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
from collections import defaultdict

# Third-party imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module imports
from plane.db.models import CommentReaction
from plane.graphql.helpers import get_epic, project_member_filter_via_teamspaces
from plane.graphql.permissions.project import ProjectPermission
from plane.graphql.types.issues.comment_reaction import CommentReactionType
from plane.graphql.utils.archive import ArchivedFilterTypes


@sync_to_async
def get_epic_comment_reactions(workspace_slug: str, project_id: str, comment_id: str, user_id: str):
    project_teamspace_filter = project_member_filter_via_teamspaces(
        user_id=user_id,
        workspace_slug=workspace_slug,
    )
    comment_reactions = (
        CommentReaction.objects.filter(workspace__slug=workspace_slug, project_id=project_id, comment_id=comment_id)
        .filter(project_teamspace_filter.query)
        .order_by("-created_at")
        .distinct()
    )

    return list(comment_reactions)


@strawberry.type
class EpicCommentReactionQuery:
    @strawberry.field(extensions=[PermissionExtension(permissions=[ProjectPermission()])])
    async def epic_comment_reactions(
        self, info: Info, slug: str, project: str, epic: str, comment: str
    ) -> list[CommentReactionType]:
        user = info.context.user
        user_id = str(user.id)

        await get_epic(
            workspace_slug=slug, project_id=project, epic_id=epic, archived_filter=ArchivedFilterTypes.INCLUDE
        )

        comment_reactions = await get_epic_comment_reactions(
            workspace_slug=slug, project_id=project, comment_id=comment, user_id=user_id
        )

        grouped = defaultdict(list)
        for reaction in comment_reactions:
            grouped[reaction.reaction].append(str(reaction.created_by_id))

        return [CommentReactionType(reaction=k, user_ids=v) for k, v in grouped.items()]
