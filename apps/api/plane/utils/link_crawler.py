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
from typing import Literal

from pydantic import BaseModel


class LinkCrawlerEntity(str, Enum):
    ISSUE = "issue"
    MODULE = "module"
    PROJECT = "project"
    INITIATIVE = "initiative"
    CUSTOMER = "customer"


LINK_CRAWLER_ENTITIES = frozenset(e.value for e in LinkCrawlerEntity)

LinkCrawlerEntityLiteral = Literal[
    "issue",
    "module",
    "project",
    "initiative",
    "customer",
]


class LinkCrawlerInput(BaseModel):
    id: str
    url: str
    entity: LinkCrawlerEntityLiteral
