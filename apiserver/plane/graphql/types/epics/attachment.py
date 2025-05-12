# python imports
from dataclasses import dataclass, field
from typing import Optional

# Strawberry imports
import strawberry
from strawberry.scalars import JSON


@strawberry.input
@dataclass
class EpicAttachmentCreateInputType:
    name: str = field()
    type: str = field()
    size: int = field()


@strawberry.input
@dataclass
class EpicAttachmentUpdateInputType:
    attributes: Optional[JSON] = field(default=None)


@strawberry.type
class EpicAttachmentPresignedUrlResponseType:
    upload_data: JSON
    attachment_id: str
    asset_url: Optional[str]
