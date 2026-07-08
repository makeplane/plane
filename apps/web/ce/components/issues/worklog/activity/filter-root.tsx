/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import type { TActivityFilters, TActivityFilterOption } from "@plane/constants";
import { ACTIVITY_FILTER_TYPE_OPTIONS, EActivityFilterType } from "@plane/constants";
// components
import { ActivityFilter } from "@/components/issues/issue-detail/issue-activity";
// hooks
import { useProject } from "@/hooks/store/use-project";

export type TActivityFilterRoot = {
  selectedFilters: TActivityFilters[];
  toggleFilter: (filter: TActivityFilters) => void;
  projectId: string;
  isIntakeIssue?: boolean;
};

export const ActivityFilterRoot = observer(function ActivityFilterRoot(props: TActivityFilterRoot) {
  const { selectedFilters, toggleFilter, projectId, isIntakeIssue = false } = props;
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const currentProjectDetails = getProjectById(projectId);
  // the worklog filter is only relevant when time tracking is on and the work item is not an intake item
  const showWorklogFilter = Boolean(currentProjectDetails?.is_time_tracking_enabled) && !isIntakeIssue;

  const filters: TActivityFilterOption[] = Object.entries(ACTIVITY_FILTER_TYPE_OPTIONS)
    .filter(([key]) => showWorklogFilter || (key as TActivityFilters) !== EActivityFilterType.WORKLOG)
    .map(([key, value]) => {
      const filterKey = key as TActivityFilters;
      return {
        key: filterKey,
        labelTranslationKey: value.labelTranslationKey,
        isSelected: selectedFilters.includes(filterKey),
        onClick: () => toggleFilter(filterKey),
      };
    });

  return <ActivityFilter selectedFilters={selectedFilters} filterOptions={filters} />;
});
