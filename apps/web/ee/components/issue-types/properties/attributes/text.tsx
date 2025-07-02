import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EIssuePropertyType, TIssueProperty, TOperationMode, TTextAttributeDisplayOptions } from "@plane/types";
import { TextArea } from "@plane/ui";
import { getTextAttributeDisplayNameKey } from "@plane/utils";
// plane web components
import { PropertySettingsConfiguration } from "@/plane-web/components/issue-types/properties";

type TTextAttributesProps = {
  textPropertyDetail: Partial<TIssueProperty<EIssuePropertyType.TEXT>>;
  currentOperationMode: TOperationMode;
  onTextDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType.TEXT>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType.TEXT>[K],
    shouldSync?: boolean
  ) => void;
  isUpdateAllowed: boolean;
};

export const TextAttributes = observer((props: TTextAttributesProps) => {
  const { textPropertyDetail, currentOperationMode, onTextDetailChange, isUpdateAllowed } = props;
  // states
  const [data, setData] = useState<string[]>([]);
  // plane hooks
  const { t } = useTranslation();

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
    <div>
      <span className="text-xs text-custom-text-300 font-medium">
        {t("work_item_types.settings.properties.attributes.label")}
      </span>
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
          getLabelDetails={(labelKey) => t(getTextAttributeDisplayNameKey(labelKey as TTextAttributeDisplayOptions))}
          isDisabled={!configurations.allowedEditingModes.includes(currentOperationMode) && !isUpdateAllowed}
        />
      ))}
      {textPropertyDetail.settings?.display_format === "readonly" && (
        <div className="pt-2">
          <div className="text-xs font-medium text-custom-text-300">
            {t("work_item_types.settings.properties.attributes.text.readonly.label")}
          </div>
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
    </div>
  );
});
