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
Mention Context Module

Provides context enrichment for entity mentions in chat queries.
When users mention entities using @mentions, this module fetches core
metadata from the database to enable direct answers without tool calls.
"""

from .enricher import MentionContextEnricher

__all__ = ["MentionContextEnricher"]
