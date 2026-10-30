# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from enum import Enum


class FeatureFlag(Enum):
    ISSUE_TYPES = "ISSUE_TYPES"
    WORKFLOWS = "WORKFLOWS"
    TEAMSPACES = "TEAMSPACES"
    EPICS = "EPICS"
    EPIC_OVERVIEW = "EPIC_OVERVIEW"
    PROJECT_OVERVIEW = "PROJECT_OVERVIEW"
    INITIATIVES = "INITIATIVES"
