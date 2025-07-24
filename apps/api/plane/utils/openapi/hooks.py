"""
Schema processing hooks for drf-spectacular OpenAPI generation.

This module provides preprocessing and postprocessing functions that modify
the generated OpenAPI schema to apply custom filtering, tagging, and other
transformations.
"""


def preprocess_filter_api_v1_paths(endpoints):
    """
    Filter OpenAPI endpoints to only include /api/v1/ paths, exclude PUT methods,
    and exclude views that inherit from BaseServiceAPIView.
    """
    from plane.ee.views.api.base import BaseServiceAPIView

    filtered = []
    for path, path_regex, method, callback in endpoints:
        # Only include paths that start with /api/v1/ and exclude PUT methods
        if not (path.startswith("/api/v1/") and method.upper() != "PUT"):
            continue

        # Don't include any server or page endpoints
        if "server" in path.lower() or "page" in path.lower():
            continue

        # Check if the callback's view_class inherits from BaseServiceAPIView
        view_class = getattr(callback, "view_class", None)
        if view_class and issubclass(view_class, BaseServiceAPIView):
            continue  # Skip views that inherit from BaseServiceAPIView

        filtered.append((path, path_regex, method, callback))
    return filtered


def generate_operation_summary(method, path, tag):
    """
    Generate a human-readable summary for an operation.
    """
    # Extract the main resource from the path
    path_parts = [part for part in path.split("/") if part and not part.startswith("{")]

    if len(path_parts) > 0:
        resource = path_parts[-1].replace("-", " ").title()
    else:
        resource = tag

    # Generate summary based on method
    method_summaries = {
        "GET": f"Retrieve {resource}",
        "POST": f"Create {resource}",
        "PATCH": f"Update {resource}",
        "DELETE": f"Delete {resource}",
    }

    # Handle specific cases
    if "archive" in path.lower():
        if method == "POST":
            return f"Archive {tag.rstrip('s')}"
        elif method == "DELETE":
            return f"Unarchive {tag.rstrip('s')}"

    if "transfer" in path.lower():
        return f"Transfer {tag.rstrip('s')}"

    return method_summaries.get(method, f"{method} {resource}")
