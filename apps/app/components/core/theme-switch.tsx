import { useState, useEffect, Dispatch, SetStateAction } from "react";

import { useTheme } from "next-themes";

// constants
import { THEMES_OBJ } from "constants/themes";
// ui
import { CustomSelect } from "components/ui";
// helper
import { applyTheme } from "helpers/theme.helper";
// types
import { ICustomTheme, IUser } from "types";

type Props = {
  user: IUser | undefined;
  setPreLoadedData: Dispatch<SetStateAction<ICustomTheme | null>>;
  customThemeSelectorOptions: boolean;
  setCustomThemeSelectorOptions: Dispatch<SetStateAction<boolean>>;
};

export const ThemeSwitch: React.FC<Props> = ({
  user,
  setPreLoadedData,
  customThemeSelectorOptions,
  setCustomThemeSelectorOptions,
}) => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <CustomSelect
        value={theme}
        label={theme ? THEMES_OBJ.find((t) => t.value === theme)?.label : "Select your theme"}
        onChange={({ value, type }: { value: string; type: string }) => {
          if (value === "custom") {
            if (user?.theme) {
              setPreLoadedData(user?.theme);
              applyTheme(user?.theme.palette, user?.theme.darkPalette);
              setTheme("custom");
            }
            if (!customThemeSelectorOptions) setCustomThemeSelectorOptions(true);
          } else {
            if (customThemeSelectorOptions) setCustomThemeSelectorOptions(false);
            const cssVars = [
              "--color-bg-base",
              "--color-bg-surface-1",
              "--color-bg-surface-2",

              "--color-border",
              "--color-bg-sidebar",
              "--color-accent",

              "--color-text-base",
              "--color-text-secondary",
            ];
            cssVars.forEach((cssVar) => document.documentElement.style.removeProperty(cssVar));
            setTheme(value);
          }
          document.documentElement.style.setProperty("color-scheme", type);
        }}
        input
        width="w-full"
        position="right"
      >
        {THEMES_OBJ.map(({ value, label, type }) => (
          <CustomSelect.Option key={value} value={{ value, type }}>
            {label}
          </CustomSelect.Option>
        ))}
      </CustomSelect>
    </>
  );
};
