"use client";

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { PageHead } from "@/components/core/page-title";
import { ProfileForm } from "@/components/profile/form";
import { ProfileSettingContentWrapper } from "@/components/profile/profile-setting-content-wrapper";
// hooks
import { useUser } from "@/hooks/store/user";

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
      <PageHead title={`${t("profile.label")} - ${t("general_settings")}`} />
      <ProfileSettingContentWrapper>
        <ProfileForm user={currentUser} profile={userProfile.data} />
      </ProfileSettingContentWrapper>
    </>
  );
});

export default ProfileSettingsPage;
