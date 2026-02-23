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

"""Service for page summarization."""

from pi.services.pages.content import PageContentService
from pi.services.pages.prompts import get_prompt


class SummarizeService(PageContentService):
    """
    Service for summarizing page content.

    This service is completely independent - just imports the prompt and implements the interface.
    """

    def build_system_prompt(self) -> str:
        """Return the summarization system prompt."""
        return get_prompt("summarize")

    def build_user_prompt(self, context_text: str, **kwargs) -> str:
        """
        Build user prompt with page content.

        Args:
            context_text: The page content to summarize
            **kwargs: Unused for summarization

        Returns:
            User prompt string
        """
        return context_text

    def get_usage_type(self) -> str:
        """Return usage type for token tracking."""
        return "page_summary"
