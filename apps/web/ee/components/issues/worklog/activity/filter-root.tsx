"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane constants
import {
  TActivityFilters,
  ACTIVITY_FILTER_TYPE_OPTIONS,
  TActivityFilterOption,
  EActivityFilterTypeEE,
} from "@plane/constants";
// ce components
import { TActivityFilterRoot } from "@/ce/components/issues";
// components
import { ActivityFilter } from "@/components/issues";
// hooks
import { useWorkspace } from "@/hooks/store";
// plane web hooks
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";

export const ActivityFilterRoot: FC<TActivityFilterRoot> = observer((props) => {
  const { selectedFilters, toggleFilter, isIntakeIssue = false, projectId } = props;
  // hooks
  const { currentWorkspace } = useWorkspace();
  const { isWorklogsEnabledByProjectId } = useWorkspaceWorklogs();

  // derived values
  const workspaceId = currentWorkspace?.id || undefined;
  const isFeatureFlagged = (projectId && isWorklogsEnabledByProjectId(projectId)) || false;
  const filterOptions = { ...ACTIVITY_FILTER_TYPE_OPTIONS };

  if (!workspaceId || !projectId) return <></>;
  if ((!isFeatureFlagged || isIntakeIssue) && filterOptions?.[EActivityFilterTypeEE.WORKLOG]) {
    delete filterOptions?.[EActivityFilterTypeEE.WORKLOG as keyof typeof filterOptions];
  }

  const filters: TActivityFilterOption[] = Object.entries(filterOptions).map(([key, value]) => {
    const filterKey = key as TActivityFilters;
    return {
      key: filterKey,
      labelTranslationKey: value.labelTranslationKey,
      isSelected: selectedFilters.includes(filterKey),
      onClick: () => toggleFilter(filterKey),
    };
  });

  const filteredSelectedFilters = selectedFilters.filter((filter) => {
    if (!isFeatureFlagged && filter === EActivityFilterTypeEE.WORKLOG) return false;
    return true;
  });

  return <ActivityFilter selectedFilters={filteredSelectedFilters} filterOptions={filters} />;
});
