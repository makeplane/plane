"use client";

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
// components
import { LogoSpinner } from "@/components/common";
import { PageHead } from "@/components/core";
import { ProfileSettingContentWrapper, ProfileForm } from "@/components/profile";
// hooks
import { useUser } from "@/hooks/store";

const ProfileSettingsPage = observer(() => {
  const { t } = useTranslation();
  // store hooks
  const { data: currentUser, userProfile } = useUser();

  if (!currentUser)
    return (
      <div className="grid h-full w-full place-items-center px-4 sm:px-0">
        <LogoSpinner />
      </div>
    );

  return (
    <>
      <PageHead title={`${t("profile")} - ${t("general_settings")}`} />
      <ProfileSettingContentWrapper>
        <ProfileForm user={currentUser} profile={userProfile.data} />
      </ProfileSettingContentWrapper>
    </>
  );
});

export default ProfileSettingsPage;
