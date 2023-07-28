import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// services
import userService from "services/user.service";
// components
import {
  ProfileActivity,
  ProfileNavbar,
  ProfilePriorityDistribution,
  ProfileSidebar,
  ProfileStateDistribution,
  ProfileStats,
  ProfileWorkload,
} from "components/profile";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import type { NextPage } from "next";
import { IUserStateDistribution, TStateGroups } from "types";
// constants
import { USER_PROFILE_DATA } from "constants/fetch-keys";
import { GROUP_CHOICES } from "constants/project";

const ProfileOverview: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, userId } = router.query;

  const { data: userProfile } = useSWR(
    workspaceSlug && userId ? USER_PROFILE_DATA(workspaceSlug.toString(), userId.toString()) : null,
    workspaceSlug && userId
      ? () => userService.getUserProfileData(workspaceSlug.toString(), userId.toString())
      : null
  );

  const stateDistribution: IUserStateDistribution[] = Object.keys(GROUP_CHOICES).map((key) => {
    const group = userProfile?.state_distribution.find((g) => g.state_group === key);

    if (group) return group;
    else return { state_group: key as TStateGroups, state_count: 0 };
  });

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
          <BreadcrumbItem title={`User Name`} />
        </Breadcrumbs>
      }
    >
      <div className="h-full w-full flex overflow-hidden">
        <div className="h-full w-full flex flex-col overflow-hidden">
          <ProfileNavbar />
          <div className="h-full w-full overflow-y-auto px-9 py-5 space-y-7">
            <ProfileStats userProfile={userProfile} />
            <ProfileWorkload stateDistribution={stateDistribution} />
            <div className="grid grid-cols-1 xl:grid-cols-2 items-stretch gap-5">
              <ProfilePriorityDistribution userProfile={userProfile} />
              <ProfileStateDistribution
                stateDistribution={stateDistribution}
                userProfile={userProfile}
              />
            </div>
            <ProfileActivity />
          </div>
        </div>
        <ProfileSidebar />
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default ProfileOverview;
