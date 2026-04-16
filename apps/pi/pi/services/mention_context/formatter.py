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

"""Format mention contexts for LLM injection."""

from typing import Any
from typing import Dict
from typing import List


class MentionContextFormatter:
    """Formats enriched mention contexts for LLM prompts."""

    def format_all_contexts(self, formatted_contexts: List[str]) -> Dict[str, Any]:
        """
        Format all mention contexts into a single structure for LLM.

        Args:
            formatted_contexts: List of formatted context strings

        Returns:
            Dict with formatted_context string and metadata
        """
        if not formatted_contexts:
            return {}

        # Combine all contexts with clear separation
        combined = "\n\n".join(formatted_contexts)

        return {"formatted_context": combined, "count": len(formatted_contexts), "has_context": True}

    @staticmethod
    def format_list(items: list, max_items: int = 3) -> str:
        """Format a list with optional truncation."""
        if not items:
            return "None"

        if len(items) <= max_items:
            return ", ".join(str(i) for i in items if i)

        shown = ", ".join(str(i) for i in items[:max_items] if i)
        remaining = len(items) - max_items
        return f"{shown} (+{remaining} more)"
