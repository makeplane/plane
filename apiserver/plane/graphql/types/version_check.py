# Python imports
from typing import Optional

# Strawberry imports
import strawberry


@strawberry.type
class VersionCheckType:
    version: Optional[str]
    min_supported_version: Optional[str]
    url: Optional[str]
    force_update: bool
    min_supported_backend_version: Optional[str]
