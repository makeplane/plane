import { useState, useEffect, ChangeEvent } from "react";
import { useTheme } from "next-themes";
import { THEMES_OBJ } from "constants/themes";
import { CustomSelect } from "components/ui";
import { CustomThemeModal } from "./custom-theme-modal";

export const ThemeSwitch = () => {
  const [mounted, setMounted] = useState(false);
  const [customThemeModal, setCustomThemeModal] = useState(false);
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
            if (!customThemeModal) setCustomThemeModal(true);
          } else {
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
          }
          document.documentElement.style.setProperty("color-scheme", type);
          setTheme(value);
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
      {/* <CustomThemeModal isOpen={customThemeModal} handleClose={() => setCustomThemeModal(false)} /> */}
    </>
  );
};
