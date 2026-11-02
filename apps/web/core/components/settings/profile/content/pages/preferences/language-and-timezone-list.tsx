/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { SUPPORTED_LANGUAGES, useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { CustomSelect } from "@plane/ui";
// components
import { TimezoneSelect } from "@/components/global";
import { StartOfWeekPreference } from "@/components/profile/start-of-week-preference";
import { SettingsControlItem } from "@/components/settings/control-item";
// hooks
import { useUser, useUserProfile } from "@/hooks/store/user";

export const ProfileSettingsLanguageAndTimezonePreferencesList = observer(
  function ProfileSettingsLanguageAndTimezonePreferencesList() {
    // store hooks
    const {
      data: user,
      updateCurrentUser,
      userProfile: { data: profile },
    } = useUser();
    const { updateUserProfile } = useUserProfile();
    // translation
    const { t } = useTranslation();

    const handleTimezoneChange = async (value: string) => {
      try {
        await updateCurrentUser({ user_timezone: value });
        setToast({
          title: t("toast.success"),
          message: t("account_settings.preferences.toasts.timezone_updated"),
          type: TOAST_TYPE.SUCCESS,
        });
      } catch (_error) {
        setToast({
          title: t("toast.error"),
          message: t("account_settings.preferences.toasts.timezone_update_failed"),
          type: TOAST_TYPE.ERROR,
        });
      }
    };

    const handleLanguageChange = async (value: string) => {
      try {
        await updateUserProfile({ language: value });
        setToast({
          title: t("toast.success"),
          message: t("account_settings.preferences.toasts.language_updated"),
          type: TOAST_TYPE.SUCCESS,
        });
      } catch (_error) {
        setToast({
          title: t("toast.error"),
          message: t("account_settings.preferences.toasts.language_update_failed"),
          type: TOAST_TYPE.ERROR,
        });
      }
    };

    const getLanguageLabel = (value: string) => {
      const selectedLanguage = SUPPORTED_LANGUAGES.find((l) => l.value === value);
      if (!selectedLanguage) return value;
      return selectedLanguage.label;
    };

    return (
      <div className="flex flex-col gap-y-1">
        <SettingsControlItem
          title={t("timezone")}
          description={t("timezone_setting")}
          control={<TimezoneSelect value={user?.user_timezone || "Asia/Kolkata"} onChange={handleTimezoneChange} />}
        />
        <SettingsControlItem
          title={t("language")}
          description={t("language_setting")}
          control={
            <CustomSelect
              value={profile?.language}
              label={
                profile?.language
                  ? getLanguageLabel(profile?.language)
                  : t("account_settings.preferences.select_a_language")
              }
              onChange={handleLanguageChange}
              buttonClassName="border border-subtle-1"
              className="rounded-md"
              input
              placement="bottom-end"
            >
              {SUPPORTED_LANGUAGES.map((item) => (
                <CustomSelect.Option key={item.value} value={item.value}>
                  {item.label}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          }
        />
        <StartOfWeekPreference
          option={{
            title: t("account_settings.preferences.start_of_week.title"),
            description: t("account_settings.preferences.start_of_week.description"),
          }}
        />
      </div>
    );
  }
);
