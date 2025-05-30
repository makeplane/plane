"""
Common OpenAPI parameters for drf-spectacular.

This module provides reusable parameter definitions that can be shared
across multiple API endpoints to ensure consistency.
"""

from drf_spectacular.utils import OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes


# Path Parameters
WORKSPACE_SLUG_PARAMETER = OpenApiParameter(
    name="slug",
    description="Workspace slug",
    required=True,
    type=OpenApiTypes.STR,
    location=OpenApiParameter.PATH,
    examples=[
        OpenApiExample(
            name="Example workspace",
            value="my-workspace",
            description="A typical workspace slug",
        )
    ],
)

PROJECT_ID_PARAMETER = OpenApiParameter(
    name="project_id",
    description="Project ID",
    required=True,
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
    examples=[
        OpenApiExample(
            name="Example project ID",
            value="550e8400-e29b-41d4-a716-446655440000",
            description="A typical project UUID",
        )
    ],
)

ASSET_ID_PARAMETER = OpenApiParameter(
    name="asset_id",
    description="Asset ID",
    required=True,
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
    examples=[
        OpenApiExample(
            name="Example asset ID",
            value="550e8400-e29b-41d4-a716-446655440000",
            description="A typical asset UUID",
        )
    ],
)


# Query Parameters
CURSOR_PARAMETER = OpenApiParameter(
    name="cursor",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.QUERY,
    description="Pagination cursor for getting next set of results",
    required=False,
)

PER_PAGE_PARAMETER = OpenApiParameter(
    name="per_page",
    type=OpenApiTypes.INT,
    location=OpenApiParameter.QUERY,
    description="Number of results per page (default: 20, max: 100)",
    required=False,
    examples=[
        OpenApiExample(name="Default", value=20),
        OpenApiExample(name="Maximum", value=100),
    ],
) 