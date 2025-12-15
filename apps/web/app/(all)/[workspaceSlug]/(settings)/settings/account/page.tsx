import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { ProfileForm } from "@/components/profile/form";
// hooks
import { useUser } from "@/hooks/store/user";

function ProfileSettingsPage() {
  const { t } = useTranslation();
  // store hooks
  const { data: currentUser, userProfile } = useUser();

  if (!currentUser) return <></>;
  return (
    <>
      <PageHead title={`${t("profile.label")} - ${t("general_settings")}`} />
      <ProfileForm user={currentUser} profile={userProfile.data} />
    </>
  );
}

export default observer(ProfileSettingsPage);
