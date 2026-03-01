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
Documentation vectorization package.

This package handles fetching, processing, and vectorizing documentation
from GitHub repositories for AI-powered search and chat.

Main modules:
- github_fetcher: Fetch documentation from GitHub without API tokens
- document_processor: Process and prepare documents for vectorization
- initial_feed: Legacy full feed functionality (for backward compatibility)
- mdx_processor: MDX file processing utilities
- api_code_generator: Generate API code examples in multiple languages
- mdx_to_code: Code converters for Python, Java, JS, cURL, Go, PHP
- create_index: OpenSearch index creation utilities
"""

# Legacy exports for backward compatibility
from .initial_feed import get_all_file_paths
from .initial_feed import process_file
from .initial_feed import process_repo_contents

__all__ = [
    # Legacy functions (for backward compatibility)
    "process_repo_contents",
    "get_all_file_paths",
    "process_file",
]
