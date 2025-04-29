# Strawberry imports
import strawberry

# Module Imports
from plane.graphql.types.issue import IssuesType


@strawberry.type
class EpicRelationType:
    blocking: list[IssuesType]
    blocked_by: list[IssuesType]
