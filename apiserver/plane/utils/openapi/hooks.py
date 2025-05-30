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
        if path.startswith("/api/v1/") and method.upper() != "PUT":
            filtered.append((path, path_regex, method, callback))
    return filtered


def postprocess_assign_tags(result, generator, request, public):
    """
    Post-process the OpenAPI schema to assign tags to endpoints based on URL patterns.
    Tags are defined in SPECTACULAR_SETTINGS["TAGS"].
    """
    # Define tag mapping based on URL patterns - ORDER MATTERS (most specific first)
    tag_mappings = [
        {
            "patterns": [
                "/projects/{project_id}/intake-issues/{",
                "/intake-issues/",
            ],
            "tag": "Intake",
        },
        {
            "patterns": [
                "/projects/{project_id}/cycles/",
                "/cycles/{cycle_id}/",
                "/archived-cycles/",
                "/cycle-issues/",
                "/transfer-issues/",
                "/transfer/",
            ],
            "tag": "Cycles",
        },
        {
            "patterns": [
                "/projects/{project_id}/modules/",
                "/modules/{module_id}/",
                "/archived-modules/",
                "/module-issues/",
            ],
            "tag": "Modules",
        },
        {
            "patterns": [
                "/projects/{project_id}/issues/",
                "/issue-attachments/",
            ],
            "tag": "Work Items",
        },
        {
            "patterns": ["/projects/{project_id}/states/", "/states/{state_id}/"],
            "tag": "States",
        },
        {"patterns": ["/projects/{project_id}/labels/", "/labels/{"], "tag": "Labels"},
        {"patterns": ["/members/", "/members/{"], "tag": "Members"},
        {"patterns": ["/assets/", "/user-assets/", "/generic-asset"], "tag": "Assets"},
        {"patterns": ["/users/", "/users/{"], "tag": "Users"},
        {"patterns": ["/projects/", "/projects/{", "/archive/"], "tag": "Projects"},
    ]

    # Assign tags to endpoints based on URL patterns
    for path, path_info in result.get("paths", {}).items():
        for method, operation in path_info.items():
            if method.upper() in ["GET", "POST", "PATCH", "DELETE"]:
                # Find the appropriate tag - check most specific patterns first
                assigned_tag = "General"  # Default tag

                for tag_info in tag_mappings:
                    for pattern in tag_info["patterns"]:
                        if pattern in path:
                            assigned_tag = tag_info["tag"]
                            break
                    if assigned_tag != "General":
                        break

                # Assign the tag
                operation["tags"] = [assigned_tag]

                # Add better summaries based on method and path
                if "summary" not in operation:
                    operation["summary"] = generate_operation_summary(
                        method.upper(), path, assigned_tag
                    )

    return result


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