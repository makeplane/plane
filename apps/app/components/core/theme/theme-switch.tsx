import { useState, useEffect, Dispatch, SetStateAction } from "react";

import { useTheme } from "next-themes";

// constants
import { THEMES_OBJ } from "constants/themes";
// ui
import { CustomSelect } from "components/ui";
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

  const currentThemeObj = THEMES_OBJ.find((t) => t.value === theme);

  return (
    <>
      <CustomSelect
        value={theme}
        label={
          currentThemeObj ? (
            <div className="flex items-center gap-2">
              <div
                className="border-1 relative flex h-4 w-4 rotate-45 transform items-center justify-center rounded-full border"
                style={{
                  borderColor: currentThemeObj.icon.border,
                }}
              >
                <div
                  className="h-full w-1/2 rounded-l-full"
                  style={{
                    background: currentThemeObj.icon.color1,
                  }}
                />
                <div
                  className="h-full w-1/2 rounded-r-full border-l"
                  style={{
                    borderLeftColor: currentThemeObj.icon.border,
                    background: currentThemeObj.icon.color2,
                  }}
                />
              </div>
              {currentThemeObj.label}
            </div>
          ) : (
            "Select your theme"
          )
        }
        onChange={({ value, type }: { value: string; type: string }) => {
          if (value === "custom") {
            if (user?.theme.palette) setPreLoadedData(user.theme);

            if (!customThemeSelectorOptions) setCustomThemeSelectorOptions(true);
          } else {
            if (customThemeSelectorOptions) setCustomThemeSelectorOptions(false);

            for (let i = 10; i <= 900; i >= 100 ? (i += 100) : (i += 10)) {
              document.documentElement.style.removeProperty(`--color-background-${i}`);
              document.documentElement.style.removeProperty(`--color-text-${i}`);
              document.documentElement.style.removeProperty(`--color-primary-${i}`);
              document.documentElement.style.removeProperty(`--color-sidebar-background-${i}`);
              document.documentElement.style.removeProperty(`--color-sidebar-text-${i}`);
            }
          }
          setTheme(value);
          document.documentElement.style.setProperty("color-scheme", type);
        }}
        input
        width="w-full"
        position="right"
      >
        {THEMES_OBJ.map(({ value, label, type, icon }) => (
          <CustomSelect.Option key={value} value={{ value, type }}>
            <div className="flex items-center gap-2">
              <div
                className="border-1 relative flex h-4 w-4 rotate-45 transform items-center justify-center rounded-full border"
                style={{
                  borderColor: icon.border,
                }}
              >
                <div
                  className="h-full w-1/2 rounded-l-full"
                  style={{
                    background: icon.color1,
                  }}
                />
                <div
                  className="h-full w-1/2 rounded-r-full border-l"
                  style={{
                    borderLeftColor: icon.border,
                    background: icon.color2,
                  }}
                />
              </div>
              {label}
            </div>
          </CustomSelect.Option>
        ))}
      </CustomSelect>
    </>
  );
};
