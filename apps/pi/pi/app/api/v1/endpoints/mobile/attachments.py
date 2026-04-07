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
from fastapi.responses import JSONResponse
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.api.dependencies import check_guest_access
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
from pi.app.utils.attachments import get_attachment_urls_internal
from pi.app.utils.attachments import get_presigned_url_download
from pi.app.utils.attachments import get_s3_client
from pi.app.utils.attachments import sanitize_filename
from pi.config import settings
from pi.core.db.plane_pi.lifecycle import get_async_session

log = logger.getChild(__name__)
mobile_router = APIRouter()

# S3 Configuration
S3_BUCKET = settings.AWS_S3_BUCKET


@mobile_router.post("/upload-attachment/")
async def create_attachment_upload(
    data: AttachmentUploadRequestMobile,
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """Step 1: Create attachment record and generate S3 pre-signed upload URL"""
    try:
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})

    if data.workspace_id:
        guest_check = await check_guest_access(str(user_id), str(data.workspace_id))
        if guest_check:
            return guest_check

    try:
        # Validate file size (10MB for images, 50MB for PDFs)
        max_size = settings.FILE_SIZE_LIMIT
        if data.file_size > max_size:
            return JSONResponse(status_code=413, content={"detail": "File size exceeds limit"})

        # Validate file type
        if data.content_type not in allowed_attachment_types:
            return JSONResponse(status_code=415, content={"detail": "Unsupported file type"})

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
            ExpiresIn=600,  # 5 minutes
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
            content=AttachmentUploadResponseMobile(
                upload_data=S3UploadDataMobile(
                    url=presigned_post["url"],
                    fields=presigned_post["fields"],
                ),
                attachment_id=str(attachment.id),
                attachment=attachment_response,
            ).model_dump()
        )

    except Exception as e:
        log.error(f"Error creating attachment upload: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@mobile_router.patch("/complete-upload/")
async def complete_attachment_upload(
    data: AttachmentCompleteRequestMobile,
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """Step 3: Complete attachment upload and optionally link to message"""
    try:
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})

    try:
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

        if attachment.status != "pending":
            return JSONResponse(status_code=409, content={"detail": "Attachment already processed"})

        # Verify file exists in S3 before marking as uploaded
        try:
            s3_client = get_s3_client()
            s3_client.head_object(Bucket=S3_BUCKET, Key=attachment.file_path)
            log.info(f"Verified S3 file exists: {attachment.file_path}")
        except Exception as s3_error:
            log.error(f"S3 file verification failed for {attachment.file_path}: {s3_error}")
            return JSONResponse(status_code=400, content={"detail": "File not found in S3. Please upload the file first."})

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
        log.error(f"Error completing attachment upload: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@mobile_router.get("/get-url/")
async def get_attachment_url(
    attachment_id: str,
    chat_id: str,
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """Get pre-signed URLs (download & preview) for an attachment"""
    try:
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})

    try:
        # Use shared utility function
        result = await get_attachment_urls_internal(attachment_id, chat_id, str(user_id), db)
        return JSONResponse(content=result)

    except ValueError as e:
        log.error(f"Invalid UUID format: {e}")
        return JSONResponse(status_code=400, content={"detail": "Invalid ID format"})
    except FileNotFoundError as e:
        return JSONResponse(status_code=404, content={"detail": str(e)})
    except Exception as e:
        log.error(f"Error generating attachment URLs: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@mobile_router.get("/view/")
async def view_attachment(
    attachment_id: str,
    chat_id: str,
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """Redirect to attachment preview URL for direct rendering in <img> tags and markdown.

    This endpoint allows using attachment URLs directly in markdown image syntax:
    ![alt text](/api/v1/mobile/attachments/view/?attachment_id=xxx&chat_id=yyy)

    The browser will automatically follow the redirect to the S3 presigned URL.
    """
    try:
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})

    try:
        # Use shared utility function
        result = await get_attachment_urls_internal(attachment_id, chat_id, str(user_id), db)
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


@mobile_router.get("/chat/")
async def get_attachments_by_chat(
    chat_id: str,
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """Get all attachment objects for a chat"""
    try:
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})

    try:
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


# @mobile_router.delete("/delete-attachment/")
# async def delete_attachment(
#     data: AttachmentDeleteRequest,
#     db: AsyncSession = Depends(get_async_session),
#     token: HTTPAuthorizationCredentials = Depends(jwt_schema),
# ):
#     """Delete an attachment (soft delete)"""
#     try:
#         auth = await validate_jwt_token(token)
#         if not auth.user:
#             return JSONResponse(status_code=401, content={"detail": "Invalid User"})
#         user_id = auth.user.id
#     except Exception as e:
#         log.error(f"Error validating JWT: {e!s}")
#         return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})

#     try:
#         # Get attachment
#         stmt = select(MessageAttachment).where(
#             MessageAttachment.id == data.attachment_id,
#             MessageAttachment.chat_id == data.chat_id,
#             MessageAttachment.user_id == user_id,
#         )
#         result = await db.execute(stmt)
#         attachment = result.scalar_one_or_none()

#         if not attachment:
#             return JSONResponse(status_code=404, content={"detail": "Attachment not found"})

#         # Soft delete
#         attachment.soft_delete()
#         await db.commit()

#         return JSONResponse(content={"detail": "Attachment deleted successfully"})

#     except Exception as e:
#         log.error(f"Error deleting attachment: {e!s}")
#         return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})
