import React, { FC, useEffect, useState } from "react";
import { Command } from "cmdk";
import { useTheme } from "next-themes";
import { Settings } from "lucide-react";
import { observer } from "mobx-react-lite";
// hooks
import { useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// constants
import { THEME_OPTIONS } from "constants/themes";

type Props = {
  closePalette: () => void;
};

export const CommandPaletteThemeActions: FC<Props> = observer((props) => {
  const { closePalette } = props;
  // states
  const [mounted, setMounted] = useState(false);
  // store
  const { updateCurrentUserTheme } = useUser();
  // hooks
  const { setTheme } = useTheme();
  const { setToastAlert } = useToast();

  const updateUserTheme = async (newTheme: string) => {
    setTheme(newTheme);

    return updateCurrentUserTheme(newTheme).catch(() => {
      setToastAlert({
        title: "Failed to save user theme settings!",
        type: "error",
      });
    });
  };

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {THEME_OPTIONS.filter((t) => t.value !== "custom").map((theme) => (
        <Command.Item
          key={theme.value}
          onSelect={() => {
            updateUserTheme(theme.value);
            closePalette();
          }}
          className="focus:outline-none"
        >
          <div className="flex items-center gap-2 text-custom-text-200">
            <Settings className="h-4 w-4 text-custom-text-200" />
            {theme.label}
          </div>
        </Command.Item>
      ))}
    </>
  );
});
