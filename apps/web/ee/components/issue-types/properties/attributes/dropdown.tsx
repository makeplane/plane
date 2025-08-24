import { observer } from "mobx-react";
// plane imports
import { ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EIssuePropertyType, TIssueProperty, TOperationMode } from "@plane/types";
// plane web imports
import { usePropertyOptions } from "@/plane-web/hooks/store";
// local imports
import { TIssuePropertyFormError } from "../property-list-item";
import { PropertyMultiSelect } from "./common/property-multi-select";
import { PropertySettingsConfiguration } from "./common/property-settings-configuration";
import { IssuePropertyOptionsRoot } from "./options";
import { DefaultOptionSelect } from "./options/default-option-select";

type TDropdownAttributesProps = {
  dropdownPropertyDetail: Partial<TIssueProperty<EIssuePropertyType.OPTION>>;
  currentOperationMode: TOperationMode;
  onDropdownDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType.OPTION>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType.OPTION>[K],
    shouldSync?: boolean
  ) => void;
  error?: TIssuePropertyFormError;
  isUpdateAllowed: boolean;
};

export const DropdownAttributes = observer((props: TDropdownAttributesProps) => {
  const { dropdownPropertyDetail, currentOperationMode, onDropdownDetailChange, error, isUpdateAllowed } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { propertyOptions, setPropertyOptions } = usePropertyOptions();
  // derived values
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
          isDisabled={currentOperationMode === "update" && !isUpdateAllowed}
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
              isDisabled={!configurations.allowedEditingModes.includes(currentOperationMode) && !isUpdateAllowed}
            />
          ))}
        </div>
      )}
      <IssuePropertyOptionsRoot customPropertyId={dropdownPropertyDetail.id} error={error?.options} />
      <div>
        <div className="text-xs font-medium text-custom-text-300">
          {t("common.default")} <span className="font-normal italic">({t("common.optional")})</span>
        </div>
        <DefaultOptionSelect isMultiSelect={dropdownPropertyDetail.is_multi} isDisabled={isOptionDefaultDisabled} />
      </div>
    </>
  );
});
