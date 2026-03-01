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

# models/enums.py
from enum import Enum

# WARNING: Enum values MUST match exactly what's in the database migrations!
# Current migrations use UPPERCASE values in PostgreSQL, but these enums use lowercase.
# This mismatch can cause data insertion failures.


class UserTypeChoices(str, Enum):
    # Database has: USER, ASSISTANT, SYSTEM
    # Python has: user, assistant, system
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

    def __str__(self):
        return self.value


class MessageFeedbackTypeChoices(str, Enum):
    FEEDBACK = "feedback"
    REACTION = "reaction"

    def __str__(self):
        return self.value


class FlowStepType(str, Enum):
    REWRITE = "rewrite"
    ROUTING = "routing"
    TOOL = "tool"
    COMBINATION = "combination"
    ARTIFACT_CHAT = "artifact_chat"  # For sub-chat prompts under artifacts

    def __str__(self):
        return self.value


class AgentsType(str, Enum):
    PRD_WRITER = "prd_writer"

    def __str__(self):
        return self.value


class AgentArtifactContentType(str, Enum):
    MARKDOWN = "markdown"

    def __str__(self):
        return self.value


class MessageMetaStepType(str, Enum):
    INPUT = "input"
    REWRITE = "rewrite"
    ROUTER = "router"
    COMBINATION = "combination"
    SQL_TABLE_SELECTION = "sql_table_selection"
    SQL_GENERATION = "sql_generation"
    TITLE_GENERATION = "title_generation"
    TOOL_ORCHESTRATION = "tool_orchestration"
    ATTACHMENT_CONTEXT_EXTRACTION = "attachment_context_extraction"
    ARTIFACT_MODIFICATION = "artifact_modification"
    ACTION_CATEGORY_ROUTING = "action_category_routing"
    ACTION_METHOD_PLANNING = "action_method_planning"
    ACTION_EXECUTION = "action_execution"
    WEB_SEARCH = "web_search"

    def __str__(self):
        return self.value


class ExecutionStatus(str, Enum):
    PENDING = "pending"  # Not yet attempted
    SUCCESS = "success"  # Successfully executed
    FAILED = "failed"  # Attempted but failed

    def __str__(self):
        return self.value


class FocusEntityType(str, Enum):
    """Entity types that can be used as focus context in chat preferences."""

    WORKSPACE = "workspace"
    PROJECT = "project"
    CYCLE = "cycle"
    MODULE = "module"
    INITIATIVE = "initiative"
    TEAMSPACE = "teamspace"
    PAGE = "page"
    PROJECT_PAGE = "project_page"
    WIKI = "wiki"
    EPIC = "epic"
    WORKITEM = "workitem"

    def __str__(self):
        return self.value
