import { observer } from "mobx-react";
// plane imports
import { EIssuePropertyType, ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS } from "@plane/constants";
import { TDateAttributeDisplayOptions, TIssueProperty, TOperationMode } from "@plane/types";
import { getDateAttributeDisplayName } from "@plane/utils";
// plane web components
import { PropertySettingsConfiguration } from "@/plane-web/components/issue-types/properties";

type TDatePickerAttributesProps = {
  datePickerPropertyDetail: Partial<TIssueProperty<EIssuePropertyType.DATETIME>>;
  currentOperationMode: TOperationMode;
  onDatePickerDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType.DATETIME>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType.DATETIME>[K],
    shouldSync?: boolean
  ) => void;
  isUpdateAllowed: boolean;
};

export const DatePickerAttributes = observer((props: TDatePickerAttributesProps) => {
  const { datePickerPropertyDetail, currentOperationMode, onDatePickerDetailChange, isUpdateAllowed } = props;

  return (
    <>
      {ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS?.DATETIME?.map((configurations, index) => (
        <PropertySettingsConfiguration
          key={index}
          settings={datePickerPropertyDetail.settings}
          settingsConfigurations={configurations}
          onChange={(value) =>
            onDatePickerDetailChange("settings", value as TIssueProperty<EIssuePropertyType.DATETIME>["settings"])
          }
          getLabelDetails={(labelKey) => getDateAttributeDisplayName(labelKey as TDateAttributeDisplayOptions)}
          isDisabled={!configurations.allowedEditingModes.includes(currentOperationMode) && !isUpdateAllowed}
        />
      ))}
    </>
  );
});
