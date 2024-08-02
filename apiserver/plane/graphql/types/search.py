# Strawberry imports
import strawberry

# Module imports
from plane.graphql.types.project import ProjectLiteType
from plane.graphql.types.issue import IssueLiteType
from plane.graphql.types.page import PageLiteType

@strawberry.type
class ProjectSearchType:
    projects: list[ProjectLiteType]
    issues: list[IssueLiteType]
    pages: list[PageLiteType]
