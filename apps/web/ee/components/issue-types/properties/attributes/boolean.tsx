import { observer } from "mobx-react";
// plane imports
import { ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EIssuePropertyType, TIssueProperty, TOperationMode } from "@plane/types";
// local imports
import { BooleanInput } from "../../values/components/boolean-input";
import { PropertySettingsConfiguration } from "./common/property-settings-configuration";

type TBooleanAttributesProps = {
  booleanPropertyDetail: Partial<TIssueProperty<EIssuePropertyType.BOOLEAN>>;
  currentOperationMode: TOperationMode;
  onBooleanDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType.BOOLEAN>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType.BOOLEAN>[K],
    shouldSync?: boolean
  ) => void;
  isUpdateAllowed: boolean;
};

export const BooleanAttributes = observer((props: TBooleanAttributesProps) => {
  const { booleanPropertyDetail, currentOperationMode, onBooleanDetailChange, isUpdateAllowed } = props;
  // plane hooks
  const { t } = useTranslation();

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
              isDisabled={!configurations.allowedEditingModes.includes(currentOperationMode) && !isUpdateAllowed}
            />
          ))}
        </div>
      )}
      <div className="flex flex-col gap-3">
        <div className="text-xs font-medium text-custom-text-300">
          {t("common.default")} <span className="font-normal italic">({t("common.optional")})</span>
        </div>
        <div className="flex items-center gap-2">
          <BooleanInput
            value={booleanPropertyDetail.default_value ?? []}
            onBooleanValueChange={async (value) => onBooleanDetailChange("default_value", value)}
            isDisabled={!!booleanPropertyDetail.is_required}
          />
          <div className="text-xs font-medium text-custom-text-200">
            {booleanPropertyDetail.default_value?.[0] !== undefined
              ? `${booleanPropertyDetail.default_value?.[0] === "true" ? t("common.true") : t("common.false")}`
              : t("work_item_types.settings.properties.attributes.boolean.no_default")}
          </div>
        </div>
      </div>
    </>
  );
});
