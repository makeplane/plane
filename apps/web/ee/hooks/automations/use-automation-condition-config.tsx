import { useMemo } from "react";
import { CircleUserRound, SignalHigh, Tag, Users } from "lucide-react";
// plane imports
import { DoubleCircleIcon, LayersIcon, PriorityIcon, StateGroupIcon } from "@plane/propel/icons";
import type { IUserLite, TAutomationConditionFilterProperty, TFilterConfig } from "@plane/types";
import { Avatar } from "@plane/ui";
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
import { useProjectState } from "@/hooks/store/use-project-state";
// plane web imports
import { IssueTypeLogo } from "@/plane-web/components/issue-types/common/issue-type-logo";
// local imports
import { useIssueTypes } from "../store/issue-types/use-issue-types";

type TArgs = {
  projectId: string;
  workspaceSlug: string;
};

export const useAutomationConfig = (args: TArgs) => {
  const { projectId, workspaceSlug } = args;
  // store hooks
  const { getProjectLabels } = useLabel();
  const { getProjectStates } = useProjectState();
  const {
    getUserDetails,
    project: { getProjectMemberIds },
  } = useMember();
  const { isWorkItemTypeEnabledForProject, getProjectIssueTypes } = useIssueTypes();
  // derived values
  const operatorConfigs = useFiltersOperatorConfigs({ workspaceSlug });
  const members = getProjectMemberIds(projectId, false)
    ?.map((memberId) => getUserDetails(memberId))
    .filter((member) => member) as IUserLite[];
  const projectWorkItemStates = getProjectStates(projectId);
  const projectLabels = getProjectLabels(projectId);
  const isWorkItemTypeEnabled = isWorkItemTypeEnabledForProject(workspaceSlug, projectId);
  const workItemTypesMap = projectId ? getProjectIssueTypes(projectId, false) : {};
  const workItemTypes = Object.values(workItemTypesMap).filter((workItemType) => workItemType && workItemType.id);

  const stateFilterConfig = useMemo(
    () =>
      getStateFilterConfig<TAutomationConditionFilterProperty>("payload.data.state_id")({
        isEnabled: true,
        filterIcon: DoubleCircleIcon,
        getOptionIcon: (state) => <StateGroupIcon stateGroup={state.group} color={state.color} />,
        states: projectWorkItemStates ?? [],
        ...operatorConfigs,
      }),
    [projectWorkItemStates, operatorConfigs]
  );

  const workItemTypeFilterConfig = useMemo(
    () =>
      getWorkItemTypeFilterConfig<TAutomationConditionFilterProperty>("payload.data.type_id")({
        isEnabled: isWorkItemTypeEnabled,
        filterIcon: LayersIcon,
        getOptionIcon: (workItemType) => (
          <IssueTypeLogo icon_props={workItemType?.logo_props?.icon} isDefault={workItemType?.is_default} size="xs" />
        ),
        workItemTypes,
        ...operatorConfigs,
      }),
    [isWorkItemTypeEnabled, workItemTypes, operatorConfigs]
  );

  const labelFilterConfig = useMemo(
    () =>
      getLabelFilterConfig<TAutomationConditionFilterProperty>("payload.data.label_ids")({
        isEnabled: true,
        filterIcon: Tag,
        labels: projectLabels ?? [],
        getOptionIcon: (color) => (
          <span className="flex flex-shrink-0 size-2.5 rounded-full" style={{ backgroundColor: color }} />
        ),
        ...operatorConfigs,
      }),
    [projectLabels, operatorConfigs]
  );

  const assigneeFilterConfig = useMemo(
    () =>
      getAssigneeFilterConfig<TAutomationConditionFilterProperty>("payload.data.assignee_ids")({
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
        ...operatorConfigs,
      }),
    [members, operatorConfigs]
  );

  const createdByFilterConfig = useMemo(
    () =>
      getCreatedByFilterConfig<TAutomationConditionFilterProperty>("payload.data.created_by_id")({
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
