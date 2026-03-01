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
GitHub documentation fetcher without authentication.

Fetches documentation from public GitHub repositories without requiring API tokens.
Uses two approaches:
- GitHub public API for commit information and file lists
- raw.githubusercontent.com for file content

Designed for self-hosted deployments where GitHub webhooks and API tokens are not available.
"""

from typing import Any

import requests

from pi import logger

log = logger.getChild(__name__)


def get_latest_commit_sha(repo_owner: str, repo_name: str, branch: str) -> tuple[str | None, str | None]:
    """
    Get the latest commit SHA for a given branch using public GitHub API.
    No authentication required for public repos.

    Args:
        repo_owner: GitHub repository owner (e.g., "makeplane")
        repo_name: Repository name (e.g., "docs")
        branch: Branch name (e.g., "master")

    Returns:
        Tuple of (commit_sha, error_message)
        - If successful: (sha, None)
        - If failed: (None, error_message)
    """
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/commits/{branch}"

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        sha = data.get("sha")
        if sha:
            log.info(f"Latest commit for {repo_name}/{branch}: {sha}")
            return sha, None
        else:
            error_msg = f"No SHA found in response for {repo_name}/{branch}"
            log.error(error_msg)
            return None, error_msg

    except requests.exceptions.HTTPError as e:
        error_msg = f"HTTP error getting latest commit for {repo_name}/{branch}: {e.response.status_code} - {e}"
        log.error(error_msg)
        return None, error_msg

    except requests.exceptions.RequestException as e:
        error_msg = f"Failed to get latest commit for {repo_name}/{branch}: {e}"
        log.error(error_msg)
        return None, error_msg


def get_file_changes_between_commits(repo_owner: str, repo_name: str, base_sha: str, head_sha: str) -> dict[str, Any]:
    """
    Get file changes between two commits using public GitHub API.
    No authentication required for public repos.

    Args:
        repo_owner: GitHub repository owner
        repo_name: Repository name
        base_sha: Base commit SHA
        head_sha: Head commit SHA

    Returns:
        Dictionary with 'added', 'modified', 'removed' lists, or 'error' string
    """
    if base_sha == head_sha:
        return {"added": [], "modified": [], "removed": []}

    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/compare/{base_sha}...{head_sha}"

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        files = data.get("files", [])

        # Filter for documentation files only (.mdx, .md, and .txt)
        # Exclude README.md and CONTRIBUTING.md
        def is_doc_file(filename: str) -> bool:
            # Check if it's a documentation file
            if not (filename.endswith(".mdx") or filename.endswith(".md") or filename.endswith(".txt")):
                return False

            # Exclude README.md and CONTRIBUTING.md (case-insensitive, any path)
            basename = filename.split("/")[-1].upper()
            if basename in ["README.MD", "CONTRIBUTING.MD"]:
                return False

            return True

        added = []
        modified = []
        removed = []

        for file in files:
            filename = file.get("filename", "")
            if not is_doc_file(filename):
                continue

            status = file.get("status", "")
            if status == "added":
                added.append(filename)
            elif status == "modified":
                modified.append(filename)
            elif status == "removed":
                removed.append(filename)
            elif status == "renamed":
                # Handle renamed files
                previous_filename = file.get("previous_filename", "")
                if is_doc_file(previous_filename):
                    removed.append(previous_filename)
                added.append(filename)

        log.info(
            f"Changes for {repo_name} ({base_sha[:7]}..{head_sha[:7]}): " f"Added: {len(added)}, Modified: {len(modified)}, Removed: {len(removed)}"
        )

        return {"added": added, "modified": modified, "removed": removed}

    except requests.exceptions.HTTPError as e:
        error_message = f"HTTP error getting file changes for {repo_name}: {e.response.status_code} - {e}"
        log.error(error_message)
        return {"added": [], "modified": [], "removed": [], "error": error_message}

    except requests.exceptions.RequestException as e:
        error_message = f"Failed to get file changes for {repo_name}: {e}"
        log.error(error_message)
        return {"added": [], "modified": [], "removed": [], "error": error_message}


def fetch_file_content_raw(repo_owner: str, repo_name: str, branch: str, file_path: str) -> str | None:
    """
    Fetch file content via raw.githubusercontent.com.
    No authentication required.

    Args:
        repo_owner: GitHub repository owner
        repo_name: Repository name
        branch: Branch name
        file_path: Path to file in repository

    Returns:
        File content as string or None if failed
    """
    url = f"https://raw.githubusercontent.com/{repo_owner}/{repo_name}/{branch}/{file_path}"

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.text
    except requests.exceptions.RequestException as e:
        log.error(f"Failed to fetch raw content for {file_path} from {repo_name}: {e}")
        return None


def get_all_doc_files_from_tree(repo_owner: str, repo_name: str, branch: str) -> tuple[list[str] | None, str | None]:
    """
    Get all documentation files from repository using git tree API.
    Uses recursive tree to get all files in one API call.
    No authentication required for public repos.

    Args:
        repo_owner: GitHub repository owner
        repo_name: Repository name
        branch: Branch name

    Returns:
        Tuple of (file_list, error_message)
        - If successful: (list of file paths, None)
        - If failed: (None, error_message)
    """
    # First get the commit SHA for the branch
    commit_sha, error = get_latest_commit_sha(repo_owner, repo_name, branch)
    if not commit_sha:
        return None, error or "Failed to get commit SHA"

    # Get the tree recursively
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/git/trees/{commit_sha}?recursive=1"

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        tree = data.get("tree", [])

        # Filter for documentation files (.mdx, .md, .txt)
        # Exclude README.md and CONTRIBUTING.md
        def is_doc_file(path: str) -> bool:
            # Check if it's a documentation file
            if not (path.endswith(".mdx") or path.endswith(".md") or path.endswith(".txt")):
                return False

            # Exclude README.md and CONTRIBUTING.md (case-insensitive, any path)
            basename = path.split("/")[-1].upper()
            if basename in ["README.MD", "CONTRIBUTING.MD"]:
                return False

            return True

        doc_files = [item["path"] for item in tree if item["type"] == "blob" and is_doc_file(item["path"])]

        log.info(f"Found {len(doc_files)} documentation files in {repo_name}/{branch}")
        return doc_files, None

    except requests.exceptions.HTTPError as e:
        error_message = f"HTTP error getting file tree for {repo_name}: {e.response.status_code} - {e}"
        log.error(error_message)
        return None, error_message

    except requests.exceptions.RequestException as e:
        error_message = f"Failed to get file tree for {repo_name}: {e}"
        log.error(error_message)
        return None, error_message
