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

from typing import Any

from pi import logger
from pi import settings
from pi.vectorizer.docs.api_code_generator import generate_api_code_examples
from pi.vectorizer.docs.github_fetcher import fetch_file_content_raw
from pi.vectorizer.docs.github_fetcher import get_all_doc_files_from_tree
from pi.vectorizer.docs.initial_feed import clean_text
from pi.vectorizer.docs.mdx_processor import parse_path
from pi.vectorizer.docs.mdx_processor import process_mdx_file

log = logger.getChild(__name__)


def process_file_from_raw_content(repo_name: str, file_path: str, content: str) -> dict[str, Any]:
    """
    Process a file from raw content (fetched via raw.githubusercontent.com).
    Similar to process_file() but uses pre-fetched content instead of API.

    Args:
        repo_name: Repository name
        file_path: Path to file in repository
        content: Raw file content

    Returns:
        Dictionary with processed file data
    """
    unique_id = file_path.replace("/", "_").replace("-", "_").replace(".mdx", "").replace(".md", "").replace(".txt", "")

    if content is None or content.strip() == "":
        log.warning(f"Empty or invalid content for file: {file_path}")
        processed_content = ""
    else:
        txt_content = process_mdx_file(content)
        if "api-reference" in file_path:
            processed_content = generate_api_code_examples(txt_content)
        else:
            processed_content = txt_content

    section, subsection = parse_path(file_path)

    # Clean the text to remove control characters
    processed_content = clean_text(processed_content)
    section = clean_text(section)
    subsection = clean_text(subsection.replace(".mdx", "").replace(".md", "").replace(".txt", ""))

    return {
        "id": unique_id,
        "section": section,
        "subsection": subsection,
        "content": processed_content,
    }


def fetch_and_process_files(repo_name: str, file_paths: list[str], branch: str) -> tuple[list[dict[str, Any]], list[str]]:
    """
    Fetch and process multiple files from GitHub.
    Uses raw.githubusercontent.com for fetching.

    Args:
        repo_name: Repository name
        file_paths: List of file paths to process
        branch: Branch name

    Returns:
        Tuple of (successfully_processed_docs, failed_file_paths)
    """
    docs_to_index = []
    failed_files = []

    repo_owner = settings.vector_db.DOCS_REPO_OWNER

    for file_path in file_paths:
        try:
            # Fetch file content via raw URL
            content = fetch_file_content_raw(repo_owner, repo_name, branch, file_path)

            if content is None:
                log.warning(f"Failed to fetch content for {file_path}")
                failed_files.append(file_path)
                continue

            # Process the file
            doc = process_file_from_raw_content(repo_name, file_path, content)

            # Only add if content is not empty
            if doc["content"].strip():
                docs_to_index.append(doc)
            else:
                log.warning(f"Skipping {file_path} - empty content after processing")

        except Exception as e:
            log.error(f"Error processing file {file_path}: {e}")
            failed_files.append(file_path)

    # Only log if there are failures
    if failed_files:
        log.warning(f"Failed to process {len(failed_files)} files from {repo_name}: {failed_files[:5]}")

    return docs_to_index, failed_files


def get_all_files_for_full_feed(repo_name: str, branch: str) -> tuple[list[str] | None, str | None]:
    """
    Get all documentation files for a full feed operation.
    Uses git tree API for efficient retrieval.

    Args:
        repo_name: Repository name
        branch: Branch name

    Returns:
        Tuple of (file_list, error_message)
        - If successful: (list of file paths, None)
        - If failed: (None, error_message)
    """
    repo_owner = settings.vector_db.DOCS_REPO_OWNER
    return get_all_doc_files_from_tree(repo_owner, repo_name, branch)
