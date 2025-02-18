# python imports
from typing import Optional

# Strawberry imports
import strawberry
from strawberry.scalars import JSON


@strawberry.type
class IssueAttachmentPresignedUrlResponseType:
    upload_data: JSON
    attachment_id: str
    asset_url: Optional[str]
