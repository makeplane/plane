/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { SelectField } from "@makeplane/propel/components/select-field";
import { SUPPORTED_LANGUAGES, useTranslation } from "@plane/i18n";
import { setToast } from "@plane/blocks/toast";
// components
import { TimezoneSelect } from "@/components/global/timezone-select";
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

    return (
      <div className="flex flex-col gap-y-1">
        <SettingsControlItem
          title={t("timezone")}
          description={t("timezone_setting")}
          control={
            <TimezoneSelect
              value={user?.user_timezone || "Asia/Kolkata"}
              onChange={handleTimezoneChange}
              label={t("timezone")}
              size="md"
              width="fit"
              className="max-w-64"
            />
          }
        />
        <SettingsControlItem
          title={t("language")}
          description={t("language_setting")}
          control={
            <SelectField<string>
              aria-label={t("language")}
              size="md"
              width="fit"
              options={SUPPORTED_LANGUAGES}
              value={profile?.language ?? null}
              onValueChange={(value) => {
                if (value !== null) void handleLanguageChange(value);
              }}
              placeholder="Select a language"
            />
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
