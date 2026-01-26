import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
// hooks
import { useUser } from "@/hooks/store/user";
// local imports
import { GeneralProfileSettingsForm } from "./form";

export const GeneralProfileSettings = observer(function GeneralProfileSettings() {
  const { t } = useTranslation();
  // store hooks
  const { data: currentUser, userProfile } = useUser();

  if (!currentUser) return null;

  return (
    <>
      <PageHead title={`${t("profile.label")} - ${t("general_settings")}`} />
      <GeneralProfileSettingsForm user={currentUser} profile={userProfile.data} />
    </>
  );
});
