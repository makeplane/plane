import { useMemo } from "react";
// plane imports
import { ISSUE_PRIORITIES } from "@plane/constants";
import { EAutomationChangePropertyType, EAutomationChangeType, type ICustomSearchSelectOption } from "@plane/types";
import { Avatar, PriorityIcon, StateGroupIcon } from "@plane/ui";
import { getFileURL, renderFormattedDate } from "@plane/utils";
// hooks
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useProjectState } from "@/hooks/store/use-project-state";

export enum EConfigurationComponentType {
  SINGLE_SELECT = "single_select",
  MULTI_SELECT = "multi_select",
  DATE_PICKER = "date_picker",
}

type TSingleSelectConfiguration = {
  component_type: EConfigurationComponentType.SINGLE_SELECT;
  options: ICustomSearchSelectOption[];
};

type TMultiSelectConfiguration = {
  component_type: EConfigurationComponentType.MULTI_SELECT;
  options: ICustomSearchSelectOption[];
};

type TDatePickerConfiguration = {
  component_type: EConfigurationComponentType.DATE_PICKER;
  minDate?: Date;
  maxDate?: Date;
};

type TComponentConfiguration = TSingleSelectConfiguration | TMultiSelectConfiguration | TDatePickerConfiguration;

export type TChangePropertyConfiguration = {
  supported_change_types: EAutomationChangeType[];
  getPreviewContent: (value: string[]) => React.ReactNode;
} & TComponentConfiguration;

type TChangePropertyConfigurationMap = {
  [K in EAutomationChangePropertyType]: TChangePropertyConfiguration;
};

type TArgs = {
  projectId: string;
};

export const useAutomationActionConfig = (args: TArgs) => {
  const { projectId } = args;
  // store hooks
  const { getProjectStates } = useProjectState();
  const {
    project: { getProjectMemberIds, getProjectMemberDetails },
  } = useMember();
  const { getProjectLabels } = useLabel();
  // derived values
  const projectStates = getProjectStates(projectId);
  const projectMemberIds = getProjectMemberIds(projectId, false);
  const projectLabels = getProjectLabels(projectId);

  const stateConfig: TChangePropertyConfiguration = useMemo(
    () => ({
      supported_change_types: [EAutomationChangeType.UPDATE],
      component_type: EConfigurationComponentType.SINGLE_SELECT,
      options:
        projectStates?.map((state) => ({
          value: state.id,
          query: state.name,
          content: (
            <div className="flex items-center gap-2">
              <StateGroupIcon stateGroup={state.group} color={state.color} />
              <span className="flex-grow truncate">{state.name}</span>
            </div>
          ),
        })) ?? [],
      getPreviewContent: (value: string[]) => {
        const states = value.map((id) => projectStates?.find((state) => state.id === id)?.name);
        return states.join(", ");
      },
    }),
    [projectStates]
  );

  const priorityConfig: TChangePropertyConfiguration = useMemo(
    () => ({
      supported_change_types: [EAutomationChangeType.UPDATE],
      component_type: EConfigurationComponentType.SINGLE_SELECT,
      options: ISSUE_PRIORITIES.map((priority) => ({
        value: priority.key,
        query: priority.key,
        content: (
          <div className="flex items-center gap-2">
            <PriorityIcon priority={priority.key} size={14} withContainer />
            <span className="flex-grow truncate">{priority.title}</span>
          </div>
        ),
      })),
      getPreviewContent: (value: string[]) => {
        const priorities = value.map((key) => ISSUE_PRIORITIES.find((priority) => priority.key === key)?.title);
        return priorities.join(", ");
      },
    }),
    []
  );

  const assigneeConfig: TChangePropertyConfiguration = useMemo(
    () => ({
      supported_change_types: [EAutomationChangeType.ADD, EAutomationChangeType.REMOVE],
      component_type: EConfigurationComponentType.MULTI_SELECT,
      options:
        projectMemberIds
          ?.map((userId) => {
            if (!projectId) return;
            const memberDetails = getProjectMemberDetails(userId, projectId.toString());
            return {
              value: `${memberDetails?.member?.id}`,
              query: `${memberDetails?.member?.display_name}`,
              content: (
                <div className="flex items-center gap-2">
                  <Avatar
                    name={memberDetails?.member?.display_name}
                    src={getFileURL(memberDetails?.member?.avatar_url ?? "")}
                    showTooltip={false}
                  />
                  {memberDetails?.member?.display_name}
                </div>
              ),
            };
          })
          .filter((o) => o !== undefined) ?? [],
      getPreviewContent: (value: string[]) => {
        const members = value.map((id) => getProjectMemberDetails(id, projectId)?.member?.display_name);
        return members.join(", ");
      },
    }),
    [projectMemberIds, getProjectMemberDetails, projectId]
  );

  const labelsConfig: TChangePropertyConfiguration = useMemo(
    () => ({
      supported_change_types: [EAutomationChangeType.ADD, EAutomationChangeType.REMOVE],
      component_type: EConfigurationComponentType.MULTI_SELECT,
      options: (projectLabels ?? []).map((label) => ({
        value: label.id,
        query: label.name,
        content: (
          <div className="flex items-center justify-start gap-2 overflow-hidden">
            <span
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{
                backgroundColor: label.color,
              }}
            />
            <div className="line-clamp-1 inline-block truncate">{label.name}</div>
          </div>
        ),
      })),
      getPreviewContent: (value: string[]) => {
        const labels = value.map((id) => projectLabels?.find((label) => label.id === id)?.name);
        return labels.join(", ");
      },
    }),
    [projectLabels]
  );

  const startDateConfig: TChangePropertyConfiguration = useMemo(
    () => ({
      supported_change_types: [EAutomationChangeType.UPDATE],
      component_type: EConfigurationComponentType.DATE_PICKER,
      minDate: new Date(),
      getPreviewContent: (value: string[]) => renderFormattedDate(value[0] ?? ""),
    }),
    []
  );

  const dueDateConfig: TChangePropertyConfiguration = useMemo(
    () => ({
      supported_change_types: [EAutomationChangeType.UPDATE],
      component_type: EConfigurationComponentType.DATE_PICKER,
      minDate: new Date(),
      getPreviewContent: (value: string[]) => renderFormattedDate(value[0] ?? ""),
    }),
    []
  );

  const configurationMap: TChangePropertyConfigurationMap = useMemo(
    () => ({
      [EAutomationChangePropertyType.STATE]: stateConfig,
      [EAutomationChangePropertyType.PRIORITY]: priorityConfig,
      [EAutomationChangePropertyType.ASSIGNEE]: assigneeConfig,
      [EAutomationChangePropertyType.LABELS]: labelsConfig,
      [EAutomationChangePropertyType.START_DATE]: startDateConfig,
      [EAutomationChangePropertyType.DUE_DATE]: dueDateConfig,
    }),
    [stateConfig, priorityConfig, assigneeConfig, labelsConfig, startDateConfig, dueDateConfig]
  );

  return {
    configurationMap,
  };
};
