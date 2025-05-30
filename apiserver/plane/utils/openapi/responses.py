"""
Common OpenAPI responses for drf-spectacular.

This module provides reusable response definitions for common HTTP status codes
and scenarios that occur across multiple API endpoints.
"""

from drf_spectacular.utils import OpenApiResponse, OpenApiExample


# Authentication & Authorization Responses
UNAUTHORIZED_RESPONSE = OpenApiResponse(
    description="Authentication credentials were not provided or are invalid.",
    examples=[
        OpenApiExample(
            name="Unauthorized",
            value={
                "error": "Authentication credentials were not provided",
                "error_code": "AUTHENTICATION_REQUIRED",
            },
        )
    ],
)

FORBIDDEN_RESPONSE = OpenApiResponse(
    description="Permission denied. User lacks required permissions.",
    examples=[
        OpenApiExample(
            name="Forbidden",
            value={
                "error": "You do not have permission to perform this action",
                "error_code": "PERMISSION_DENIED",
            },
        )
    ],
)


# Resource Responses
NOT_FOUND_RESPONSE = OpenApiResponse(
    description="The requested resource was not found.",
    examples=[
        OpenApiExample(
            name="Not Found",
            value={"error": "Not found", "error_code": "RESOURCE_NOT_FOUND"},
        )
    ],
)

VALIDATION_ERROR_RESPONSE = OpenApiResponse(
    description="Validation error occurred with the provided data.",
    examples=[
        OpenApiExample(
            name="Validation Error",
            value={
                "error": "Validation failed",
                "details": {"field_name": ["This field is required."]},
            },
        )
    ],
)


# Asset-specific Responses
PRESIGNED_URL_SUCCESS_RESPONSE = OpenApiResponse(
    description="Presigned URL generated successfully"
)

GENERIC_ASSET_UPLOAD_SUCCESS_RESPONSE = OpenApiResponse(
    description="Presigned URL generated successfully",
    examples=[
        OpenApiExample(
            name="Generic Asset Upload Response",
            value={
                "upload_data": {
                    "url": "https://s3.amazonaws.com/bucket-name",
                    "fields": {
                        "key": "workspace-id/uuid-filename.pdf",
                        "AWSAccessKeyId": "AKIA...",
                        "policy": "eyJ...",
                        "signature": "abc123..."
                    }
                },
                "asset_id": "550e8400-e29b-41d4-a716-446655440000",
                "asset_url": "https://cdn.example.com/workspace-id/uuid-filename.pdf"
            }
        )
    ]
)

GENERIC_ASSET_VALIDATION_ERROR_RESPONSE = OpenApiResponse(
    description="Validation error",
    examples=[
        OpenApiExample(
            name="Missing required fields",
            value={
                "error": "Name and size are required fields.",
                "status": False
            }
        ),
        OpenApiExample(
            name="Invalid file type",
            value={
                "error": "Invalid file type.",
                "status": False
            }
        )
    ]
)

ASSET_CONFLICT_RESPONSE = OpenApiResponse(
    description="Asset with same external ID already exists",
    examples=[
        OpenApiExample(
            name="Duplicate external asset",
            value={
                "message": "Asset with same external id and source already exists",
                "asset_id": "550e8400-e29b-41d4-a716-446655440000",
                "asset_url": "https://cdn.example.com/existing-file.pdf"
            }
        )
    ]
)

ASSET_DOWNLOAD_SUCCESS_RESPONSE = OpenApiResponse(
    description="Presigned download URL generated successfully",
    examples=[
        OpenApiExample(
            name="Asset Download Response",
            value={
                "asset_id": "550e8400-e29b-41d4-a716-446655440000",
                "asset_url": "https://s3.amazonaws.com/bucket/file.pdf?signed-url",
                "asset_name": "document.pdf",
                "asset_type": "application/pdf"
            }
        )
    ]
)

ASSET_DOWNLOAD_ERROR_RESPONSE = OpenApiResponse(
    description="Bad request",
    examples=[
        OpenApiExample(
            name="Asset not uploaded",
            value={"error": "Asset not yet uploaded"}
        ),
    ]
)

ASSET_UPDATED_RESPONSE = OpenApiResponse(
    description="Asset updated successfully"
)

ASSET_DELETED_RESPONSE = OpenApiResponse(
    description="Asset deleted successfully"
)

ASSET_NOT_FOUND_RESPONSE = OpenApiResponse(
    description="Asset not found",
    examples=[
        OpenApiExample(
            name="Asset not found",
            value={"error": "Asset not found"}
        )
    ]
) 