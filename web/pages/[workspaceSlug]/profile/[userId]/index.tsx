import { ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { IUserStateDistribution, TStateGroups } from "@plane/types";
// services
// layouts
// components
import { PageHead } from "@/components/core";
import { UserProfileHeader } from "@/components/headers";
import {
  ProfileActivity,
  ProfilePriorityDistribution,
  ProfileStateDistribution,
  ProfileStats,
  ProfileWorkload,
} from "@/components/profile";
// types
// constants
import { USER_PROFILE_DATA } from "@/constants/fetch-keys";
import { GROUP_CHOICES } from "@/constants/project";
import { AppLayout } from "@/layouts/app-layout";
import { ProfileAuthWrapper } from "@/layouts/user-profile-layout";
import { NextPageWithLayout } from "@/lib/types";
import { UserService } from "@/services/user.service";

// services
const userService = new UserService();

const ProfileOverviewPage: NextPageWithLayout = () => {
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
    <>
      <PageHead title="Profile - Summary" />
      <div className="h-full w-full space-y-7 overflow-y-auto px-5 py-5 md:px-9 vertical-scrollbar scrollbar-md">
        <ProfileStats userProfile={userProfile} />
        <ProfileWorkload stateDistribution={stateDistribution} />
        <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
          <ProfilePriorityDistribution userProfile={userProfile} />
          <ProfileStateDistribution stateDistribution={stateDistribution} userProfile={userProfile} />
        </div>
        <ProfileActivity />
      </div>
    </>
  );
};

ProfileOverviewPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<UserProfileHeader type="Summary" />}>
      <ProfileAuthWrapper>{page}</ProfileAuthWrapper>
    </AppLayout>
  );
};

export default ProfileOverviewPage;
