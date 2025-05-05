# Strawberry imports
import strawberry_django

# Module Imports
from plane.db.models import IssueRelation
from .base import IssuesType


@strawberry_django.type(IssueRelation)
class IssueRelationType:
    blocking: list[IssuesType]
    blocked_by: list[IssuesType]
