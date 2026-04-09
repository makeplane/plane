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
from typing import Optional

# Strawberry imports
from strawberry.types import Info
import strawberry
import strawberry_django

# Module imports
from plane.ee.models import PageCommentReaction
from plane.graphql.utils.timezone import user_timezone_converter


@strawberry.type
class PageCommentReactionCountType:
    reaction: str
    user_ids: list[str]


@strawberry_django.type(PageCommentReaction)
class PageCommentReactionType:
    id: str
    reaction: str
    actor: str

    @strawberry.field
    def workspace(self) -> str:
        return self.workspace_id

    @strawberry.field
    def project(self) -> Optional[str]:
        return self.project_id if self.project_id else None

    @strawberry.field
    def actor(self) -> Optional[str]:
        return self.actor_id if self.actor_id else None

    @strawberry.field
    def created_by(self) -> Optional[str]:
        return self.created_by_id if self.created_by_id else None

    @strawberry.field
    def updated_by(self) -> Optional[str]:
        return self.updated_by_id if self.updated_by_id else None

    @strawberry.field
    def created_at(self, info: Info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.created_at)
        return converted_date

    @strawberry.field
    def updated_at(self, info: Info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.updated_at)
        return converted_date
