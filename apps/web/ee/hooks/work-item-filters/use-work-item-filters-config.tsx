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
import { AlignLeft } from "lucide-react";
// plane imports
import { Logo } from "@plane/propel/emoji-icon-picker";
import {
  LayersIcon,
  MilestoneIcon,
  ProjectIcon,
  WorkItemsIcon,
  EpicIcon,
  ParentPropertyIcon,
  WorkflowIcon,
} from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type {
  EIssuePropertyType,
  IIssueProperty,
  IIssueType,
  IMilestoneInstance,
  IProject,
  IWorkflow,
  TEpicMeta,
  TAsyncMultiSelectParams,
  TWorkItemFilterProperty,
} from "@plane/types";
import { EIssueServiceType, EWorkItemTypeEntity, EXTENDED_EQUALITY_OPERATOR } from "@plane/types";
import {
  getMilestoneFilterConfig,
  getWorkItemFilterConfig,
  getEpicFilterConfig,
  getMilestoneIconProps,
  getTeamspaceProjectFilterConfig,
  getTextPropertyFilterConfig,
  getWorkItemTypeFilterConfig,
  getWorkflowFilterConfig,
  isLoaderReady,
  getParentFilterConfig,
} from "@plane/utils";
// services
import { IssueService } from "@/services/issue";
// ce imports
import type {
  TUseWorkItemFiltersConfigProps as TCoreUseWorkItemFiltersConfigProps,
  TWorkItemFiltersEntityProps as TCoreWorkItemFiltersEntityProps,
  TWorkItemFiltersConfig,
} from "@/ce/hooks/work-item-filters/use-work-item-filters-config";
import { useWorkItemFiltersConfig as useCoreWorkItemFiltersConfig } from "@/ce/hooks/work-item-filters/use-work-item-filters-config";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useEpicMeta } from "@/hooks/store/use-epic-meta";
import { useWorkflows } from "@/hooks/store/use-workflows";
// plane web imports
import { IssueTypeLogo } from "@/components/work-item-types/common/issue-type-logo";
import { getWorkItemsFilterOptions } from "@/components/rich-filters/filter-value-input/select/shared";
import { useCustomPropertyFiltersConfig } from "@/plane-web/hooks/rich-filters/use-custom-property-filters-config";
import { useFiltersOperatorConfigs } from "@/plane-web/hooks/rich-filters/use-filters-operator-configs";
import { useIssueTypes } from "@/plane-web/hooks/store/issue-types";
import { useMilestones } from "../store/use-milestone";

export type TWorkItemFiltersEntityProps = TCoreWorkItemFiltersEntityProps & {
  workItemTypeIds?: string[];
  teamspaceProjectIds?: string[];
  customPropertyIds?: string[];
  milestoneIds?: string[];
  epicIds?: string[];
  workflowIds?: string[];
};

export type TUseWorkItemFiltersConfigProps = TCoreUseWorkItemFiltersConfigProps & TWorkItemFiltersEntityProps;

export const useWorkItemFiltersConfig = (props: TUseWorkItemFiltersConfigProps): TWorkItemFiltersConfig => {
  const {
    workItemTypeIds,
    teamspaceProjectIds,
    workspaceSlug,
    projectId,
    customPropertyIds,
    milestoneIds,
    epicIds,
    workflowIds,
  } = props;
  // store hooks
  const {
    getIssuePropertyById,
    getIssueTypeById,
    getProjectWorkItemPropertiesLoader,
    isEpicEnabledForProject,
    isWorkItemTypeEnabledForProject,
    loader: workItemTypesLoader,
  } = useIssueTypes();
  const { getMilestoneById } = useMilestones();
  const { getProjectById } = useProject();
  const { getEpicMetaById } = useEpicMeta();
  const { getWorkflowById } = useWorkflows();
  // derived values
  const workItemFiltersConfig = useCoreWorkItemFiltersConfig(props);
  const { isFilterEnabled, members, areAllConfigsInitialized: areAllCoreConfigsInitialized } = workItemFiltersConfig;
  const operatorConfigs = useFiltersOperatorConfigs({ workspaceSlug });
  const operatorConfigsWithoutIsNull = useMemo(() => {
    return {
      allowedOperators: new Set(
        [...operatorConfigs.allowedOperators].filter((op) => op !== EXTENDED_EQUALITY_OPERATOR.ISNULL)
      ),
      allowNegative: operatorConfigs.allowNegative,
    };
  }, [operatorConfigs]);
  const workItemTypes: IIssueType[] | undefined = workItemTypeIds
    ? (workItemTypeIds
        .map((workItemTypeId) => getIssueTypeById(workItemTypeId))
        .filter((workItemType) => workItemType) as IIssueType[])
    : undefined;
  const customProperties = customPropertyIds
    ? (customPropertyIds
        .map((customPropertyId) => getIssuePropertyById(customPropertyId))
        .filter((property) => property) as IIssueProperty<EIssuePropertyType>[])
    : [];
  const teamspaceProjects = useMemo(
    () =>
      teamspaceProjectIds
        ? (teamspaceProjectIds.map((projectId) => getProjectById(projectId)).filter((project) => project) as IProject[])
        : [],
    [teamspaceProjectIds, getProjectById]
  );
  const workflows: IWorkflow[] | undefined = useMemo(
    () =>
      workflowIds
        ? (workflowIds.map((workflowId) => getWorkflowById(workflowId)).filter((workflow) => workflow) as IWorkflow[])
        : undefined,
    [workflowIds, getWorkflowById]
  );

  // milestones list
  const milestones: IMilestoneInstance[] | undefined =
    projectId && milestoneIds
      ? (milestoneIds
          .map((milestoneId) => getMilestoneById(projectId, milestoneId))
          .filter((milestone) => milestone) as IMilestoneInstance[])
      : undefined;

  // epics list
  const epics = useMemo(
    () =>
      projectId && epicIds
        ? (epicIds.map((epicId) => getEpicMetaById(projectId, epicId)).filter((epic) => epic) as TEpicMeta[])
        : undefined,
    [projectId, epicIds, getEpicMetaById]
  );

  const isWorkItemTypesEnabled = isFilterEnabled("type_id") && workItemTypes !== undefined;
  const isMilestonesEnabled = isFilterEnabled("milestone_id") && milestones !== undefined;
  const isEpicsEnabled = isFilterEnabled("epic_id") && epics !== undefined;
  const isWorkflowFilterEnabled = isFilterEnabled("workflow_id") && workflows !== undefined;
  const isWorkItemTypeFeatureEnabled = projectId ? isWorkItemTypeEnabledForProject(workspaceSlug, projectId) : false;
  const isEpicFeatureEnabled = projectId ? isEpicEnabledForProject(workspaceSlug, projectId) : false;
  const workItemTypePropertiesLoader = projectId
    ? getProjectWorkItemPropertiesLoader(projectId, EWorkItemTypeEntity.WORK_ITEM)
    : undefined;
  const epicPropertiesLoader = projectId
    ? getProjectWorkItemPropertiesLoader(projectId, EWorkItemTypeEntity.EPIC)
    : undefined;
  // Check if all configuration loaders are ready
  const areAllConfigsInitialized = useMemo(() => {
    // Core configurations must be initialized first
    if (!areAllCoreConfigsInitialized) {
      return false;
    }

    // Check work item type feature dependencies
    const isWorkItemTypeConfigReady = isWorkItemTypeFeatureEnabled
      ? isLoaderReady(workItemTypesLoader) && isLoaderReady(workItemTypePropertiesLoader)
      : true; // Not enabled, so considered ready

    // Check epic feature dependencies
    const isEpicConfigReady = isEpicFeatureEnabled ? isLoaderReady(epicPropertiesLoader) : true; // Not enabled, so considered ready

    return isWorkItemTypeConfigReady && isEpicConfigReady;
  }, [
    areAllCoreConfigsInitialized,
    isWorkItemTypeFeatureEnabled,
    workItemTypesLoader,
    workItemTypePropertiesLoader,
    isEpicFeatureEnabled,
    epicPropertiesLoader,
  ]);

  // work item type filter config
  const workItemTypeFilterConfig = useMemo(
    () =>
      getWorkItemTypeFilterConfig<TWorkItemFilterProperty>("type_id")({
        isEnabled: isWorkItemTypesEnabled,
        filterIcon: LayersIcon,
        getOptionIcon: (issueType) => <IssueTypeLogo icon_props={issueType?.logo_props?.icon} size="xs" />,
        workItemTypes: workItemTypes ?? [],
        ...operatorConfigs,
      }),
    [isWorkItemTypesEnabled, operatorConfigs, workItemTypes]
  );

  // get property tooltip content
  const getPropertyTooltipContent = useCallback(
    (property: IIssueProperty<EIssuePropertyType>) => {
      const workItemType = property.issue_type ? getIssueTypeById(property.issue_type) : undefined;
      if (!workItemType) return undefined;
      return (
        <div className="flex items-center gap-1">
          <span>This property belongs to</span>
          <IssueTypeLogo icon_props={workItemType.logo_props?.icon} isEpic={workItemType.is_epic} size="xs" />
          <span className="font-medium">{workItemType.name}</span>
          <span>work item type</span>
        </div>
      );
    },
    [getIssueTypeById]
  );

  // get additional right content
  const getAdditionalRightContent = useCallback(
    (property: IIssueProperty<EIssuePropertyType>) => {
      const workItemType = property.issue_type ? getIssueTypeById(property.issue_type) : undefined;
      if (!workItemType) return undefined;
      return (
        <Tooltip position="right" tooltipContent={workItemType.name} disabled={!workItemType.name}>
          <div>
            <IssueTypeLogo icon_props={workItemType.logo_props?.icon} isEpic={workItemType.is_epic} size="xs" />
          </div>
        </Tooltip>
      );
    },
    [getIssueTypeById]
  );

  // custom property filter configs
  const customPropertyConfigs = useCustomPropertyFiltersConfig({
    customProperties,
    getAdditionalRightContent,
    getPropertyTooltipContent,
    isFilterEnabled: (_key) => customPropertyIds !== undefined,
    operatorConfigs,
    members: members,
  });

  // teamspace project filter config
  const teamspaceProjectFilterConfig = useMemo(
    () =>
      getTeamspaceProjectFilterConfig<TWorkItemFilterProperty>("team_project_id")({
        isEnabled: isFilterEnabled("team_project_id") && teamspaceProjects !== undefined,
        filterIcon: ProjectIcon,
        projects: teamspaceProjects,
        getOptionIcon: (project) => <Logo logo={project.logo_props} size={12} />,
        ...operatorConfigs,
      }),
    [isFilterEnabled, teamspaceProjects, operatorConfigs]
  );

  // work item name filter config
  const workItemNameFilterConfig = useMemo(
    () =>
      getTextPropertyFilterConfig<TWorkItemFilterProperty>("name")({
        isEnabled: isFilterEnabled("name"),
        filterIcon: AlignLeft,
        propertyDisplayName: "Title",
        ...operatorConfigsWithoutIsNull,
      }),
    [isFilterEnabled, operatorConfigsWithoutIsNull]
  );

  // milestones filter config
  const milestoneFilterConfig = useMemo(
    () =>
      getMilestoneFilterConfig<TWorkItemFilterProperty>("milestone_id")({
        isEnabled: isMilestonesEnabled,
        filterIcon: MilestoneIcon,
        getOptionIcon: (milestone) => (
          <MilestoneIcon {...getMilestoneIconProps(milestone.progress_percentage)} className="size-3.5" />
        ),
        milestones: milestones ?? [],
        ...operatorConfigs,
      }),
    [isMilestonesEnabled, operatorConfigs, milestones]
  );

  // work item filter config
  const issueService = useMemo(() => new IssueService(EIssueServiceType.ISSUES), []);
  const workItemFilterConfig = useMemo(
    () =>
      getWorkItemFilterConfig<TWorkItemFilterProperty>("id")({
        isEnabled: !!projectId && isFilterEnabled("id"),
        filterIcon: WorkItemsIcon,
        fetchOptions: async (params: TAsyncMultiSelectParams) => {
          const res = await issueService.getWorkItemsMeta(workspaceSlug, projectId!, params);
          const results = getWorkItemsFilterOptions(res.results);
          return { results, next_cursor: res.next_page_results ? res.next_cursor : "" };
        },
        fetchSelected: async (ids: string[]) => {
          const params = { issues: ids.join(","), cursor: `${ids.length}:0:0`, per_page: ids.length };
          const res = await issueService.getWorkItemsMeta(workspaceSlug, projectId!, params);
          return getWorkItemsFilterOptions(res.results);
        },
        ...operatorConfigs,
      }),
    [workspaceSlug, projectId, isFilterEnabled, operatorConfigs, issueService]
  );

  // epic filter config
  const epicFilterConfig = useMemo(
    () =>
      getEpicFilterConfig<TWorkItemFilterProperty>("epic_id")({
        isEnabled: isEpicFeatureEnabled && isEpicsEnabled,
        filterIcon: EpicIcon,
        getOptionIcon: () => <EpicIcon className="h-3 w-3 flex-shrink-0" />,
        epics: epics ?? [],
        ...operatorConfigs,
      }),
    [isEpicFeatureEnabled, isEpicsEnabled, epics, operatorConfigs]
  );

  // parent filter config
  const parentFilterConfig = useMemo(
    () =>
      getParentFilterConfig<TWorkItemFilterProperty>("parent_id")({
        isEnabled: !!projectId && isFilterEnabled("parent_id"),
        filterIcon: ParentPropertyIcon,
        fetchOptions: async (params: TAsyncMultiSelectParams) => {
          const res = await issueService.getWorkItemsMeta(workspaceSlug, projectId!, params);
          const results = getWorkItemsFilterOptions(res.results);
          return { results, next_cursor: res.next_page_results ? res.next_cursor : "" };
        },
        fetchSelected: async (ids: string[]) => {
          const params = { issues: ids.join(","), cursor: `${ids.length}:0:0`, per_page: ids.length };
          const res = await issueService.getWorkItemsMeta(workspaceSlug, projectId!, params);
          return getWorkItemsFilterOptions(res.results);
        },
        ...operatorConfigs,
      }),
    [workspaceSlug, projectId, isFilterEnabled, operatorConfigs, issueService]
  );

  const workflowFilterConfig = useMemo(
    () =>
      getWorkflowFilterConfig<TWorkItemFilterProperty>("workflow_id")({
        isEnabled: !!projectId && isWorkflowFilterEnabled,
        filterIcon: WorkflowIcon,
        getOptionIcon: () => <WorkflowIcon className="h-3.5 w-3.5 shrink-0" />,
        workflows: workflows ?? [],
        ...operatorConfigs,
      }),
    [projectId, isWorkflowFilterEnabled, workflows, operatorConfigs]
  );

  return {
    ...workItemFiltersConfig,
    areAllConfigsInitialized,
    configs: [
      workItemNameFilterConfig,
      workItemTypeFilterConfig,
      teamspaceProjectFilterConfig,
      milestoneFilterConfig,
      workItemFilterConfig,
      epicFilterConfig,
      parentFilterConfig,
      workflowFilterConfig,
      ...workItemFiltersConfig.configs,
      ...customPropertyConfigs.configs,
    ],
    configMap: {
      team_project_id: teamspaceProjectFilterConfig,
      type_id: workItemTypeFilterConfig,
      milestone_id: milestoneFilterConfig,
      id: workItemFilterConfig,
      epic_id: epicFilterConfig,
      parent_id: parentFilterConfig,
      workflow_id: workflowFilterConfig,
      ...workItemFiltersConfig.configMap,
      name: workItemNameFilterConfig,
      ...customPropertyConfigs.configMap,
    },
  };
};
