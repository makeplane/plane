"""
Schema processing hooks for drf-spectacular OpenAPI generation.

This module provides preprocessing and postprocessing functions that modify
the generated OpenAPI schema to apply custom filtering, tagging, and other
transformations.
"""


def preprocess_filter_api_v1_paths(endpoints):
    """
    Filter OpenAPI endpoints to only include /api/v1/ paths and exclude PUT methods.
    """
    filtered = []
    for path, path_regex, method, callback in endpoints:
        # Only include paths that start with /api/v1/ and exclude PUT methods
        if (
            path.startswith("/api/v1/")
            and method.upper() != "PUT"
            and "server" not in path.lower()
        ):
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
            return f'Archive {tag.rstrip("s")}'
        elif method == "DELETE":
            return f'Unarchive {tag.rstrip("s")}'

    if "transfer" in path.lower():
        return f'Transfer {tag.rstrip("s")}'

    return method_summaries.get(method, f"{method} {resource}")
