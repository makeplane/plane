import { useMemo } from "react";
import { CalendarCheck2, CalendarClock } from "lucide-react";
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
        const state = projectStates?.find((state) => state.id === value[0]);
        if (!state) return null;
        return (
          <div className="shrink-0 inline-flex items-center gap-2 bg-custom-background-80 rounded px-1 py-0.5">
            <StateGroupIcon stateGroup={state.group} color={state.color} />
            <span className="flex-grow truncate">{state.name}</span>
          </div>
        );
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
        const priority = ISSUE_PRIORITIES.find((priority) => priority.key === value[0]);
        if (!priority) return null;
        return (
          <div className="shrink-0 inline-flex items-center gap-2 bg-custom-background-80 rounded px-1 py-0.5">
            <PriorityIcon priority={priority.key} size={14} withContainer />
            <span className="flex-grow truncate">{priority.title}</span>
          </div>
        );
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
        const members = value.map((id) => getProjectMemberDetails(id, projectId)).filter((m) => m !== undefined);
        return (
          <>
            {members.map((member, index) => (
              <div key={member?.id} className="shrink-0">
                <div className="inline-flex items-center gap-2 bg-custom-background-80 rounded px-1 py-0.5">
                  <Avatar
                    name={member?.member?.display_name}
                    src={getFileURL(member?.member?.avatar_url ?? "")}
                    showTooltip={false}
                    size="sm"
                  />
                  {member?.member?.display_name}
                </div>
                {index !== members.length - 1 && <span className="mr-1">,</span>}
              </div>
            ))}
          </>
        );
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
              className="size-2.5 flex-shrink-0 rounded-full"
              style={{
                backgroundColor: label.color,
              }}
            />
            <div className="line-clamp-1 inline-block truncate">{label.name}</div>
          </div>
        ),
      })),
      getPreviewContent: (value: string[]) => {
        const labels = value
          .map((id) => projectLabels?.find((label) => label.id === id))
          .filter((l) => l !== undefined);
        return (
          <>
            {labels.map((label, index) => (
              <div key={label.id} className="shrink-0">
                <div className="inline-flex items-center gap-2 bg-custom-background-80 rounded px-1 py-0.5">
                  <span
                    className="size-2.5 flex-shrink-0 rounded-full"
                    style={{
                      backgroundColor: label.color,
                    }}
                  />
                  <span className="flex-grow truncate">{label.name}</span>
                </div>
                {index !== labels.length - 1 && <span className="mr-1">,</span>}
              </div>
            ))}
          </>
        );
      },
    }),
    [projectLabels]
  );

  const startDateConfig: TChangePropertyConfiguration = useMemo(
    () => ({
      supported_change_types: [EAutomationChangeType.UPDATE],
      component_type: EConfigurationComponentType.DATE_PICKER,
      minDate: new Date(),
      getPreviewContent: (value: string[]) => (
        <div className="shrink-0 inline-flex items-center gap-2 bg-custom-background-80 rounded px-1 py-0.5">
          <CalendarClock className="shrink-0 size-3.5" />
          <span className="flex-grow truncate">{renderFormattedDate(value[0] ?? "")}</span>
        </div>
      ),
    }),
    []
  );

  const dueDateConfig: TChangePropertyConfiguration = useMemo(
    () => ({
      supported_change_types: [EAutomationChangeType.UPDATE],
      component_type: EConfigurationComponentType.DATE_PICKER,
      minDate: new Date(),
      getPreviewContent: (value: string[]) => (
        <div className="shrink-0 inline-flex items-center gap-2 bg-custom-background-80 rounded px-1 py-0.5">
          <CalendarCheck2 className="shrink-0 size-3.5" />
          <span className="flex-grow truncate">{renderFormattedDate(value[0] ?? "")}</span>
        </div>
      ),
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
