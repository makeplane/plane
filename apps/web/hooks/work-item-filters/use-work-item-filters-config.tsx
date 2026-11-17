/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo } from "react";
import {
  AtOutline,
  CalendarOutline,
  CyclesOutline,
  DueDateOutline,
  LabelsOutline,
  MembersOutline,
  ModuleOutline,
  PriorityOutline,
  ProjectsOutline,
  StartDateOutline,
  StateOutline,
  UserOutline,
} from "@makeplane/propel/icons";
// plane imports
import { Avatar } from "@makeplane/propel/components/avatar";
import { Logo } from "@plane/blocks/emoji-icon-picker";
import { CycleGroupIcon, PriorityIcon, StateGroupIcon } from "@plane/blocks/icons";
import { useTranslation } from "@plane/i18n";
import type {
  ICycle,
  IState,
  IUserLite,
  TFilterConfig,
  IIssueLabel,
  IModule,
  IProject,
  TWorkItemFilterProperty,
} from "@plane/types";

import {
  getAssigneeFilterConfig,
  getCreatedAtFilterConfig,
  getCreatedByFilterConfig,
  getCycleFilterConfig,
  getFileURL,
  getLabelFilterConfig,
  getMentionFilterConfig,
  getModuleFilterConfig,
  getPriorityFilterConfig,
  getProjectFilterConfig,
  getStartDateFilterConfig,
  getStateFilterConfig,
  getStateGroupFilterConfig,
  getSubscriberFilterConfig,
  getTargetDateFilterConfig,
  getUpdatedAtFilterConfig,
  isLoaderReady,
} from "@plane/utils";
// store hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
// plane web imports
import { useFiltersOperatorConfigs } from "@/hooks/rich-filters/use-filters-operator-configs";

export type TWorkItemFiltersEntityProps = {
  workspaceSlug: string;
  cycleIds?: string[];
  labelIds?: string[];
  memberIds?: string[];
  moduleIds?: string[];
  projectId?: string;
  projectIds?: string[];
  stateIds?: string[];
};

export type TUseWorkItemFiltersConfigProps = {
  allowedFilters: TWorkItemFilterProperty[];
} & TWorkItemFiltersEntityProps;

export type TWorkItemFiltersConfig = {
  areAllConfigsInitialized: boolean;
  configs: TFilterConfig<TWorkItemFilterProperty>[];
  configMap: {
    [key in TWorkItemFilterProperty]?: TFilterConfig<TWorkItemFilterProperty>;
  };
  isFilterEnabled: (key: TWorkItemFilterProperty) => boolean;
  members: IUserLite[];
};

export const useWorkItemFiltersConfig = (props: TUseWorkItemFiltersConfigProps): TWorkItemFiltersConfig => {
  const { allowedFilters, cycleIds, labelIds, memberIds, moduleIds, projectId, projectIds, stateIds, workspaceSlug } =
    props;
  // store hooks
  const { loader: projectLoader, getProjectById } = useProject();
  const { getCycleById } = useCycle();
  const { getLabelById } = useLabel();
  const { getModuleById } = useModule();
  const { getStateById } = useProjectState();
  const { getUserDetails } = useMember();
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const operatorConfigs = useFiltersOperatorConfigs({ workspaceSlug });
  const filtersToShow = useMemo(() => new Set(allowedFilters), [allowedFilters]);
  const project = useMemo(() => getProjectById(projectId), [projectId, getProjectById]);
  const members: IUserLite[] | undefined = useMemo(
    () =>
      memberIds
        ? (memberIds.map((memberId) => getUserDetails(memberId)).filter((member) => member) as IUserLite[])
        : undefined,
    [memberIds, getUserDetails]
  );
  const workItemStates: IState[] | undefined = useMemo(
    () =>
      stateIds ? (stateIds.map((stateId) => getStateById(stateId)).filter((state) => state) as IState[]) : undefined,
    [stateIds, getStateById]
  );
  const workItemLabels: IIssueLabel[] | undefined = useMemo(
    () =>
      labelIds
        ? (labelIds.map((labelId) => getLabelById(labelId)).filter((label) => label) as IIssueLabel[])
        : undefined,
    [labelIds, getLabelById]
  );
  const cycles = useMemo(
    () => (cycleIds ? (cycleIds.map((cycleId) => getCycleById(cycleId)).filter((cycle) => cycle) as ICycle[]) : []),
    [cycleIds, getCycleById]
  );
  const modules = useMemo(
    () =>
      moduleIds ? (moduleIds.map((moduleId) => getModuleById(moduleId)).filter((module) => module) as IModule[]) : [],
    [moduleIds, getModuleById]
  );
  const projects = useMemo(
    () =>
      projectIds ? (projectIds.map((id) => getProjectById(id)).filter((projectItem) => projectItem) as IProject[]) : [],
    [projectIds, getProjectById]
  );
  const areAllConfigsInitialized = useMemo(() => isLoaderReady(projectLoader), [projectLoader]);

  // translated filter labels; plain strings, so the configs below only rebuild when the language changes
  const filterLabels = {
    state_group: t("common.state_group"),
    state_id: t("common.state"),
    label_id: t("common.label"),
    cycle_id: t("common.cycle"),
    module_id: t("common.module"),
    assignee_id: t("common.assignees"),
    mention_id: t("mentions"),
    created_by_id: t("common.created_by"),
    subscriber_id: t("rich_filters.properties.subscriber"),
    priority: t("common.priority"),
    start_date: t("start_date"),
    target_date: t("target_date"),
    created_at: t("common.created_at"),
    updated_at: t("common.updated_at"),
    project_id: t("common.projects"),
  };

  /**
   * Checks if a filter is enabled based on the filters to show.
   * @param key - The filter key.
   * @param level - The level of the filter.
   * @returns True if the filter is enabled, false otherwise.
   */
  const isFilterEnabled = useCallback((key: TWorkItemFilterProperty) => filtersToShow.has(key), [filtersToShow]);

  // state group filter config
  const stateGroupFilterConfig = useMemo(
    () =>
      getStateGroupFilterConfig<TWorkItemFilterProperty>("state_group")({
        label: filterLabels.state_group,
        isEnabled: isFilterEnabled("state_group"),
        filterIcon: StateOutline,
        getOptionIcon: (stateGroupKey) => <StateGroupIcon stateGroup={stateGroupKey} />,
        ...operatorConfigs,
      }),
    [isFilterEnabled, operatorConfigs, filterLabels.state_group]
  );

  // state filter config
  const stateFilterConfig = useMemo(
    () =>
      getStateFilterConfig<TWorkItemFilterProperty>("state_id")({
        label: filterLabels.state_id,
        isEnabled: isFilterEnabled("state_id") && workItemStates !== undefined,
        filterIcon: StateOutline,
        getOptionIcon: (state) => <StateGroupIcon stateGroup={state.group} color={state.color} />,
        states: workItemStates ?? [],
        ...operatorConfigs,
      }),
    [isFilterEnabled, workItemStates, operatorConfigs, filterLabels.state_id]
  );

  // label filter config
  const labelFilterConfig = useMemo(
    () =>
      getLabelFilterConfig<TWorkItemFilterProperty>("label_id")({
        label: filterLabels.label_id,
        isEnabled: isFilterEnabled("label_id") && workItemLabels !== undefined,
        filterIcon: LabelsOutline,
        labels: workItemLabels ?? [],
        getOptionIcon: (color) => (
          <span className="flex size-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
        ),
        ...operatorConfigs,
      }),
    [isFilterEnabled, workItemLabels, operatorConfigs, filterLabels.label_id]
  );

  // cycle filter config
  const cycleFilterConfig = useMemo(
    () =>
      getCycleFilterConfig<TWorkItemFilterProperty>("cycle_id")({
        label: filterLabels.cycle_id,
        isEnabled: isFilterEnabled("cycle_id") && project?.cycle_view === true && cycles !== undefined,
        filterIcon: CyclesOutline,
        getOptionIcon: (cycleGroup) => <CycleGroupIcon cycleGroup={cycleGroup} className="h-3.5 w-3.5 flex-shrink-0" />,
        cycles: cycles ?? [],
        ...operatorConfigs,
      }),
    [isFilterEnabled, project?.cycle_view, cycles, operatorConfigs, filterLabels.cycle_id]
  );

  // module filter config
  const moduleFilterConfig = useMemo(
    () =>
      getModuleFilterConfig<TWorkItemFilterProperty>("module_id")({
        label: filterLabels.module_id,
        isEnabled: isFilterEnabled("module_id") && project?.module_view === true && modules !== undefined,
        filterIcon: ModuleOutline,
        getOptionIcon: () => <ModuleOutline className="h-3 w-3 flex-shrink-0" />,
        modules: modules ?? [],
        ...operatorConfigs,
      }),
    [isFilterEnabled, project?.module_view, modules, operatorConfigs, filterLabels.module_id]
  );

  // assignee filter config
  const assigneeFilterConfig = useMemo(
    () =>
      getAssigneeFilterConfig<TWorkItemFilterProperty>("assignee_id")({
        label: filterLabels.assignee_id,
        isEnabled: isFilterEnabled("assignee_id") && members !== undefined,
        filterIcon: MembersOutline,
        members: members ?? [],
        getOptionIcon: (memberDetails) => (
          <Avatar
            alt={memberDetails.display_name}
            fallback={memberDetails.display_name?.[0]?.toUpperCase()}
            src={getFileURL(memberDetails.avatar_url)}
            size="2xs"
          />
        ),
        ...operatorConfigs,
      }),
    [isFilterEnabled, members, operatorConfigs, filterLabels.assignee_id]
  );

  // mention filter config
  const mentionFilterConfig = useMemo(
    () =>
      getMentionFilterConfig<TWorkItemFilterProperty>("mention_id")({
        label: filterLabels.mention_id,
        isEnabled: isFilterEnabled("mention_id") && members !== undefined,
        filterIcon: AtOutline,
        members: members ?? [],
        getOptionIcon: (memberDetails) => (
          <Avatar
            alt={memberDetails.display_name}
            fallback={memberDetails.display_name?.[0]?.toUpperCase()}
            src={getFileURL(memberDetails.avatar_url)}
            size="2xs"
          />
        ),
        ...operatorConfigs,
      }),
    [isFilterEnabled, members, operatorConfigs, filterLabels.mention_id]
  );

  // created by filter config
  const createdByFilterConfig = useMemo(
    () =>
      getCreatedByFilterConfig<TWorkItemFilterProperty>("created_by_id")({
        label: filterLabels.created_by_id,
        isEnabled: isFilterEnabled("created_by_id") && members !== undefined,
        filterIcon: UserOutline,
        members: members ?? [],
        getOptionIcon: (memberDetails) => (
          <Avatar
            alt={memberDetails.display_name}
            fallback={memberDetails.display_name?.[0]?.toUpperCase()}
            src={getFileURL(memberDetails.avatar_url)}
            size="2xs"
          />
        ),
        ...operatorConfigs,
      }),
    [isFilterEnabled, members, operatorConfigs, filterLabels.created_by_id]
  );

  // subscriber filter config
  const subscriberFilterConfig = useMemo(
    () =>
      getSubscriberFilterConfig<TWorkItemFilterProperty>("subscriber_id")({
        label: filterLabels.subscriber_id,
        isEnabled: isFilterEnabled("subscriber_id") && members !== undefined,
        filterIcon: MembersOutline,
        members: members ?? [],
        getOptionIcon: (memberDetails) => (
          <Avatar
            alt={memberDetails.display_name}
            fallback={memberDetails.display_name?.[0]?.toUpperCase()}
            src={getFileURL(memberDetails.avatar_url)}
            size="2xs"
          />
        ),
        ...operatorConfigs,
      }),
    [isFilterEnabled, members, operatorConfigs, filterLabels.subscriber_id]
  );

  // priority filter config
  const priorityFilterConfig = useMemo(
    () =>
      getPriorityFilterConfig<TWorkItemFilterProperty>("priority")({
        label: filterLabels.priority,
        isEnabled: isFilterEnabled("priority"),
        filterIcon: PriorityOutline,
        getOptionIcon: (priority) => <PriorityIcon priority={priority} />,
        ...operatorConfigs,
      }),
    [isFilterEnabled, operatorConfigs, filterLabels.priority]
  );

  // start date filter config
  const startDateFilterConfig = useMemo(
    () =>
      getStartDateFilterConfig<TWorkItemFilterProperty>("start_date")({
        label: filterLabels.start_date,
        isEnabled: true,
        filterIcon: StartDateOutline,
        ...operatorConfigs,
      }),
    [operatorConfigs, filterLabels.start_date]
  );

  // target date filter config
  const targetDateFilterConfig = useMemo(
    () =>
      getTargetDateFilterConfig<TWorkItemFilterProperty>("target_date")({
        label: filterLabels.target_date,
        isEnabled: true,
        filterIcon: DueDateOutline,
        ...operatorConfigs,
      }),
    [operatorConfigs, filterLabels.target_date]
  );

  // created at filter config
  const createdAtFilterConfig = useMemo(
    () =>
      getCreatedAtFilterConfig<TWorkItemFilterProperty>("created_at")({
        label: filterLabels.created_at,
        isEnabled: true,
        filterIcon: CalendarOutline,
        ...operatorConfigs,
      }),
    [operatorConfigs, filterLabels.created_at]
  );

  // updated at filter config
  const updatedAtFilterConfig = useMemo(
    () =>
      getUpdatedAtFilterConfig<TWorkItemFilterProperty>("updated_at")({
        label: filterLabels.updated_at,
        isEnabled: true,
        filterIcon: CalendarOutline,
        ...operatorConfigs,
      }),
    [operatorConfigs, filterLabels.updated_at]
  );

  // project filter config
  const projectFilterConfig = useMemo(
    () =>
      getProjectFilterConfig<TWorkItemFilterProperty>("project_id")({
        label: filterLabels.project_id,
        isEnabled: isFilterEnabled("project_id") && projects !== undefined,
        filterIcon: ProjectsOutline,
        projects: projects,
        getOptionIcon: (projectItem) => <Logo logo={projectItem.logo_props} size={12} />,
        ...operatorConfigs,
      }),
    [isFilterEnabled, projects, operatorConfigs, filterLabels.project_id]
  );

  return {
    areAllConfigsInitialized,
    configs: [
      stateFilterConfig,
      stateGroupFilterConfig,
      assigneeFilterConfig,
      priorityFilterConfig,
      projectFilterConfig,
      mentionFilterConfig,
      labelFilterConfig,
      cycleFilterConfig,
      moduleFilterConfig,
      startDateFilterConfig,
      targetDateFilterConfig,
      createdAtFilterConfig,
      updatedAtFilterConfig,
      createdByFilterConfig,
      subscriberFilterConfig,
    ],
    configMap: {
      project_id: projectFilterConfig,
      state_group: stateGroupFilterConfig,
      state_id: stateFilterConfig,
      label_id: labelFilterConfig,
      cycle_id: cycleFilterConfig,
      module_id: moduleFilterConfig,
      assignee_id: assigneeFilterConfig,
      mention_id: mentionFilterConfig,
      created_by_id: createdByFilterConfig,
      subscriber_id: subscriberFilterConfig,
      priority: priorityFilterConfig,
      start_date: startDateFilterConfig,
      target_date: targetDateFilterConfig,
      created_at: createdAtFilterConfig,
      updated_at: updatedAtFilterConfig,
    },
    isFilterEnabled,
    members: members ?? [],
  };
};
