# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# bot_type value written on the bot User rows backing AI accounts.
# Deliberately NOT added to plane.db BotTypeEnum: choices are not enforced at
# the DB level, and keeping plane/db untouched avoids migration conflicts when
# following upstream.
BOT_TYPE_AI_AGENT = "AI_AGENT"


class ResourceType:
    # Wildcard: a policy row with this resource type matches any resource
    ALL = "all"
    PROJECT = "project"
    MEMBER = "member"
    USER = "user"
    ASSET = "asset"
    ESTIMATE = "estimate"
    CYCLE = "cycle"
    MODULE = "module"
    STICKY = "sticky"
    LABEL = "label"
    INTAKE = "intake"
    WORK_ITEM = "work_item"
    COMMENT = "comment"
    STATE = "state"
    PAGE = "page"
    INVITE = "invite"


RESOURCE_CHOICES = (
    (ResourceType.ALL, "All"),
    (ResourceType.PROJECT, "Project"),
    (ResourceType.MEMBER, "Member"),
    (ResourceType.USER, "User"),
    (ResourceType.ASSET, "Asset"),
    (ResourceType.ESTIMATE, "Estimate"),
    (ResourceType.CYCLE, "Cycle"),
    (ResourceType.MODULE, "Module"),
    (ResourceType.STICKY, "Sticky"),
    (ResourceType.LABEL, "Label"),
    (ResourceType.INTAKE, "Intake"),
    (ResourceType.WORK_ITEM, "Work Item"),
    (ResourceType.COMMENT, "Comment"),
    (ResourceType.STATE, "State"),
    (ResourceType.PAGE, "Page"),
    (ResourceType.INVITE, "Invite"),
)


class Action:
    # Wildcard: a policy row with this action matches any action
    ALL = "all"
    READ = "read"
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"


ACTION_CHOICES = (
    (Action.ALL, "All"),
    (Action.READ, "Read"),
    (Action.CREATE, "Create"),
    (Action.UPDATE, "Update"),
    (Action.DELETE, "Delete"),
)
