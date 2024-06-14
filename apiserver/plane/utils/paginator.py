# Python imports
import math
from collections import defaultdict
from collections.abc import Sequence

# Django imports
from django.db.models import Count, F, Window
from django.db.models.functions import RowNumber

# Third party imports
from rest_framework.exceptions import ParseError
from rest_framework.response import Response

# Module imports


class Cursor:
    # The cursor value
    def __init__(self, value, offset=0, is_prev=False, has_results=None):
        self.value = value
        self.offset = int(offset)
        self.is_prev = bool(is_prev)
        self.has_results = has_results

    # Return the cursor value in string format
    def __str__(self):
        return f"{self.value}:{self.offset}:{int(self.is_prev)}"

    # Return the cursor value
    def __eq__(self, other):
        return all(
            getattr(self, attr) == getattr(other, attr)
            for attr in ("value", "offset", "is_prev", "has_results")
        )

    # Return the representation of the cursor
    def __repr__(self):
        return f"{type(self).__name__,}: value={self.value} offset={self.offset}, is_prev={int(self.is_prev)}"

    # Return if the cursor is true
    def __bool__(self):
        return bool(self.has_results)

    @classmethod
    def from_string(cls, value):
        """Return the cursor value from string format"""
        try:
            bits = value.split(":")
            if len(bits) != 3:
                raise ValueError(
                    "Cursor must be in the format 'value:offset:is_prev'"
                )

            value = float(bits[0]) if "." in bits[0] else int(bits[0])
            return cls(value, int(bits[1]), bool(int(bits[2])))
        except (TypeError, ValueError) as e:
            raise ValueError(f"Invalid cursor format: {e}")


class CursorResult(Sequence):
    def __init__(self, results, next, prev, hits=None, max_hits=None):
        self.results = results
        self.next = next
        self.prev = prev
        self.hits = hits
        self.max_hits = max_hits

    def __len__(self):
        # Return the length of the results
        return len(self.results)

    def __iter__(self):
        # Return the iterator of the results
        return iter(self.results)

    def __getitem__(self, key):
        # Return the results based on the key
        return self.results[key]

    def __repr__(self):
        # Return the representation of the results
        return f"<{type(self).__name__}: results={len(self.results)}>"


MAX_LIMIT = 100


class BadPaginationError(Exception):
    pass


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
        self.queryset = queryset
        self.max_limit = max_limit
        self.max_offset = max_offset
        self.on_results = on_results

    def get_result(self, limit=100, cursor=None):
        # offset is page #
        # value is page limit
        if cursor is None:
            cursor = Cursor(0, 0, 0)

        # Get the min from limit and max limit
        limit = min(limit, self.max_limit)

        # queryset
        queryset = self.queryset
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
        stop = offset + (cursor.value or limit) + 1

        if self.max_offset is not None and offset >= self.max_offset:
            raise BadPaginationError("Pagination offset too large")
        if offset < 0:
            raise BadPaginationError("Pagination offset cannot be negative")

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
        count = queryset.count()

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


class GroupedOffsetPaginator(OffsetPaginator):

    # Field mappers - list m2m fields here
    FIELD_MAPPER = {
        "labels__id": "label_ids",
        "assignees__id": "assignee_ids",
        "issue_module__module_id": "module_ids",
    }

    def __init__(
        self,
        queryset,
        group_by_field_name,
        group_by_fields,
        count_filter,
        *args,
        **kwargs,
    ):
        # Initiate the parent class for all the parameters
        super().__init__(queryset, *args, **kwargs)

        # Set the group by field name
        self.group_by_field_name = group_by_field_name
        # Set the group by fields
        self.group_by_fields = group_by_fields
        # Set the count filter - this are extra filters that need to be passed to calculate the counts with the filters
        self.count_filter = count_filter

    def get_result(self, limit=50, cursor=None):
        # offset is page #
        # value is page limit
        if cursor is None:
            cursor = Cursor(0, 0, 0)

        limit = min(limit, self.max_limit)

        # Adjust the initial offset and stop based on the cursor and limit
        queryset = self.queryset

        page = cursor.offset
        offset = cursor.offset * cursor.value
        stop = offset + (cursor.value or limit) + 1

        # Check if the offset is greater than the max offset
        if self.max_offset is not None and offset >= self.max_offset:
            raise BadPaginationError("Pagination offset too large")

        # Check if the offset is less than 0
        if offset < 0:
            raise BadPaginationError("Pagination offset cannot be negative")

        # Compute the results
        results = {}
        # Create window for all the groups
        queryset = queryset.annotate(
            row_number=Window(
                expression=RowNumber(),
                partition_by=[F(self.group_by_field_name)],
                order_by=(
                    (
                        F(*self.key).desc(
                            nulls_last=True
                        )  # order by desc if desc is set
                        if self.desc
                        else F(*self.key).asc(
                            nulls_last=True
                        )  # Order by asc if set
                    ),
                    F("created_at").desc(),
                ),
            )
        )
        # Filter the results by row number
        results = queryset.filter(
            row_number__gt=offset, row_number__lt=stop
        ).order_by(
            (
                F(*self.key).desc(nulls_last=True)
                if self.desc
                else F(*self.key).asc(nulls_last=True)
            ),
            F("created_at").desc(),
        )

        # Adjust cursors based on the grouped results for pagination
        next_cursor = Cursor(
            limit,
            page + 1,
            False,
            queryset.filter(row_number__gte=stop).exists(),
        )

        # Add previous cursors
        prev_cursor = Cursor(
            limit,
            page - 1,
            True,
            page > 0,
        )

        # Count the queryset
        count = queryset.count()

        # Optionally, calculate the total count and max_hits if needed
        # This might require adjustments based on specific use cases
        if results:
            max_hits = math.ceil(
                queryset.values(self.group_by_field_name)
                .annotate(
                    count=Count(
                        "id",
                        filter=self.count_filter,
                        distinct=True,
                    )
                )
                .order_by("-count")[0]["count"]
                / limit
            )
        else:
            max_hits = 0
        return CursorResult(
            results=results,
            next=next_cursor,
            prev=prev_cursor,
            hits=count,
            max_hits=max_hits,
        )

    def __get_total_queryset(self):
        # Get total items for each group
        return (
            self.queryset.values(self.group_by_field_name)
            .annotate(
                count=Count(
                    "id",
                    filter=self.count_filter,
                    distinct=True,
                )
            )
            .order_by()
        )

    def __get_total_dict(self):
        # Convert the total into dictionary of keys as group name and value as the total
        total_group_dict = {}
        for group in self.__get_total_queryset():
            total_group_dict[str(group.get(self.group_by_field_name))] = (
                total_group_dict.get(
                    str(group.get(self.group_by_field_name)), 0
                )
                + (1 if group.get("count") == 0 else group.get("count"))
            )
        return total_group_dict

    def __get_field_dict(self):
        # Create a field dictionary
        total_group_dict = self.__get_total_dict()
        return {
            str(field): {
                "results": [],
                "total_results": total_group_dict.get(str(field), 0),
            }
            for field in self.group_by_fields
        }

    def __result_already_added(self, result, group):
        # Check if the result is already added then add it
        for existing_issue in group:
            if existing_issue["id"] == result["id"]:
                return True
        return False

    def __query_multi_grouper(self, results):
        # Grouping for m2m values
        total_group_dict = self.__get_total_dict()

        # Preparing a dict to keep track of group IDs associated with each entity ID
        result_group_mapping = defaultdict(set)
        # Preparing a dict to group result by group ID
        grouped_by_field_name = defaultdict(list)

        # Iterate over results to fill the above dictionaries
        for result in results:
            result_id = result["id"]
            group_id = result[self.group_by_field_name]
            result_group_mapping[str(result_id)].add(str(group_id))

        # Adding group_ids key to each issue and grouping by group_name
        for result in results:
            result_id = result["id"]
            group_ids = list(result_group_mapping[str(result_id)])
            result[self.FIELD_MAPPER.get(self.group_by_field_name)] = (
                [] if "None" in group_ids else group_ids
            )
            # If a result belongs to multiple groups, add it to each group
            for group_id in group_ids:
                if not self.__result_already_added(
                    result, grouped_by_field_name[group_id]
                ):
                    grouped_by_field_name[group_id].append(result)

        # Convert grouped_by_field_name back to a list for each group
        processed_results = {
            str(group_id): {
                "results": issues,
                "total_results": total_group_dict.get(str(group_id)),
            }
            for group_id, issues in grouped_by_field_name.items()
        }

        return processed_results

    def __query_grouper(self, results):
        # Grouping for values that are not m2m
        processed_results = self.__get_field_dict()
        for result in results:
            group_value = str(result.get(self.group_by_field_name))
            if group_value in processed_results:
                processed_results[str(group_value)]["results"].append(result)
        return processed_results

    def process_results(self, results):
        # Process results
        if results:
            if self.group_by_field_name in self.FIELD_MAPPER:
                processed_results = self.__query_multi_grouper(results=results)
            else:
                processed_results = self.__query_grouper(results=results)
        else:
            processed_results = {}
        return processed_results


class SubGroupedOffsetPaginator(OffsetPaginator):
    # Field mappers this are the fields that are m2m
    FIELD_MAPPER = {
        "labels__id": "label_ids",
        "assignees__id": "assignee_ids",
        "issue_module__module_id": "module_ids",
    }

    def __init__(
        self,
        queryset,
        group_by_field_name,
        sub_group_by_field_name,
        group_by_fields,
        sub_group_by_fields,
        count_filter,
        *args,
        **kwargs,
    ):
        # Initiate the parent class for all the parameters
        super().__init__(queryset, *args, **kwargs)

        # Set the group by field name
        self.group_by_field_name = group_by_field_name
        self.group_by_fields = group_by_fields

        # Set the sub group by field name
        self.sub_group_by_field_name = sub_group_by_field_name
        self.sub_group_by_fields = sub_group_by_fields

        # Set the count filter - this are extra filters that need to be passed to calculate the counts with the filters
        self.count_filter = count_filter

    def get_result(self, limit=30, cursor=None):
        # offset is page #
        # value is page limit
        if cursor is None:
            cursor = Cursor(0, 0, 0)

        # get the minimum value
        limit = min(limit, self.max_limit)

        # Adjust the initial offset and stop based on the cursor and limit
        queryset = self.queryset

        # the current page
        page = cursor.offset

        # the offset
        offset = cursor.offset * cursor.value

        # the stop
        stop = offset + (cursor.value or limit) + 1

        if self.max_offset is not None and offset >= self.max_offset:
            raise BadPaginationError("Pagination offset too large")
        if offset < 0:
            raise BadPaginationError("Pagination offset cannot be negative")

        # Compute the results
        results = {}

        # Create windows for group and sub group field name
        queryset = queryset.annotate(
            row_number=Window(
                expression=RowNumber(),
                partition_by=[
                    F(self.group_by_field_name),
                    F(self.sub_group_by_field_name),
                ],
                order_by=(
                    (
                        F(*self.key).desc(nulls_last=True)
                        if self.desc
                        else F(*self.key).asc(nulls_last=True)
                    ),
                    "-created_at",
                ),
            )
        )

        # Filter the results
        results = queryset.filter(
            row_number__gt=offset, row_number__lt=stop
        ).order_by(
            (
                F(*self.key).desc(nulls_last=True)
                if self.desc
                else F(*self.key).asc(nulls_last=True)
            ),
            F("created_at").desc(),
        )

        # Adjust cursors based on the grouped results for pagination
        next_cursor = Cursor(
            limit,
            page + 1,
            False,
            queryset.filter(row_number__gte=stop).exists(),
        )

        # Add previous cursors
        prev_cursor = Cursor(
            limit,
            page - 1,
            True,
            page > 0,
        )

        # Count the queryset
        count = queryset.count()

        # Optionally, calculate the total count and max_hits if needed
        # This might require adjustments based on specific use cases
        if results:
            max_hits = math.ceil(
                queryset.values(self.group_by_field_name)
                .annotate(
                    count=Count(
                        "id",
                        filter=self.count_filter,
                        distinct=True,
                    )
                )
                .order_by("-count")[0]["count"]
                / limit
            )
        else:
            max_hits = 0
        return CursorResult(
            results=results,
            next=next_cursor,
            prev=prev_cursor,
            hits=count,
            max_hits=max_hits,
        )

    def __get_group_total_queryset(self):
        # Get group totals
        return (
            self.queryset.order_by(self.group_by_field_name)
            .values(self.group_by_field_name)
            .annotate(
                count=Count(
                    "id",
                    filter=self.count_filter,
                    distinct=True,
                )
            )
            .distinct()
        )

    def __get_subgroup_total_queryset(self):
        # Get subgroup totals
        return (
            self.queryset.values(
                self.group_by_field_name, self.sub_group_by_field_name
            )
            .annotate(
                count=Count("id", filter=self.count_filter, distinct=True)
            )
            .order_by()
            .values(
                self.group_by_field_name, self.sub_group_by_field_name, "count"
            )
        )

    def __get_total_dict(self):
        # Use the above to convert to dictionary of 2D objects
        total_group_dict = {}
        total_sub_group_dict = {}
        for group in self.__get_group_total_queryset():
            total_group_dict[str(group.get(self.group_by_field_name))] = (
                total_group_dict.get(
                    str(group.get(self.group_by_field_name)), 0
                )
                + (1 if group.get("count") == 0 else group.get("count"))
            )

        # Sub group total values
        for item in self.__get_subgroup_total_queryset():
            group = str(item[self.group_by_field_name])
            subgroup = str(item[self.sub_group_by_field_name])
            count = item["count"]

            # Create a dictionary of group and sub group
            if group not in total_sub_group_dict:
                total_sub_group_dict[str(group)] = {}

            # Create a dictionary of sub group
            if subgroup not in total_sub_group_dict[group]:
                total_sub_group_dict[str(group)][str(subgroup)] = {}

            # Create a nested dictionary of group and sub group
            total_sub_group_dict[group][subgroup] = count

        return total_group_dict, total_sub_group_dict

    def __get_field_dict(self):
        # Create a field dictionary
        total_group_dict, total_sub_group_dict = self.__get_total_dict()

        # Create a dictionary of group and sub group
        return {
            str(group): {
                "results": {
                    str(sub_group): {
                        "results": [],
                        "total_results": total_sub_group_dict.get(
                            str(group)
                        ).get(str(sub_group), 0),
                    }
                    for sub_group in total_sub_group_dict.get(str(group), [])
                },
                "total_results": total_group_dict.get(str(group), 0),
            }
            for group in self.group_by_fields
        }

    def __query_multi_grouper(self, results):
        # Multi grouper
        processed_results = self.__get_field_dict()
        # Preparing a dict to keep track of group IDs associated with each label ID
        result_group_mapping = defaultdict(set)
        result_sub_group_mapping = defaultdict(set)

        # Iterate over results to fill the above dictionaries
        if self.group_by_field_name in self.FIELD_MAPPER:
            for result in results:
                result_id = result["id"]
                group_id = result[self.group_by_field_name]
                result_group_mapping[str(result_id)].add(str(group_id))
        # Use the same calculation for the sub group
        if self.sub_group_by_field_name in self.FIELD_MAPPER:
            for result in results:
                result_id = result["id"]
                sub_group_id = result[self.sub_group_by_field_name]
                result_sub_group_mapping[str(result_id)].add(str(sub_group_id))

        # Iterate over results
        for result in results:
            # Get the group value
            group_value = str(result.get(self.group_by_field_name))
            # Get the sub group value
            sub_group_value = str(result.get(self.sub_group_by_field_name))
            # Check if the group value is in the processed results
            result_id = result["id"]

            if (
                group_value in processed_results
                and sub_group_value
                in processed_results[str(group_value)]["results"]
            ):
                if self.group_by_field_name in self.FIELD_MAPPER:
                    # for multi grouper
                    group_ids = list(result_group_mapping[str(result_id)])
                    result[self.FIELD_MAPPER.get(self.group_by_field_name)] = (
                        [] if "None" in group_ids else group_ids
                    )
                if self.sub_group_by_field_name in self.FIELD_MAPPER:
                    sub_group_ids = list(
                        result_sub_group_mapping[str(result_id)]
                    )
                    # for multi groups
                    result[
                        self.FIELD_MAPPER.get(self.sub_group_by_field_name)
                    ] = ([] if "None" in sub_group_ids else sub_group_ids)
                # If a result belongs to multiple groups, add it to each group
                processed_results[str(group_value)]["results"][
                    str(sub_group_value)
                ]["results"].append(result)

        return processed_results

    def __query_grouper(self, results):
        # Single grouper
        processed_results = self.__get_field_dict()
        for result in results:
            group_value = str(result.get(self.group_by_field_name))
            sub_group_value = str(result.get(self.sub_group_by_field_name))
            processed_results[group_value]["results"][sub_group_value][
                "results"
            ].append(result)

        return processed_results

    def process_results(self, results):
        if results:
            if (
                self.group_by_field_name in self.FIELD_MAPPER
                or self.sub_group_by_field_name in self.FIELD_MAPPER
            ):
                # if the grouping is done through m2m then
                processed_results = self.__query_multi_grouper(results=results)
            else:
                # group it directly
                processed_results = self.__query_grouper(results=results)
        else:
            processed_results = {}
        return processed_results


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
        count_filter=None,
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
                paginator_kwargs["count_filter"] = count_filter

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
