/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { orderBy } from "lodash-es";
import type { TIssue } from "@plane/types";
import type { RootStore } from "@/plane-web/store/root.store";
import { getIssueIds } from "@/store/issue/helpers/base-issues-utils";

// Check resolved name emptiness — push items with no resolved name to the bottom
const getResolvedNameIsEmpty = (resolvedName: string | undefined) => (resolvedName ? 0 : 1);

/**
 * CE extension for sorting work items by project name, main/sub task category name.
 * Called from core's issuesSortWithOrderBy when the sort key doesn't match any core case.
 */
export const workItemSortWithOrderByExtended = (
  array: TIssue[],
  key: string | undefined,
  rootStore?: RootStore
): string[] => {
  if (!key || !rootStore) return getIssueIds(array);

  const { projectRoot, taskCategoryStore } = rootStore;
  if (!taskCategoryStore || !projectRoot) return getIssueIds(array);

  const isDescending = key.startsWith("-");
  const baseKey = isDescending ? key.slice(1) : key;
  const sortDir = isDescending ? "desc" : "asc";

  let getNameFn: ((issue: TIssue) => string) | undefined;

  switch (baseKey) {
    case "project__name":
      getNameFn = (issue: TIssue) => projectRoot.project.getProjectById(issue.project_id)?.name?.toLowerCase() ?? "";
      break;
    case "main_task_category__name":
      getNameFn = (issue: TIssue) =>
        taskCategoryStore.mainCategories[issue.main_task_category_id ?? ""]?.name?.toLowerCase() ?? "";
      break;
    case "sub_task_category__name":
      getNameFn = (issue: TIssue) =>
        taskCategoryStore.subCategories[issue.sub_task_category_id ?? ""]?.name?.toLowerCase() ?? "";
      break;
    default:
      return getIssueIds(array);
  }

  return getIssueIds(
    orderBy(array, [(i: TIssue) => getResolvedNameIsEmpty(getNameFn(i)), getNameFn], ["asc", sortDir])
  );
};
