"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// ce components
import { TActivityFilterRoot } from "@/ce/components/issues";
// components
import { ActivityFilter } from "@/components/issues";
// hooks
import { useProject, useWorkspace } from "@/hooks/store";
// plane web constants
import {
  TActivityFilters,
  ACTIVITY_FILTER_TYPE_OPTIONS,
  TActivityFilterOption,
  EActivityFilterTypeEE,
} from "@/plane-web/constants/issues";
// plane web hooks
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";

export const ActivityFilterRoot: FC<TActivityFilterRoot> = observer((props) => {
  const { selectedFilters, toggleFilter , isIntakeIssue = false} = props;
  // hooks
  const { currentWorkspace } = useWorkspace();
  const { currentProjectDetails } = useProject();
  const { isWorklogsEnabledByProjectId } = useWorkspaceWorklogs();

  // derived values
  const workspaceId = currentWorkspace?.id || undefined;
  const projectId = currentProjectDetails?.id || undefined;
  const isFeatureFlagged = (projectId && isWorklogsEnabledByProjectId(projectId)) || false;
  const filterOptions = { ...ACTIVITY_FILTER_TYPE_OPTIONS };

  if (!workspaceId || !projectId) return <></>;
  if((!isFeatureFlagged || isIntakeIssue) && filterOptions?.[EActivityFilterTypeEE.WORKLOG]){
    delete filterOptions?.[EActivityFilterTypeEE.WORKLOG as keyof typeof filterOptions];
  }

  const filters: TActivityFilterOption[] = Object.entries(filterOptions).map(([key, value]) => {
    const filterKey = key as TActivityFilters;
    return {
      key: filterKey,
      label: value.label,
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
