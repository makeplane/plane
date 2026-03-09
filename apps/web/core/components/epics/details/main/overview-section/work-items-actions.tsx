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

import { useCallback, useMemo } from "react";
// constants
import { observer } from "mobx-react";
import {
  EIssueFilterType,
  ISSUE_DISPLAY_FILTERS_BY_PAGE,
  SUB_WORK_ITEM_AVAILABLE_FILTERS_FOR_WORK_ITEM_PAGE,
} from "@plane/constants";
// types
import type {
  IIssueDisplayFilterOptions,
  TIssueServiceType,
  IIssueDisplayProperties,
  IIssueFilterOptions,
} from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// components
import { SubIssuesActionButton, SubIssueDisplayFilters } from "@/components/issues/issue-detail-widgets/sub-issues";
import { SubIssueFilters } from "@/components/issues/issue-detail-widgets/sub-issues/filters/root";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useMember } from "@/hooks/store/use-member";
import { useProjectState } from "@/hooks/store/use-project-state";

type TSubWorkItemsActionsProps = {
  workItemId: string;
  workItemServiceType: TIssueServiceType;
  disabled?: boolean;
  projectId: string;
  workspaceSlug: string;
};

export const SubWorkItemsActions = observer(function SubWorkItemsActions(props: TSubWorkItemsActionsProps) {
  const { workItemId, workItemServiceType, disabled, projectId, workspaceSlug } = props;

  // store hooks
  const {
    subIssues: {
      filters: { getSubIssueFilters, updateSubWorkItemFilters },
    },
  } = useIssueDetail(workItemServiceType);

  const { getProjectStates } = useProjectState();
  const {
    project: { getProjectMemberIds },
  } = useMember();
  const { areEstimateEnabledByProjectId } = useProjectEstimates();

  // derived values
  const projectMemberIds = getProjectMemberIds(projectId, false);
  const projectStates = getProjectStates(projectId);
  const subIssueFilters = getSubIssueFilters(workItemId);
  // handlers
  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;
      updateSubWorkItemFilters(EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter, workItemId);
    },
    [workspaceSlug, projectId, updateSubWorkItemFilters, workItemId]
  );

  const handleDisplayPropertiesUpdate = useCallback(
    (updatedDisplayProperties: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !projectId) return;
      updateSubWorkItemFilters(EIssueFilterType.DISPLAY_PROPERTIES, updatedDisplayProperties, workItemId);
    },
    [workspaceSlug, projectId, updateSubWorkItemFilters, workItemId]
  );

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug || !projectId) return;
      const newValues = subIssueFilters?.filters?.[key] ?? [];

      if (Array.isArray(value)) {
        // this validation is majorly for the filter start_date, target_date custom
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      } else {
        if (subIssueFilters?.filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateSubWorkItemFilters(EIssueFilterType.RICH_FILTERS, { [key]: newValues }, workItemId);
    },
    [workspaceSlug, projectId, subIssueFilters?.filters, updateSubWorkItemFilters, workItemId]
  );

  const layoutDisplayFiltersOptions = useMemo(() => {
    const baseLayoutOptions = ISSUE_DISPLAY_FILTERS_BY_PAGE["sub_work_items"]?.layoutOptions["list"];
    if (!baseLayoutOptions) return undefined;
    if (areEstimateEnabledByProjectId(projectId)) return baseLayoutOptions;

    return {
      ...baseLayoutOptions,
      display_properties: baseLayoutOptions.display_properties.filter((property) => property !== "estimate"),
    };
  }, [areEstimateEnabledByProjectId, projectId]);

  return (
    <div className="flex items-center gap-2">
      <SubIssueDisplayFilters
        isEpic={workItemServiceType === EIssueServiceType.EPICS}
        layoutDisplayFiltersOptions={layoutDisplayFiltersOptions}
        displayProperties={subIssueFilters?.displayProperties ?? {}}
        displayFilters={subIssueFilters?.displayFilters ?? {}}
        handleDisplayPropertiesUpdate={handleDisplayPropertiesUpdate}
        handleDisplayFiltersUpdate={handleDisplayFilters}
      />
      <SubIssueFilters
        handleFiltersUpdate={handleFiltersUpdate}
        filters={subIssueFilters?.filters ?? {}}
        memberIds={projectMemberIds ?? undefined}
        states={projectStates}
        availableFilters={SUB_WORK_ITEM_AVAILABLE_FILTERS_FOR_WORK_ITEM_PAGE}
      />
      <SubIssuesActionButton issueId={workItemId} issueServiceType={workItemServiceType} disabled={disabled} />
    </div>
  );
});
