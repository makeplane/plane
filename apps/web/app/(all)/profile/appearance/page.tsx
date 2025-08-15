"use client";

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
// components
import { PreferencesList } from "@/components/appearance/list";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { PageHead } from "@/components/core/page-title";
import { ProfileSettingContentHeader } from "@/components/profile/profile-setting-content-header";
import { ProfileSettingContentWrapper } from "@/components/profile/profile-setting-content-wrapper";
import { StartOfWeekPreference } from "@/components/profile/start-of-week-preference";

// hooks
import { useUserProfile } from "@/hooks/store/user";

const ProfileAppearancePage = observer(() => {
  const { t } = useTranslation();
  // hooks
  const { data: userProfile } = useUserProfile();

  return (
    <>
      <PageHead title="Profile - Preferences" />
      {userProfile ? (
        <ProfileSettingContentWrapper>
          <ProfileSettingContentHeader title={t("appearance")} />
          <PreferencesList />
          <StartOfWeekPreference option={{ title: "Start of week", description: "Select the start of the week" }} />
        </ProfileSettingContentWrapper>
      ) : (
        <div className="grid h-full w-full place-items-center px-4 sm:px-0">
          <LogoSpinner />
        </div>
      )}
    </>
  );
});

export default ProfileAppearancePage;
