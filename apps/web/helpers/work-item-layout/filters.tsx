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

import { useParams } from "next/navigation";
// plane imports
import { ISSUE_GROUP_BY_OPTIONS } from "@plane/constants";
import type {
  IIssueDisplayProperties,
  IIssueFilterOptions,
  IIssueFilters,
  IIssueDisplayFilterOptions,
  TIssueGroupByOptions,
} from "@plane/types";
// store
import { DEFAULT_DISPLAY_PROPERTIES } from "@/store/work-items/details/sub_issues_filter.store";
// hooks
import { useReleases } from "@/hooks/store/use-releases";
// plane web store hooks
import { useIssueTypes } from "@/plane-web/hooks/store/issue-types/use-issue-types";
import { useMilestones } from "@/plane-web/hooks/store/use-milestone";
import { useFeatureFlags } from "@/plane-web/hooks/store";

/**
 * This method returns if the filters are applied
 * @param filters
 * @returns
 */
export const isDisplayFiltersApplied = (filters: Partial<IIssueFilters>): boolean => {
  const isDisplayPropertiesApplied = Object.keys(DEFAULT_DISPLAY_PROPERTIES).some(
    (key) => !filters.displayProperties?.[key as keyof IIssueDisplayProperties]
  );

  const isDisplayFiltersApplied = Object.keys(filters.displayFilters ?? {}).some((key) => {
    const value = filters.displayFilters?.[key as keyof IIssueDisplayFilterOptions];
    if (!value) return false;
    // -create_at is the default order
    if (key === "order_by") {
      return value !== "-created_at";
    }
    return true;
  });

  return isDisplayPropertiesApplied || isDisplayFiltersApplied;
};

/**
 * This method returns if the filters are applied
 * @param filters
 * @returns
 */
export const isFiltersApplied = (filters: IIssueFilterOptions): boolean =>
  Object.values(filters).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== "";
  });

export const useGroupByOptions = (
  options: TIssueGroupByOptions[]
): { key: TIssueGroupByOptions; titleTranslationKey: string }[] => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { isMilestonesEnabled } = useMilestones();
  const { isEpicEnabledForProject, isWorkItemTypeEnabledForProject } = useIssueTypes();
  const { getFeatureFlag } = useFeatureFlags();
  const {
    release: { isReleasesEnabled },
  } = useReleases();
  //derived values
  const isReleasesFeatureEnabled = isReleasesEnabled(workspaceSlug);
  const groupByOptions = ISSUE_GROUP_BY_OPTIONS.filter((option) => options.includes(option.key));

  if (!workspaceSlug) return groupByOptions;

  // feature flags for workspace-level type check
  const isWorkItemTypeFlagAvailable = getFeatureFlag(workspaceSlug, "ISSUE_TYPES", false);
  const isWorkspaceWorkItemTypesFlagAvailable = getFeatureFlag(workspaceSlug, "WORKSPACE_WORK_ITEM_TYPES", false);
  const isWorkItemTypeFlagEnabled = isWorkItemTypeFlagAvailable || isWorkspaceWorkItemTypesFlagAvailable;
  // project-level feature checks
  const isMilestonesFeatureEnabled = projectId ? isMilestonesEnabled(workspaceSlug, projectId) : false;
  const isEpicFeatureEnabled = projectId ? isEpicEnabledForProject(workspaceSlug, projectId) : false;
  const isWorkItemTypeEnabled = projectId ? isWorkItemTypeEnabledForProject(workspaceSlug, projectId) : false;

  const FEATURES_STATUS_MAP: Record<string, boolean> = {
    milestone: isMilestonesFeatureEnabled,
    epic: isEpicFeatureEnabled,
    type: projectId ? isWorkItemTypeEnabled : isWorkItemTypeFlagEnabled,
    release: isReleasesFeatureEnabled,
  };

  // filter out options that are not enabled
  const enabledGroupByOptions = groupByOptions.filter((option) => {
    if (option.key === null) return true;
    const isEnabled = FEATURES_STATUS_MAP[option.key];
    if (isEnabled === undefined) return true;
    return isEnabled;
  });

  return enabledGroupByOptions;
};
