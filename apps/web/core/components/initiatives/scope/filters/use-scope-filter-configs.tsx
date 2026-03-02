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

import { useMemo } from "react";
import { UserCircle } from "lucide-react";
import {
  StartDatePropertyIcon,
  DueDatePropertyIcon,
  PriorityPropertyIcon,
  StatePropertyIcon,
  PriorityIcon,
} from "@plane/propel/icons";
import type { IUserLite } from "@plane/types";
import { COLLECTION_OPERATOR, EQUALITY_OPERATOR } from "@plane/types";
import { Avatar } from "@plane/propel/avatar";
import {
  createFilterConfig,
  createOperatorConfigEntry,
  getIsNullOperatorConfigEntry,
  getMemberMultiSelectConfig,
  getStartDateFilterConfig,
  getTargetDateFilterConfig,
  getPriorityFilterConfig,
  getMultiSelectConfig,
  getFileURL,
} from "@plane/utils";
import type { TFiltersOperatorConfigs } from "@/ce/hooks/rich-filters/use-filters-operator-configs";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import { ProjectStateIcon } from "@/components/workspace-project-states/project-state-icon";
import type { TProjectState } from "@/types/workspace-project-states";
import type { TInitiativeScopeProjectFilterKeys } from "./types";
import type { TCreateUserFilterParams } from "@plane/utils";

interface UseProjectScopeFilterConfigsProps {
  workspaceMembers: IUserLite[];
  operatorConfigs: TFiltersOperatorConfigs;
}

// Helper function to create project member filter config with IN operator support
const createProjectMemberFilterConfig = (
  key: TInitiativeScopeProjectFilterKeys,
  params: {
    isEnabled: boolean;
    members: IUserLite[];
    getOptionIcon: (member: IUserLite) => React.ReactNode;
    filterIcon: React.FC<React.SVGAttributes<SVGElement>>;
    propertyDisplayName: string;
  } & TFiltersOperatorConfigs
) => {
  const baseParams: TCreateUserFilterParams = {
    ...params,
    members: params.members,
    getOptionIcon: params.getOptionIcon,
    filterIcon: params.filterIcon,
  };
  return createFilterConfig<TInitiativeScopeProjectFilterKeys>({
    id: key,
    label: params.propertyDisplayName,
    icon: params.filterIcon,
    isEnabled: params.isEnabled,
    supportedOperatorConfigsMap: new Map([
      createOperatorConfigEntry(COLLECTION_OPERATOR.IN, baseParams, (updatedParams) =>
        getMemberMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
      ),
      getIsNullOperatorConfigEntry(params),
    ]),
  });
};

export const useProjectScopeFilterConfigs = ({
  workspaceMembers,
  operatorConfigs,
}: UseProjectScopeFilterConfigsProps) => {
  const { currentWorkspace } = useWorkspace();
  const { getProjectStatesByWorkspaceId } = useWorkspaceProjectStates();

  // Get project states for the current workspace
  const workspaceId = currentWorkspace?.id;
  const projectStates = useMemo(() => {
    if (!workspaceId) return [];
    return getProjectStatesByWorkspaceId(workspaceId) ?? [];
  }, [workspaceId, getProjectStatesByWorkspaceId]);

  // Backend supports: lead, lead__in, lead__isnull
  const projectLeadFilterConfig = useMemo(
    () =>
      createProjectMemberFilterConfig("lead", {
        isEnabled: true,
        members: workspaceMembers,
        getOptionIcon: (member: IUserLite) => (
          <Avatar src={getFileURL(member.avatar_url)} name={member.display_name} size="sm" />
        ),
        filterIcon: UserCircle as React.FC<React.SVGAttributes<SVGElement>>,
        propertyDisplayName: "Lead",
        ...operatorConfigs,
      }),
    [workspaceMembers, operatorConfigs]
  );

  // Start date filter
  const startDateFilterConfig = useMemo(
    () =>
      getStartDateFilterConfig<TInitiativeScopeProjectFilterKeys>("start_date")({
        isEnabled: true,
        filterIcon: StartDatePropertyIcon,
        ...operatorConfigs,
      }),
    [operatorConfigs]
  );

  // Target date filter
  const targetDateFilterConfig = useMemo(
    () =>
      getTargetDateFilterConfig<TInitiativeScopeProjectFilterKeys>("target_date")({
        isEnabled: true,
        filterIcon: DueDatePropertyIcon,
        ...operatorConfigs,
      }),
    [operatorConfigs]
  );

  // Priority filter
  const priorityFilterConfig = useMemo(
    () =>
      getPriorityFilterConfig<TInitiativeScopeProjectFilterKeys>("priority")({
        isEnabled: true,
        filterIcon: PriorityPropertyIcon,
        getOptionIcon: (priority) => <PriorityIcon priority={priority} />,
        ...operatorConfigs,
      }),
    [operatorConfigs]
  );

  // State filter using project states
  const stateFilterConfig = useMemo(
    () =>
      createFilterConfig<TInitiativeScopeProjectFilterKeys>({
        id: "state_id",
        label: "State",
        icon: StatePropertyIcon,
        isEnabled: projectStates.length > 0,
        supportedOperatorConfigsMap: new Map([
          createOperatorConfigEntry(
            COLLECTION_OPERATOR.IN,
            { isEnabled: projectStates.length > 0, ...operatorConfigs },
            (updatedParams) =>
              getMultiSelectConfig<TProjectState, string, TProjectState>(
                {
                  items: projectStates,
                  getId: (state) => state.id ?? "",
                  getLabel: (state) => state.name ?? "",
                  getValue: (state) => state.id ?? "",
                  getIconData: (state) => state,
                },
                {
                  singleValueOperator: EQUALITY_OPERATOR.EXACT,
                  ...updatedParams,
                },
                {
                  ...updatedParams,
                  getOptionIcon: (state: TProjectState) => (
                    <ProjectStateIcon projectStateGroup={state.group} color={state.color} width="14" height="14" />
                  ),
                }
              )
          ),
        ]),
      }),
    [operatorConfigs, projectStates]
  );

  return {
    projectLeadFilterConfig,
    stateFilterConfig,
    startDateFilterConfig,
    targetDateFilterConfig,
    priorityFilterConfig,
    configs: [
      projectLeadFilterConfig,
      stateFilterConfig,
      startDateFilterConfig,
      targetDateFilterConfig,
      priorityFilterConfig,
    ],
    areAllConfigsInitialized: true,
  };
};
