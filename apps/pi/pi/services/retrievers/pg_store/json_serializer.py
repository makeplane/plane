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
JSON Serialization utilities for handling non-serializable objects in pg_store.
"""

import json
from datetime import date
from datetime import datetime
from typing import Any
from uuid import UUID

from pi import logger

log = logger.getChild(__name__)


def make_json_serializable(obj: Any) -> Any:
    """
    Recursively convert an object to make it JSON serializable.

    This function handles common non-serializable types like:
    - Exception objects
    - datetime objects
    - UUID objects
    - Custom objects with __dict__
    - Sets, tuples
    """
    if obj is None:
        return None

    # Handle primitive types that are already serializable
    if isinstance(obj, (str, int, float, bool)):
        return obj

    # Handle datetime objects
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()

    # Handle UUID objects
    if isinstance(obj, UUID):
        return str(obj)

    # Handle Exception objects (including GroupingError and other custom exceptions)
    if isinstance(obj, Exception):
        return {"error_type": type(obj).__name__, "error_message": str(obj), "error_args": list(obj.args) if obj.args else None}

    # Handle dictionaries recursively
    if isinstance(obj, dict):
        return {key: make_json_serializable(value) for key, value in obj.items()}

    # Handle lists, tuples recursively
    if isinstance(obj, (list, tuple)):
        return [make_json_serializable(item) for item in obj]

    # Handle sets
    if isinstance(obj, set):
        return list(make_json_serializable(item) for item in obj)

    # Handle objects with __dict__ (custom objects)
    if hasattr(obj, "__dict__"):
        try:
            return make_json_serializable(obj.__dict__)
        except Exception as e:
            log.warning(f"Could not serialize object {type(obj).__name__}: {e}")
            return f"<{type(obj).__name__}: {str(obj)}>"

    # Handle other types by converting to string
    try:
        # Try to serialize to see if it's already serializable
        json.dumps(obj)
        return obj
    except (TypeError, ValueError):
        # If not serializable, convert to string representation
        log.debug(f"Converting non-serializable object {type(obj).__name__} to string")
        return f"<{type(obj).__name__}: {str(obj)}>"


def safe_json_dumps(obj: Any, **kwargs) -> str:
    """
    Safely serialize an object to JSON string, handling non-serializable objects.

    Args:
        obj: Object to serialize
        **kwargs: Additional arguments passed to json.dumps

    Returns:
        JSON string representation of the object
    """
    try:
        # First try normal serialization
        return json.dumps(obj, **kwargs)
    except (TypeError, ValueError) as e:
        log.debug(f"Standard JSON serialization failed: {e}, using safe serialization")
        # If that fails, use our custom serializer
        safe_obj = make_json_serializable(obj)
        return json.dumps(safe_obj, **kwargs)


def sanitize_execution_data(execution_data: Any) -> dict:
    """
    Sanitize execution_data to ensure it's JSON serializable for database storage.

    Args:
        execution_data: The execution data to sanitize

    Returns:
        A dictionary that is guaranteed to be JSON serializable
    """
    if execution_data is None:
        return {}

    try:
        # If it's already a dict, sanitize its contents
        if isinstance(execution_data, dict):
            sanitized = make_json_serializable(execution_data)
        else:
            # If it's not a dict, try to make it serializable and wrap in a dict
            sanitized = {"data": make_json_serializable(execution_data)}

        # Verify it can actually be serialized
        json.dumps(sanitized)
        return sanitized

    except Exception as e:
        log.error(f"Failed to sanitize execution_data: {e}")
        # Return a safe fallback
        return {
            "sanitization_error": str(e),
            "original_type": type(execution_data).__name__,
            "original_repr": str(execution_data)[:1000],  # Truncate to avoid huge strings
        }
