import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
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

  if (!userProfile) return <></>;
  return (
    <>
      <PageHead title={`${t("profile.label")} - ${t("preferences")}`} />
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
  );
});

export default ProfileAppearancePage;
