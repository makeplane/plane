/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { SelectField } from "@makeplane/propel/components/select-field";
import type { I_THEME_OPTION } from "@plane/constants";
import { THEME_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";

type Props = {
  value: I_THEME_OPTION | null;
  onChange: (value: I_THEME_OPTION) => void;
};

function ThemeOptionIcon({ option }: { option: I_THEME_OPTION }) {
  return (
    <div
      aria-hidden
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
    <SelectField<string>
      aria-label={t("theme")}
      size="md"
      width="fit"
      value={value?.value ?? null}
      onValueChange={(themeValue) => {
        const themeOption = THEME_OPTIONS.find((option) => option.value === themeValue);
        if (themeOption) onChange(themeOption);
      }}
      icon={value ? <ThemeOptionIcon option={value} /> : undefined}
      options={THEME_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.key),
        icon: <ThemeOptionIcon option={option} />,
      }))}
      placeholder={t("select_your_theme")}
    />
  );
}
