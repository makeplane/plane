import { GetServerSidePropsContext } from "next";

import useSWR from "swr";

// services
import userService from "services/user.service";
// lib
import { requiredAuth } from "lib/auth";
// layouts
import AppLayout from "layouts/app-layout";
// ui
import { Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// helpers
import { timeAgo } from "helpers/date-time.helper";
// fetch-keys
import { USER_ACTIVITY } from "constants/fetch-keys";

const ProfileActivity = () => {
  const { data: userActivity } = useSWR(USER_ACTIVITY, () => userService.getUserActivity());

  return (
    <AppLayout
      meta={{
        title: "Plane - My Profile",
      }}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="My Profile Activity" />
        </Breadcrumbs>
      }
      settingsLayout
      profilePage
    >
      {userActivity ? (
        <div className="divide-y rounded-[10px] border border-gray-200 bg-white px-6 -mt-4">
          {userActivity.results.length > 0
            ? userActivity.results.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-2 justify-between py-4 text-sm text-gray-500"
                >
                  <h4>
                    <span className="font-medium text-black">{activity.comment}</span>
                  </h4>
                  <div className="text-xs">{timeAgo(activity.created_at)}</div>
                </div>
              ))
            : null}
        </div>
      ) : (
        <Loader className="space-y-5">
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
        </Loader>
      )}
    </AppLayout>
  );
};

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const user = await requiredAuth(ctx.req?.headers.cookie);

  const redirectAfterSignIn = ctx.resolvedUrl;

  if (!user) {
    return {
      redirect: {
        destination: `/signin?next=${redirectAfterSignIn}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      user,
    },
  };
};

export default ProfileActivity;
