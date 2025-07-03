"use client";

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
// components
import { LogoSpinner } from "@/components/common";
import { PageHead } from "@/components/core";
import { PreferencesList } from "@/components/preferences/list";
import { ProfileSettingContentHeader } from "@/components/profile";
// hooks
import { LanguageTimezone } from "@/components/profile/preferences/language-timezone";
import { SettingsHeading } from "@/components/settings";
import { useUserProfile } from "@/hooks/store";

const ProfileAppearancePage = observer(() => {
  const { t } = useTranslation();
  // hooks
  const { data: userProfile } = useUserProfile();

  return (
    <>
      <PageHead title={`${t("profile.label")} - ${t("preferences")}`} />
      {userProfile ? (
        <>
          <div className="flex flex-col gap-4 w-full">
            <div>
              <SettingsHeading
                title={t("account_settings.preferences.heading")}
                description={t("account_settings.preferences.description")}
              />
              <PreferencesList />
            </div>
            <div>
              <ProfileSettingContentHeader title={t("language_and_time")} />
              <LanguageTimezone />
            </div>
          </div>
        </>
      ) : (
        <div className="grid h-full w-full place-items-center px-4 sm:px-0">
          <LogoSpinner />
        </div>
      )}
    </>
  );
});

export default ProfileAppearancePage;
