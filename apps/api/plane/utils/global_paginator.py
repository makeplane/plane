# python imports
from math import ceil

# constants
PAGINATOR_MAX_LIMIT = 1000


class PaginateCursor:
    def __init__(self, current_page_size: int, current_page: int, offset: int):
        self.current_page_size = current_page_size
        self.current_page = current_page
        self.offset = offset

    def __str__(self):
        return f"{self.current_page_size}:{self.current_page}:{self.offset}"

    @classmethod
    def from_string(self, value):
        """Return the cursor value from string format"""
        try:
            bits = value.split(":")
            if len(bits) != 3:
                raise ValueError("Cursor must be in the format 'value:offset:is_prev'")
            return self(int(bits[0]), int(bits[1]), int(bits[2]))
        except (TypeError, ValueError) as e:
            raise ValueError(f"Invalid cursor format: {e}")


def paginate(base_queryset, queryset, cursor, on_result):
    # validating for cursor
    if cursor is None:
        cursor_object = PaginateCursor(PAGINATOR_MAX_LIMIT, 0, 0)
    else:
        cursor_object = PaginateCursor.from_string(cursor)

    # getting the issues count
    total_results = base_queryset.count()
    page_size = min(cursor_object.current_page_size, PAGINATOR_MAX_LIMIT)

    # getting the total pages available based on the page size
    total_pages = ceil(total_results / page_size)

    # Calculate the start and end index for the paginated data
    start_index = 0
    if cursor_object.current_page > 0:
        start_index = cursor_object.current_page * page_size
    end_index = min(start_index + page_size, total_results)

    # Get the paginated data
    paginated_data = queryset[start_index:end_index]

    # Create the pagination info object
    prev_cursor = f"{page_size}:{cursor_object.current_page - 1}:0"
    cursor = f"{page_size}:{cursor_object.current_page}:0"
    next_cursor = None
    if end_index < total_results:
        next_cursor = f"{page_size}:{cursor_object.current_page + 1}:0"

    prev_page_results = False
    if cursor_object.current_page > 0:
        prev_page_results = True

    next_page_results = False
    if next_cursor:
        next_page_results = True

    if on_result:
        paginated_data = on_result(paginated_data)

    # returning the result
    paginated_data = {
        "prev_cursor": prev_cursor,
        "cursor": cursor,
        "next_cursor": next_cursor,
        "prev_page_results": prev_page_results,
        "next_page_results": next_page_results,
        "page_count": len(paginated_data),
        "total_results": total_results,
        "total_pages": total_pages,
        "results": paginated_data,
    }

    return paginated_data
