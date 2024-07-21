# Python imports
import math
from collections import defaultdict

# Django imports
from django.db.models import Count, F, Window
from django.db.models.functions import RowNumber

# Module imports
from .list_paginator import OffsetPaginator
from .paginator_util import Cursor, CursorResult, BadPaginationError


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
        count = self.count_queryset.count()

        # Optionally, calculate the total count and max_hits if needed
        # This might require adjustments based on specific use cases
        if results:
            max_hits = math.ceil(
                self.count_queryset.values(self.group_by_field_name)
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
            self.count_queryset.order_by(self.group_by_field_name)
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
            self.count_queryset.values(
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
