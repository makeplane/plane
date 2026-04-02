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
import { CircleUserRound, SignalHigh, Tag, Users } from "lucide-react";
// plane imports
import { DoubleCircleIcon, LayersIcon, PriorityIcon, StateGroupIcon } from "@plane/propel/icons";
import type {
  IFilterOption,
  IFilterOptionGroup,
  IUserLite,
  TAutomationConditionFilterProperty,
  TFilterConfig,
  TOperatorConfigMap,
} from "@plane/types";
import { COLLECTION_OPERATOR } from "@plane/types";
import { Avatar } from "@plane/propel/avatar";
import { Logo } from "@plane/propel/emoji-icon-picker";
import {
  getAssigneeFilterConfig,
  getCreatedByFilterConfig,
  getFileURL,
  getLabelFilterConfig,
  getPriorityFilterConfig,
  getStateFilterConfig,
  getWorkItemTypeFilterConfig,
} from "@plane/utils";
// hooks
import { useFiltersOperatorConfigs } from "@/ce/hooks/rich-filters/use-filters-operator-configs";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
// plane web imports
import { IssueTypeLogo } from "@/components/work-item-types/common/issue-type-logo";
// local imports
import { useIssueTypes } from "../store/issue-types/use-issue-types";

type TArgs = {
  isGlobal: boolean;
  projectIds: string[];
  workspaceSlug: string;
};

// ---- Helpers to override the IN operator's getOptions ----

const overrideInOperatorOptions = <P extends TAutomationConditionFilterProperty>(
  config: TFilterConfig<P>,
  patch: object
): TFilterConfig<P> => {
  const inEntry = config.supportedOperatorConfigsMap.get(COLLECTION_OPERATOR.IN);
  if (!inEntry || !("getOptions" in inEntry)) return config;

  const newMap: TOperatorConfigMap = new Map(config.supportedOperatorConfigsMap);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newMap.set(COLLECTION_OPERATOR.IN, { ...inEntry, ...patch } as any);
  return { ...config, supportedOperatorConfigsMap: newMap };
};

const withGroupedOptions = <P extends TAutomationConditionFilterProperty>(
  config: TFilterConfig<P>,
  groups: IFilterOptionGroup<string>[]
): TFilterConfig<P> => overrideInOperatorOptions(config, { optionsType: "group", getOptions: () => groups });

const withFlatOptions = <P extends TAutomationConditionFilterProperty>(
  config: TFilterConfig<P>,
  options: IFilterOption<string>[]
): TFilterConfig<P> => overrideInOperatorOptions(config, { getOptions: () => options });

export const useAutomationConfig = (args: TArgs) => {
  const { isGlobal, projectIds, workspaceSlug } = args;
  // store hooks
  const { getProjectById } = useProject();
  const { getProjectLabels } = useLabel();
  const { getProjectStates } = useProjectState();
  const {
    getUserDetails,
    workspace: { getWorkspaceMemberIds },
  } = useMember();
  const { isWorkItemTypeEnabledForProject, getProjectIssueTypes } = useIssueTypes();
  // derived values
  const members = (getWorkspaceMemberIds(workspaceSlug) ?? [])
    ?.map((memberId) => getUserDetails(memberId))
    .filter((member) => member) as IUserLite[];
  const operatorConfigs = useFiltersOperatorConfigs({ workspaceSlug });
  const isAnyWorkItemTypeEnabled = projectIds.some((id) => isWorkItemTypeEnabledForProject(workspaceSlug, id));

  const getProjectGroupLabel = useCallback(
    (projectId: string): React.ReactNode => {
      const projectDetails = getProjectById(projectId);
      return (
        <span className="flex items-center gap-1.5 truncate">
          <span className="shrink-0 size-4 grid place-items-center">
            <Logo logo={projectDetails?.logo_props} size={16} />
          </span>
          {projectDetails?.name}
        </span>
      );
    },
    [getProjectById]
  );

  const stateGroups = useMemo<IFilterOptionGroup<string>[]>(
    () =>
      projectIds.map((projectId) => ({
        id: projectId,
        label: getProjectGroupLabel(projectId),
        options: (getProjectStates(projectId) ?? []).map((state) => ({
          id: state.id,
          label: state.name,
          value: state.id,
          icon: <StateGroupIcon stateGroup={state.group} color={state.color} />,
        })),
      })),
    [projectIds, getProjectGroupLabel, getProjectStates]
  );

  const workItemTypeGroups = useMemo<IFilterOptionGroup<string>[]>(
    () =>
      projectIds.map((projectId) => ({
        id: projectId,
        label: getProjectGroupLabel(projectId),
        options: Object.values(getProjectIssueTypes(projectId, false) ?? {})
          .filter((t): t is NonNullable<typeof t> => !!t?.id)
          .map((t) => ({
            id: t.id ?? "",
            label: t.name ?? "",
            value: t.id ?? "",
            icon: <IssueTypeLogo icon_props={t.logo_props?.icon} size="xs" />,
          })),
      })),
    [projectIds, getProjectGroupLabel, getProjectIssueTypes]
  );

  const labelGroups = useMemo<IFilterOptionGroup<string>[]>(
    () =>
      projectIds.map((projectId) => ({
        id: projectId,
        label: getProjectGroupLabel(projectId),
        options: (getProjectLabels(projectId) ?? []).map((label) => ({
          id: label.id,
          label: label.name,
          value: label.id,
          icon: <span className="flex shrink-0 size-2.5 rounded-full" style={{ backgroundColor: label.color }} />,
        })),
      })),
    [projectIds, getProjectGroupLabel, getProjectLabels]
  );

  // ---- Filter configs ----
  // isGlobal → grouped (one collapsible section per project)
  // !isGlobal → flat options taken from the single project's group

  const stateFilterConfig = useMemo(() => {
    const base = getStateFilterConfig<TAutomationConditionFilterProperty>("payload.data.state_id")({
      isEnabled: true,
      filterIcon: DoubleCircleIcon,
      getOptionIcon: (state) => <StateGroupIcon stateGroup={state.group} color={state.color} />,
      states: [],
      ...operatorConfigs,
    });
    return isGlobal ? withGroupedOptions(base, stateGroups) : withFlatOptions(base, stateGroups[0]?.options ?? []);
  }, [isGlobal, stateGroups, operatorConfigs]);

  const workItemTypeFilterConfig = useMemo(() => {
    const base = getWorkItemTypeFilterConfig<TAutomationConditionFilterProperty>("payload.data.type_id")({
      isEnabled: isAnyWorkItemTypeEnabled,
      filterIcon: LayersIcon,
      getOptionIcon: (t) => <IssueTypeLogo icon_props={t.logo_props?.icon} size="xs" />,
      workItemTypes: [],
      ...operatorConfigs,
    });
    return isGlobal
      ? withGroupedOptions(base, workItemTypeGroups)
      : withFlatOptions(base, workItemTypeGroups[0]?.options ?? []);
  }, [isGlobal, isAnyWorkItemTypeEnabled, workItemTypeGroups, operatorConfigs]);

  const labelFilterConfig = useMemo(() => {
    const base = getLabelFilterConfig<TAutomationConditionFilterProperty>("payload.data.label_ids")({
      isEnabled: true,
      filterIcon: Tag,
      labels: [],
      getOptionIcon: (color) => (
        <span className="flex shrink-0 size-2.5 rounded-full" style={{ backgroundColor: color }} />
      ),
      ...operatorConfigs,
    });
    return isGlobal ? withGroupedOptions(base, labelGroups) : withFlatOptions(base, labelGroups[0]?.options ?? []);
  }, [isGlobal, labelGroups, operatorConfigs]);

  const assigneeFilterConfig = useMemo(
    () =>
      getAssigneeFilterConfig<TAutomationConditionFilterProperty>("payload.data.assignee_ids")({
        isEnabled: true,
        filterIcon: Users,
        members,
        getOptionIcon: (memberDetails) => (
          <Avatar
            name={memberDetails.display_name}
            src={getFileURL(memberDetails.avatar_url)}
            showTooltip={false}
            size="sm"
          />
        ),
        ...operatorConfigs,
      }),
    [members, operatorConfigs]
  );

  const createdByFilterConfig = useMemo(
    () =>
      getCreatedByFilterConfig<TAutomationConditionFilterProperty>("payload.data.created_by_id")({
        isEnabled: true,
        filterIcon: CircleUserRound,
        members,
        getOptionIcon: (memberDetails) => (
          <Avatar
            name={memberDetails.display_name}
            src={getFileURL(memberDetails.avatar_url)}
            showTooltip={false}
            size="sm"
          />
        ),
        ...operatorConfigs,
      }),
    [members, operatorConfigs]
  );

  const priorityFilterConfig = useMemo(
    () =>
      getPriorityFilterConfig<TAutomationConditionFilterProperty>("payload.data.priority")({
        isEnabled: true,
        filterIcon: SignalHigh,
        getOptionIcon: (priority) => <PriorityIcon priority={priority} />,
        ...operatorConfigs,
      }),
    [operatorConfigs]
  );

  const automationConfigs: TFilterConfig<TAutomationConditionFilterProperty>[] = useMemo(
    () => [
      stateFilterConfig,
      workItemTypeFilterConfig,
      labelFilterConfig,
      assigneeFilterConfig,
      createdByFilterConfig,
      priorityFilterConfig,
    ],
    [
      stateFilterConfig,
      workItemTypeFilterConfig,
      labelFilterConfig,
      assigneeFilterConfig,
      createdByFilterConfig,
      priorityFilterConfig,
    ]
  );

  return {
    automationConfigs,
  };
};
