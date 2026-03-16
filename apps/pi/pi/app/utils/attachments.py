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

import asyncio
import base64
import io
import re
import unicodedata
from pathlib import Path
from typing import Optional
from typing import Tuple
from urllib.parse import urlparse

import boto3
from botocore.client import Config
from PIL import Image
from pypdf import PdfReader

from pi import logger
from pi.app.models.message_attachment import MessageAttachment
from pi.config import settings

log = logger.getChild(__name__)

# S3 Configuration
S3_BUCKET = settings.AWS_S3_BUCKET
S3_REGION = settings.AWS_S3_REGION

allowed_attachment_types = ["image/jpeg", "image/png", "application/pdf", "image/gif", "image/webp"]

# Heuristic size thresholds (in bytes)
MIN_FILE_SIZE_BYTES = 32  # reject obviously empty/corrupt payloads
MIN_PDF_SIZE_BYTES = 256  # PDFs below this are almost always bogus junk


def get_s3_client(use_public_url: bool = False):
    """
    Get configured S3 client. Matches the logic from main API's S3Storage class.

    For presigned URLs (user-facing): uses FRONTEND_URL for MinIO public URLs.
    For uploads (server-to-S3): uses AWS_S3_ENDPOINT_URL (internal endpoint).

    Args:
        use_public_url:
            - False (default):
                Used for server-side S3 operations such as uploads.
                Always uses AWS_S3_ENDPOINT_URL (internal/private endpoint).

            - True:
                Used for generating presigned URLs (preview/download).
                If USE_MINIO is enabled, derives the public endpoint from
                plane_api.FRONTEND_URL so that the URL is accessible externally.
                Otherwise, falls back to AWS_S3_ENDPOINT_URL or standard AWS S3.
    """
    client_kwargs: dict = {
        "service_name": "s3",
        "region_name": S3_REGION,
        "config": Config(signature_version="s3v4"),
    }
    # Only pass explicit credentials when set; otherwise boto3 uses default chain (e.g. IRSA / EKS Pod Identity)
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        client_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
        client_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY

    if not use_public_url:
        # Server-side operations: always use internal endpoint
        endpoint_url = settings.AWS_S3_ENDPOINT_URL
    elif settings.USE_MINIO and settings.plane_api.FRONTEND_URL:
        # MinIO presigned URLs: derive public endpoint from FRONTEND_URL
        parsed = urlparse(settings.plane_api.FRONTEND_URL)
        endpoint_url = f"{parsed.scheme}://{parsed.netloc}"
    elif settings.AWS_S3_ENDPOINT_URL:
        # Custom S3-compatible endpoint
        endpoint_url = settings.AWS_S3_ENDPOINT_URL
    else:
        # Standard AWS S3 — boto3 auto-resolves from region
        endpoint_url = None

    if endpoint_url:
        client_kwargs["endpoint_url"] = endpoint_url

    return boto3.client(**client_kwargs)


def get_presigned_url_download(
    attachment: MessageAttachment,
    expires_in: Optional[int] = 600,
) -> Optional[str]:
    """
    Generate presigned download URL for an attachment.

    Args:
        attachment: MessageAttachment instance
        expires_in: URL expiration time in seconds (default: 600 = 10 minutes)

    Returns:
        Presigned download URL or None if failed
    """
    if not attachment.file_path or attachment.status != "uploaded":
        return None

    try:
        s3_client = get_s3_client(use_public_url=True)
        download_url = s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": S3_BUCKET,
                "Key": attachment.file_path,
                "ResponseContentDisposition": f"attachment; filename*=UTF-8''{attachment.original_filename}",
            },
            ExpiresIn=expires_in,
        )
        return download_url
    except Exception as e:
        log.error(f"Failed to generate presigned URL for attachment {attachment.id}: {e}")
        return None


def get_presigned_url_preview(
    attachment: MessageAttachment,
    expires_in: int = 300,
) -> Optional[str]:
    """
    Generate presigned preview URL for an attachment (inline render).

    Args:
        attachment: MessageAttachment instance
        expires_in: URL expiration time in seconds (default: 300 = 5 minutes)

    Returns:
        Presigned preview URL or None if failed
    """
    if not attachment.file_path or attachment.status != "uploaded":
        return None

    try:
        s3_client = get_s3_client(use_public_url=True)
        preview_url = s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": S3_BUCKET,
                "Key": attachment.file_path,
                "ResponseContentDisposition": "inline",
            },
            ExpiresIn=expires_in,
        )
        return preview_url
    except Exception as e:
        log.error(f"Failed to generate presigned preview URL for attachment {attachment.id}: {e}")
        return None


async def get_attachment_urls_internal(
    attachment_id: str,
    chat_id: str,
    user_id: str,
    db,
) -> dict:
    """
    Internal utility to validate attachment access and generate presigned URLs.

    This is shared logic used by both web and mobile get_attachment_url endpoints,
    as well as the new view redirect endpoint.

    Args:
        attachment_id: Attachment UUID (as string)
        chat_id: Chat UUID (as string)
        user_id: User UUID (as string or UUID object)
        db: AsyncSession database connection

    Returns:
        Dictionary with attachment details and URLs

    Raises:
        ValueError: If UUIDs are invalid format
        FileNotFoundError: If attachment not found or not in S3
        PermissionError: If user doesn't own attachment
    """
    import uuid

    from sqlmodel import select

    # Convert string IDs to UUIDs
    attachment_uuid = uuid.UUID(attachment_id)
    chat_uuid = uuid.UUID(chat_id)
    user_uuid = uuid.UUID(str(user_id))  # Handle both string and UUID

    # Get attachment owned by this user
    stmt = select(MessageAttachment).where(
        MessageAttachment.id == attachment_uuid,
        MessageAttachment.chat_id == chat_uuid,
        MessageAttachment.user_id == user_uuid,
        MessageAttachment.status == "uploaded",
    )
    result = await db.execute(stmt)
    attachment = result.scalar_one_or_none()

    if not attachment:
        raise FileNotFoundError("Attachment not found")

    # Verify file exists in S3 (use upload client for internal access)
    try:
        s3_client = get_s3_client()
        s3_client.head_object(Bucket=S3_BUCKET, Key=attachment.file_path)
    except Exception as s3_error:
        log.error(f"S3 file verification failed for {attachment.file_path}: {s3_error}")
        raise FileNotFoundError("File not found in S3")

    # Generate presigned URLs
    download_url = get_presigned_url_download(attachment)
    preview_url = get_presigned_url_preview(attachment)

    return {
        "download_url": download_url,
        "preview_url": preview_url,
        "filename": attachment.original_filename,
        "content_type": attachment.content_type,
        "file_size": attachment.file_size,
    }


async def get_attachment_base64_data(attachment: MessageAttachment) -> Optional[str]:
    """
    Fetch file data from S3 and return as base64 encoded string.

    Args:
        attachment: MessageAttachment instance

    Returns:
        Base64 encoded file data or None if failed
    """
    if not attachment.file_path or attachment.status != "uploaded":
        return None

    try:
        s3_client = get_s3_client()

        # Download file data from S3 using asyncio.to_thread for blocking I/O
        response = await asyncio.to_thread(s3_client.get_object, Bucket=S3_BUCKET, Key=attachment.file_path)
        file_data = await asyncio.to_thread(response["Body"].read)

        # Encode to base64
        base64_data = base64.b64encode(file_data).decode("utf-8")
        return base64_data

    except Exception as e:
        log.error(f"Error fetching file data from S3: {e}")
        return None


def sanitize_filename(filename: str, max_length: int = 150) -> str:
    """
    Sanitize a filename for safe use in S3 and Content-Disposition headers.
    - Removes/normalizes weird unicode characters
    - Replaces spaces with underscores
    - Removes unsafe symbols (keeps letters, numbers, dot, dash, underscore)
    - Truncates if too long
    """

    # Normalize unicode → removes invisible chars like U+202F
    filename = unicodedata.normalize("NFKD", filename)

    # Split extension
    name, ext = Path(filename).stem, Path(filename).suffix

    # Replace spaces and colons with safe chars
    name = name.replace(" ", "_").replace(":", "-")

    # Remove anything not safe
    name = re.sub(r"[^A-Za-z0-9._-]", "", name)

    # Truncate to max length (to avoid OS/S3 issues with very long names)
    if len(name) > max_length:
        name = name[:max_length]

    # Ensure not empty
    if not name:
        name = "file"

    return f"{name}{ext}"


def detect_file_type(file_data: bytes) -> str:
    """
    Detect file type based on file signatures (magic bytes).

    Args:
        file_data: Raw file bytes

    Returns:
        Detected MIME type
    """
    if not file_data:
        return "unknown"

    # Check file signatures
    if file_data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    elif file_data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    elif file_data.startswith(b"GIF87a") or file_data.startswith(b"GIF89a"):
        return "image/gif"
    elif file_data.startswith(b"RIFF") and b"WEBP" in file_data[:12]:
        return "image/webp"
    elif file_data.startswith(b"%PDF-"):
        return "application/pdf"
    else:
        return "unknown"


async def validate_file_content(file_data: bytes, content_type: str, filename: str) -> Tuple[bool, str]:
    """
    Validate file content for malicious content.

    Args:
        file_data: Raw file bytes
        content_type: Declared MIME type
        filename: Original filename

    Returns:
        Tuple of (is_safe, error_message)
    """
    try:
        # 1. Verify actual file type matches declared content type
        detected_type = detect_file_type(file_data)
        if detected_type != "unknown" and detected_type != content_type:
            return False, f"File type mismatch: declared {content_type}, detected {detected_type}"

        # 2. Check for suspicious file signatures
        # Known malicious file signatures to block
        malicious_signatures = [
            b"\x4d\x5a",  # PE executable
            b"\x7f\x45\x4c\x46",  # ELF executable
            b"\xca\xfe\xba\xbe",  # Java class file
            b"\xfe\xed\xfa",  # Mach-O executable
        ]

        for sig in malicious_signatures:
            if file_data.startswith(sig):
                return False, "File contains executable code"

        # 3. For images, validate they're actually images
        if content_type.startswith("image/"):
            try:
                Image.open(io.BytesIO(file_data)).verify()
            except Exception:
                return False, "Invalid image file"

        # 4. For PDFs, check for embedded JavaScript or suspicious objects
        if content_type == "application/pdf":
            try:
                pdf_content = file_data.decode("latin-1", errors="ignore")

                # Check for high-risk patterns that are almost always malicious
                high_risk_patterns = [
                    "/Launch",  # Can execute external programs
                    "eval(",
                    "unescape(",
                ]

                for pattern in high_risk_patterns:
                    if pattern in pdf_content:
                        return False, f"PDF contains potentially malicious content: {pattern}"

                # Check for JavaScript - only flag if combined with action triggers
                has_javascript = "/JavaScript" in pdf_content or "/JS" in pdf_content
                has_open_action = "/OpenAction" in pdf_content
                has_embedded_file = "/EmbeddedFile" in pdf_content

                # Flag if JavaScript is combined with auto-execution triggers
                if has_javascript and has_open_action:
                    return False, "PDF contains JavaScript with auto-execution (OpenAction)"

                # EmbeddedFiles with JavaScript can be risky
                if has_javascript and has_embedded_file:
                    return False, "PDF contains JavaScript with embedded files"

            except Exception:
                # If we can't decode, it might be a binary PDF which is safer
                pass

            # Check if PDF is password-protected
            is_protected, error_msg = is_pdf_password_protected(file_data)
            if is_protected:
                return False, f"Password-protected PDFs are not allowed: {error_msg}"

        # 5. Check file size vs content (basic heuristic)
        file_size = len(file_data)
        if file_size < MIN_FILE_SIZE_BYTES:
            return False, "File is empty or corrupted"

        if content_type == "application/pdf" and file_size < MIN_PDF_SIZE_BYTES:
            return False, "PDF appears to be incomplete"

        return True, ""

    except Exception as e:
        return False, f"Content validation error: {str(e)}"


async def scan_file_for_malware(file_data: bytes, content_type: str, filename: str) -> Tuple[bool, str]:
    """
    Comprehensive malware scanning for uploaded files.

    Args:
        file_data: Raw file bytes
        content_type: Declared MIME type
        filename: Original filename

    Returns:
        Tuple of (is_safe, error_message)
    """
    # Basic content validation
    is_safe, error_msg = await validate_file_content(file_data, content_type, filename)
    if not is_safe:
        return False, error_msg

    # Additional security checks
    try:
        # Check for embedded scripts in images
        if content_type.startswith("image/"):
            # Look for script tags or executable content in image data
            suspicious_strings = [
                b"<script",
                b"javascript:",
                b"vbscript:",
                b"data:text/html",
                b"<iframe",
                b"<object",
                b"<embed",
            ]

            for suspicious in suspicious_strings:
                if suspicious in file_data.lower():
                    return False, f"Image contains suspicious content: {suspicious.decode()}"

        # Check for zip bombs or compressed content
        if file_data.startswith(b"PK"):  # ZIP file signature
            return False, "Compressed files are not allowed"

        # Check for extremely large files that might be zip bombs (respect configured limit)
        if len(file_data) > settings.FILE_SIZE_LIMIT:
            return False, f"File exceeds configured limit ({settings.FILE_SIZE_LIMIT} bytes)"

        return True, ""

    except Exception as e:
        return False, f"Malware scanning error: {str(e)}"


def is_pdf_password_protected(file_data: bytes) -> Tuple[bool, str]:
    """
    Check if a PDF file is password-protected.

    Args:
        file_data: Raw PDF file bytes

    Returns:
        Tuple of (is_password_protected, error_message)
    """
    try:
        # Create a BytesIO object from the file data
        pdf_stream = io.BytesIO(file_data)

        # Try to read the PDF
        reader = PdfReader(pdf_stream)

        # Check if the PDF is encrypted/password-protected
        if reader.is_encrypted:
            return True, "PDF is password-protected"

        return False, ""

    except Exception as e:
        # If we can't read the PDF, it might be corrupted or not a valid PDF
        # We'll allow it through and let other validation catch it
        log.warning(f"Could not check PDF encryption status: {str(e)}")
        return False, ""


def get_file_hash(file_data: bytes) -> str:
    """
    Generate SHA-256 hash of file content for tracking and deduplication.

    Args:
        file_data: Raw file bytes

    Returns:
        SHA-256 hash as hex string
    """
    import hashlib

    return hashlib.sha256(file_data).hexdigest()
