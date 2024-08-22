import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// ui
import { TextArea } from "@plane/ui";
// plane web components
import { PropertySettingsConfiguration } from "@/plane-web/components/issue-types/properties";
// plane web constants
import { ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS } from "@/plane-web/constants/issue-properties";
// plane web hooks
import { useIssueType } from "@/plane-web/hooks/store";
// plane web types
import { EIssuePropertyType, TIssueProperty, TOperationMode } from "@/plane-web/types";

type TTextAttributesProps = {
  issueTypeId: string;
  textPropertyDetail: Partial<TIssueProperty<EIssuePropertyType.TEXT>>;
  currentOperationMode: TOperationMode;
  onTextDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType.TEXT>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType.TEXT>[K],
    shouldSync?: boolean
  ) => void;
};

export const TextAttributes = observer((props: TTextAttributesProps) => {
  const { issueTypeId, textPropertyDetail, currentOperationMode, onTextDetailChange } = props;
  const [data, setData] = useState<string[]>([]);
  // store hooks
  const issueType = useIssueType(issueTypeId);
  // derived values
  const isAnyIssueAttached = issueType?.issue_exists;

  useEffect(() => {
    setData(textPropertyDetail.default_value ?? []);
  }, [textPropertyDetail.default_value]);

  const handleReadOnlyFieldChange = () => {
    // trim and filter empty values
    const trimmedValue = data.map((val) => val.trim()).filter((val) => val);
    // update readonly data
    onTextDetailChange("default_value", trimmedValue);
  };

  return (
    <>
      <div className="px-1">
        {ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS?.TEXT?.map((configurations, index) => (
          <PropertySettingsConfiguration
            key={index}
            settings={textPropertyDetail.settings}
            settingsConfigurations={configurations}
            onChange={(value) => {
              onTextDetailChange("settings", value as TIssueProperty<EIssuePropertyType.TEXT>["settings"]);
              onTextDetailChange("default_value", []);
              if (value?.display_format === "readonly") {
                onTextDetailChange("is_required", false);
              }
            }}
            isDisabled={!configurations.allowedEditingModes.includes(currentOperationMode) && isAnyIssueAttached}
          />
        ))}
      </div>
      {textPropertyDetail.settings?.display_format === "readonly" && (
        <div className="pt-4">
          <div className="text-xs font-medium text-custom-text-300">Read only data</div>
          <TextArea
            id="default_value"
            value={data?.[0] ?? ""}
            onChange={(e) => setData([e.target.value])}
            onKeyDown={(e) => e.key === "Enter" && !!data[0] && e.currentTarget.blur()}
            onBlur={() => handleReadOnlyFieldChange()}
            className="w-full max-h-28 resize-none text-sm bg-custom-background-100 border-[0.5px] border-custom-border-300 rounded"
            tabIndex={1}
            textAreaSize="xs"
            autoFocus
          />
        </div>
      )}
    </>
  );
});
