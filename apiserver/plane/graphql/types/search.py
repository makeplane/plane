# Strawberry imports
import strawberry

# Module imports
from plane.graphql.types.issue import IssueType
from plane.graphql.types.project import ProjectType


@strawberry.type
class ProjectSearchType:
    projects: list[ProjectType]
    issues: list[IssueType]
