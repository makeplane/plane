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

# python imports
import uuid
from typing import Optional

# Third-party imports
from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlmodel import Field

from pi.app.models.base import BaseModel
from pi.config import settings


class MessageAttachment(BaseModel, table=True):
    __tablename__ = "message_attachments"

    # File information
    original_filename: str = Field(nullable=False, max_length=500)
    content_type: str = Field(nullable=False, max_length=100)  # MIME type (e.g., image/png, application/pdf)
    file_size: int = Field(nullable=False)  # Size in bytes
    file_type: str = Field(sa_column=Column(String(50), nullable=False))  # image, pdf, document, other

    # Upload status
    status: str = Field(sa_column=Column(String(50), nullable=False, default="pending"))  # pending, uploaded, failed

    # S3 file path (just the key/path, not full URL)
    file_path: str = Field(nullable=False, max_length=1000)  # e.g., "uploads/ws-id/chat-id/file-id-filename.pdf"

    # Context information
    workspace_id: Optional[uuid.UUID] = Field(nullable=True, index=True)
    chat_id: Optional[uuid.UUID] = Field(nullable=True, index=True)
    message_id: Optional[uuid.UUID] = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("messages.id", name="fk_message_attachments_message_id"), nullable=True, index=True)
    )  # Can be null initially, set later

    # User who uploaded
    user_id: uuid.UUID = Field(nullable=False, index=True)

    @property
    def s3_url(self) -> str:
        """Generate the S3 URL for this attachment"""
        return f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_S3_REGION}.amazonaws.com/{self.file_path}"

    @property
    def is_image(self) -> bool:
        """Check if the attachment is an image"""
        return self.file_type == "image"

    @property
    def is_pdf(self) -> bool:
        """Check if the attachment is a PDF"""
        return self.file_type == "pdf"

    @classmethod
    def get_file_type_from_mime(cls, content_type: str) -> str:
        """Determine file type from MIME type"""
        if content_type.startswith("image/"):
            return "image"
        elif content_type == "application/pdf":
            return "pdf"
        else:
            return "other"

    def generate_file_path(self, workspace_id: Optional[uuid.UUID], chat_id: uuid.UUID) -> str:
        # path is like: uploads/ws-id/chat-id/attachment-id-filename
        env_prefix = settings.AWS_S3_ENV.strip()
        # Base path
        base_path = f"uploads/{workspace_id}/{chat_id}/{self.id}-{self.original_filename}"

        if env_prefix:
            # Add env as top-level folder
            return f"plane_ai/{env_prefix}/{base_path}"
        else:
            # Prod case — no prefix
            return f"plane_ai/{base_path}"
