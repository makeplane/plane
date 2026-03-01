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

import re

from pi import logger

log = logger.getChild(__name__)


def process_mdx_file(mdx_content: str) -> str:
    """
    Processes MDX file content by removing image frames.

    Args:
        mdx_content: Raw MDX file content

    Returns:
        Processed content with image frames removed
    """
    image_regex = re.compile(r"<Frame>!\[.*?\]\(.*?\)</Frame>")
    processed_lines = [line for line in mdx_content.split("\n") if not image_regex.search(line)]
    return "\n".join(processed_lines)


def parse_path(file_path: str) -> tuple[str, str]:
    """
    Parses file path to extract section and subsection.

    Strips leading 'docs/' prefix to maintain compatibility with URL construction.
    This handles the new repository structure where files are organized under docs/.

    Args:
        file_path: Path to file in repository (e.g., "docs/api-reference/customer/add-customer.md")

    Returns:
        Tuple of (section, subsection)

    Examples:
        "issues.md" -> ("issues", "issues")
        "api-reference/customer/add-customer.md" -> ("api-reference/customer", "add-customer.md")
        "docs/api-reference/customer/add-customer.md" -> ("api-reference/customer", "add-customer.md")
        "docs/plane-one/introduction.md" -> ("plane-one", "introduction.md")
    """
    # Strip leading 'docs/' prefix to maintain consistent section extraction
    # New repo structure: docs/api-reference/... should become api-reference/...
    if file_path.startswith("docs/"):
        file_path = file_path[5:]  # Remove 'docs/' prefix

    parts = file_path.split("/")
    if len(parts) == 1:
        return parts[0], parts[0]
    if len(parts) == 2:
        return parts[0], parts[1]
    return "/".join(parts[:-1]), parts[-1]
