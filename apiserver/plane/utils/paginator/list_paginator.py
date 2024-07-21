# Python imports
import math

# Django imports
from django.db.models import F

# Module imports
from .paginator_util import Cursor, CursorResult, BadPaginationError, MAX_LIMIT


class OffsetPaginator:
    """
    The Offset paginator using the offset and limit
    with cursor controls
    http://example.com/api/users/?cursor=10.0.0&per_page=10
    cursor=limit,offset=page,
    """

    def __init__(
        self,
        queryset,
        count_queryset,
        order_by=None,
        max_limit=MAX_LIMIT,
        max_offset=None,
        on_results=None,
    ):
        # Key tuple and remove `-` if descending order by
        self.key = (
            order_by
            if order_by is None or isinstance(order_by, (list, tuple, set))
            else (order_by[1::] if order_by.startswith("-") else order_by,)
        )
        # Set desc to true when `-` exists in the order by
        self.desc = True if order_by and order_by.startswith("-") else False
        # Set the queryset
        self.queryset = queryset
        # Set the max limit
        self.max_limit = max_limit
        # Set the max offset
        self.max_offset = max_offset
        # Set the on results
        self.on_results = on_results
        # Set the count queryset
        self.count_queryset = count_queryset

    def get_result(self, limit=100, cursor=None):
        # offset is page #
        # value is page limit
        if cursor is None:
            cursor = Cursor(0, 0, 0)

        # Get the min from limit and max limit
        limit = min(limit, self.max_limit)

        # queryset
        queryset = self.queryset
        # Order the queryset
        if self.key:
            queryset = queryset.order_by(
                (
                    F(*self.key).desc(nulls_last=True)
                    if self.desc
                    else F(*self.key).asc(nulls_last=True)
                ),
                "-created_at",
            )
        # The current page
        page = cursor.offset
        # The offset
        offset = cursor.offset * cursor.value
        # The stop
        stop = offset + (cursor.value or limit) + 1

        if self.max_offset is not None and offset >= self.max_offset:
            raise BadPaginationError("Pagination offset too large")
        if offset < 0:
            raise BadPaginationError("Pagination offset cannot be negative")

        # Compute the results
        results = queryset[offset:stop]

        if cursor.value != limit:
            results = results[-(limit + 1) :]

        # Adjust cursors based on the results for pagination
        next_cursor = Cursor(limit, page + 1, False, results.count() > limit)
        # If the page is greater than 0, then set the previous cursor
        prev_cursor = Cursor(limit, page - 1, True, page > 0)

        # Process the results
        results = results[:limit]

        # Process the results
        if self.on_results:
            results = self.on_results(results)

        # Count the queryset
        count = self.count_queryset.count()

        # Optionally, calculate the total count and max_hits if needed
        max_hits = math.ceil(count / limit)

        # Return the cursor results
        return CursorResult(
            results=results,
            next=next_cursor,
            prev=prev_cursor,
            hits=count,
            max_hits=max_hits,
        )

    def process_results(self, results):
        raise NotImplementedError
