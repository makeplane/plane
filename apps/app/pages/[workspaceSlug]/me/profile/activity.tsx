import useSWR from "swr";

// services
import userService from "services/user.service";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// components
import { Feeds } from "components/core";
// ui
import { Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// fetch-keys
import { USER_ACTIVITY } from "constants/fetch-keys";
import SettingsNavbar from "layouts/settings-navbar";

const ProfileActivity = () => {
  const { data: userActivity } = useSWR(USER_ACTIVITY, () => userService.getUserActivity());

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="My Profile Activity" />
        </Breadcrumbs>
      }
    >
      <div className="px-24 py-8">
        <div className="mb-12 space-y-6">
          <div>
            <h3 className="text-3xl font-semibold">Profile Settings</h3>
            <p className="mt-1 text-brand-secondary">
              This information will be visible to only you.
            </p>
          </div>
          <SettingsNavbar profilePage />
        </div>
        {userActivity ? (
          userActivity.results.length > 0 ? (
            <Feeds activities={userActivity.results} />
          ) : null
        ) : (
          <Loader className="space-y-5">
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
          </Loader>
        )}
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default ProfileActivity;
