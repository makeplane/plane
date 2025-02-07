"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
// types
import { GROUP_CHOICES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IUserStateDistribution, TStateGroups } from "@plane/types";
// components
import { ContentWrapper } from "@plane/ui";
import { PageHead } from "@/components/core";
import {
  ProfileActivity,
  ProfilePriorityDistribution,
  ProfileStateDistribution,
  ProfileStats,
  ProfileWorkload,
} from "@/components/profile";
// constants
import { USER_PROFILE_DATA } from "@/constants/fetch-keys";
// services
import { UserService } from "@/services/user.service";

// services
const userService = new UserService();

export default function ProfileOverviewPage() {
  const { workspaceSlug, userId } = useParams();

  const { t } = useTranslation();
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
      <PageHead title={t("profile.page_label")} />
      <ContentWrapper className="space-y-7">
        <ProfileStats userProfile={userProfile} />
        <ProfileWorkload stateDistribution={stateDistribution} />
        <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
          <ProfilePriorityDistribution userProfile={userProfile} />
          <ProfileStateDistribution stateDistribution={stateDistribution} userProfile={userProfile} />
        </div>
        <ProfileActivity />
      </ContentWrapper>
    </>
  );
}
