import { observer } from "mobx-react";
// plane web components
import { PropertySettingsConfiguration } from "@/plane-web/components/issue-types/properties";
// plane web constants
import { ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS } from "@/plane-web/constants/issue-properties";
// plane web hooks
import { useIssueType } from "@/plane-web/hooks/store";
// plane web types
import { EIssuePropertyType, TIssueProperty, TOperationMode } from "@/plane-web/types";

type TDatePickerAttributesProps = {
  issueTypeId: string;
  datePickerPropertyDetail: Partial<TIssueProperty<EIssuePropertyType.DATETIME>>;
  currentOperationMode: TOperationMode;
  onDatePickerDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType.DATETIME>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType.DATETIME>[K],
    shouldSync?: boolean
  ) => void;
};

export const DatePickerAttributes = observer((props: TDatePickerAttributesProps) => {
  const { issueTypeId, datePickerPropertyDetail, currentOperationMode, onDatePickerDetailChange } = props;
  // store hooks
  const issueType = useIssueType(issueTypeId);
  // derived values
  const isAnyIssueAttached = issueType?.issue_exists;

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
          isDisabled={!configurations.allowedEditingModes.includes(currentOperationMode) && isAnyIssueAttached}
        />
      ))}
    </>
  );
});
