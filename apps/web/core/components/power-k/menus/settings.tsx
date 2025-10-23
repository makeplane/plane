"use client";

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

export const PowerKSettingsMenu: React.FC<Props> = observer(({ settings, onSelect }) => (
  <PowerKMenuBuilder
    items={settings}
    getKey={(setting) => setting.key}
    getIcon={(setting) => setting.icon}
    getValue={(setting) => setting.label}
    getLabel={(setting) => setting.label}
    onSelect={onSelect}
    emptyText="No settings found"
  />
));
