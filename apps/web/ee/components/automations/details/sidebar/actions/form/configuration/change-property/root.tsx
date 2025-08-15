// components
import { useMemo } from "react";
import { observer } from "mobx-react";
import { useFormContext } from "react-hook-form";
// plane imports
import { ISSUE_PRIORITIES } from "@plane/constants";
import { EAutomationChangePropertyType, EAutomationChangeType, ICustomSearchSelectOption } from "@plane/types";
import { Avatar, PriorityIcon } from "@plane/ui";
import { cn, getFileURL } from "@plane/utils";
// hooks
import { useLabel } from "@/hooks/store/use-label"
import { useMember } from "@/hooks/store/use-member"
import { useProjectState } from "@/hooks/store/use-project-state";
// local imports
import { TAutomationActionFormData } from "../../root";
import { ChangeTypeSelect } from "./change-type-select";
import { PropertyNameSelect } from "./property-name-select";
import { PropertyValueSelect } from "./property-value-select";

type TProps = {
  isDisabled?: boolean;
  projectId: string;
};

enum EConfigurationComponentType {
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

type TChangePropertyConfiguration = {
  supported_change_types: EAutomationChangeType[];
} & TComponentConfiguration;

type TChangePropertyConfigurationMap = {
  [K in EAutomationChangePropertyType]: TChangePropertyConfiguration;
};

export const AutomationActionChangePropertyConfiguration: React.FC<TProps> = observer((props) => {
  const { isDisabled, projectId } = props;
  // store hooks
  const { getProjectStates } = useProjectState();
  const {
    project: { getProjectMemberIds, getProjectMemberDetails },
  } = useMember();
  const { getProjectLabels } = useLabel();
  // form hooks
  const { watch, setValue } = useFormContext<TAutomationActionFormData>();
  // derived values
  const projectStates = getProjectStates(projectId);
  const projectMemberIds = getProjectMemberIds(projectId, false);
  const projectLabels = getProjectLabels(projectId);
  const selectedPropertyName = watch("config.property_name");
  const selectedPropertyChangeType = watch("config.change_type");

  const stateConfig: TChangePropertyConfiguration = useMemo(
    () => ({
      supported_change_types: [EAutomationChangeType.UPDATE],
      component_type: EConfigurationComponentType.SINGLE_SELECT,
      options:
        projectStates?.map((state) => ({
          value: state.id,
          query: state.name,
          content: state.name,
        })) ?? [],
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
                <>
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={memberDetails?.member?.display_name}
                      src={getFileURL(memberDetails?.member?.avatar_url ?? "")}
                      showTooltip={false}
                    />
                    {memberDetails?.member?.display_name}
                  </div>
                </>
              ),
            };
          })
          .filter((o) => o !== undefined) ?? [],
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
    }),
    [projectLabels]
  );

  const startDateConfig: TChangePropertyConfiguration = useMemo(
    () => ({
      supported_change_types: [EAutomationChangeType.UPDATE],
      component_type: EConfigurationComponentType.DATE_PICKER,
      minDate: new Date(),
    }),
    []
  );

  const dueDateConfig: TChangePropertyConfiguration = useMemo(
    () => ({
      supported_change_types: [EAutomationChangeType.UPDATE],
      component_type: EConfigurationComponentType.DATE_PICKER,
      minDate: new Date(),
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

  const selectedPropertyConfig = useMemo(
    () => selectedPropertyName && configurationMap[selectedPropertyName],
    [selectedPropertyName, configurationMap]
  );

  const handlePropertyNameChange = (property: EAutomationChangePropertyType) => {
    const config = configurationMap[property];
    // Set the first supported change type as default
    setValue("config.change_type", config.supported_change_types[0]);
    // Reset property value
    setValue("config.property_value", []);
  };

  const handleChangeTypeChange = (_changeType: EAutomationChangeType) => {
    // Reset property value when change type changes
    setValue("config.property_value", []);
  };

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-6 gap-2">
        <div
          className={cn("col-span-4 transition-all duration-200 ease-in-out", {
            "col-span-6": !selectedPropertyName,
          })}
        >
          <PropertyNameSelect isDisabled={isDisabled} onPropertyChange={handlePropertyNameChange} />
        </div>
        {selectedPropertyName && (
          <>
            <div className="col-span-2">
              <ChangeTypeSelect
                isDisabled={isDisabled}
                supportedChangeTypes={selectedPropertyConfig?.supported_change_types || []}
                onChangeTypeChange={handleChangeTypeChange}
              />
            </div>
            <div className="col-span-6">
              <PropertyValueSelect
                isDisabled={isDisabled}
                propertyName={selectedPropertyName}
                changeType={selectedPropertyChangeType}
                configuration={selectedPropertyConfig}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
});
