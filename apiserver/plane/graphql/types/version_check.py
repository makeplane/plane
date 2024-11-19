# Strawberry imports
import strawberry


@strawberry.type
class VersionCheckType:
    version: str
    min_supported_version: str
    url: str
    force_update: bool
