# Third party imports
from rest_framework.exceptions import ParseError
from rest_framework.response import Response

# Module imports
from .list_paginator import OffsetPaginator
from .paginator_util import Cursor, BadPaginationError


class BasePaginator:
    """BasePaginator class can be inherited by any View to return a paginated view"""

    # cursor query parameter name
    cursor_name = "cursor"

    # get the per page parameter from request
    def get_per_page(self, request, default_per_page=100, max_per_page=100):
        try:
            per_page = int(request.GET.get("per_page", default_per_page))
        except ValueError:
            raise ParseError(detail="Invalid per_page parameter.")

        max_per_page = max(max_per_page, default_per_page)
        if per_page > max_per_page:
            raise ParseError(
                detail=f"Invalid per_page value. Cannot exceed {max_per_page}."
            )

        return per_page

    def paginate(
        self,
        request,
        on_results=None,
        paginator=None,
        paginator_cls=OffsetPaginator,
        default_per_page=100,
        max_per_page=100,
        cursor_cls=Cursor,
        extra_stats=None,
        controller=None,
        group_by_field_name=None,
        group_by_fields=None,
        sub_group_by_field_name=None,
        sub_group_by_fields=None,
        **paginator_kwargs,
    ):
        """Paginate the request"""
        per_page = self.get_per_page(request, default_per_page, max_per_page)

        # Convert the cursor value to integer and float from string
        input_cursor = None
        try:
            input_cursor = cursor_cls.from_string(
                request.GET.get(self.cursor_name, f"{per_page}:0:0"),
            )
        except ValueError:
            raise ParseError(detail="Invalid cursor parameter.")

        if not paginator:
            if group_by_field_name:
                paginator_kwargs["group_by_field_name"] = group_by_field_name
                paginator_kwargs["group_by_fields"] = group_by_fields

                if sub_group_by_field_name:
                    paginator_kwargs["sub_group_by_field_name"] = (
                        sub_group_by_field_name
                    )
                    paginator_kwargs["sub_group_by_fields"] = (
                        sub_group_by_fields
                    )

            paginator = paginator_cls(**paginator_kwargs)

        try:
            cursor_result = paginator.get_result(
                limit=per_page, cursor=input_cursor
            )
        except BadPaginationError:
            raise ParseError(detail="Error in parsing")

        if on_results:
            results = on_results(cursor_result.results)
        else:
            results = cursor_result.results

        if group_by_field_name:
            results = paginator.process_results(results=results)

        # Add Manipulation functions to the response
        if controller is not None:
            results = controller(results)
        else:
            results = results

        # Return the response
        response = Response(
            {
                "grouped_by": group_by_field_name,
                "sub_grouped_by": sub_group_by_field_name,
                "total_count": (cursor_result.hits),
                "next_cursor": str(cursor_result.next),
                "prev_cursor": str(cursor_result.prev),
                "next_page_results": cursor_result.next.has_results,
                "prev_page_results": cursor_result.prev.has_results,
                "count": cursor_result.__len__(),
                "total_pages": cursor_result.max_hits,
                "total_results": cursor_result.hits,
                "extra_stats": extra_stats,
                "results": results,
            }
        )

        return response
