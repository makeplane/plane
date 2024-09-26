# Strawberry imports
import strawberry

# Module imports
from plane.graphql.types.project import ProjectLiteType
from plane.graphql.types.issue import IssueLiteType
from plane.graphql.types.page import PageLiteType
from plane.graphql.types.module import ModuleLiteType
from plane.graphql.types.cycle import CycleLiteType


@strawberry.type
class GlobalSearchType:
    projects: list[ProjectLiteType]
    issues: list[IssueLiteType]
    modules: list[ModuleLiteType]
    cycles: list[CycleLiteType]
    pages: list[PageLiteType]
