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

"""Mobile file attachment management endpoints for chat messages."""

from fastapi import APIRouter
from fastapi import Depends
from fastapi import Path
from fastapi import Query
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import UUID4
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.api.dependencies import jwt_schema
from pi.app.api.dependencies import validate_jwt_token
from pi.app.models.message_attachment import MessageAttachment
from pi.app.schemas.mobile.attachment import AttachmentCompleteRequestMobile
from pi.app.schemas.mobile.attachment import AttachmentDetailResponseMobile
from pi.app.schemas.mobile.attachment import AttachmentResponseMobile
from pi.app.schemas.mobile.attachment import AttachmentUploadRequestMobile
from pi.app.schemas.mobile.attachment import AttachmentUploadResponseMobile
from pi.app.schemas.mobile.attachment import S3UploadDataMobile
from pi.app.utils.attachments import allowed_attachment_types
from pi.app.utils.attachments import get_presigned_url_download
from pi.app.utils.attachments import get_presigned_url_preview
from pi.app.utils.attachments import get_s3_client
from pi.app.utils.attachments import sanitize_filename
from pi.config import settings
from pi.core.db.plane_pi.lifecycle import get_async_session

router = APIRouter()
log = logger.getChild("v2.mobile.attachments")

# S3 Configuration
S3_BUCKET = settings.AWS_S3_BUCKET


@router.post("/", status_code=201)
async def create_attachment(
    data: AttachmentUploadRequestMobile,
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """
    Create a new attachment and get S3 pre-signed upload URL (Mobile).

    This is the first step in a 3-step attachment upload flow for mobile clients:
    1. Create attachment record → Get pre-signed S3 URL (this endpoint)
    2. Upload file directly to S3 using the provided URL and fields
    3. Complete upload → Mark attachment as uploaded (PATCH /{id})

    The pre-signed URL approach ensures:
    - Direct mobile-to-S3 uploads (no proxy through API)
    - Better performance and bandwidth efficiency
    - Secure, time-limited upload access
    - Client-side progress tracking

    Supported file types:
    - Images: image/jpeg, image/png, image/gif, image/webp
    - Documents: application/pdf
    - Archives: application/zip

    Args:
        data: AttachmentUploadRequestMobile containing:
            - filename: Original filename
            - content_type: MIME type of file
            - file_size: Size in bytes
            - workspace_id: UUID of workspace
            - chat_id: UUID of chat
        db: Database session (injected)
        token: JWT token for authentication (injected)

    Returns:
        JSON response with:
        - attachment_id: UUID of created attachment
        - attachment: Attachment metadata
        - upload_data:
            - url: S3 endpoint URL for upload
            - fields: Form fields to include in upload POST

    Status Codes:
        - 201: Attachment created successfully
        - 400: Invalid request data
        - 401: Invalid or missing authentication
        - 413: File size exceeds limit (10MB images, 50MB PDFs)
        - 415: Unsupported file type
        - 500: Internal server error

    Example Request:
        POST /api/v2/mobile/attachments/
        Authorization: Bearer <jwt-token>
        {
            "filename": "screenshot.png",
            "content_type": "image/png",
            "file_size": 524288,
            "workspace_id": "abc-123",
            "chat_id": "xyz-789"
        }

    Example Response:
        {
            "attachment_id": "att-001",
            "attachment": {
                "id": "att-001",
                "filename": "screenshot.png",
                "content_type": "image/png",
                "file_size": 524288,
                "file_type": "image",
                "status": "pending"
            },
            "upload_data": {
                "url": "https://s3.amazonaws.com/bucket-name",
                "fields": {
                    "key": "attachments/...",
                    "Content-Type": "image/png",
                    "policy": "...",
                    "x-amz-signature": "..."
                }
            }
        }

    Upload Flow Example (React Native):
        // Step 1: Create attachment
        const createResponse = await fetch('/api/v2/mobile/attachments/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename: file.name,
                content_type: file.type,
                file_size: file.size,
                workspace_id: workspaceId,
                chat_id: chatId
            })
        });
        const { attachment_id, upload_data } = await createResponse.json();

        // Step 2: Upload to S3
        const formData = new FormData();
        Object.entries(upload_data.fields).forEach(([key, value]) => {
            formData.append(key, value);
        });
        formData.append('file', {
            uri: fileUri,
            type: file.type,
            name: file.name
        });

        await fetch(upload_data.url, {
            method: 'POST',
            body: formData
        });

        // Step 3: Complete upload
        await fetch(`/api/v2/mobile/attachments/${attachment_id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                attachment_id: attachment_id,
                chat_id: chatId
            })
        });

    Notes:
        - Uses JWT authentication for mobile apps
        - Pre-signed URL expires in 10 minutes
        - File size limits: 10MB for images, 50MB for PDFs
        - Unsupported file types are rejected
        - Filenames are sanitized for security
        - Migrated from V1: POST /api/v1/mobile/attachments/upload-attachment/
    """
    try:
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired JWT token"})

    try:
        # Validate file size
        max_size = settings.FILE_SIZE_LIMIT
        if data.file_size > max_size:
            return JSONResponse(
                status_code=413,
                content={"detail": f"File size exceeds limit of {max_size} bytes"},
            )

        # Validate file type
        if data.content_type not in allowed_attachment_types:
            return JSONResponse(
                status_code=415,
                content={"detail": f"Unsupported file type: {data.content_type}. Allowed types: {', '.join(allowed_attachment_types)}"},
            )

        sanitized_filename = sanitize_filename(data.filename)

        # Create attachment record
        attachment = MessageAttachment(
            original_filename=sanitized_filename,
            content_type=data.content_type,
            file_size=data.file_size,
            file_type=MessageAttachment.get_file_type_from_mime(data.content_type),
            status="pending",
            file_path="",  # Will be set after generating
            workspace_id=data.workspace_id,
            chat_id=data.chat_id,
            message_id=None,  # Will be set later when message is created
            user_id=user_id,
        )

        db.add(attachment)
        await db.commit()
        await db.refresh(attachment)

        # Generate S3 file path
        file_path = attachment.generate_file_path(data.workspace_id, data.chat_id)
        attachment.file_path = file_path

        # Generate pre-signed POST data for S3 upload
        s3_client = get_s3_client()
        presigned_post = s3_client.generate_presigned_post(
            Bucket=S3_BUCKET,
            Key=file_path,
            Fields={"Content-Type": data.content_type},
            Conditions=[
                {"Content-Type": data.content_type},
                ["content-length-range", 1, settings.FILE_SIZE_LIMIT],
            ],
            ExpiresIn=600,  # 10 minutes
        )

        await db.commit()

        # Prepare response
        attachment_response = AttachmentResponseMobile(
            id=str(attachment.id),
            filename=attachment.original_filename,
            content_type=attachment.content_type,
            file_size=attachment.file_size,
            file_type=attachment.file_type,
            status=attachment.status,
        )

        return JSONResponse(
            status_code=201,
            content=AttachmentUploadResponseMobile(
                upload_data=S3UploadDataMobile(
                    url=presigned_post["url"],
                    fields=presigned_post["fields"],
                ),
                attachment_id=str(attachment.id),
                attachment=attachment_response,
            ).model_dump(),
        )

    except Exception as e:
        log.error(f"Error creating mobile attachment upload: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@router.patch("/{attachment_id}")
async def complete_upload(
    data: AttachmentCompleteRequestMobile,
    attachment_id: UUID4 = Path(..., description="UUID of the attachment"),
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """
    Complete attachment upload and mark as uploaded (Mobile).

    This is the final step (step 3) of the attachment upload flow for mobile clients.
    After the file has been uploaded to S3, this endpoint verifies the upload and
    marks the attachment as ready for use.

    Args:
        attachment_id: UUID of the attachment (path parameter)
        data: AttachmentCompleteRequestMobile containing:
            - attachment_id: UUID of the attachment (must match path parameter)
            - chat_id: UUID of the chat
        db: Database session (injected)
        token: JWT token for authentication (injected)

    Returns:
        JSON response with:
        - id: Attachment UUID
        - filename: Original filename
        - content_type: MIME type
        - file_size: Size in bytes
        - file_type: Type category (image/document/archive)
        - status: Upload status ("uploaded")
        - attachment_url: Pre-signed URL for downloading

    Status Codes:
        - 200: Upload completed successfully
        - 400: File not found in S3
        - 401: Invalid or missing authentication
        - 404: Attachment not found
        - 409: Attachment already processed
        - 500: Internal server error

    Example Request:
        PATCH /api/v2/mobile/attachments/att-001
        Authorization: Bearer <jwt-token>
        {
            "attachment_id": "att-001",
            "chat_id": "xyz-789"
        }

    Example Response:
        {
            "id": "att-001",
            "filename": "screenshot.png",
            "content_type": "image/png",
            "file_size": 524288,
            "file_type": "image",
            "status": "uploaded",
            "attachment_url": "https://s3.amazonaws.com/..."
        }

    Notes:
        - Uses JWT authentication for mobile apps
        - Verifies file exists in S3 before marking as uploaded
        - Generates pre-signed download URL valid for 1 hour
        - Returns 409 if attachment already processed
        - Migrated from V1: PATCH /api/v1/mobile/attachments/complete-upload/
    """
    try:
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired JWT token"})

    try:
        # Get attachment
        stmt = select(MessageAttachment).where(
            MessageAttachment.id == attachment_id,
            MessageAttachment.chat_id == data.chat_id,
            MessageAttachment.user_id == user_id,
        )
        result = await db.execute(stmt)
        attachment = result.scalar_one_or_none()

        if not attachment:
            return JSONResponse(status_code=404, content={"detail": "Attachment not found"})

        if attachment.status != "pending":
            return JSONResponse(
                status_code=409,
                content={"detail": f"Attachment already processed with status: {attachment.status}"},
            )

        # Verify file exists in S3 before marking as uploaded
        try:
            s3_client = get_s3_client()
            s3_client.head_object(Bucket=S3_BUCKET, Key=attachment.file_path)
            log.info(f"Verified S3 file exists: {attachment.file_path}")
        except Exception as s3_error:
            log.error(f"S3 file verification failed for {attachment.file_path}: {s3_error}")
            return JSONResponse(
                status_code=400,
                content={"detail": "File not found in S3. Please upload the file first."},
            )

        # Update attachment status only after S3 verification
        attachment.status = "uploaded"
        download_url = get_presigned_url_download(attachment)

        await db.commit()
        await db.refresh(attachment)

        # Prepare response
        return JSONResponse(
            content=AttachmentDetailResponseMobile(
                id=str(attachment.id),
                filename=attachment.original_filename,
                content_type=attachment.content_type,
                file_size=attachment.file_size,
                file_type=attachment.file_type,
                status=attachment.status,
                attachment_url=download_url,
            ).model_dump()
        )

    except Exception as e:
        log.error(f"Error completing mobile attachment upload: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@router.get("/{attachment_id}")
async def get_attachment(
    attachment_id: UUID4 = Path(..., description="UUID of the attachment"),
    chat_id: UUID4 = Query(..., description="UUID of the chat"),
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """
    Get attachment details and pre-signed URLs (Mobile).

    This endpoint retrieves attachment metadata and generates pre-signed URLs
    for downloading and previewing the file for mobile clients.

    Args:
        attachment_id: UUID of the attachment (path parameter)
        chat_id: UUID of the chat (query parameter)
        db: Database session (injected)
        token: JWT token for authentication (injected)

    Returns:
        JSON response with:
        - download_url: Pre-signed URL for downloading (expires in 1 hour)
        - preview_url: Pre-signed URL for preview/inline display (expires in 1 hour)
        - filename: Original filename
        - content_type: MIME type
        - file_size: Size in bytes

    Status Codes:
        - 200: Attachment retrieved successfully
        - 401: Invalid or missing authentication
        - 404: Attachment not found or not uploaded
        - 500: Internal server error

    Example Request:
        GET /api/v2/mobile/attachments/att-001?chat_id=xyz-789
        Authorization: Bearer <jwt-token>

    Example Response:
        {
            "download_url": "https://s3.amazonaws.com/bucket/file?...",
            "preview_url": "https://s3.amazonaws.com/bucket/file?...",
            "filename": "screenshot.png",
            "content_type": "image/png",
            "file_size": 524288
        }

    Notes:
        - Uses JWT authentication for mobile apps
        - Only returns uploaded attachments (status="uploaded")
        - Verifies file exists in S3 before returning URLs
        - Pre-signed URLs expire after 1 hour
        - download_url has Content-Disposition: attachment
        - preview_url has Content-Disposition: inline
        - Migrated from V1: GET /api/v1/mobile/attachments/get-url/
    """
    try:
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired JWT token"})

    try:
        # Get attachment owned by this user
        stmt = select(MessageAttachment).where(
            MessageAttachment.id == attachment_id,
            MessageAttachment.chat_id == chat_id,
            MessageAttachment.user_id == user_id,
            MessageAttachment.status == "uploaded",
        )
        result = await db.execute(stmt)
        attachment = result.scalar_one_or_none()

        if not attachment:
            return JSONResponse(
                status_code=404,
                content={"detail": "Attachment not found or not yet uploaded"},
            )

        # Verify file exists in S3
        try:
            s3_client = get_s3_client()
            s3_client.head_object(Bucket=S3_BUCKET, Key=attachment.file_path)
        except Exception as s3_error:
            log.error(f"S3 file verification failed for {attachment.file_path}: {s3_error}")
            return JSONResponse(status_code=404, content={"detail": "File not found in S3"})

        # Use utility functions for URL generation
        download_url = get_presigned_url_download(attachment)
        preview_url = get_presigned_url_preview(attachment)

        return JSONResponse(
            content={
                "download_url": download_url,
                "preview_url": preview_url,
                "filename": attachment.original_filename,
                "content_type": attachment.content_type,
                "file_size": attachment.file_size,
            }
        )

    except ValueError as e:
        log.error(f"Invalid UUID format: {e}")
        return JSONResponse(status_code=400, content={"detail": "Invalid ID format"})
    except Exception as e:
        log.error(f"Error generating mobile attachment URLs: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@router.get("/")
async def list_attachments(
    chat_id: UUID4 = Query(..., description="UUID of the chat"),
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """
    Get all attachments for a chat (Mobile).

    This endpoint retrieves all attachment objects for a specific chat conversation
    for mobile clients, including metadata and download URLs.

    Args:
        chat_id: UUID of the chat (query parameter)
        db: Database session (injected)
        token: JWT token for authentication (injected)

    Returns:
        JSON response with:
        - attachments: List of attachment objects with metadata and URLs

    Status Codes:
        - 200: Attachments retrieved successfully
        - 401: Invalid or missing authentication
        - 500: Internal server error

    Example Request:
        GET /api/v2/mobile/attachments/?chat_id=xyz-789
        Authorization: Bearer <jwt-token>

    Example Response:
        {
            "attachments": [
                {
                    "id": "att-001",
                    "filename": "screenshot.png",
                    "content_type": "image/png",
                    "file_size": 524288,
                    "file_type": "image",
                    "status": "uploaded",
                    "message_id": "msg-123",
                    "attachment_url": "https://s3.amazonaws.com/...",
                    "created_at": "2025-01-15T10:00:00Z"
                },
                {
                    "id": "att-002",
                    "filename": "document.pdf",
                    "content_type": "application/pdf",
                    "file_size": 1048576,
                    "file_type": "document",
                    "status": "uploaded",
                    "message_id": "msg-124",
                    "attachment_url": "https://s3.amazonaws.com/...",
                    "created_at": "2025-01-15T11:00:00Z"
                }
            ]
        }

    Notes:
        - Uses JWT authentication for mobile apps
        - Only returns uploaded attachments (status="uploaded")
        - Only returns non-deleted attachments
        - Returns attachments owned by the authenticated user
        - Each attachment includes a pre-signed download URL
        - Download URLs expire after 1 hour
        - Migrated from V1: GET /api/v1/mobile/attachments/chat/
    """
    try:
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired JWT token"})

    try:
        # Get all attachments for this chat owned by this user
        stmt = select(MessageAttachment).where(
            MessageAttachment.chat_id == chat_id,
            MessageAttachment.user_id == user_id,
            MessageAttachment.status == "uploaded",
            MessageAttachment.deleted_at.is_(None),  # type: ignore[union-attr]
        )
        result = await db.execute(stmt)
        attachments = result.scalars().all()

        # Build response with attachment details and URLs
        attachment_list = []
        for attachment in attachments:
            # Generate download URL
            download_url = get_presigned_url_download(attachment)

            attachment_data = {
                "id": str(attachment.id),
                "filename": attachment.original_filename,
                "content_type": attachment.content_type,
                "file_size": attachment.file_size,
                "file_type": attachment.file_type,
                "status": attachment.status,
                "message_id": str(attachment.message_id) if attachment.message_id else None,
                "attachment_url": download_url,
                "created_at": attachment.created_at.isoformat() if attachment.created_at else None,
            }
            attachment_list.append(attachment_data)

        return JSONResponse(content={"attachments": attachment_list})

    except ValueError as e:
        log.error(f"Invalid UUID format: {e}")
        return JSONResponse(status_code=400, content={"detail": "Invalid chat ID format"})
    except Exception as e:
        log.error(f"Error retrieving mobile attachments for chat: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})
