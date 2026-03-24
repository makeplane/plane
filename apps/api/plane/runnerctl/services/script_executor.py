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
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from dataclasses import dataclass
from typing import Any, Optional

import requests
from django.conf import settings
from django.db import connection
from django.utils import timezone

from plane.authentication.utils.token_utils import generate_token_for_workspace_and_app

from ..models import Script, ScriptExecution, ScriptFunction

logger = logging.getLogger(__name__)

# Bounded thread pool for token generation to prevent DB connection exhaustion
_token_executor = ThreadPoolExecutor(max_workers=10, thread_name_prefix="runner-token")


def _generate_token_worker(workspace_id: str, app_slug: str) -> str | None:
    """
    Worker function that generates token in a separate thread.

    Each thread gets its own database connection, ensuring the token
    is committed independently of the caller's transaction.
    """
    try:
        return generate_token_for_workspace_and_app(workspace_id, app_slug)
    finally:
        # Return connection to pool when done
        connection.close()


def get_runner_access_token(workspace_id: str, timeout: int = 30) -> str | None:
    """
    Get access token for runner, ensuring it's committed and visible.

    Uses a separate thread with its own DB connection to avoid transaction
    isolation issues where the token wouldn't be visible to node-runner.

    Args:
        workspace_id: The workspace ID to get token for
        timeout: Maximum seconds to wait for token generation

    Returns:
        Access token string or None if generation failed

    Raises:
        TimeoutError: If token generation exceeds timeout
        RuntimeError: If token generation fails
    """
    try:
        future = _token_executor.submit(_generate_token_worker, workspace_id, "runner")
        return future.result(timeout=timeout)
    except FuturesTimeoutError:
        logger.error(f"Token generation timed out for workspace {workspace_id}")
        raise TimeoutError("Token generation timed out")
    except Exception as e:
        logger.exception(f"Token generation failed for workspace {workspace_id}")
        raise RuntimeError(f"Token generation failed: {e}") from e


def get_functions_for_workspace(
    workspace_id: str,
    function_names: Optional[list[str]] = None,
) -> list[dict]:
    """
    Fetch functions for execution.

    Args:
        workspace_id: The workspace ID to fetch functions for
        function_names: If provided, only fetch these functions. Empty list = no functions.
                       None = fetch all (fallback behavior).

    Returns:
        List of function dictionaries with code and metadata
    """
    from django.db.models import Q

    # No functions needed - return empty list
    if function_names is not None and len(function_names) == 0:
        return []

    query = Q(is_system=True) | Q(workspace_id=workspace_id)

    # Filter by names if provided
    if function_names is not None:
        query &= Q(name__in=function_names)

    functions = ScriptFunction.objects.filter(query).values(
        "id",
        "name",
        "description",
        "category",
        "parameters",
        "return_type",
        "code",
        "usage_example",
        "is_system",
    )

    return [
        {
            "id": str(fn["id"]),
            "name": fn["name"],
            "description": fn["description"],
            "category": fn["category"],
            "parameters": fn["parameters"] or [],
            "return_type": fn["return_type"],
            "code": fn["code"],
            "usage_example": fn["usage_example"] or "",
            "is_system": fn["is_system"],
        }
        for fn in functions
    ]


@dataclass
class ScriptExecutionResult:
    """Result of a script execution."""

    success: bool
    execution_id: Optional[str] = None
    script_id: Optional[str] = None
    script_name: Optional[str] = None
    output_data: Optional[Any] = None
    error: Optional[str] = None
    error_data: Optional[dict] = None


def execute_sync(
    # Either script_id OR code (one required)
    script_id: Optional[str] = None,
    code: Optional[str] = None,
    # Pre-built bundle and detected functions (for test runs with pre-validation)
    build: Optional[str] = None,
    function_names: Optional[list[str]] = None,
    # Common params
    input_data: Optional[dict] = None,
    execution_variables: Optional[dict[str, str]] = None,
    # Only needed when code is provided directly (ignored if script_id provided)
    workspace_id: Optional[str] = None,
    workspace_slug: Optional[str] = None,
    script_type: Optional[str] = None,
    code_type: Optional[str] = None,
    env_variables: Optional[dict] = None,
    allowed_domains: Optional[list] = None,
    # Trigger info
    trigger_type: str = "manual",
    trigger_id: Optional[str] = None,
    trigger_context: Optional[dict] = None,
) -> ScriptExecutionResult:
    """
    Execute code synchronously via Node Runner.

    Can execute either a saved script (by script_id) or code directly.

    Args:
        script_id: UUID of the script to execute (if using saved script)
        code: Code to execute directly (if not using saved script)
        build: Pre-built bundle (for test runs that already built the code)
        function_names: Detected function names (for test runs). If provided, only fetch these functions.
                       If None and using saved script, uses script.function_names.
        input_data: Input data to pass to the script
        execution_variables: Variables to pass to the script (key-value string pairs)
        workspace_id: Workspace ID for the execution (required if code provided, ignored if script_id provided)
        workspace_slug: Workspace slug for the execution (required if code provided, ignored if script_id provided)
        code_type: Type of code - inline or main_fn (ignored if script_id provided)
        env_variables: Environment variables (ignored if script_id provided)
        allowed_domains: Allowed domains for fetch (ignored if script_id provided)
        trigger_type: Type of trigger (test, manual, automation, etc.)
        trigger_id: UUID of the triggering entity
        trigger_context: Additional context about the trigger

    Returns:
        ScriptExecutionResult with execution details
    """
    input_data = input_data or {}

    # Validate: either script_id or code must be provided
    if not script_id and not code:
        return ScriptExecutionResult(
            success=False,
            error="Either script_id or code must be provided",
        )

    script = None
    exec_code = code
    exec_build = build  # Use provided build (for test runs) or None
    exec_function_names: Optional[list[str]] = function_names  # Use provided function_names or None
    exec_workspace_id: str | None = workspace_id
    exec_workspace_slug: str | None = workspace_slug
    exec_code_type = code_type
    exec_env_variables = env_variables
    exec_allowed_domains = allowed_domains
    exec_project = None

    # If script_id provided, fetch script and use its values
    if script_id:
        try:
            script = Script.objects.select_related("workspace").get(id=script_id)
            exec_code = script.code
            exec_build = script.build  # Use pre-built bundle if available
            exec_function_names = script.function_names  # Use stored function names
            # For system scripts, workspace is null — use the caller-provided values
            exec_workspace_id = script.workspace_id or workspace_id
            exec_workspace_slug = script.workspace.slug if script.workspace else workspace_slug
            exec_code_type = script.code_type
            exec_env_variables = script.env_variables
            exec_allowed_domains = script.allowed_domains
            exec_project = script.project
        except Script.DoesNotExist:
            return ScriptExecutionResult(
                success=False,
                script_id=script_id,
                error=f"Script with ID {script_id} not found",
            )

    # Validate workspace is available
    if not exec_workspace_id:
        return ScriptExecutionResult(
            success=False,
            script_id=script_id,
            error="Workspace is required when executing code directly",
        )

    # Step 1: Create execution record in pending state
    execution = ScriptExecution.objects.create(
        workspace_id=exec_workspace_id,
        project=exec_project,
        script=script,
        trigger_type=trigger_type,
        trigger_id=trigger_id,
        trigger_context=trigger_context,
        code=code if not script_id else None,
        code_type=code_type if not script_id else None,
        input_data=input_data,
        execution_variables=execution_variables,
        status="pending",
    )

    # Step 2: Make API call to Node Runner
    runner_service_url = getattr(settings, "RUNNER_BASE_URL", None)

    if not runner_service_url:
        # Update execution with error
        execution.status = "errored"
        execution.error_data = {"message": "Runner service is not configured"}
        execution.completed_at = timezone.now()
        execution.save(update_fields=["status", "error_data", "completed_at", "updated_at"])

        return ScriptExecutionResult(
            success=False,
            execution_id=str(execution.id),
            script_id=script_id,
            script_name=script.name if script else None,
            error="Runner service is not configured",
            error_data={"message": "Runner service is not configured"},
        )

    # Generate token in separate thread to ensure it's committed and visible to node-runner
    try:
        access_token = get_runner_access_token(exec_workspace_id)
    except (TimeoutError, RuntimeError) as e:
        execution.status = "errored"
        execution.error_data = {"message": f"Failed to get access token: {e}"}
        execution.completed_at = timezone.now()
        execution.save(update_fields=["status", "error_data", "completed_at", "updated_at"])

        return ScriptExecutionResult(
            success=False,
            execution_id=str(execution.id),
            script_id=script_id,
            script_name=script.name if script else None,
            error=f"Failed to get access token: {e}",
            error_data={"message": str(e)},
        )

    # Fetch only required functions (or all if exec_function_names is None - fallback)
    functions = get_functions_for_workspace(exec_workspace_id, exec_function_names)

    payload = {
        "code": exec_code,
        "build": exec_build,  # Pre-built bundle (if available) for faster execution
        "input_data": input_data,
        "event_type": script_type,
        "code_type": exec_code_type,
        "env_variables": exec_env_variables or {},
        "execution_variables": execution_variables or {},
        "allowed_domains": exec_allowed_domains or [],
        "access_token": access_token,
        "workspace_slug": exec_workspace_slug,
        "functions": functions,
    }

    try:
        logger.info(f"Calling Node Runner: {runner_service_url}/execute-sync for execution {execution.id}")

        execution.started_at = timezone.now()
        execution.status = "in_progress"
        execution.save(update_fields=["started_at", "status", "updated_at"])

        response = requests.post(
            f"{runner_service_url}/execute-sync",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=300,  # 5 minute timeout
        )

        result = response.json()

        # Step 3: Update execution with result
        execution.status = result.get("status", "errored")
        execution.output_data = result.get("output_data")
        execution.error_data = result.get("error_data")
        execution.completed_at = timezone.now()
        execution.save(update_fields=["status", "output_data", "error_data", "completed_at", "updated_at"])

        if result.get("status") == "completed":
            return ScriptExecutionResult(
                success=True,
                execution_id=str(execution.id),
                script_id=script_id,
                script_name=script.name if script else None,
                output_data=result.get("output_data"),
            )
        else:
            return ScriptExecutionResult(
                success=False,
                execution_id=str(execution.id),
                script_id=script_id,
                script_name=script.name if script else None,
                error=result.get("error_data", {}).get("message", "Script execution failed"),
                error_data=result.get("error_data"),
            )

    except requests.exceptions.Timeout:
        # Update execution with timeout error
        execution.status = "errored"
        execution.error_data = {"message": "Execution timed out"}
        execution.completed_at = timezone.now()
        execution.save(update_fields=["status", "error_data", "completed_at", "updated_at"])

        return ScriptExecutionResult(
            success=False,
            execution_id=str(execution.id),
            script_id=script_id,
            script_name=script.name if script else None,
            error="Execution timed out",
            error_data={"message": "Execution timed out"},
        )

    except requests.exceptions.RequestException as e:
        error_message = f"Failed to connect to runner service: {str(e)}"

        # Update execution with connection error
        execution.status = "errored"
        execution.error_data = {"message": error_message}
        execution.completed_at = timezone.now()
        execution.save(update_fields=["status", "error_data", "completed_at", "updated_at"])

        return ScriptExecutionResult(
            success=False,
            execution_id=str(execution.id),
            script_id=script_id,
            script_name=script.name if script else None,
            error=error_message,
            error_data={"message": error_message},
        )

    except Exception as e:
        error_message = f"Unexpected error: {str(e)}"
        logger.exception(f"Unexpected error executing script for execution {execution.id}")

        # Update execution with unexpected error
        execution.status = "errored"
        execution.error_data = {"message": error_message}
        execution.completed_at = timezone.now()
        execution.save(update_fields=["status", "error_data", "completed_at", "updated_at"])

        return ScriptExecutionResult(
            success=False,
            execution_id=str(execution.id),
            script_id=script_id,
            script_name=script.name if script else None,
            error=error_message,
            error_data={"message": error_message},
        )
