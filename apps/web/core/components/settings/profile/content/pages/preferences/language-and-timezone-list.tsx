/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { SUPPORTED_LANGUAGES, useTranslation } from "@plane/i18n";
import { Select } from "@plane/blocks/select";
import { setToast } from "@plane/blocks/toast";
// components
import { TimezoneSelect } from "@/components/global";
import { StartOfWeekPreference } from "@/components/profile/start-of-week-preference";
import { SettingsControlItem } from "@/components/settings/control-item";
// hooks
import { useUser, useUserProfile } from "@/hooks/store/user";

/** A supported UI language, in the shape the `Select` renders. */
type LanguageOption = { value: string; label: string };

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
          title: "Success!",
          message: "Timezone updated successfully",
          type: "success",
        });
      } catch (_error) {
        setToast({
          title: "Error!",
          message: "Failed to update timezone",
          type: "error",
        });
      }
    };

    const handleLanguageChange = async (value: string) => {
      try {
        await updateUserProfile({ language: value });
        setToast({
          title: "Success!",
          message: "Language updated successfully",
          type: "success",
        });
      } catch (_error) {
        setToast({
          title: "Error!",
          message: "Failed to update language",
          type: "error",
        });
      }
    };

    const getLanguageLabel = (value: string) => {
      const selectedLanguage = SUPPORTED_LANGUAGES.find((l) => l.value === value);
      if (!selectedLanguage) return value;
      return selectedLanguage.label;
    };

    const languageOptions: LanguageOption[] = SUPPORTED_LANGUAGES.map((item) => ({
      value: item.value,
      label: item.label,
    }));
    const selectedLanguageOption = languageOptions.find((option) => option.value === profile?.language) ?? null;

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
            <Select<LanguageOption>
              getValues={() => languageOptions}
              value={selectedLanguageOption}
              onChange={(value) => void handleLanguageChange(value)}
              getOptionValue={(option) => option.value}
              getOptionLabel={(option) => option.label}
              placeholder="Select a language"
              showSearch={false}
              pinSelected={false}
              contentSizing="anchor"
            >
              <Select.Trigger<LanguageOption> variant="select-md" className="w-42 max-w-full">
                <span className="min-w-0 grow truncate text-left">
                  {profile?.language ? getLanguageLabel(profile.language) : "Select a language"}
                </span>
              </Select.Trigger>
            </Select>
          }
        />
        <StartOfWeekPreference
          option={{
            title: "First day of the week",
            description: "This will change how all calendars in your app look.",
          }}
        />
      </div>
    );
  }
);
