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

from enum import Enum


class PageAction(str, Enum):
    SUB_PAGE = "sub_page"
    ARCHIVED = "archived"
    UNARCHIVED = "unarchived"
    LOCKED = "locked"
    UNLOCKED = "unlocked"
    MADE_PUBLIC = "made-public"
    MADE_PRIVATE = "made-private"
    PUBLISHED = "published"
    UNPUBLISHED = "unpublished"
    DUPLICATED = "duplicated"
    MOVED = "moved"
    MOVED_INTERNALLY = "moved_internally"
    DELETED = "deleted"
    RESTORED = "restored"
    SHARED = "shared"
    UNSHARED = "unshared"
    RESOLVED_COMMENT = "resolved_comment"
    UNRESOLVED_COMMENT = "unresolved_comment"


class MoveActionEnum(Enum):
    WORKSPACE_TO_PROJECT = "workspace_to_project"
    PROJECT_TO_WORKSPACE = "project_to_workspace"
    TEAMSPACE_TO_PROJECT = "teamspace_to_project"
    PROJECT_TO_TEAMSPACE = "project_to_teamspace"
    PROJECT_TO_PROJECT = "project_to_project"
    TEAMSPACE_TO_TEAMSPACE = "teamspace_to_teamspace"
    WORKSPACE_TO_TEAMSPACE = "workspace_to_teamspace"
    TEAMSPACE_TO_WORKSPACE = "teamspace_to_workspace"
    COLLECTION_TO_COLLECTION = "collection_to_collection"


class MoveEntityEnum(Enum):
    WORKSPACE = "workspace"
    PROJECT = "project"
    TEAMSPACE = "teamspace"
