import { observer } from "mobx-react";
// plane web components
import {
  DefaultOptionSelect,
  IssuePropertyOptionsRoot,
  PropertyMultiSelect,
  PropertySettingsConfiguration,
  TIssuePropertyFormError,
} from "@/plane-web/components/issue-types/properties";
// plane web constants
import { ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS } from "@/plane-web/constants/issue-properties";
// plane web hooks
import { useIssueType, usePropertyOptions } from "@/plane-web/hooks/store";
// plane web types
import { EIssuePropertyType, TIssueProperty, TOperationMode } from "@/plane-web/types";

type TDropdownAttributesProps = {
  issueTypeId: string;
  dropdownPropertyDetail: Partial<TIssueProperty<EIssuePropertyType.OPTION>>;
  currentOperationMode: TOperationMode;
  onDropdownDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType.OPTION>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType.OPTION>[K],
    shouldSync?: boolean
  ) => void;
  error?: TIssuePropertyFormError;
};

export const DropdownAttributes = observer((props: TDropdownAttributesProps) => {
  const { issueTypeId, dropdownPropertyDetail, currentOperationMode, onDropdownDetailChange, error } = props;
  // store hooks
  const issueType = useIssueType(issueTypeId);
  const { setPropertyOptions } = usePropertyOptions();
  // derived values
  const isAnyIssueAttached = issueType?.issue_exists;
  const isOptionDefaultDisabled = dropdownPropertyDetail.is_multi === undefined || !!dropdownPropertyDetail.is_required;
  // helpers
  const resetToSingleSelectDefault = () => {
    const firstDefaultOption = dropdownPropertyDetail.default_value?.[0];
    // Update property options
    setPropertyOptions((prevOptions) => {
      if (!prevOptions) return [];
      return prevOptions.map((option) => ({
        ...option,
        is_default: option.id === firstDefaultOption,
      }));
    });
    // Update default value
    const newDefaultValue = firstDefaultOption ? [firstDefaultOption] : [];
    onDropdownDetailChange("default_value", newDefaultValue);
  };

  return (
    <>
      <div className="px-1">
        <PropertyMultiSelect
          value={dropdownPropertyDetail.is_multi}
          variant="OPTION"
          onChange={(value) => {
            onDropdownDetailChange("is_multi", value);
            if (!value) {
              resetToSingleSelectDefault();
            }
          }}
          isDisabled={currentOperationMode === "update" && isAnyIssueAttached}
        />
      </div>
      {ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS?.OPTION?.length && (
        <div className="pt-4">
          {ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS?.OPTION?.map((configurations, index) => (
            <PropertySettingsConfiguration
              key={index}
              settings={dropdownPropertyDetail.settings}
              settingsConfigurations={configurations}
              onChange={(value) =>
                onDropdownDetailChange("settings", value as TIssueProperty<EIssuePropertyType.OPTION>["settings"])
              }
              isDisabled={!configurations.allowedEditingModes.includes(currentOperationMode) && isAnyIssueAttached}
            />
          ))}
        </div>
      )}
      <IssuePropertyOptionsRoot issuePropertyId={dropdownPropertyDetail.id} error={error?.options} />
      <div className="pt-2 px-1">
        <div className="text-xs font-medium text-custom-text-300">Default • Optional</div>
        <DefaultOptionSelect isMultiSelect={dropdownPropertyDetail.is_multi} isDisabled={isOptionDefaultDisabled} />
      </div>
    </>
  );
});
