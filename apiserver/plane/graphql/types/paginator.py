# Python imports
from typing import TypeVar, Optional, Generic

# Django imports
from django.db.models import Model

# Strawberry imports
import strawberry

# Defining a generic type variable
T = TypeVar("T", bound=Model)


@strawberry.type
class PaginatorInfo:
    prev_cursor: Optional[str]
    cursor: str
    next_cursor: Optional[str]
    prev_page_results: bool
    next_page_results: bool
    count: int
    total_count: int


@strawberry.type
class PaginatorResponse(PaginatorInfo, Generic[T]):
    results: list[T]
