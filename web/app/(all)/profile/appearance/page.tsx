"use client";

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
// components
import { PreferencesList } from "@/components/appearance/list";
import { LogoSpinner } from "@/components/common";
import { PageHead } from "@/components/core";
import { ProfileSettingContentHeader, ProfileSettingContentWrapper, StartOfWeekPreference } from "@/components/profile";
// hooks
import { useUserProfile } from "@/hooks/store";

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
          <StartOfWeekPreference />
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
