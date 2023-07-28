import React from "react";

import { useRouter } from "next/router";
import Link from "next/link";

import useSWR from "swr";

// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// services
import userService from "services/user.service";
// components
import {
  ProfileNavbar,
  ProfilePriorityDistribution,
  ProfileSidebar,
  ProfileStateDistribution,
  ProfileStats,
  ProfileWorkload,
} from "components/profile";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
import { Icon, Loader } from "components/ui";
// helpers
import { activityDetails } from "helpers/activity.helper";
import { timeAgo } from "helpers/date-time.helper";
// types
import type { NextPage } from "next";
import { IUserStateDistribution, TStateGroups } from "types";
// constants
import { USER_PROFILE_DATA, USER_PROFILE_ACTIVITY } from "constants/fetch-keys";
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

  const { data: userProfileActivity } = useSWR(
    workspaceSlug && userId
      ? USER_PROFILE_ACTIVITY(workspaceSlug.toString(), userId.toString())
      : null,
    workspaceSlug && userId
      ? () => userService.getUserProfileActivity(workspaceSlug.toString(), userId.toString())
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
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Recent Activity</h3>
              <div className="border border-custom-border-100 rounded p-6">
                {userProfileActivity ? (
                  <div className="space-y-5">
                    {userProfileActivity.results.map((activity) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="flex-shrink-0">
                          {activity.actor_detail.avatar && activity.actor_detail.avatar !== "" ? (
                            <img
                              src={activity.actor_detail.avatar}
                              alt={activity.actor_detail.first_name}
                              height={24}
                              width={24}
                              className="rounded"
                            />
                          ) : (
                            <div className="grid h-6 w-6 place-items-center rounded border-2 bg-gray-700 text-xs text-white">
                              {activity.actor_detail.first_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="-mt-1">
                          <p className="text-sm text-custom-text-200">
                            <span className="font-medium text-custom-text-100">
                              {activity.actor_detail.first_name} {activity.actor_detail.last_name}{" "}
                            </span>
                            {activity.field ? (
                              activityDetails[activity.field]?.message(activity as any)
                            ) : (
                              <span>
                                created this{" "}
                                <Link
                                  href={`/${activity.workspace_detail.slug}/projects/${activity.project}/issues/${activity.issue}`}
                                >
                                  <a className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline">
                                    Issue
                                    <Icon iconName="launch" className="!text-xs" />
                                  </a>
                                </Link>
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-custom-text-200">
                            {timeAgo(activity.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Loader className="space-y-5">
                    <Loader.Item height="40px" />
                    <Loader.Item height="40px" />
                    <Loader.Item height="40px" />
                    <Loader.Item height="40px" />
                    <Loader.Item height="40px" />
                  </Loader>
                )}
              </div>
            </div>
          </div>
        </div>
        <ProfileSidebar />
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default ProfileOverview;
