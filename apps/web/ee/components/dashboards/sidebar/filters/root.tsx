import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { AtSign, CircleUserRound, Files, Layers, SignalHigh, Tag, Users } from "lucide-react";

/**
 * plane imports
 */

import { CycleGroupIcon, DiceIcon, DoubleCircleIcon, PriorityIcon, StateGroupIcon } from "@plane/propel/icons";
import { FilterInstance } from "@plane/shared-state";
import {
  ICycle,
  IIssueLabel,
  IModule,
  IState,
  IUserLite,
  TCycleGroups,
  TDashboardWidget,
  TDashboardWidgetFilterKeys,
  TExternalDashboardWidgetFilterExpression,
  TIssuePriorities,
  TIssueType,
} from "@plane/types";
import { Avatar, Loader } from "@plane/ui";
import {
  cn,
  getAssigneeFilterConfig,
  getCreatedByFilterConfig,
  getCycleFilterConfig,
  getLabelFilterConfig,
  getMentionFilterConfig,
  getModuleFilterConfig,
  getPriorityFilterConfig,
  getStateFilterConfig,
  getStateGroupFilterConfig,
  getWorkItemTypeFilterConfig,
} from "@plane/utils";

/**
 * local imports
 */

import { AddFilterButton } from "@/components/rich-filters/add-filters-button";
import { useCycle } from "@/hooks/store/use-cycle";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { IssueTypeLogo } from "@/plane-web/components/issue-types/common/issue-type-logo";
import { useFiltersOperatorConfigs } from "@/plane-web/hooks/rich-filters/use-filters-operator-configs";
import { useIssueTypes } from "@/plane-web/hooks/store";
import { DashboardWidgetFilterAdapter } from "./adapter";
import { FilterConditions } from "./filter-conditions";

type Props = {
  projectIds?: string[];
  handleSubmit: (data: Partial<TDashboardWidget>) => Promise<void>;
  initialFilters?: TExternalDashboardWidgetFilterExpression;
};

const FilterContent: React.FC<Props> = observer(({ projectIds, initialFilters, handleSubmit }) => {
  const filterInstance = useMemo(
    () =>
      new FilterInstance<TDashboardWidgetFilterKeys, TExternalDashboardWidgetFilterExpression>({
        adapter: new DashboardWidgetFilterAdapter(),
        initialExpression: initialFilters,
        onExpressionChange: (expression) => {
          handleSubmit({
            filters: expression,
          });
        },
      }),
    []
  );

  /**
   * store hooks
   */

  const { getProjectLabels } = useLabel();
  const { workspaceSlug } = useParams();
  const { getUserDetails } = useMember();
  const { getProjectById } = useProject();
  const { getProjectCycleDetails } = useCycle();
  const { getProjectModuleDetails } = useModule();
  const { getProjectIssueTypes } = useIssueTypes();
  const { getProjectStates } = useProjectState();

  /**
   * derived values
   */

  const operatorConfigs = useFiltersOperatorConfigs({ workspaceSlug: workspaceSlug?.toString() });

  const joinedProjectData = useMemo(() => {
    if (!workspaceSlug || !projectIds?.length) {
      return {
        labels: [],
        members: [],
        cycles: [],
        modules: [],
        workItemTypes: [],
        states: [],
      };
    }

    // Single loop to collect all data
    const joinedProjectLabels: IIssueLabel[] = [];
    const joinedProjectMemberIds = new Set<string>();
    const joinedProjectCycles = new Set<ICycle>();
    const joinedProjectModules = new Set<IModule>();
    const joinedProjectWorkItemTypes = new Set<TIssueType>();
    const joinedProjectStates = new Set<IState>();

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

      // Collect states
      const projectStates = getProjectStates(projectId);
      if (projectStates) {
        projectStates.forEach((state) => joinedProjectStates.add(state));
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
      states: Array.from(joinedProjectStates),
    };
  }, [
    workspaceSlug,
    projectIds,
    getProjectLabels,
    getProjectById,
    getProjectCycleDetails,
    getProjectModuleDetails,
    getProjectIssueTypes,
    getProjectStates,
    getUserDetails,
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
        ...operatorConfigs,
      }),
    [joinedProjectData.members, operatorConfigs]
  );

  const cycleFilterConfig = useMemo(
    () =>
      getCycleFilterConfig("cycle_id")({
        isEnabled: true,
        filterIcon: DiceIcon,
        cycles: joinedProjectData.cycles,
        getOptionIcon: (cycle: TCycleGroups) => <CycleGroupIcon cycleGroup={cycle} />,
        ...operatorConfigs,
      }),
    [joinedProjectData.cycles, operatorConfigs]
  );

  const moduleFilterConfig = useMemo(
    () =>
      getModuleFilterConfig("module_id")({
        isEnabled: true,
        filterIcon: Files,
        modules: joinedProjectData.modules,
        getOptionIcon: () => <DiceIcon className="h-3 w-3 flex-shrink-0" />,
        ...operatorConfigs,
      }),
    [joinedProjectData.modules, operatorConfigs]
  );

  const mentionFilterConfig = useMemo(
    () =>
      getMentionFilterConfig("mention_id")({
        isEnabled: true,
        filterIcon: AtSign,
        members: joinedProjectData.members,
        getOptionIcon: (member: IUserLite) => <Avatar src={member.avatar_url} name={member.display_name} size="sm" />,
        ...operatorConfigs,
      }),
    [joinedProjectData.members, operatorConfigs]
  );

  const createdByFilterConfig = useMemo(
    () =>
      getCreatedByFilterConfig("created_by_id")({
        isEnabled: true,
        filterIcon: CircleUserRound,
        members: joinedProjectData.members,
        getOptionIcon: (member: IUserLite) => <Avatar src={member.avatar_url} name={member.display_name} size="sm" />,
        ...operatorConfigs,
      }),
    [joinedProjectData.members, operatorConfigs]
  );

  const priorityFilterConfig = useMemo(
    () =>
      getPriorityFilterConfig("priority")({
        isEnabled: true,
        filterIcon: SignalHigh,
        getOptionIcon: (priority: TIssuePriorities) => <PriorityIcon priority={priority} />,
        ...operatorConfigs,
      }),
    [operatorConfigs]
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
        ...operatorConfigs,
      }),
    [joinedProjectData.labels, operatorConfigs]
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
        ...operatorConfigs,
      }),
    [joinedProjectData.workItemTypes, operatorConfigs]
  );

  const stateFilterConfig = useMemo(
    () =>
      getStateFilterConfig<TDashboardWidgetFilterKeys>("state_id")({
        isEnabled: true,
        filterIcon: DoubleCircleIcon,
        getOptionIcon: (state) => <StateGroupIcon stateGroup={state.group} color={state.color} />,
        states: joinedProjectData.states ?? [],
        ...operatorConfigs,
      }),
    [joinedProjectData.states, operatorConfigs]
  );

  const stateGroupFilterConfig = useMemo(
    () =>
      getStateGroupFilterConfig<TDashboardWidgetFilterKeys>("state_group")({
        isEnabled: true,
        filterIcon: DoubleCircleIcon,
        getOptionIcon: (stateGroupKey) => <StateGroupIcon stateGroup={stateGroupKey} />,
        ...operatorConfigs,
      }),
    [operatorConfigs]
  );

  if (filterInstance) {
    filterInstance.configManager.registerAll([
      assigneeFilterConfig,
      cycleFilterConfig,
      moduleFilterConfig,
      mentionFilterConfig,
      createdByFilterConfig,
      priorityFilterConfig,
      labelFilterConfig,
      workItemTypeFilterConfig,
      stateFilterConfig,
      stateGroupFilterConfig,
    ]);
  }

  return (
    <section className="space-y-2 w-full overflow-auto">
      <div className="flex flex-col items-start">
        <FilterConditions filters={filterInstance} />
        <div
          className={cn("w-fit", {
            "pt-3": filterInstance.allConditionsForDisplay.length > 0,
          })}
        >
          <AddFilterButton
            filter={filterInstance}
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
    </section>
  );
});

const WidgetConfigSidebarFilters: React.FC<Props> = observer((props) => (
  <div className="flex flex-col gap-4 w-full overflow-x-hidden flex-shrink-0">
    <div className="flex items-center justify-between w-full">
      <h6 className="font-semibold text-custom-text-200 text-sm">Filters</h6>
    </div>
    {props.initialFilters ? <FilterContent {...props} /> : <Loader.Item height="24px" width="100%" />}
  </div>
));

export { WidgetConfigSidebarFilters };
