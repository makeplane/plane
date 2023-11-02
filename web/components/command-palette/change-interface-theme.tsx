import React, { FC, Dispatch, SetStateAction, useEffect, useState } from "react";
import { Command } from "cmdk";
import { useTheme } from "next-themes";
import { Settings } from "lucide-react";
import { observer } from "mobx-react-lite";
// hooks
import useToast from "hooks/use-toast";
import { useMobxStore } from "lib/mobx/store-provider";
// constants
import { THEME_OPTIONS } from "constants/themes";

type Props = {
  setIsPaletteOpen: Dispatch<SetStateAction<boolean>>;
};

export const ChangeInterfaceTheme: FC<Props> = observer((props) => {
  const { setIsPaletteOpen } = props;
  // store
  const { user: userStore } = useMobxStore();
  // states
  const [mounted, setMounted] = useState(false);
  // hooks
  const { setTheme } = useTheme();
  const { setToastAlert } = useToast();

  const updateUserTheme = (newTheme: string) => {
    setTheme(newTheme);
    return userStore.updateCurrentUserTheme(newTheme).catch(() => {
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
            setIsPaletteOpen(false);
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
