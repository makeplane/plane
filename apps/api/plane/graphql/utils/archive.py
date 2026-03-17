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
Archive Filter Types and helper functions for the GraphQL API
"""

# Python imports
import enum
from typing import Literal, Optional

# Django Imports
from django.db.models import QuerySet


# ==============================
# Archive Filter Literal and Types
# ==============================
class ArchivedFilterTypes(enum.Enum):
    EXCLUDE = "exclude"
    INCLUDE = "include"
    ONLY = "only"


ArchivedFilter = Literal[ArchivedFilterTypes.EXCLUDE, ArchivedFilterTypes.INCLUDE, ArchivedFilterTypes.ONLY]


# ==============================
# Helper Functions
# ==============================
def _resolve_archived_filter(archived_filter: Optional[ArchivedFilter]) -> ArchivedFilter:
    """
    Resolve the archived filter.

    archived_filter:
        - "exclude": only non-archived epics (archived_at is null)
        - "include": both archived and non-archived (no filter)
        - "only": only archived epics (archived_at is not null)
    """

    return archived_filter if archived_filter is not None else ArchivedFilterTypes.INCLUDE


def apply_archived_filter(queryset: QuerySet, archived_filter: ArchivedFilter) -> QuerySet:
    """
    Apply the archived filter to the queryset.
    """

    # resolve the archived filter
    resolved = _resolve_archived_filter(archived_filter)

    if resolved == ArchivedFilterTypes.EXCLUDE:
        queryset = queryset.filter(archived_at__isnull=True)
    elif resolved == ArchivedFilterTypes.ONLY:
        queryset = queryset.filter(archived_at__isnull=False)

    return queryset
