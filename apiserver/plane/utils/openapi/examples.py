"""
Common OpenAPI examples for drf-spectacular.

This module provides reusable example data for API responses and requests
to make the generated documentation more helpful and realistic.
"""

from drf_spectacular.utils import OpenApiExample


# File Upload Examples
FILE_UPLOAD_EXAMPLE = OpenApiExample(
    name="File Upload Success",
    value={
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "asset": "uploads/workspace_1/file_example.pdf",
        "attributes": {
            "name": "example-document.pdf",
            "size": 1024000,
            "mimetype": "application/pdf",
        },
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
    },
)


# Workspace Examples
WORKSPACE_EXAMPLE = OpenApiExample(
    name="Workspace",
    value={
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "My Workspace",
        "slug": "my-workspace",
        "organization_size": "1-10",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
    },
)


# Project Examples
PROJECT_EXAMPLE = OpenApiExample(
    name="Project",
    value={
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Mobile App Development",
        "description": "Development of the mobile application",
        "identifier": "MAD",
        "network": 2,
        "project_lead": "550e8400-e29b-41d4-a716-446655440001",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
    },
)


# Issue Examples
ISSUE_EXAMPLE = OpenApiExample(
    name="Issue",
    value={
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Implement user authentication",
        "description": "Add OAuth 2.0 authentication flow",
        "sequence_id": 1,
        "priority": "high",
        "assignees": ["550e8400-e29b-41d4-a716-446655440001"],
        "labels": ["550e8400-e29b-41d4-a716-446655440002"],
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
    },
) 