# Python Imports
import uuid

# Django Imports
from django.utils import timezone
from django.conf import settings

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# drf-spectacular imports
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiResponse, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

# Module Imports
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata
from plane.settings.storage import S3Storage
from plane.db.models import FileAsset, User, Workspace
from plane.api.views.base import BaseAPIView
from plane.utils.openapi_spec_helpers import (
    UNAUTHORIZED_RESPONSE,
    FORBIDDEN_RESPONSE,
    NOT_FOUND_RESPONSE
)

class UserAssetEndpoint(BaseAPIView):
    """This endpoint is used to upload user profile images."""

    def asset_delete(self, asset_id):
        asset = FileAsset.objects.filter(id=asset_id).first()
        if asset is None:
            return
        asset.is_deleted = True
        asset.deleted_at = timezone.now()
        asset.save(update_fields=["is_deleted", "deleted_at"])
        return

    def entity_asset_delete(self, entity_type, asset, request):
        # User Avatar
        if entity_type == FileAsset.EntityTypeContext.USER_AVATAR:
            user = User.objects.get(id=asset.user_id)
            user.avatar_asset_id = None
            user.save()
            return
        # User Cover
        if entity_type == FileAsset.EntityTypeContext.USER_COVER:
            user = User.objects.get(id=asset.user_id)
            user.cover_image_asset_id = None
            user.save()
            return
        return

    @extend_schema(
        operation_id="create_user_asset_upload",
        tags=["Assets"],
        summary="Generate presigned URL for user asset upload",
        description="""
        Create a presigned URL for uploading user profile assets (avatar or cover image).
        This endpoint generates the necessary credentials for direct S3 upload.
        """,
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'name': {
                        'type': 'string',
                        'description': 'Original filename of the asset'
                    },
                    'type': {
                        'type': 'string',
                        'description': 'MIME type of the file',
                        'enum': ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'],
                        'default': 'image/jpeg'
                    },
                    'size': {
                        'type': 'integer',
                        'description': 'File size in bytes'
                    },
                    'entity_type': {
                        'type': 'string',
                        'description': 'Type of user asset',
                        'enum': ['USER_AVATAR', 'USER_COVER']
                    }
                },
                'required': ['name', 'entity_type']
            }
        },
        responses={
            200: OpenApiResponse(
                description="Presigned URL generated successfully",
                examples=[
                    OpenApiExample(
                        name="Presigned URL Response",
                        value={
                            "upload_data": {
                                "url": "https://s3.amazonaws.com/bucket-name",
                                "fields": {
                                    "key": "uuid-filename.jpg",
                                    "AWSAccessKeyId": "AKIA...",
                                    "policy": "eyJ...",
                                    "signature": "abc123..."
                                }
                            },
                            "asset_id": "550e8400-e29b-41d4-a716-446655440000",
                            "asset_url": "https://cdn.example.com/uuid-filename.jpg"
                        }
                    )
                ]
            ),
            400: OpenApiResponse(
                description="Validation error",
                examples=[
                    OpenApiExample(
                        name="Invalid entity type",
                        value={
                            "error": "Invalid entity type.",
                            "status": False
                        }
                    ),
                    OpenApiExample(
                        name="Invalid file type",
                        value={
                            "error": "Invalid file type. Only JPEG and PNG files are allowed.",
                            "status": False
                        }
                    )
                ]
            ),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
        }
    )
    def post(self, request):
        # get the asset key
        name = request.data.get("name")
        type = request.data.get("type", "image/jpeg")
        size = int(request.data.get("size", settings.FILE_SIZE_LIMIT))
        entity_type = request.data.get("entity_type", False)

        # Check if the file size is within the limit
        size_limit = min(size, settings.FILE_SIZE_LIMIT)

        #  Check if the entity type is allowed
        if not entity_type or entity_type not in ["USER_AVATAR", "USER_COVER"]:
            return Response(
                {"error": "Invalid entity type.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the file type is allowed
        allowed_types = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/jpg",
            "image/gif",
        ]
        if type not in allowed_types:
            return Response(
                {
                    "error": "Invalid file type. Only JPEG and PNG files are allowed.",
                    "status": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # asset key
        asset_key = f"{uuid.uuid4().hex}-{name}"

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={"name": name, "type": type, "size": size_limit},
            asset=asset_key,
            size=size_limit,
            user=request.user,
            created_by=request.user,
            entity_type=entity_type,
        )

        # Get the presigned URL
        storage = S3Storage(request=request)
        # Generate a presigned URL to share an S3 object
        presigned_url = storage.generate_presigned_post(
            object_name=asset_key, file_type=type, file_size=size_limit
        )
        # Return the presigned URL
        return Response(
            {
                "upload_data": presigned_url,
                "asset_id": str(asset.id),
                "asset_url": asset.asset_url,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        operation_id="update_user_asset",
        tags=["Assets"],
        summary="Update user asset after upload completion",
        description="""
        Update the asset status and attributes after the file has been uploaded to S3.
        This endpoint should be called after completing the S3 upload to mark the asset as uploaded.
        """,
        parameters=[
            OpenApiParameter(
                name='asset_id',
                description='UUID of the asset to update',
                required=True,
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH
            )
        ],
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'attributes': {
                        'type': 'object',
                        'description': 'Additional attributes to update for the asset',
                        'additionalProperties': True
                    }
                }
            }
        },
        responses={
            204: OpenApiResponse(description="Asset updated successfully"),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        }
    )
    def patch(self, request, asset_id):
        # get the asset id
        asset = FileAsset.objects.get(id=asset_id, user_id=request.user.id)
        # get the storage metadata
        asset.is_uploaded = True
        # get the storage metadata
        if not asset.storage_metadata:
            get_asset_object_metadata.delay(asset_id=str(asset_id))
        # update the attributes
        asset.attributes = request.data.get("attributes", asset.attributes)
        # save the asset
        asset.save(update_fields=["is_uploaded", "attributes"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        operation_id="delete_user_asset",
        tags=["Assets"],
        summary="Delete user asset",
        description="""
        Delete a user profile asset (avatar or cover image) and remove its reference from the user profile.
        This performs a soft delete by marking the asset as deleted and updating the user's profile.
        """,
        parameters=[
            OpenApiParameter(
                name='asset_id',
                description='UUID of the asset to delete',
                required=True,
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH
            )
        ],
        responses={
            204: OpenApiResponse(description="Asset deleted successfully"),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        }
    )
    def delete(self, request, asset_id):
        asset = FileAsset.objects.get(id=asset_id, user_id=request.user.id)
        asset.is_deleted = True
        asset.deleted_at = timezone.now()
        # get the entity and save the asset id for the request field
        self.entity_asset_delete(
            entity_type=asset.entity_type, asset=asset, request=request
        )
        asset.save(update_fields=["is_deleted", "deleted_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserServerAssetEndpoint(BaseAPIView):
    """This endpoint is used to upload user profile images."""

    def asset_delete(self, asset_id):
        asset = FileAsset.objects.filter(id=asset_id).first()
        if asset is None:
            return
        asset.is_deleted = True
        asset.deleted_at = timezone.now()
        asset.save(update_fields=["is_deleted", "deleted_at"])
        return

    def entity_asset_delete(self, entity_type, asset, request):
        # User Avatar
        if entity_type == FileAsset.EntityTypeContext.USER_AVATAR:
            user = User.objects.get(id=asset.user_id)
            user.avatar_asset_id = None
            user.save()
            return
        # User Cover
        if entity_type == FileAsset.EntityTypeContext.USER_COVER:
            user = User.objects.get(id=asset.user_id)
            user.cover_image_asset_id = None
            user.save()
            return
        return

    @extend_schema(
        operation_id="create_user_server_asset_upload",
        tags=["Assets"],
        summary="Generate presigned URL for user server asset upload",
        description="""
        Create a presigned URL for uploading user profile assets (avatar or cover image) using server credentials.
        This endpoint generates the necessary credentials for direct S3 upload with server-side authentication.
        """,
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'name': {
                        'type': 'string',
                        'description': 'Original filename of the asset'
                    },
                    'type': {
                        'type': 'string',
                        'description': 'MIME type of the file',
                        'enum': ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'],
                        'default': 'image/jpeg'
                    },
                    'size': {
                        'type': 'integer',
                        'description': 'File size in bytes'
                    },
                    'entity_type': {
                        'type': 'string',
                        'description': 'Type of user asset',
                        'enum': ['USER_AVATAR', 'USER_COVER']
                    }
                },
                'required': ['name', 'entity_type']
            }
        },
        responses={
            200: OpenApiResponse(
                description="Presigned URL generated successfully",
                examples=[
                    OpenApiExample(
                        name="Server Presigned URL Response",
                        value={
                            "upload_data": {
                                "url": "https://s3.amazonaws.com/bucket-name",
                                "fields": {
                                    "key": "uuid-filename.jpg",
                                    "AWSAccessKeyId": "AKIA...",
                                    "policy": "eyJ...",
                                    "signature": "abc123..."
                                }
                            },
                            "asset_id": "550e8400-e29b-41d4-a716-446655440000",
                            "asset_url": "https://cdn.example.com/uuid-filename.jpg"
                        }
                    )
                ]
            ),
            400: OpenApiResponse(
                description="Validation error",
                examples=[
                    OpenApiExample(
                        name="Invalid entity type",
                        value={
                            "error": "Invalid entity type.",
                            "status": False
                        }
                    ),
                    OpenApiExample(
                        name="Invalid file type",
                        value={
                            "error": "Invalid file type. Only JPEG and PNG files are allowed.",
                            "status": False
                        }
                    )
                ]
            ),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
        }
    )
    def post(self, request):
        # get the asset key
        name = request.data.get("name")
        type = request.data.get("type", "image/jpeg")
        size = int(request.data.get("size", settings.FILE_SIZE_LIMIT))
        entity_type = request.data.get("entity_type", False)

        # Check if the file size is within the limit
        size_limit = min(size, settings.FILE_SIZE_LIMIT)

        #  Check if the entity type is allowed
        if not entity_type or entity_type not in ["USER_AVATAR", "USER_COVER"]:
            return Response(
                {"error": "Invalid entity type.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the file type is allowed
        allowed_types = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/jpg",
            "image/gif",
        ]
        if type not in allowed_types:
            return Response(
                {
                    "error": "Invalid file type. Only JPEG and PNG files are allowed.",
                    "status": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # asset key
        asset_key = f"{uuid.uuid4().hex}-{name}"

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={"name": name, "type": type, "size": size_limit},
            asset=asset_key,
            size=size_limit,
            user=request.user,
            created_by=request.user,
            entity_type=entity_type,
        )

        # Get the presigned URL
        storage = S3Storage(request=request, is_server=True)
        # Generate a presigned URL to share an S3 object
        presigned_url = storage.generate_presigned_post(
            object_name=asset_key, file_type=type, file_size=size_limit
        )
        # Return the presigned URL
        return Response(
            {
                "upload_data": presigned_url,
                "asset_id": str(asset.id),
                "asset_url": asset.asset_url,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        operation_id="update_user_server_asset",
        tags=["Assets"],
        summary="Update user server asset after upload completion",
        description="""
        Update the asset status and attributes after the file has been uploaded to S3 using server credentials.
        This endpoint should be called after completing the S3 upload to mark the asset as uploaded.
        """,
        parameters=[
            OpenApiParameter(
                name='asset_id',
                description='UUID of the asset to update',
                required=True,
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH
            )
        ],
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'attributes': {
                        'type': 'object',
                        'description': 'Additional attributes to update for the asset',
                        'additionalProperties': True
                    }
                }
            }
        },
        responses={
            204: OpenApiResponse(description="Asset updated successfully"),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        }
    )
    def patch(self, request, asset_id):
        # get the asset id
        asset = FileAsset.objects.get(id=asset_id, user_id=request.user.id)
        # get the storage metadata
        asset.is_uploaded = True
        # get the storage metadata
        if not asset.storage_metadata:
            get_asset_object_metadata.delay(asset_id=str(asset_id))
        # update the attributes
        asset.attributes = request.data.get("attributes", asset.attributes)
        # save the asset
        asset.save(update_fields=["is_uploaded", "attributes"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        operation_id="delete_user_server_asset",
        tags=["Assets"],
        summary="Delete user server asset",
        description="""
        Delete a user profile asset (avatar or cover image) using server credentials and remove its reference from the user profile.
        This performs a soft delete by marking the asset as deleted and updating the user's profile.
        """,
        parameters=[
            OpenApiParameter(
                name='asset_id',
                description='UUID of the asset to delete',
                required=True,
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH
            )
        ],
        responses={
            204: OpenApiResponse(description="Asset deleted successfully"),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        }
    )
    def delete(self, request, asset_id):
        asset = FileAsset.objects.get(id=asset_id, user_id=request.user.id)
        asset.is_deleted = True
        asset.deleted_at = timezone.now()
        # get the entity and save the asset id for the request field
        self.entity_asset_delete(
            entity_type=asset.entity_type, asset=asset, request=request
        )
        asset.save(update_fields=["is_deleted", "deleted_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class GenericAssetEndpoint(BaseAPIView):
    """This endpoint is used to upload generic assets that can be later bound to entities."""

    @extend_schema(
        operation_id="get_generic_asset",
        tags=["Assets"],
        summary="Get presigned URL for asset download",
        description="""
        Generate a presigned URL for downloading a generic asset.
        The asset must be uploaded and associated with the specified workspace.
        """,
        parameters=[
            OpenApiParameter(
                name='slug',
                description='Workspace slug',
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name='asset_id',
                description='UUID of the asset to download',
                required=True,
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH
            )
        ],
        responses={
            200: OpenApiResponse(
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
            ),
            400: OpenApiResponse(
                description="Bad request",
                examples=[
                    OpenApiExample(
                        name="Asset not uploaded",
                        value={
                            "error": "Asset not yet uploaded"
                        }
                    ),
                    OpenApiExample(
                        name="Missing asset ID",
                        value={
                            "error": "Asset ID is required"
                        }
                    )
                ]
            ),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: OpenApiResponse(
                description="Asset or workspace not found",
                examples=[
                    OpenApiExample(
                        name="Asset not found",
                        value={
                            "error": "Asset not found"
                        }
                    ),
                    OpenApiExample(
                        name="Workspace not found",
                        value={
                            "error": "Workspace not found"
                        }
                    )
                ]
            ),
        }
    )
    def get(self, request, slug, asset_id=None):
        """Get a presigned URL for an asset"""
        try:
            # Get the workspace
            workspace = Workspace.objects.get(slug=slug)

            # If asset_id is not provided, return 400
            if not asset_id:
                return Response(
                    {"error": "Asset ID is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get the asset
            asset = FileAsset.objects.get(
                id=asset_id, workspace_id=workspace.id, is_deleted=False
            )

            # Check if the asset exists and is uploaded
            if not asset.is_uploaded:
                return Response(
                    {"error": "Asset not yet uploaded"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            size_limit = settings.FILE_SIZE_LIMIT

            # Generate presigned URL for GET
            storage = S3Storage(request=request, is_server=True)
            presigned_url = storage.generate_presigned_url(
                object_name=asset.asset.name, filename=asset.attributes.get("name")
            )

            return Response(
                {
                    "asset_id": str(asset.id),
                    "asset_url": presigned_url,
                    "asset_name": asset.attributes.get("name", ""),
                    "asset_type": asset.attributes.get("type", ""),
                },
                status=status.HTTP_200_OK,
            )

        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except FileAsset.DoesNotExist:
            return Response(
                {"error": "Asset not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        operation_id="create_generic_asset_upload",
        tags=["Assets"],
        summary="Generate presigned URL for generic asset upload",
        description="""
        Create a presigned URL for uploading generic assets that can be bound to entities like issues.
        Supports various file types and includes external source tracking for integrations.
        """,
        parameters=[
            OpenApiParameter(
                name='slug',
                description='Workspace slug',
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            )
        ],
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'name': {
                        'type': 'string',
                        'description': 'Original filename of the asset'
                    },
                    'type': {
                        'type': 'string',
                        'description': 'MIME type of the file'
                    },
                    'size': {
                        'type': 'integer',
                        'description': 'File size in bytes'
                    },
                    'project_id': {
                        'type': 'string',
                        'description': 'UUID of the project to associate with the asset',
                        'format': 'uuid'
                    },
                    'external_id': {
                        'type': 'string',
                        'description': 'External identifier for the asset (for integration tracking)'
                    },
                    'external_source': {
                        'type': 'string',
                        'description': 'External source system (for integration tracking)'
                    }
                },
                'required': ['name', 'size']
            }
        },
        responses={
            200: OpenApiResponse(
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
            ),
            400: OpenApiResponse(
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
            ),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
            409: OpenApiResponse(
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
        }
    )
    def post(self, request, slug):
        name = request.data.get("name")
        type = request.data.get("type")
        size = int(request.data.get("size", settings.FILE_SIZE_LIMIT))
        project_id = request.data.get("project_id")
        external_id = request.data.get("external_id")
        external_source = request.data.get("external_source")

        # Check if the request is valid
        if not name or not size:
            return Response(
                {"error": "Name and size are required fields.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the file size is within the limit
        size_limit = min(size, settings.FILE_SIZE_LIMIT)

        # Check if the file type is allowed
        if not type or type not in settings.ATTACHMENT_MIME_TYPES:
            return Response(
                {"error": "Invalid file type.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the workspace
        workspace = Workspace.objects.get(slug=slug)

        # asset key
        asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name}"

        # Check for existing asset with same external details if provided
        if external_id and external_source:
            existing_asset = FileAsset.objects.filter(
                workspace__slug=slug,
                external_source=external_source,
                external_id=external_id,
                is_deleted=False,
            ).first()

            if existing_asset:
                return Response(
                    {
                        "message": "Asset with same external id and source already exists",
                        "asset_id": str(existing_asset.id),
                        "asset_url": existing_asset.asset_url,
                    },
                    status=status.HTTP_409_CONFLICT,
                )

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={"name": name, "type": type, "size": size_limit},
            asset=asset_key,
            size=size_limit,
            workspace_id=workspace.id,
            project_id=project_id,
            created_by=request.user,
            external_id=external_id,
            external_source=external_source,
            entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,  # Using ISSUE_ATTACHMENT since we'll bind it to issues
        )

        # Get the presigned URL
        storage = S3Storage(request=request, is_server=True)
        presigned_url = storage.generate_presigned_post(
            object_name=asset_key,
            file_type=type,
            file_size=size_limit
        )

        return Response(
            {
                "upload_data": presigned_url,
                "asset_id": str(asset.id),
                "asset_url": asset.asset_url,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        operation_id="update_generic_asset",
        tags=["Assets"],
        summary="Update generic asset after upload completion",
        description="""
        Update the asset status after the file has been uploaded to S3.
        This endpoint should be called after completing the S3 upload to mark the asset as uploaded
        and trigger metadata extraction.
        """,
        parameters=[
            OpenApiParameter(
                name='slug',
                description='Workspace slug',
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name='asset_id',
                description='UUID of the asset to update',
                required=True,
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH
            )
        ],
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'is_uploaded': {
                        'type': 'boolean',
                        'description': 'Whether the asset has been successfully uploaded',
                        'default': True
                    }
                }
            }
        },
        responses={
            204: OpenApiResponse(description="Asset updated successfully"),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: OpenApiResponse(
                description="Asset not found",
                examples=[
                    OpenApiExample(
                        name="Asset not found",
                        value={
                            "error": "Asset not found"
                        }
                    )
                ]
            ),
        }
    )
    def patch(self, request, slug, asset_id):
        try:
            asset = FileAsset.objects.get(
                id=asset_id,
                workspace__slug=slug,
                is_deleted=False
            )

            # Update is_uploaded status
            asset.is_uploaded = request.data.get("is_uploaded", asset.is_uploaded)

            # Update storage metadata if not present
            if not asset.storage_metadata:
                get_asset_object_metadata.delay(asset_id=str(asset_id))

            asset.save(update_fields=["is_uploaded"])

            return Response(
                status=status.HTTP_204_NO_CONTENT
            )
        except FileAsset.DoesNotExist:
            return Response(
                {"error": "Asset not found"},
                status=status.HTTP_404_NOT_FOUND
            )
