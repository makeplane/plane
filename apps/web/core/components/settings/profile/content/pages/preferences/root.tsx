import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { ProfileSettingsHeading } from "@/components/settings/profile/heading";
// hooks
import { useUserProfile } from "@/hooks/store/user";
// local imports
import { ProfileSettingsDefaultPreferencesList } from "./default-list";
import { ProfileSettingsLanguageAndTimezonePreferencesList } from "./language-and-timezone-list";

export const PreferencesProfileSettings = observer(function PreferencesProfileSettings() {
  const { t } = useTranslation();
  // hooks
  const { data: userProfile } = useUserProfile();

  if (!userProfile) return null;

  return (
    <div className="size-full">
      <ProfileSettingsHeading
        title={t("account_settings.preferences.heading")}
        description={t("account_settings.preferences.description")}
      />
      <div className="mt-7 flex flex-col gap-6 w-full">
        <section>
          <ProfileSettingsDefaultPreferencesList />
        </section>
        <section className="flex flex-col gap-y-3">
          <div className="text-h6-medium text-primary">{t("language_and_time")}</div>
          <ProfileSettingsLanguageAndTimezonePreferencesList />
        </section>
      </div>
    </div>
  );
});
