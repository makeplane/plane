import { orderBy } from "lodash-es";
import { TIssue } from "@plane/types";
import { getIssueIds } from "@/store/issue/helpers/base-issues-utils";

export const workItemSortWithOrderByExtended = (array: TIssue[], key?: string) => {
  switch (key) {
    case "customer_count":
      return getIssueIds(orderBy(array, (issue) => issue.customer_ids?.length));
    case "-customer_count":
      return getIssueIds(orderBy(array, (issue) => issue.customer_ids?.length, ["desc"]));

    case "customer_request_count":
      return getIssueIds(orderBy(array, (issue) => issue.customer_request_ids?.length));
    case "-customer_request_count":
      return getIssueIds(orderBy(array, (issue) => issue.customer_request_ids?.length, ["desc"]));
    default:
      return getIssueIds(array);
  }
};
