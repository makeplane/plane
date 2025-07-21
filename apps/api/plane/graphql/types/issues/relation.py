# Third party imports
from enum import Enum

# Strawberry imports
import strawberry_django

# Module Imports
from plane.db.models import IssueRelation
from .base import IssuesType


class WorkItemRelationTypes(Enum):
    BLOCKING = "blocking"
    BLOCKED_BY = "blocked_by"
    DUPLICATE = "duplicate"
    RELATES_TO = "relates_to"
    START_AFTER = "start_after"
    START_BEFORE = "start_before"
    FINISH_AFTER = "finish_after"
    FINISH_BEFORE = "finish_before"

    def __str__(self):
        return self.name.lower()


@strawberry_django.type(IssueRelation)
class IssueRelationType:
    blocking: list[IssuesType]
    blocked_by: list[IssuesType]
    duplicate: list[IssuesType]
    relates_to: list[IssuesType]
    start_after: list[IssuesType]
    start_before: list[IssuesType]
    finish_after: list[IssuesType]
    finish_before: list[IssuesType]
