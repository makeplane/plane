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

import uuid

from fastapi import APIRouter
from fastapi import Depends
from fastapi import File
from fastapi import Form
from fastapi import UploadFile
from fastapi.responses import JSONResponse
from fastapi.responses import RedirectResponse
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.api.dependencies import get_current_user
from pi.app.models.message_attachment import MessageAttachment
from pi.app.schemas.attachment import AttachmentCompleteRequest
from pi.app.schemas.attachment import AttachmentDetailResponse
from pi.app.utils.attachments import allowed_attachment_types
from pi.app.utils.attachments import detect_file_type
from pi.app.utils.attachments import get_attachment_urls_internal
from pi.app.utils.attachments import get_presigned_url_download
from pi.app.utils.attachments import get_s3_client
from pi.app.utils.attachments import sanitize_filename
from pi.app.utils.attachments import scan_file_for_malware
from pi.config import settings
from pi.core.db.plane_pi.lifecycle import get_async_session

router = APIRouter()
log = logger.getChild("v1")

# S3 Configuration
S3_BUCKET = settings.AWS_S3_BUCKET


@router.post("/upload-attachment/")
async def create_attachment_upload(
    file: UploadFile = File(...),
    workspace_id: str = Form(...),
    chat_id: str = Form(...),
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """Receive file, scan for security, then upload to S3 if safe"""
    try:
        user_id = current_user.id
        # Read file into memory
        file_data = await file.read()
        file_size = len(file_data)

        # Validate file size
        max_size = settings.FILE_SIZE_LIMIT
        if file_size > max_size:
            return JSONResponse(status_code=413, content={"detail": "File size exceeds limit"})

        # Detect MIME type from file content (more secure than trusting client)
        content_type = detect_file_type(file_data)
        if content_type == "unknown":
            # Fallback to content_type header if detection fails
            content_type = file.content_type or "application/octet-stream"

        # Validate file type
        if content_type not in allowed_attachment_types:
            return JSONResponse(status_code=415, content={"detail": "Unsupported file type"})

        # 🔒 SECURITY SCAN BEFORE UPLOADING TO S3
        log.debug(f"Scanning file before S3 upload: {file.filename}")
        is_safe, error_message = await scan_file_for_malware(file_data, content_type, file.filename or "attachment")

        if not is_safe:
            log.warning(f"File rejected during pre-upload scan: {error_message}")
            return JSONResponse(status_code=400, content={"detail": f"File rejected: {error_message}"})

        log.debug(f"File passed security scan: {file.filename}")

        sanitized_filename = sanitize_filename(file.filename or "attachment")

        # Create attachment record
        attachment = MessageAttachment(
            original_filename=sanitized_filename,
            content_type=content_type,
            file_size=file_size,
            file_type=MessageAttachment.get_file_type_from_mime(content_type),
            status="pending",
            file_path="",
            workspace_id=workspace_id,
            chat_id=chat_id,
            message_id=None,
            user_id=user_id,
        )

        db.add(attachment)
        await db.commit()
        await db.refresh(attachment)

        # Generate S3 file path
        file_path = attachment.generate_file_path(uuid.UUID(workspace_id), uuid.UUID(chat_id))
        attachment.file_path = file_path

        # Upload DIRECTLY to S3 (since we already have the clean file data)
        s3_client = get_s3_client()
        s3_client.put_object(Bucket=S3_BUCKET, Key=file_path, Body=file_data, ContentType=content_type)

        # Mark as uploaded immediately
        attachment.status = "uploaded"
        await db.commit()

        log.debug(f"File scanned and uploaded successfully: {file_path}")

        # Prepare response
        download_url = get_presigned_url_download(attachment)

        return JSONResponse(
            content=AttachmentDetailResponse(
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
        log.error(f"Error in secure file upload: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@router.patch("/complete-upload/")
async def complete_attachment_upload(
    data: AttachmentCompleteRequest,
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """Complete attachment upload - only for failed uploads or linking to messages"""

    try:
        user_id = current_user.id
        # Get attachment
        stmt = select(MessageAttachment).where(
            MessageAttachment.id == data.attachment_id,
            MessageAttachment.chat_id == data.chat_id,
            MessageAttachment.user_id == user_id,
        )
        result = await db.execute(stmt)
        attachment = result.scalar_one_or_none()

        if not attachment:
            return JSONResponse(status_code=404, content={"detail": "Attachment not found"})

        # Only process if attachment is in pending state (upload failed)
        if attachment.status == "uploaded":
            # Already uploaded, just return the attachment details
            download_url = get_presigned_url_download(attachment)
            return JSONResponse(
                content=AttachmentDetailResponse(
                    id=str(attachment.id),
                    filename=attachment.original_filename,
                    content_type=attachment.content_type,
                    file_size=attachment.file_size,
                    file_type=attachment.file_type,
                    status=attachment.status,
                    attachment_url=download_url,
                ).model_dump()
            )

        if attachment.status != "pending":
            return JSONResponse(status_code=409, content={"detail": "Attachment already processed"})

        # For pending attachments, verify file exists in S3 (no re-scanning needed)
        try:
            s3_client = get_s3_client()
            s3_client.head_object(Bucket=S3_BUCKET, Key=attachment.file_path)
            log.debug(f"Verified S3 file exists: {attachment.file_path}")
        except Exception as s3_error:
            log.error(f"S3 file verification failed for {attachment.file_path}: {s3_error}")
            return JSONResponse(status_code=400, content={"detail": "File not found in S3. Please upload the file first."})

        # Update attachment status to uploaded (file was already scanned during upload-attachment)
        attachment.status = "uploaded"
        download_url = get_presigned_url_download(attachment)

        await db.commit()
        await db.refresh(attachment)

        # Prepare response
        return JSONResponse(
            content=AttachmentDetailResponse(
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
        log.error(f"Error completing attachment upload: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@router.get("/get-url/")
async def get_attachment_url(
    attachment_id: str,
    chat_id: str,
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """Get pre-signed URLs (download & preview) for an attachment"""
    try:
        user_id = current_user.id
        # Use shared utility function
        result = await get_attachment_urls_internal(attachment_id, chat_id, user_id, db)
        return JSONResponse(content=result)

    except ValueError as e:
        log.error(f"Invalid UUID format: {e}")
        return JSONResponse(status_code=400, content={"detail": "Invalid ID format"})
    except FileNotFoundError as e:
        return JSONResponse(status_code=404, content={"detail": str(e)})
    except Exception as e:
        log.error(f"Error generating attachment URLs: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@router.get("/view/")
async def view_attachment(
    attachment_id: str,
    chat_id: str,
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """Redirect to attachment preview URL for direct rendering in <img> tags and markdown.

    This endpoint allows using attachment URLs directly in markdown image syntax:
    ![alt text](/api/v1/attachments/view/?attachment_id=xxx&chat_id=yyy)

    The browser will automatically follow the redirect to the S3 presigned URL.
    """
    try:
        user_id = current_user.id
        # Use shared utility function
        result = await get_attachment_urls_internal(attachment_id, chat_id, user_id, db)
        preview_url = result.get("preview_url")

        if not preview_url:
            return JSONResponse(status_code=404, content={"detail": "Preview URL not available"})

        return RedirectResponse(preview_url)

    except ValueError as e:
        log.error(f"Invalid UUID format: {e}")
        return JSONResponse(status_code=400, content={"detail": "Invalid ID format"})
    except FileNotFoundError as e:
        return JSONResponse(status_code=404, content={"detail": str(e)})
    except Exception as e:
        log.error(f"Error redirecting to attachment: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@router.get("/chat/")
async def get_attachments_by_chat(
    chat_id: str,
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """Get all attachment objects for a chat"""
    try:
        user_id = current_user.id
        # Convert string ID to UUID
        chat_uuid = uuid.UUID(chat_id)

        # Get all attachments for this chat owned by this user
        stmt = select(MessageAttachment).where(
            MessageAttachment.chat_id == chat_uuid,
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
        log.error(f"Error retrieving attachments for chat: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})
