"use client";

import { FC } from "react";
// constants
import { CustomSelect } from "@plane/ui";
import { THEME_OPTIONS, I_THEME_OPTION } from "@/constants/themes";
// ui

type Props = {
  value: I_THEME_OPTION | null;
  onChange: (value: I_THEME_OPTION) => void;
};

export const ThemeSwitch: FC<Props> = (props) => {
  const { value, onChange } = props;

  return (
    <CustomSelect
      value={value}
      label={
        value ? (
          <div className="flex items-center gap-2">
            <div
              className="border-1 relative flex h-4 w-4 rotate-45 transform items-center justify-center rounded-full border"
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
            {value.label}
          </div>
        ) : (
          "Select your theme"
        )
      }
      onChange={onChange}
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
            {themeOption.label}
          </div>
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
};
