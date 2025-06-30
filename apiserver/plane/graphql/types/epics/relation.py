# Strawberry imports
import strawberry

# Module Imports
from plane.graphql.types.issues.base import IssuesType


@strawberry.type
class EpicRelationType:
    blocking: list[IssuesType]
    blocked_by: list[IssuesType]
    duplicate: list[IssuesType]
    relates_to: list[IssuesType]
    start_after: list[IssuesType]
    start_before: list[IssuesType]
    finish_after: list[IssuesType]
    finish_before: list[IssuesType]
