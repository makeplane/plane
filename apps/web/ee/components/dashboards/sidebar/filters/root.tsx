import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { AtSign, CircleUserRound, Files, Layers, SignalHigh, Tag, Users } from "lucide-react";

/**
 * plane imports
 */

import {
  ICycle,
  IIssueLabel,
  IModule,
  IUserLite,
  TCycleGroups,
  TDashboardWidget,
  TDashboardWidgetFilterKeys,
  TExternalDashboardWidgetFilterExpression,
  TIssuePriorities,
  TIssueType,
} from "@plane/types";
import { Avatar, CycleGroupIcon, DiceIcon, Loader, PriorityIcon } from "@plane/ui";
import {
  cn,
  getAssigneeFilterConfig,
  getCreatedByFilterConfig,
  getCycleFilterConfig,
  getLabelFilterConfig,
  getMentionFilterConfig,
  getModuleFilterConfig,
  getPriorityFilterConfig,
  getWorkItemTypeFilterConfig,
} from "@plane/utils";

/**
 * local imports
 */

import { useCycle } from "@/hooks/store/use-cycle";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";

import { IssueTypeLogo } from "@/plane-web/components/issue-types/common/issue-type-logo";
import { AddFilterButton } from "@/plane-web/components/rich-filters/add-filters-button";
import { FilterItem } from "@/plane-web/components/rich-filters/filter-item";
import { useIssueTypes } from "@/plane-web/hooks/store";
import { IFilterInstance } from "@/plane-web/store/rich-filters/filter";
import { withFilters } from "./with-filters";
import { useProject } from "@/hooks/store/use-project";

type Props = {
  filters: IFilterInstance<TDashboardWidgetFilterKeys, TExternalDashboardWidgetFilterExpression> | null;
  projectIds?: string[];
  handleSubmit: (data: Partial<TDashboardWidget>) => Promise<void>;
};

const WidgetConfigSidebarFilters: React.FC<Props> = observer((props) => {
  const { filters, projectIds } = props;
  /**
   * store hooks
   */

  const { getProjectLabels, fetchProjectLabels } = useLabel();
  const { workspaceSlug } = useParams();
  const { getUserDetails } = useMember();
  const { getProjectById } = useProject();
  const {
    project: { getProjectMemberIds, fetchProjectMembers },
  } = useMember();
  const { getProjectCycleDetails, fetchAllCycles } = useCycle();
  const { getProjectModuleDetails, fetchModules } = useModule();
  const { getProjectIssueTypes, fetchAll } = useIssueTypes();

  /**
   * derived values
   */

  const joinedProjectData = useMemo(() => {
    if (!workspaceSlug || !projectIds?.length) {
      return {
        labels: [],
        members: [],
        cycles: [],
        modules: [],
        workItemTypes: [],
      };
    }

    // Single loop to collect all data
    const joinedProjectLabels: IIssueLabel[] = [];
    const joinedProjectMemberIds = new Set<string>();
    const joinedProjectCycles = new Set<ICycle>();
    const joinedProjectModules = new Set<IModule>();
    const joinedProjectWorkItemTypes = new Set<TIssueType>();

    projectIds.forEach((projectId) => {
      // Collect labels
      const labels = getProjectLabels(projectId);
      if (labels) joinedProjectLabels.push(...labels);

      // Collect members
      getProjectById(projectId)?.members?.forEach((memberId) => joinedProjectMemberIds.add(memberId));

      // Collect cycles
      const projectCycles = getProjectCycleDetails(projectId);
      if (projectCycles) {
        projectCycles.forEach((cycle) => joinedProjectCycles.add(cycle));
      }

      // Collect modules
      const projectModules = getProjectModuleDetails(projectId);
      if (projectModules) {
        projectModules.forEach((module) => joinedProjectModules.add(module));
      }

      // Collect work item types
      const projectWorkItemTypes = getProjectIssueTypes(projectId, true);
      if (projectWorkItemTypes) {
        Object.values(projectWorkItemTypes).forEach((workItemType) => joinedProjectWorkItemTypes.add(workItemType));
      }
    });

    const joinedProjectMembers = Array.from(joinedProjectMemberIds)
      .map((memberId) => getUserDetails(memberId))
      .filter((member) => member !== undefined);

    return {
      labels: joinedProjectLabels,
      members: joinedProjectMembers,
      cycles: Array.from(joinedProjectCycles),
      modules: Array.from(joinedProjectModules),
      workItemTypes: Array.from(joinedProjectWorkItemTypes),
    };
  }, [
    workspaceSlug,
    projectIds,
    fetchProjectLabels,
    getProjectLabels,
    fetchProjectMembers,
    getProjectMemberIds,
    getUserDetails,
    fetchAllCycles,
    getProjectCycleDetails,
    fetchModules,
    getProjectModuleDetails,
    fetchAll,
    getProjectIssueTypes,
  ]);

  /**
   * Filter Configuration
   */

  const assigneeFilterConfig = useMemo(
    () =>
      getAssigneeFilterConfig("assignee_id")({
        isEnabled: true,
        filterIcon: Users,
        members: joinedProjectData.members,
        getOptionIcon: (assignee: IUserLite) => (
          <Avatar src={assignee.avatar_url} name={assignee.display_name} size="sm" />
        ),
      }),
    [joinedProjectData.members]
  );

  const cycleFilterConfig = useMemo(
    () =>
      getCycleFilterConfig("cycle_id")({
        isEnabled: true,
        filterIcon: DiceIcon,
        cycles: joinedProjectData.cycles,
        getOptionIcon: (cycle: TCycleGroups) => <CycleGroupIcon cycleGroup={cycle} />,
      }),
    [joinedProjectData.cycles]
  );

  const moduleFilterConfig = useMemo(
    () =>
      getModuleFilterConfig("module_id")({
        isEnabled: true,
        filterIcon: Files,
        modules: joinedProjectData.modules,
        getOptionIcon: () => <DiceIcon className="h-3 w-3 flex-shrink-0" />,
      }),
    [joinedProjectData.modules]
  );

  const mentionFilterConfig = useMemo(
    () =>
      getMentionFilterConfig("mention_id")({
        isEnabled: true,
        filterIcon: AtSign,
        members: joinedProjectData.members,
        getOptionIcon: (member: IUserLite) => <Avatar src={member.avatar_url} name={member.display_name} size="sm" />,
      }),
    [joinedProjectData.members]
  );

  const createdByFilterConfig = useMemo(
    () =>
      getCreatedByFilterConfig("created_by_id")({
        isEnabled: true,
        filterIcon: CircleUserRound,
        members: joinedProjectData.members,
        getOptionIcon: (member: IUserLite) => <Avatar src={member.avatar_url} name={member.display_name} size="sm" />,
      }),
    [joinedProjectData.members]
  );

  const priorityFilterConfig = useMemo(
    () =>
      getPriorityFilterConfig("priority")({
        isEnabled: true,
        filterIcon: SignalHigh,
        getOptionIcon: (priority: TIssuePriorities) => <PriorityIcon priority={priority} />,
      }),
    []
  );

  const labelFilterConfig = useMemo(
    () =>
      getLabelFilterConfig("label_id")({
        isEnabled: true,
        filterIcon: Tag,
        labels: joinedProjectData.labels,
        getOptionIcon: (color: string) => (
          <span className="flex flex-shrink-0 size-2.5 rounded-full" style={{ backgroundColor: color }} />
        ),
      }),
    [joinedProjectData.labels]
  );

  const workItemTypeFilterConfig = useMemo(
    () =>
      getWorkItemTypeFilterConfig("type_id")({
        isEnabled: true,
        filterIcon: Layers,
        workItemTypes: joinedProjectData.workItemTypes,
        getOptionIcon: (workItemType: TIssueType) => (
          <IssueTypeLogo icon_props={workItemType.logo_props?.icon} size="xs" isDefault={workItemType.is_default} />
        ),
      }),
    [joinedProjectData.workItemTypes]
  );

  if (filters) {
    filters.configManager.registerAll([
      assigneeFilterConfig,
      cycleFilterConfig,
      moduleFilterConfig,
      mentionFilterConfig,
      createdByFilterConfig,
      priorityFilterConfig,
      labelFilterConfig,
      workItemTypeFilterConfig,
    ]);
  }

  return (
    <div className="flex flex-col gap-4 w-full overflow-hidden">
      <div className="flex items-center justify-between w-full">
        <h6 className="font-semibold text-custom-text-200 text-sm">Filters</h6>
      </div>

      <section className="space-y-2 w-full overflow-auto">
        {filters && (
          <div className="flex flex-col items-start">
            {filters.allConditions.map((condition, index) => (
              <div key={condition.id} className="flex flex-col items-start">
                <FilterItem filter={filters} condition={condition} showTransition={false} />

                {index < filters.allConditions.length - 1 && (
                  <div className="flex flex-col items-center">
                    <div className="h-2 border-l border-dashed border-custom-border-300" />
                    <span className="text-xs font-medium uppercase text-custom-text-400 px-2 py-0.5 bg-custom-background-80 rounded-sm">
                      And
                    </span>
                    <div className="h-2 border-l border-dashed border-custom-border-300" />
                  </div>
                )}
              </div>
            ))}
            <div
              className={cn("w-fit", {
                "pt-3": filters.allConditions.length > 0,
              })}
            >
              <AddFilterButton
                filter={filters}
                buttonConfig={{
                  label: "Add filter",
                  variant: "accent-primary",
                  defaultOpen: false,
                  iconConfig: {
                    shouldShowIcon: false,
                  },
                }}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
});

export const EnhancedWidgetConfigSidebarFilters = withFilters(WidgetConfigSidebarFilters);
