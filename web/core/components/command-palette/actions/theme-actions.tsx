"use client";

import React, { FC, useEffect, useState } from "react";
import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import { Settings } from "lucide-react";
// plane imports
import { THEME_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/ui";
// hooks
import { useUserProfile } from "@/hooks/store";

type Props = {
  closePalette: () => void;
};

export const CommandPaletteThemeActions: FC<Props> = observer((props) => {
  const { closePalette } = props;
  const { setTheme } = useTheme();
  // hooks
  const { updateUserTheme } = useUserProfile();
  const { t } = useTranslation();
  // states
  const [mounted, setMounted] = useState(false);

  const updateTheme = async (newTheme: string) => {
    setTheme(newTheme);
    return updateUserTheme({ theme: newTheme }).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Failed to save user theme settings!",
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
      {THEME_OPTIONS.map((theme) => (
        <Command.Item
          key={theme.value}
          onSelect={() => {
            updateTheme(theme.value);
            closePalette();
          }}
          className="focus:outline-none"
        >
          <div className="flex items-center gap-2 text-custom-text-200">
            <Settings className="h-4 w-4 text-custom-text-200" />
            {t(theme.i18n_label)}
          </div>
        </Command.Item>
      ))}
    </>
  );
});
