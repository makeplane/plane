import React, { Dispatch, SetStateAction, useEffect, useState } from "react";

// cmdk
import { Command } from "cmdk";
import { THEMES_OBJ } from "constants/themes";
import { useTheme } from "next-themes";
import { SettingIcon } from "components/icons";

type Props = {
  setIsPaletteOpen: Dispatch<SetStateAction<boolean>>;
};

export const ChangeInterfaceTheme: React.FC<Props> = ({ setIsPaletteOpen }) => {
  const [mounted, setMounted] = useState(false);
  const { setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {THEMES_OBJ.map((theme) => (
        <Command.Item
          key={theme.value}
          onSelect={() => {
            setTheme(theme.value);
            setIsPaletteOpen(false);
          }}
          className="focus:outline-none"
        >
          <div className="flex items-center gap-2 text-custom-text-200">
            <SettingIcon className="h-4 w-4 text-custom-text-200" />
            {theme.label}
          </div>
        </Command.Item>
      ))}
    </>
  );
};
