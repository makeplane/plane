/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// plane constants
import type { TActivityFilters, TActivityFilterOption } from "@plane/constants";
import { ACTIVITY_FILTER_TYPE_OPTIONS, EActivityFilterType } from "@plane/constants";
// components
import { ActivityFilter } from "@/components/issues/issue-detail/issue-activity";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web hooks
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";

type TActivityFilterRoot = {
  selectedFilters: TActivityFilters[];
  toggleFilter: (filter: TActivityFilters) => void;
  projectId: string;
  isIntakeIssue?: boolean;
};

export const ActivityFilterRoot = observer(function ActivityFilterRoot(props: TActivityFilterRoot) {
  const { selectedFilters, toggleFilter, isIntakeIssue = false, projectId } = props;
  // hooks
  const { currentWorkspace } = useWorkspace();
  const { isWorklogsEnabledByProjectId } = useWorkspaceWorklogs();

  // derived values
  const workspaceId = currentWorkspace?.id || undefined;
  const isFeatureFlagged = (projectId && isWorklogsEnabledByProjectId(projectId)) || false;
  const filterOptions = { ...ACTIVITY_FILTER_TYPE_OPTIONS };

  if (!workspaceId || !projectId) return <></>;
  if ((!isFeatureFlagged || isIntakeIssue) && filterOptions?.[EActivityFilterType.WORKLOG]) {
    delete filterOptions?.[EActivityFilterType.WORKLOG as keyof typeof filterOptions];
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
    if (!isFeatureFlagged && filter === EActivityFilterType.WORKLOG) return false;
    return true;
  });

  return <ActivityFilter selectedFilters={filteredSelectedFilters} filterOptions={filters} />;
});
