import { get, set } from "lodash";
import { observer } from "mobx-react";
// components
import { EIssuePropertyType } from "@plane/constants";
import { TIssuePropertySettingsMap, TSettingsConfigurations } from "@plane/types";
import { RadioInput } from "@/components/estimates";
// helpers
import { cn } from "@/helpers/common.helper";
// plane imports

type TPropertySettingsConfigurationProps<T extends EIssuePropertyType> = {
  settings: TIssuePropertySettingsMap[T] | undefined;
  settingsConfigurations: TSettingsConfigurations;
  isDisabled?: boolean;
  onChange: (value: TIssuePropertySettingsMap[T]) => void;
  getLabelDetails?: (labelKey: string) => string;
};

export const PropertyRadioInputSelect = observer(
  <T extends EIssuePropertyType>(props: TPropertySettingsConfigurationProps<T>) => {
    const { settings, settingsConfigurations, isDisabled, onChange, getLabelDetails } = props;

    const radioInputOptions = settingsConfigurations.configurations.options.map((option) => ({
      label: getLabelDetails ? getLabelDetails(option.labelKey) : option.labelKey,
      value: option.value,
      disabled: isDisabled,
    }));

    const handleDataChange = (value: string) => {
      const updatedSettings = {
        ...settings,
      };
      set(updatedSettings, settingsConfigurations.keyToUpdate, value);
      onChange(updatedSettings as TIssuePropertySettingsMap[T]);
    };

    const selectedValue = get(settings, settingsConfigurations.keyToUpdate);
    const isVerticalLayout = settingsConfigurations.configurations.verticalLayout;

    return (
      <RadioInput
        selected={selectedValue}
        options={radioInputOptions}
        onChange={handleDataChange}
        className="z-10"
        buttonClassName="size-3"
        fieldClassName={cn("text-sm", {
          "gap-1": !isVerticalLayout,
        })}
        wrapperClassName={cn(isVerticalLayout ? "gap-1.5" : "gap-3")}
        vertical={isVerticalLayout}
      />
    );
  }
);

export const PropertySettingsConfiguration = observer(
  <T extends EIssuePropertyType>(props: TPropertySettingsConfigurationProps<T>) => {
    const { settings, settingsConfigurations, isDisabled, onChange, getLabelDetails } = props;

    switch (settingsConfigurations.configurations.componentToRender) {
      case "radio-input":
        return (
          <PropertyRadioInputSelect
            settings={settings}
            settingsConfigurations={settingsConfigurations}
            onChange={onChange}
            isDisabled={isDisabled}
            getLabelDetails={getLabelDetails}
          />
        );
      default:
        return null;
    }
  }
);
