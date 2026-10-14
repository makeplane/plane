/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { I_THEME_OPTION } from "@plane/constants";
import { THEME_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Select } from "@plane/blocks/select";

type Props = {
  value: I_THEME_OPTION | null;
  onChange: (value: I_THEME_OPTION) => void;
};

function ThemeOptionIcon({ option }: { option: I_THEME_OPTION }) {
  return (
    <div
      className="relative flex h-4 w-4 rotate-45 transform items-center justify-center rounded-full border"
      style={{
        borderColor: option.icon.border,
      }}
    >
      <div
        className="h-full w-1/2 rounded-l-full"
        style={{
          background: option.icon.color1,
        }}
      />
      <div
        className="h-full w-1/2 rounded-r-full border-l"
        style={{
          borderLeftColor: option.icon.border,
          background: option.icon.color2,
        }}
      />
    </div>
  );
}

export function ThemeSwitch(props: Props) {
  const { value, onChange } = props;
  // translation
  const { t } = useTranslation();

  return (
    <Select<I_THEME_OPTION>
      getValues={() => THEME_OPTIONS}
      value={value}
      onChange={(themeValue) => {
        const themeOption = THEME_OPTIONS.find((option) => option.value === themeValue);
        if (themeOption) onChange(themeOption);
      }}
      getOptionValue={(option) => option.value}
      getOptionLabel={(option) => t(option.key)}
      getOptionIcon={(option) => <ThemeOptionIcon option={option} />}
      contentSizing="anchor"
      showSearch={false}
      pinSelected={false}
      placeholder={t("select_your_theme")}
    >
      <Select.Trigger variant="select-md" className="w-42 max-w-full border-subtle-1">
        <div className="min-w-0 grow">
          {value ? (
            <div className="flex w-full items-center gap-2">
              <ThemeOptionIcon option={value} />
              {t(value.key)}
            </div>
          ) : (
            t("select_your_theme")
          )}
        </div>
      </Select.Trigger>
    </Select>
  );
}
