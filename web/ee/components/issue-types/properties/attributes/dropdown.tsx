import { observer } from "mobx-react";
// plane imports
import { EIssuePropertyType, ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TIssueProperty, TOperationMode } from "@plane/types";
// plane web components
import {
  DefaultOptionSelect,
  IssuePropertyOptionsRoot,
  PropertyMultiSelect,
  PropertySettingsConfiguration,
  TIssuePropertyFormError,
} from "@/plane-web/components/issue-types/properties";
// plane web hooks
import { useIssueType, usePropertyOptions } from "@/plane-web/hooks/store";

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
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const issueType = useIssueType(issueTypeId);
  const { propertyOptions, setPropertyOptions } = usePropertyOptions();
  // derived values
  const isAnyIssueAttached = issueType?.issue_exists;
  const isOptionDefaultDisabled = dropdownPropertyDetail.is_multi === undefined || !!dropdownPropertyDetail.is_required;
  // helpers
  const resetToSingleSelectDefault = () => {
    const firstDefaultOption = propertyOptions?.find((option) => option.is_default);
    const firstDefaultOptionIdentifier = firstDefaultOption?.id ?? firstDefaultOption?.key;
    // Update property options
    setPropertyOptions((prevOptions) => {
      if (!prevOptions) return [];
      return prevOptions.map((option) => ({
        ...option,
        is_default:
          !!firstDefaultOptionIdentifier &&
          (option.id === firstDefaultOptionIdentifier || option.key === firstDefaultOptionIdentifier),
      }));
    });
    // Update default value
    const newDefaultValue = firstDefaultOptionIdentifier ? [firstDefaultOptionIdentifier] : [];
    onDropdownDetailChange("default_value", newDefaultValue);
  };

  return (
    <>
      <div>
        <span className="text-xs text-custom-text-300 font-medium">
          {t("work_item_types.settings.properties.attributes.label")}
        </span>
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
        <div>
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
      <div>
        <div className="text-xs font-medium text-custom-text-300">
          {t("common.default")} <span className="font-normal italic">({t("common.optional")})</span>
        </div>
        <DefaultOptionSelect isMultiSelect={dropdownPropertyDetail.is_multi} isDisabled={isOptionDefaultDisabled} />
      </div>
    </>
  );
});
