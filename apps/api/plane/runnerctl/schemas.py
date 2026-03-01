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

"""
Pydantic schemas for RunnerCtl variable types.

These schemas document the expected structure for Script.variables
and ScriptExecution.execution_variables fields.
"""

from pydantic import BaseModel, Field, RootModel


class VariableDefinition(BaseModel):
    """
    Schema for a single variable definition in Script.variables.

    Example:
        {
            "key": "issue_id",
            "description": "The issue ID to process",
            "required": true
        }
    """

    key: str = Field(..., description="Unique identifier for the variable")
    description: str | None = Field(default=None, description="Human-readable description of the variable")
    required: bool = Field(default=False, description="Whether this variable must be provided during execution")


class ScriptVariables(RootModel[list[VariableDefinition]]):
    """
    Schema for Script.variables field.

    Example:
        [
            {"key": "issue_id", "description": "The issue ID", "required": true},
            {"key": "channel", "description": "Slack channel", "required": false}
        ]
    """

    pass


class ExecutionVariables(RootModel[dict[str, str]]):
    """
    Schema for ScriptExecution.execution_variables field.
    Simple key-value mapping where all values are strings.

    Example:
        {
            "issue_id": "abc-123",
            "channel": "#general"
        }
    """

    pass
