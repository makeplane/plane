# Strawberry imports
import strawberry

# Module imports
from .cycle import CycleLiteType
from .issues.base import IssueLiteType
from .module import ModuleLiteType
from .page import PageLiteType
from .project import ProjectLiteType


@strawberry.type
class GlobalSearchType:
    projects: list[ProjectLiteType]
    issues: list[IssueLiteType]
    modules: list[ModuleLiteType]
    cycles: list[CycleLiteType]
    pages: list[PageLiteType]
    epics: list[IssueLiteType]
