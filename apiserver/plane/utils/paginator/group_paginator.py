# Python imports
import math
from collections import defaultdict

# Django imports
from django.db.models import Count, F, Window
from django.db.models.functions import RowNumber

# Module imports
from .list_paginator import OffsetPaginator
from .paginator_util import Cursor, CursorResult, BadPaginationError


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
        *args,
        **kwargs,
    ):
        # Initiate the parent class for all the parameters
        super().__init__(queryset, *args, **kwargs)
        # Set the group by field name
        self.group_by_field_name = group_by_field_name
        # Set the group by fields
        self.group_by_fields = group_by_fields

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
        count = self.count_queryset.count()

        # Optionally, calculate the total count and max_hits if needed
        # This might require adjustments based on specific use cases
        if results:
            max_hits = math.ceil(
                self.count_queryset.values(self.group_by_field_name)
                .annotate(
                    count=Count(
                        "id",
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
            self.count_queryset.values(self.group_by_field_name)
            .annotate(
                count=Count(
                    "id",
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
