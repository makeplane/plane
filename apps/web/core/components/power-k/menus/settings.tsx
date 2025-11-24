import React from "react";
import { observer } from "mobx-react";
// local imports
import { PowerKMenuBuilder } from "./builder";

type TSettingItem = {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
};

type Props = {
  settings: TSettingItem[];
  onSelect: (setting: TSettingItem) => void;
};

export const PowerKSettingsMenu = observer(function PowerKSettingsMenu({ settings, onSelect }: Props) {
  return (
    <PowerKMenuBuilder
      items={settings}
      getKey={(setting) => setting.key}
      getIcon={(setting) => setting.icon}
      getValue={(setting) => setting.label}
      getLabel={(setting) => setting.label}
      onSelect={onSelect}
      emptyText="No settings found"
    />
  );
});
