# Python imports
from typing import Optional

# Module imports
from plane.graphql.types.paginator import PaginatorResponse

# Constants
PAGINATOR_MAX_LIMIT = 100


class Cursor:
    def __init__(self, page_size=PAGINATOR_MAX_LIMIT, current_page=0, offset=0):
        self.page_size = page_size
        self.current_page = current_page
        self.offset = offset

    def __str__(self):
        return f"{self.page_size}:{self.current_page}:{self.offset}"

    @classmethod
    def from_string(self, cursor):
        cursor_bits = cursor.split(":")
        if len(cursor_bits) != 3:
            return ValueError("Invalid cursor format")
        return self(int(cursor_bits[0]), int(cursor_bits[1]), int(cursor_bits[2]))


def paginate(results_object, cursor: Optional[str] = None):
    """
    Paginator Information Results
    """
    cursor_object = Cursor.from_string(cursor)
    if cursor_object is None:
        cursor_object = Cursor(0, 0, 0)

    total_results = len(results_object)
    page_size = min(cursor_object.page_size, PAGINATOR_MAX_LIMIT)

    # Calculate the start and end index for the paginated data
    start_index = 0
    if cursor_object.current_page > 0:
        start_index = cursor_object.current_page * page_size
    end_index = min(start_index + page_size, total_results)

    # Get the paginated data
    paginated_data = results_object[start_index:end_index]

    # Create the pagination info object
    prev_cursor = f"{page_size}:{cursor_object.current_page-1}:0"
    cursor = f"{page_size}:{cursor_object.current_page}:0"
    next_cursor = None
    if end_index < total_results:
        next_cursor = f"{page_size}:{cursor_object.current_page+1}:0"

    prev_page_results = False
    if cursor_object.current_page > 0:
        prev_page_results = True

    next_page_results = False
    if next_cursor:
        next_page_results = True

    return PaginatorResponse(
        prev_cursor=prev_cursor,
        cursor=cursor,
        next_cursor=next_cursor,
        prev_page_results=prev_page_results,
        next_page_results=next_page_results,
        count=len(paginated_data),
        total_count=total_results,
        results=paginated_data,
    )
