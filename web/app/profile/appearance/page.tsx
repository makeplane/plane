"use client";

import { observer } from "mobx-react";
// components
import { LogoSpinner } from "@/components/common";
import { PageHead } from "@/components/core";
import { PreferencesList } from "@/components/preferences/list";
import { ProfileSettingContentHeader, ProfileSettingContentWrapper } from "@/components/profile";
// hooks
import { useUserProfile } from "@/hooks/store";

const ProfileAppearancePage = observer(() => {
  // hooks
  const { data: userProfile } = useUserProfile();

  return (
    <>
      <PageHead title="Profile - Appearance" />
      {userProfile ? (
        <ProfileSettingContentWrapper>
          <ProfileSettingContentHeader title="Preferences" />
          <PreferencesList />
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
