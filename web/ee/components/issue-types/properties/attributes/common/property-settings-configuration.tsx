import { get, set } from "lodash";
// components
import { RadioInput } from "@/components/estimates";
// plane web constants
import { EIssuePropertyType, TIssuePropertySettingsMap, TSettingsConfigurations } from "@/plane-web/types";

type TPropertySettingsConfigurationProps<T extends EIssuePropertyType> = {
  settings: TIssuePropertySettingsMap[T] | undefined;
  settingsConfigurations: TSettingsConfigurations;
  isDisabled?: boolean;
  onChange: (value: TIssuePropertySettingsMap[T]) => void;
};

export const PropertyRadioInputSelect = <T extends EIssuePropertyType>(
  props: TPropertySettingsConfigurationProps<T>
) => {
  const { settings, settingsConfigurations, isDisabled, onChange } = props;

  const radioInputOptions = settingsConfigurations.configurations.options.map((option) => ({
    label: option.label,
    value: option.value,
    disabled: isDisabled,
  }));

  const handleDataChange = (value: string) => {
    const updatedSettings = {
      ...settings,
    };
    set(updatedSettings, settingsConfigurations.keyToUpdate, value);
    onChange(updatedSettings as TIssuePropertySettingsMap[T]); // TODO: Fix this
  };

  const selectedValue = get(settings, settingsConfigurations.keyToUpdate);

  return (
    <RadioInput
      selected={selectedValue}
      options={radioInputOptions}
      onChange={handleDataChange}
      className="z-50"
      buttonClassName="size-3"
      fieldClassName="text-sm"
      wrapperClassName="gap-1"
      vertical
    />
  );
};

export const PropertySettingsConfiguration = <T extends EIssuePropertyType>(
  props: TPropertySettingsConfigurationProps<T>
) => {
  const { settings, settingsConfigurations, isDisabled, onChange } = props;

  switch (settingsConfigurations.configurations.componentToRender) {
    case "radio-input":
      return (
        <PropertyRadioInputSelect
          settings={settings}
          settingsConfigurations={settingsConfigurations}
          onChange={onChange}
          isDisabled={isDisabled}
        />
      );
    default:
      return null;
  }
};
