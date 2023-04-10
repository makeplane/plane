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

const ProfileActivity = () => {
  const { data: userActivity } = useSWR(USER_ACTIVITY, () => userService.getUserActivity());

  return (
    <WorkspaceAuthorizationLayout
      meta={{
        title: "Plane - My Profile",
      }}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="My Profile Activity" />
        </Breadcrumbs>
      }
      profilePage
    >
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
    </WorkspaceAuthorizationLayout>
  );
};

export default ProfileActivity;
