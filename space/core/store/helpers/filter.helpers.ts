import { EIssueGroupByToServerOptions, EServerGroupByToFilterOptions } from "@plane/constants";
import { IssuePaginationOptions, TIssueParams } from "@plane/types";

/**
 * This Method is used to construct the url params along with paginated values
 * @param filterParams params generated from filters
 * @param options pagination options
 * @param cursor cursor if exists
 * @param groupId groupId if to fetch By group
 * @param subGroupId groupId if to fetch By sub group
 * @returns
 */
export const getPaginationParams = (
  filterParams: Partial<Record<TIssueParams, string | boolean>> | undefined,
  options: IssuePaginationOptions,
  cursor: string | undefined,
  groupId?: string,
  subGroupId?: string
) => {
  // if cursor exists, use the cursor. If it doesn't exist construct the cursor based on per page count
  const pageCursor = cursor ? cursor : groupId ? `${options.perPageCount}:1:0` : `${options.perPageCount}:0:0`;

  // pagination params
  const paginationParams: Partial<Record<TIssueParams, string | boolean>> = {
    ...filterParams,
    cursor: pageCursor,
    per_page: options.perPageCount.toString(),
  };

  // If group by is specifically sent through options, like that for calendar layout, use that to group
  if (options.groupedBy) {
    paginationParams.group_by = EIssueGroupByToServerOptions[options.groupedBy];
  }

  // If group by is specifically sent through options, like that for calendar layout, use that to group
  if (options.subGroupedBy) {
    paginationParams.sub_group_by = EIssueGroupByToServerOptions[options.subGroupedBy];
  }

  // If group by is specifically sent through options, like that for calendar layout, use that to group
  if (options.orderBy) {
    paginationParams.order_by = options.orderBy;
  }

  // If before and after dates are sent from option to filter by then, add them to filter the options
  if (options.after && options.before) {
    paginationParams["target_date"] = `${options.after};after,${options.before};before`;
  }

  // If groupId is passed down, add a filter param for that group Id
  if (groupId) {
    const groupBy = paginationParams["group_by"] as EIssueGroupByToServerOptions | undefined;
    delete paginationParams["group_by"];

    if (groupBy) {
      const groupByFilterOption = EServerGroupByToFilterOptions[groupBy];
      paginationParams[groupByFilterOption] = groupId;
    }
  }

  // If subGroupId is passed down, add a filter param for that subGroup Id
  if (subGroupId) {
    const subGroupBy = paginationParams["sub_group_by"] as EIssueGroupByToServerOptions | undefined;
    delete paginationParams["sub_group_by"];

    if (subGroupBy) {
      const subGroupByFilterOption = EServerGroupByToFilterOptions[subGroupBy];
      paginationParams[subGroupByFilterOption] = subGroupId;
    }
  }

  return paginationParams;
};
