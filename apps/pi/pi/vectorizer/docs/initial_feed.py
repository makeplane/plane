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
Initial documentation feed utilities.
Handles fetching and processing documentation from GitHub repositories.
"""

import json
import re
from typing import Any

import requests

from pi import logger
from pi import settings
from pi.vectorizer.docs.api_code_generator import generate_api_code_examples
from pi.vectorizer.docs.mdx_processor import parse_path
from pi.vectorizer.docs.mdx_processor import process_mdx_file

log = logger


def clean_text(text: str | None) -> str:
    if not text:
        return ""

    # Remove control characters and non-printable characters
    cleaned_text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]", "", text)

    escaped = json.dumps(cleaned_text)

    # Remove the surrounding quotes that json.dumps adds since opensearch ingestion pipeline adds them again
    if escaped.startswith('"') and escaped.endswith('"'):
        escaped = escaped[1:-1]

    return escaped


def get_repo_contents(repo_name: str, path: str = "") -> list[dict] | str:
    """Fetch repository contents from GitHub API for a specific repository (public repo, no auth needed)."""
    url = f"https://api.github.com/repos/{settings.vector_db.DOCS_REPO_OWNER}/{repo_name}/contents/{path}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        error_message = f"Failed to fetch repository contents: {e}"
        log.error(error_message)
        return error_message


def get_file_content(repo_name: str, file_path: str) -> str:
    """
    Retrieves file content from GitHub repository using API (public repo, no auth needed).

    Args:
        repo_name: Repository name (e.g., "docs")
        file_path: Path to file in repository

    Returns:
        File content as string, or empty string if failed
    """
    url = f"https://api.github.com/repos/{settings.vector_db.DOCS_REPO_OWNER}/{repo_name}/contents/{file_path}"
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        import base64

        content = response.json()["content"]
        return base64.b64decode(content).decode("utf-8")
    except requests.RequestException as e:
        log.error(f"Failed to fetch file content for {file_path}: {e}")
        return ""


def process_file(repo_name: str, file_path: str) -> dict[str, Any]:
    """
    Process a single file and return its content as a dictionary.

    Args:
        repo_name: Repository name
        file_path: Path to file in repository

    Returns:
        Dictionary with processed file data
    """
    unique_id = file_path.replace("/", "_").replace("-", "_").replace(".mdx", "").replace(".txt", "")
    content = get_file_content(repo_name, file_path)
    if content is None or content.strip() == "":
        log.warning(f"Empty or invalid content for file: {file_path}")
        content = ""
    else:
        txt_content = process_mdx_file(content)
        if "api-reference" in file_path:
            content = generate_api_code_examples(txt_content)
        else:
            content = txt_content
    section, subsection = parse_path(file_path)

    # Clean the text to remove control characters
    content = clean_text(content)
    section = clean_text(section)
    subsection = clean_text(subsection.replace(".mdx", "").replace(".txt", ""))

    return {
        "id": unique_id,
        "section": section,
        "subsection": subsection,
        "content": content,
    }


def is_valid_doc_file(file_name: str) -> bool:
    """Check if a file is a valid documentation file."""
    return file_name.endswith(".mdx") or file_name.endswith(".txt")


def process_repo_contents(repo_name: str, path: str = "") -> list[dict[str, Any]]:
    """Process repository contents for a specific repository."""
    feed: list[dict[str, Any]] = []
    contents = get_repo_contents(repo_name, path)

    # Check if contents is an error response
    if isinstance(contents, str):
        log.error(f"Error getting repo contents: {contents}")
        return feed

    if not contents:
        return feed

    files_to_process = [item for item in contents if item["type"] == "file" and is_valid_doc_file(item["name"])]
    dirs_to_process = [item for item in contents if item["type"] == "dir"]

    # Only log the count of files found, not individual files
    if files_to_process and path == "":
        log.info(f"Found {len(files_to_process)} document files in {repo_name}/{path}")

    for item in files_to_process:
        processed = process_file(repo_name, item["path"])
        if processed["content"].strip() == "":
            continue
        feed.append(processed)

    for dir_item in dirs_to_process:
        sub_feed = process_repo_contents(repo_name, dir_item["path"])
        feed.extend(sub_feed)

    return feed


def get_all_file_paths(repo_name: str, path: str = "") -> list[str] | str:
    """Get all documentation file paths from a repository for initial feeding."""
    file_paths: list[str] = []
    contents = get_repo_contents(repo_name, path)

    # Check if contents is an error response
    if isinstance(contents, str):
        return contents

    if not contents:
        return file_paths

    files_to_process = [item for item in contents if item["type"] == "file" and is_valid_doc_file(item["name"])]
    dirs_to_process = [item for item in contents if item["type"] == "dir"]

    # Collect file paths
    for item in files_to_process:
        file_paths.append(item["path"])

    # Recursively process directories
    for dir_item in dirs_to_process:
        sub_paths = get_all_file_paths(repo_name, dir_item["path"])
        # Check if sub_paths is an error response
        if isinstance(sub_paths, str):
            return sub_paths
        file_paths.extend(sub_paths)

    if path == "":  # Only log at root level
        log.info(f"Found {len(file_paths)} documentation file paths in {repo_name} for initial feeding")

    return file_paths


# if __name__ == "__main__":
#     # Example usage
#     repo_name = "developer-docs"
#     path = ""
#     contents = process_repo_contents(repo_name, path)
#     for item in contents:
#         print(item)
