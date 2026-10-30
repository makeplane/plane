/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type React from "react";
import type { IconGlyph } from "@makeplane/propel/components/icon";
import { KeyOutline, LockOutline, SettingsOutline, SubscribeOutline, UserOutline } from "@makeplane/propel/icons";
import { observer } from "mobx-react";
import { useParams } from "react-router";
// plane imports
import { List } from "@makeplane/propel/components/list";
import {
  GROUPED_PROFILE_SETTINGS,
  PROFILE_SETTINGS_CATEGORIES,
  PROFILE_SETTINGS_CATEGORY_LABELS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { ISvgIcons } from "@plane/blocks/icons";
import type { TProfileSettingsTabs } from "@plane/types";
// local imports
import { SettingsSidebarItem } from "../../sidebar/item";
import { SettingsSidebarSectionHeading } from "../../sidebar/section-heading";
import { ProfileSettingsSidebarWorkspaceOptions } from "./workspace-options";

const ICONS: Record<TProfileSettingsTabs, IconGlyph | React.FC<ISvgIcons>> = {
  general: UserOutline,
  security: LockOutline,
  preferences: SettingsOutline,
  notifications: SubscribeOutline,
  "api-tokens": KeyOutline,
};

type Props = {
  activeTab: TProfileSettingsTabs;
  updateActiveTab: (tab: TProfileSettingsTabs) => void;
};

export const ProfileSettingsSidebarItemCategories = observer(function ProfileSettingsSidebarItemCategories(
  props: Props
) {
  const { activeTab, updateActiveTab } = props;
  // params
  const { profileTabId } = useParams();
  // translation
  const { t } = useTranslation();

  return (
    <div className="mt-4 flex flex-col gap-y-4">
      {PROFILE_SETTINGS_CATEGORIES.map((category) => {
        const categoryItems = GROUPED_PROFILE_SETTINGS[category];

        if (categoryItems.length === 0) return null;

        return (
          <div key={category} className="shrink-0">
            <SettingsSidebarSectionHeading>
              {t(PROFILE_SETTINGS_CATEGORY_LABELS[category])}
            </SettingsSidebarSectionHeading>
            <List gap="px" role="toolbar" aria-label={t(PROFILE_SETTINGS_CATEGORY_LABELS[category])}>
              {categoryItems.map((item) => (
                <SettingsSidebarItem
                  key={item.key}
                  as="button"
                  onClick={() => updateActiveTab(item.key)}
                  isActive={activeTab === item.key}
                  icon={ICONS[item.key]}
                  label={t(item.i18n_label)}
                />
              ))}
            </List>
          </div>
        );
      })}
      {profileTabId && <ProfileSettingsSidebarWorkspaceOptions />}
    </div>
  );
});
