import { ReactElement } from "react";
import useSWR from "swr";
// layouts
import { ProfilePreferenceSettingsLayout } from "layouts/settings-layout/profile/preferences";
// components
import { EmailNotificationForm } from "components/profile/preferences";
// services
import { UserService } from "services/user.service";
// type
import { NextPageWithLayout } from "lib/types";

// services
const userService = new UserService();

const ProfilePreferencesThemePage: NextPageWithLayout = () => {
  // fetching user email notification settings
  const { data } = useSWR("CURRENT_USER_EMAIL_NOTIFICATION_SETTINGS", () =>
    userService.currentUserEmailNotificationSettings()
  );

  if (!data) {
    return null;
  }

  return (
    <div className="mx-auto mt-8 h-full w-full overflow-y-auto px-6 lg:px-20 pb-8">
      <EmailNotificationForm data={data} />
    </div>
  );
};

ProfilePreferencesThemePage.getLayout = function getLayout(page: ReactElement) {
  return <ProfilePreferenceSettingsLayout>{page}</ProfilePreferenceSettingsLayout>;
};

export default ProfilePreferencesThemePage;
