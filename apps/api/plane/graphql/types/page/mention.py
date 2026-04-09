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
from datetime import datetime
from enum import Enum
from typing import Optional

# Third Party Imports
import strawberry
import strawberry_django
from strawberry.types import Info
from asgiref.sync import sync_to_async

# Module imports
from plane.db.models import Issue, PageLog, User
from plane.graphql.utils.timezone import user_timezone_converter

# Local Imports
from ..workitem import WorkItemMentionType


@strawberry.enum
class PageMentionEntityNameEnum(Enum):
    USER_MENTION = "user_mention"
    ISSUE_MENTION = "issue_mention"


@strawberry.enum
class PageMentionEntityTypeEnum(Enum):
    MENTION = "mention"


@strawberry.type
class PageMentionUserType:
    id: str
    display_name: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    avatar_url: Optional[str]


@strawberry_django.type(PageLog)
class PageMentionType:
    id: str
    workspace: str
    page: str
    transaction: str
    entity_identifier: Optional[str]
    entity_name: PageMentionEntityNameEnum
    entity_type: PageMentionEntityTypeEnum

    @strawberry.field
    def workspace(self) -> str:
        return self.workspace_id

    @strawberry.field
    def page(self) -> str:
        return self.page_id

    @strawberry.field
    def created_at(self, info: Info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.created_at)
        return converted_date

    @strawberry.field
    def updated_at(self, info: Info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.updated_at)
        return converted_date

    @strawberry.field
    async def workitem(self) -> Optional[WorkItemMentionType]:
        if not self.entity_identifier or self.entity_name != PageMentionEntityNameEnum.ISSUE_MENTION.value:
            return None

        current_issue_details = await sync_to_async(
            lambda: Issue.objects.filter(id=self.entity_identifier).select_related("project", "state", "type").first()
        )()
        if not current_issue_details:
            return None

        return WorkItemMentionType(
            id=current_issue_details.id,
            name=current_issue_details.name,
            sequence_id=current_issue_details.sequence_id,
            project_id=current_issue_details.project_id,
            type_id=current_issue_details.type_id if current_issue_details.type else None,
            project_identifier=current_issue_details.project.identifier,
            state_group=current_issue_details.state.group if current_issue_details.state else None,
            state_name=current_issue_details.state.name if current_issue_details.state else None,
            archived_at=current_issue_details.archived_at,
            is_epic=current_issue_details.type.is_epic if current_issue_details.type else False,
        )

    @strawberry.field
    async def user(self) -> Optional[PageMentionUserType]:
        if not self.entity_identifier or self.entity_name != PageMentionEntityNameEnum.USER_MENTION.value:
            return None

        current_user_details = await sync_to_async(lambda: User.objects.filter(id=self.entity_identifier).first())()
        if not current_user_details:
            return None

        return PageMentionUserType(
            id=current_user_details.id,
            display_name=current_user_details.display_name,
            first_name=current_user_details.first_name,
            last_name=current_user_details.last_name,
            avatar_url=current_user_details.avatar_url,
        )
