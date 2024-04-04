import isEmpty from "lodash/isEmpty";
// types
import {
  TInboxIssueFilter,
  TInboxIssueSorting,
  TInboxIssueSortingOrderByQueryParam,
  TInboxIssuesQueryParams,
} from "@plane/types";

interface IInboxIssueHelpers {
  inboxIssueQueryParams: (
    inboxFilters: Partial<TInboxIssueFilter>,
    inboxSorting: Partial<TInboxIssueSorting>,
    pagePerCount: number,
    paginationCursor: string
  ) => Partial<TInboxIssuesQueryParams>;
}

export class InboxIssueHelpers implements IInboxIssueHelpers {
  constructor() {}

  inboxIssueQueryParams = (
    inboxFilters: Partial<TInboxIssueFilter>,
    inboxSorting: Partial<TInboxIssueSorting>,
    pagePerCount: number,
    paginationCursor: string
  ) => {
    const filters: Partial<Record<keyof TInboxIssueFilter, string>> = {};
    !isEmpty(inboxFilters) &&
      Object.keys(inboxFilters).forEach((key) => {
        const filterKey = key as keyof TInboxIssueFilter;
        if (inboxFilters[filterKey] && inboxFilters[filterKey]?.length)
          filters[filterKey] = inboxFilters[filterKey]?.join(",");
      });

    const sorting: TInboxIssueSortingOrderByQueryParam = {
      order_by: "-issue__created_at",
    };
    if (inboxSorting.order_by && inboxSorting.sort_by) {
      switch (inboxSorting.order_by) {
        case "issue__created_at":
          if (inboxSorting.sort_by === "desc") sorting.order_by = `-issue__created_at`;
          else sorting.order_by = "issue__created_at";
          break;
        case "issue__updated_at":
          if (inboxSorting.sort_by === "desc") sorting.order_by = `-issue__updated_at`;
          else sorting.order_by = "issue__updated_at";
          break;
        case "issue__sequence_id":
          if (inboxSorting.sort_by === "desc") sorting.order_by = `-issue__sequence_id`;
          else sorting.order_by = "issue__sequence_id";
          break;
        default:
          sorting.order_by = "-issue__created_at";
          break;
      }
    }

    return {
      ...filters,
      ...sorting,
      per_page: pagePerCount,
      cursor: paginationCursor,
    };
  };
}
