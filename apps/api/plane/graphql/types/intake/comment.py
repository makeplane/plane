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

# python imports
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

# Third-party library imports
import strawberry
import strawberry_django

# Python Standard Library Imports

# Strawberry imports
from strawberry.types import Info
from strawberry.scalars import JSON

# Module Imports
from plane.db.models import IssueComment
from plane.graphql.types.user import UserLiteType
from plane.graphql.utils.timezone import user_timezone_converter


@strawberry.input
@dataclass
class IntakeWorkItemCommentInputType:
    comment_html: Optional[str] = field(default_factory=lambda: "<p></p>")


@strawberry_django.type(IssueComment)
class IntakeWorkItemCommentActivityType:
    id: strawberry.ID
    comment_stripped: str
    comment_json: JSON
    comment_html: str
    attachments: list[str]
    issue: strawberry.ID
    actor: strawberry.ID
    actor_details: Optional[UserLiteType]
    access: str
    external_source: Optional[str]
    external_id: Optional[str]
    workspace: strawberry.ID
    project: strawberry.ID
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    edited_at: Optional[datetime]
    parent: Optional[str]
    deleted_at: Optional[datetime]

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def actor(self) -> int:
        return self.actor_id

    @strawberry.field
    async def actor_details(self) -> Optional[UserLiteType]:
        if self.actor:
            return self.actor
        return UserLiteType()

    @strawberry.field
    def project(self) -> int:
        return self.project_id

    @strawberry.field
    def issue(self) -> int:
        return self.issue_id

    @strawberry.field
    def parent(self) -> Optional[str]:
        return self.parent_id if self.parent_id else None

    @strawberry.field
    def created_by(self) -> Optional[strawberry.ID]:
        return self.created_by_id

    @strawberry.field
    def updated_by(self) -> Optional[strawberry.ID]:
        return self.updated_by_id

    @strawberry.field
    def created_at(self, info: Info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.created_at)
        return converted_date

    @strawberry.field
    def updated_at(self, info: Info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.updated_at)
        return converted_date
