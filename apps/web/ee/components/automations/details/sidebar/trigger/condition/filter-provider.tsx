import { useMemo } from "react";
import { observer } from "mobx-react";
import { CircleUserRound, SignalHigh, Tag, Users } from "lucide-react";
// plane imports
import { TAutomationConditionFilterExpression, IUserLite, TAutomationConditionFilterKeys } from "@plane/types";
import { Avatar, DoubleCircleIcon, LayersIcon, PriorityIcon, StateGroupIcon } from "@plane/ui";
import {
  getAssigneeFilterConfig,
  getCreatedByFilterConfig,
  getFileURL,
  getLabelFilterConfig,
  getPriorityFilterConfig,
  getStateFilterConfig,
  getWorkItemTypeFilterConfig,
} from "@plane/utils";
// store hooks
import { useLabel, useMember, useProjectState } from "@/hooks/store";
// plane web imports
import { IssueTypeLogo } from "@/plane-web/components/issue-types";
import { useIssueTypes } from "@/plane-web/hooks/store/issue-types";
import { automationConditionFilterAdapter } from "@/plane-web/store/automations/node/condition/adapter";
import { FilterInstance, IFilterInstance } from "@/plane-web/store/rich-filters/filter";

type TBaseAutomationConditionFilterProps = {
  projectId: string;
  workspaceSlug: string;
  updateFilterExpression?: (updatedFilters: TAutomationConditionFilterExpression) => void;
};

type TAutomationConditionFilterHOCProps = TBaseAutomationConditionFilterProps & {
  initialFilterExpression: TAutomationConditionFilterExpression | undefined;
  children:
    | React.ReactNode
    | ((props: {
        filter: IFilterInstance<TAutomationConditionFilterKeys, TAutomationConditionFilterExpression> | undefined;
      }) => React.ReactNode);
};

export const AutomationConditionFilterHOC = observer((props: TAutomationConditionFilterHOCProps) => {
  const { children, initialFilterExpression } = props;

  // Only initialize filter instance when initialFilterExpression are defined
  if (!initialFilterExpression)
    return <>{typeof children === "function" ? children({ filter: undefined }) : children}</>;

  return (
    <AutomationConditionFilterRoot {...props} initialFilterExpression={initialFilterExpression}>
      {children}
    </AutomationConditionFilterRoot>
  );
});

type TAutomationConditionFilterProps = TBaseAutomationConditionFilterProps & {
  initialFilterExpression: TAutomationConditionFilterExpression;
  children:
    | React.ReactNode
    | ((props: {
        filter: IFilterInstance<TAutomationConditionFilterKeys, TAutomationConditionFilterExpression>;
      }) => React.ReactNode);
};

const AutomationConditionFilterRoot = observer((props: TAutomationConditionFilterProps) => {
  const { children, projectId, initialFilterExpression, updateFilterExpression, workspaceSlug } = props;
  // store hooks
  const { getProjectLabels } = useLabel();
  const { getProjectStates } = useProjectState();
  const {
    getUserDetails,
    project: { getProjectMemberIds },
  } = useMember();
  const { isWorkItemTypeEnabledForProject, getProjectIssueTypes } = useIssueTypes();
  // derived values
  const members = getProjectMemberIds(projectId, false)
    ?.map((memberId) => getUserDetails(memberId))
    .filter((member) => member) as IUserLite[];
  const projectWorkItemStates = getProjectStates(projectId);
  const projectLabels = getProjectLabels(projectId);
  const isWorkItemTypeEnabled = isWorkItemTypeEnabledForProject(workspaceSlug, projectId);
  const workItemTypesMap = projectId ? getProjectIssueTypes(projectId, false) : {};
  const workItemTypes = Object.values(workItemTypesMap).filter((workItemType) => workItemType && workItemType.id);
  // Create new filter instance
  const conditionFilter = useMemo(
    () =>
      new FilterInstance<TAutomationConditionFilterKeys, TAutomationConditionFilterExpression>({
        adapter: automationConditionFilterAdapter,
        initialExpression: initialFilterExpression,
        onExpressionChange: updateFilterExpression,
      }),
    [initialFilterExpression, updateFilterExpression]
  );

  const stateFilterConfig = useMemo(
    () =>
      getStateFilterConfig<TAutomationConditionFilterKeys>("payload.data.state_id")({
        isEnabled: true,
        filterIcon: DoubleCircleIcon,
        getOptionIcon: (state) => <StateGroupIcon stateGroup={state.group} color={state.color} />,
        states: projectWorkItemStates ?? [],
      }),
    [projectWorkItemStates]
  );

  const workItemTypeFilterConfig = useMemo(
    () =>
      getWorkItemTypeFilterConfig<TAutomationConditionFilterKeys>("payload.data.type_id")({
        isEnabled: isWorkItemTypeEnabled,
        filterIcon: LayersIcon,
        getOptionIcon: (workItemType) => (
          <IssueTypeLogo icon_props={workItemType?.logo_props?.icon} isDefault={workItemType?.is_default} size="xs" />
        ),
        workItemTypes,
      }),
    [isWorkItemTypeEnabled, workItemTypes]
  );

  const labelFilterConfig = useMemo(
    () =>
      getLabelFilterConfig<TAutomationConditionFilterKeys>("payload.data.label_ids")({
        isEnabled: true,
        filterIcon: Tag,
        labels: projectLabels ?? [],
        getOptionIcon: (color) => (
          <span className="flex flex-shrink-0 size-2.5 rounded-full" style={{ backgroundColor: color }} />
        ),
      }),
    [projectLabels]
  );

  const assigneeFilterConfig = useMemo(
    () =>
      getAssigneeFilterConfig<TAutomationConditionFilterKeys>("payload.data.assignee_ids")({
        isEnabled: true,
        filterIcon: Users,
        members: members ?? [],
        getOptionIcon: (memberDetails) => (
          <Avatar
            name={memberDetails.display_name}
            src={getFileURL(memberDetails.avatar_url)}
            showTooltip={false}
            size="sm"
          />
        ),
      }),
    [members]
  );

  const createdByFilterConfig = useMemo(
    () =>
      getCreatedByFilterConfig<TAutomationConditionFilterKeys>("payload.data.created_by_id")({
        isEnabled: true,
        filterIcon: CircleUserRound,
        members: members ?? [],
        getOptionIcon: (memberDetails) => (
          <Avatar
            name={memberDetails.display_name}
            src={getFileURL(memberDetails.avatar_url)}
            showTooltip={false}
            size="sm"
          />
        ),
      }),
    [members]
  );

  const priorityFilterConfig = useMemo(
    () =>
      getPriorityFilterConfig<TAutomationConditionFilterKeys>("payload.data.priority")({
        isEnabled: true,
        filterIcon: SignalHigh,
        getOptionIcon: (priority) => <PriorityIcon priority={priority} />,
      }),
    []
  );

  conditionFilter.configManager.registerAll([
    stateFilterConfig,
    workItemTypeFilterConfig,
    labelFilterConfig,
    assigneeFilterConfig,
    createdByFilterConfig,
    priorityFilterConfig,
  ]);

  return <>{typeof children === "function" ? children({ filter: conditionFilter }) : children}</>;
});
