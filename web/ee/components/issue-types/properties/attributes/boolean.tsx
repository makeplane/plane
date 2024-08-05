import { observer } from "mobx-react";
// plane web components
import { PropertySettingsConfiguration, BooleanInput } from "@/plane-web/components/issue-types";
// plane web constants
import { ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS } from "@/plane-web/constants/issue-properties";
// plane web hooks
import { useIssueType } from "@/plane-web/hooks/store";
// plane web types
import { EIssuePropertyType, TIssueProperty, TOperationMode } from "@/plane-web/types";

type TBooleanAttributesProps = {
  issueTypeId: string;
  booleanPropertyDetail: Partial<TIssueProperty<EIssuePropertyType.BOOLEAN>>;
  currentOperationMode: TOperationMode;
  onBooleanDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType.BOOLEAN>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType.BOOLEAN>[K],
    shouldSync?: boolean
  ) => void;
};

export const BooleanAttributes = observer((props: TBooleanAttributesProps) => {
  const { issueTypeId, booleanPropertyDetail, currentOperationMode, onBooleanDetailChange } = props;
  // store hooks
  const issueType = useIssueType(issueTypeId);
  // derived values
  const isAnyIssueAttached = issueType?.issue_exists;

  return (
    <>
      {ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS?.BOOLEAN?.length && (
        <div className="pb-4">
          {ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS?.BOOLEAN?.map((configurations, index) => (
            <PropertySettingsConfiguration
              key={index}
              settings={booleanPropertyDetail.settings}
              settingsConfigurations={configurations}
              onChange={(value) =>
                onBooleanDetailChange("settings", value as TIssueProperty<EIssuePropertyType.BOOLEAN>["settings"])
              }
              isDisabled={!configurations.allowedEditingModes.includes(currentOperationMode) && isAnyIssueAttached}
            />
          ))}
        </div>
      )}
      <div className="flex gap-6">
        <div className="text-xs font-medium text-custom-text-300">Default • Optional</div>
        <BooleanInput
          value={booleanPropertyDetail.default_value ?? []}
          onBooleanValueChange={async (value) => onBooleanDetailChange("default_value", value)}
          isDisabled={!!booleanPropertyDetail.is_required}
        />
      </div>
    </>
  );
});
