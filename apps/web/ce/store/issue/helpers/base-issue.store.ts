import { TIssue } from "@plane/types";
import { getIssueIds } from "@/store/issue/helpers/base-issues-utils";

export const workItemSortWithOrderByExtended = (array: TIssue[], key?: string) => getIssueIds(array);
