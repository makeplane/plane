# Strawberry imports
import strawberry

# Module Imports
from plane.graphql.types.issues.base import IssuesType


@strawberry.type
class EpicRelationType:
    blocking: list[IssuesType]
    blocked_by: list[IssuesType]
