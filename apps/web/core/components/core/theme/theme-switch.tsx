import type { FC } from "react";
// plane imports
import type { I_THEME_OPTION } from "@plane/constants";
import { THEME_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// constants
import { CustomSelect } from "@plane/ui";
// ui

type Props = {
  value: I_THEME_OPTION | null;
  onChange: (value: I_THEME_OPTION) => void;
};

export function ThemeSwitch(props: Props) {
  const { value, onChange } = props;
  // translation
  const { t } = useTranslation();

  return (
    <CustomSelect
      value={value}
      label={
        value ? (
          <div className="flex items-center gap-2">
            <div
              className="border-1 relative flex h-4 w-4 rotate-45 transform items-center justify-center rounded-full"
              style={{
                borderColor: value.icon.border,
              }}
            >
              <div
                className="h-full w-1/2 rounded-l-full"
                style={{
                  background: value.icon.color1,
                }}
              />
              <div
                className="h-full w-1/2 rounded-r-full border-l"
                style={{
                  borderLeftColor: value.icon.border,
                  background: value.icon.color2,
                }}
              />
            </div>
            {t(value.key)}
          </div>
        ) : (
          t("select_your_theme")
        )
      }
      onChange={onChange}
      buttonClassName="border border-subtle-1"
      placement="bottom-end"
      input
    >
      {THEME_OPTIONS.map((themeOption) => (
        <CustomSelect.Option key={themeOption.value} value={themeOption}>
          <div className="flex items-center gap-2">
            <div
              className="border-1 relative flex h-4 w-4 rotate-45 transform items-center justify-center rounded-full border"
              style={{
                borderColor: themeOption.icon.border,
              }}
            >
              <div
                className="h-full w-1/2 rounded-l-full"
                style={{
                  background: themeOption.icon.color1,
                }}
              />
              <div
                className="h-full w-1/2 rounded-r-full border-l"
                style={{
                  borderLeftColor: themeOption.icon.border,
                  background: themeOption.icon.color2,
                }}
              />
            </div>
            {t(themeOption.key)}
          </div>
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
}
