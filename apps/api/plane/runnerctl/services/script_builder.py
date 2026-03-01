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

import logging
from dataclasses import dataclass, field
from typing import Optional

import requests
from django.conf import settings
from django.db.models import Q

from ..models import ScriptFunction

logger = logging.getLogger(__name__)


def validate_function_names(workspace_id: str, function_names: list[str]) -> tuple[bool, list[str]]:
    """
    Validate that all function names exist (system or workspace).

    Args:
        workspace_id: The workspace ID to check workspace functions against
        function_names: List of function names to validate

    Returns:
        (is_valid, missing_functions) tuple
    """
    if not function_names:
        return True, []

    # Get all available function names for this workspace
    available = set(
        ScriptFunction.objects.filter(Q(is_system=True) | Q(workspace_id=workspace_id)).values_list("name", flat=True)
    )

    missing = [name for name in function_names if name not in available]
    return len(missing) == 0, missing


@dataclass
class BuildResult:
    """Result of a script build operation."""

    success: bool
    build: Optional[str] = None
    function_names: list[str] = field(default_factory=list)
    error: Optional[str] = None


def build_script(script, validate_functions: bool = True) -> BuildResult:
    """
    Build script code via Node Runner and store the bundle.

    Args:
        script: Script model instance with code and code_type fields
        validate_functions: Whether to validate function names exist (default True)

    Returns:
        BuildResult with success status, build output, function_names, or error
    """
    runner_service_url = getattr(settings, "RUNNER_BASE_URL", None)

    if not runner_service_url:
        logger.warning(f"Runner service not configured, skipping build for script {script.id}")
        return BuildResult(success=False, error="Runner service is not configured")

    try:
        logger.info(f"Building script {script.id} via Node Runner...")

        response = requests.post(
            f"{runner_service_url}/build",
            json={
                "code": script.code,
                "code_type": script.code_type,
            },
            headers={"Content-Type": "application/json"},
            timeout=60,
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                build = result.get("build")
                function_names = result.get("function_names", [])

                # Validate function names exist
                if validate_functions and function_names:
                    is_valid, missing = validate_function_names(str(script.workspace_id), function_names)
                    if not is_valid:
                        error = f"Unknown functions: {', '.join(missing)}"
                        logger.warning(f"Function validation failed for script {script.id}: {error}")
                        return BuildResult(success=False, error=error, function_names=function_names)

                # Update script with build and function_names
                script.build = build
                script.function_names = function_names
                script.save(update_fields=["build", "function_names", "updated_at"])
                logger.info(f"Build successful for script {script.id}, functions: {function_names}")
                return BuildResult(success=True, build=script.build, function_names=function_names)
            else:
                error = result.get("error", "Unknown build error")
                logger.warning(f"Build failed for script {script.id}: {error}")
                return BuildResult(success=False, error=error)
        else:
            error = f"Build request failed with status {response.status_code}"
            logger.warning(f"Build failed for script {script.id}: {error}")
            return BuildResult(success=False, error=error)

    except requests.exceptions.Timeout:
        logger.warning(f"Build timed out for script {script.id}")
        return BuildResult(success=False, error="Build timed out")

    except requests.exceptions.RequestException as e:
        error = f"Failed to connect to runner service: {str(e)}"
        logger.warning(f"Build failed for script {script.id}: {error}")
        return BuildResult(success=False, error=error)

    except Exception as e:
        error = f"Unexpected error during build: {str(e)}"
        logger.exception(f"Build failed for script {script.id}")
        return BuildResult(success=False, error=error)


def clear_build(script) -> None:
    """
    Clear the pre-built bundle and function names for a script.

    Args:
        script: Script model instance
    """
    if script.build or script.function_names:
        script.build = None
        script.function_names = []
        script.save(update_fields=["build", "function_names", "updated_at"])
        logger.info(f"Cleared build for script {script.id}")
