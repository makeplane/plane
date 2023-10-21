import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import { UserService } from "services/user.service";
// layouts
import { ProfileAuthWrapper } from "layouts/profile-layout";
// components
import {
  ProfileActivity,
  ProfilePriorityDistribution,
  ProfileStateDistribution,
  ProfileStats,
  ProfileWorkload,
} from "components/profile";
// types
import type { NextPage } from "next";
import { IUserStateDistribution, TStateGroups } from "types";
// constants
import { USER_PROFILE_DATA } from "constants/fetch-keys";
import { GROUP_CHOICES } from "constants/project";

// services
const userService = new UserService();

const ProfileOverview: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, userId } = router.query;

  const { data: userProfile } = useSWR(
    workspaceSlug && userId ? USER_PROFILE_DATA(workspaceSlug.toString(), userId.toString()) : null,
    workspaceSlug && userId ? () => userService.getUserProfileData(workspaceSlug.toString(), userId.toString()) : null
  );

  const stateDistribution: IUserStateDistribution[] = Object.keys(GROUP_CHOICES).map((key) => {
    const group = userProfile?.state_distribution.find((g) => g.state_group === key);

    if (group) return group;
    else return { state_group: key as TStateGroups, state_count: 0 };
  });

  return (
    <ProfileAuthWrapper>
      <div className="h-full w-full px-5 md:px-9 py-5 space-y-7 overflow-y-auto">
        <ProfileStats userProfile={userProfile} />
        <ProfileWorkload stateDistribution={stateDistribution} />
        <div className="grid grid-cols-1 xl:grid-cols-2 items-stretch gap-5">
          <ProfilePriorityDistribution userProfile={userProfile} />
          <ProfileStateDistribution stateDistribution={stateDistribution} userProfile={userProfile} />
        </div>
        <ProfileActivity />
      </div>
    </ProfileAuthWrapper>
  );
};

export default ProfileOverview;
