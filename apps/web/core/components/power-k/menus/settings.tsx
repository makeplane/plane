"use client";

import React from "react";
import { observer } from "mobx-react";
// local imports
import { PowerKMenuBuilder } from "./builder";

type TSettingItem = {
  key: string;
  i18n_label: string;
  href: string;
};

type Props = {
  settings: TSettingItem[];
  onSelect: (setting: TSettingItem) => void;
};

export const PowerKSettingsMenu: React.FC<Props> = observer(({ settings, onSelect }) => (
  <PowerKMenuBuilder
    heading="Settings"
    items={settings}
    getKey={(setting) => setting.key}
    getValue={(setting) => setting.i18n_label}
    getLabel={(setting) => setting.i18n_label}
    onSelect={onSelect}
    emptyText="No settings found"
  />
));
