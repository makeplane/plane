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
AccessibleResource — per-scope-resource authorization state for the listing
primitive get_accessible_resources_with_conditions.

Conditions is an empty tuple for unconditional access. Multiple conditions
are OR'd (matching the engine resolver at engine/resolver.py:172): a role
that grants workitem:view+creator AND workitem:view+lead produces
conditions=("creator", "lead") meaning access applies when the user is the
creator OR the lead.
"""

from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class AccessibleResource:
    resource_id: UUID
    relation: str
    conditions: tuple[str, ...]

    def is_unconditional(self) -> bool:
        return not self.conditions
