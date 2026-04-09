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
from datetime import datetime
from typing import Optional

# Strawberry imports
from strawberry.types import Info
import strawberry
import strawberry_django
from strawberry.scalars import JSON

# Module Imports
from plane.db.models import IssueLink
from plane.graphql.utils.timezone import user_timezone_converter


@strawberry_django.type(IssueLink)
class IssueLinkType:
    id: strawberry.ID
    title: Optional[str]
    url: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    metadata: Optional[JSON]

    @strawberry.field
    def workspace(self) -> strawberry.ID:
        return self.workspace_id

    @strawberry.field
    def project(self) -> strawberry.ID:
        return self.project_id

    @strawberry.field
    def issue(self) -> strawberry.ID:
        return self.issue_id

    @strawberry.field
    def created_by(self) -> Optional[strawberry.ID]:
        return self.created_by_id if self.created_by_id else None

    @strawberry.field
    def updated_by(self) -> Optional[strawberry.ID]:
        return self.updated_by_id if self.updated_by_id else None

    @strawberry.field
    def created_at(self, info: Info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.created_at)
        return converted_date

    @strawberry.field
    def updated_at(self, info: Info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.updated_at)
        return converted_date
