import { ReactElement } from "react";
// layouts
import { ProfilePreferenceSettingsLayout } from "layouts/settings-layout/profile/preferences";
// components
import { EmailNotificationForm } from "components/profile/preferences";
// type
import { NextPageWithLayout } from "lib/types";

const ProfilePreferencesThemePage: NextPageWithLayout = () => (
  <div className="mx-auto mt-8 h-full w-full overflow-y-auto px-6 lg:px-20 pb-8">
    <EmailNotificationForm />
  </div>
);

ProfilePreferencesThemePage.getLayout = function getLayout(page: ReactElement) {
  return <ProfilePreferenceSettingsLayout>{page}</ProfilePreferenceSettingsLayout>;
};

export default ProfilePreferencesThemePage;
