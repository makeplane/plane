import { useState, useEffect, ChangeEvent } from "react";
import { useTheme } from "next-themes";
import { THEMES } from "constants/themes";
import { CustomSelect } from "components/ui";

export const ThemeSwitch = () => {
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
    <CustomSelect
      value={theme}
      label={theme ? theme : "Select your theme"}
      onChange={(value: string) => {
        setTheme(value);
      }}
      input
      width="w-full"
      position="right"
    >
      {THEMES.map((themeName) => (
        <CustomSelect.Option key={themeName} value={themeName}>
          {themeName}
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
};
