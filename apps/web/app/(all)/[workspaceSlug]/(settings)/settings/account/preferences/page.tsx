"use client";

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { PageHead } from "@/components/core/page-title";
import { PreferencesList } from "@/components/preferences/list";
import { LanguageTimezone } from "@/components/profile/preferences/language-timezone";
import { ProfileSettingContentHeader } from "@/components/profile/profile-setting-content-header";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useUserProfile } from "@/hooks/store/user";

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
