import orderBy from "lodash/orderBy";
import { TIssue } from "@plane/types";
import { getIssueIds } from "@/store/issue/helpers/base-issues-utils";

export const workItemSortWithOrderByExtended = (array: TIssue[], key?: string) => {
  switch (key) {
    case "customer_count":
      return getIssueIds(orderBy(array, "customer_count"));
    case "-customer_count":
      return getIssueIds(orderBy(array, "customer_count", ["desc"]));

    case "customer_request_count":
      return getIssueIds(orderBy(array, "customer_request_count"));
    case "-customer_request_count":
      return getIssueIds(orderBy(array, "customer_request_count", ["desc"]));
    default:
      return getIssueIds(array);
  }
};
