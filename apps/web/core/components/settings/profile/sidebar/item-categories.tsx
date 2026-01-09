import type React from "react";
import type { LucideIcon } from "lucide-react";
import { Activity, Bell, CircleUser, KeyRound, LockIcon, Settings2 } from "lucide-react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
// plane imports
import { GROUPED_PROFILE_SETTINGS, PROFILE_SETTINGS_CATEGORIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { ISvgIcons } from "@plane/propel/icons";
import type { TProfileSettingsTabs } from "@plane/types";
// local imports
import { SettingsSidebarItem } from "../../sidebar/item";
import { ProfileSettingsSidebarWorkspaceOptions } from "./workspace-options";

const ICONS: Record<TProfileSettingsTabs, LucideIcon | React.FC<ISvgIcons>> = {
  general: CircleUser,
  security: LockIcon,
  activity: Activity,
  preferences: Settings2,
  notifications: Bell,
  "api-tokens": KeyRound,
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
            <div className="p-2 text-caption-md-medium text-tertiary capitalize">{t(category)}</div>
            <div className="flex flex-col">
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
            </div>
          </div>
        );
      })}
      {profileTabId && <ProfileSettingsSidebarWorkspaceOptions />}
    </div>
  );
});
