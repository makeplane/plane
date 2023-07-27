import React from "react";

import { useRouter } from "next/router";
import Link from "next/link";

import useSWR from "swr";

// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// services
import userService from "services/user.service";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
import { BarGraph, Icon, Loader, PieGraph } from "components/ui";
// helpers
import { capitalizeFirstLetter } from "helpers/string.helper";
import { activityDetails } from "helpers/activity.helper";
import { timeAgo } from "helpers/date-time.helper";
// types
import type { NextPage } from "next";
// constants
import { USER_WORKSPACE_PROFILE, USER_WORKSPACE_PROFILE_ACTIVITY } from "constants/fetch-keys";
import { STATE_GROUP_COLORS } from "constants/state";
import { GROUP_CHOICES } from "constants/project";

const tabsList = [
  {
    route: "",
    label: "Overview",
  },
  {
    route: "assigned",
    label: "Assigned",
  },
  {
    route: "created",
    label: "Created",
  },
  {
    route: "subscribed",
    label: "Subscribed",
  },
];

const ProfileOverview: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, userId } = router.query;

  const { data: userProfile } = useSWR(
    workspaceSlug && userId
      ? USER_WORKSPACE_PROFILE(workspaceSlug.toString(), userId.toString())
      : null,
    workspaceSlug && userId
      ? () => userService.getUserWorkspaceProfileData(workspaceSlug.toString(), userId.toString())
      : null
  );

  const { data: userProfileActivity } = useSWR(
    workspaceSlug && userId
      ? USER_WORKSPACE_PROFILE_ACTIVITY(workspaceSlug.toString(), userId.toString())
      : null,
    workspaceSlug && userId
      ? () =>
          userService.getUserWorkspaceProfileActivity(workspaceSlug.toString(), userId.toString())
      : null
  );

  const overviewCards = [
    {
      icon: "new_window",
      route: "created",
      title: "Issues created",
      value: userProfile?.created_issues ?? "...",
    },
    {
      icon: "account_circle",
      route: "assigned",
      title: "Issues assigned",
      value: userProfile?.assigned_issues ?? "...",
    },
    {
      icon: "subscriptions",
      route: "subscribed",
      title: "Issues subscribed",
      value: userProfile?.subscribed_issues ?? "...",
    },
  ];

  const stateDistribution = Object.keys(GROUP_CHOICES).map((key) => {
    const group = userProfile?.state_distribution.find((g) => g.state_group === key);

    if (group) return group;
    else return { state_group: key, state_count: 0 };
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
          <div className="px-4 sm:px-5 border-b border-custom-border-300">
            <div className="flex items-center overflow-x-scroll">
              {tabsList.map((tab) => (
                <Link key={tab.route} href={`/profile/${userId}/${tab.route}`}>
                  <a
                    className={`border-b-2 p-4 text-sm font-medium outline-none whitespace-nowrap ${
                      router.pathname.includes(tab.route)
                        ? "border-custom-primary-100 text-custom-primary-100"
                        : "border-transparent"
                    }`}
                  >
                    {tab.label}
                  </a>
                </Link>
              ))}
            </div>
          </div>
          <div className="h-full w-full overflow-y-auto px-9 py-5 space-y-7">
            {userProfile ? (
              <>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-stretch">
                    {overviewCards.map((card) => (
                      <Link
                        key={card.route}
                        href={`/${workspaceSlug}/profile/${userId}/${card.route}`}
                      >
                        <a className="flex items-center gap-3 p-4 rounded border border-custom-border-100 whitespace-nowrap">
                          <div className="h-11 w-11 bg-custom-background-90 rounded grid place-items-center">
                            <Icon iconName={card.icon} className="!text-xl" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-custom-text-400 text-sm">{card.title}</p>
                            <p className="text-xl font-semibold">{card.value}</p>
                          </div>
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Workload</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 justify-stretch">
                    {stateDistribution.map((group) => (
                      <div key={group.state_group}>
                        <a className="flex gap-2 p-4 rounded border border-custom-border-100 whitespace-nowrap">
                          <div
                            className="h-3 w-3 rounded-sm"
                            style={{
                              backgroundColor: STATE_GROUP_COLORS[group.state_group],
                            }}
                          />
                          <div className="space-y-1 -mt-1">
                            <p className="text-custom-text-400 text-sm capitalize">
                              {group.state_group}
                            </p>
                            <p className="text-xl font-semibold">{group.state_count}</p>
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 items-stretch gap-5">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Issues by Priority</h3>
                    <div className="border border-custom-border-100 rounded">
                      <BarGraph
                        data={userProfile.priority_distribution.map((priority) => ({
                          priority: capitalizeFirstLetter(priority.priority ?? "None"),
                          value: priority.priority_count,
                        }))}
                        height="300px"
                        indexBy="priority"
                        keys={["value"]}
                        borderRadius={4}
                        padding={0.7}
                        customYAxisTickValues={userProfile.priority_distribution.map(
                          (p) => p.priority_count
                        )}
                        tooltip={(datum) => (
                          <div className="flex items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-80 p-2 text-xs">
                            <span
                              className="h-3 w-3 rounded"
                              style={{
                                backgroundColor: datum.color,
                              }}
                            />
                            <span className="font-medium text-custom-text-200">
                              {datum.data.priority}:
                            </span>
                            <span>{datum.value}</span>
                          </div>
                        )}
                        colors={(datum) => {
                          if (datum.data.priority === "Urgent") return "#991b1b";
                          else if (datum.data.priority === "High") return "#ef4444";
                          else if (datum.data.priority === "Medium") return "#f59e0b";
                          else if (datum.data.priority === "Low") return "#16a34a";
                          else return "#e5e5e5";
                        }}
                        theme={{
                          axis: {
                            domain: {
                              line: {
                                stroke: "transparent",
                              },
                            },
                          },
                          grid: {
                            line: {
                              stroke: "transparent",
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Issues by State</h3>
                    <div className="border border-custom-border-100 rounded p-7">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                        <div>
                          <PieGraph
                            data={
                              stateDistribution.map((group) => ({
                                id: group.state_group,
                                label: group.state_group,
                                value: group.state_count,
                                color: STATE_GROUP_COLORS[group.state_group],
                              })) ?? []
                            }
                            height="250px"
                            innerRadius={0.6}
                            cornerRadius={5}
                            padAngle={2}
                            enableArcLabels
                            arcLabelsTextColor="#000000"
                            enableArcLinkLabels={false}
                            activeInnerRadiusOffset={5}
                            colors={(datum) => datum.data.color}
                            tooltip={(datum) => (
                              <div className="flex items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-90 p-2 text-xs">
                                <span className="text-custom-text-200 capitalize">
                                  {datum.datum.label} issues:
                                </span>{" "}
                                {datum.datum.value}
                              </div>
                            )}
                            margin={{
                              top: 32,
                              right: 0,
                              bottom: 32,
                              left: 0,
                            }}
                          />
                        </div>
                        <div className="flex items-center">
                          <div className="space-y-4 w-full">
                            {stateDistribution.map((group) => (
                              <div
                                key={group.state_group}
                                className="flex items-center justify-between gap-2 text-xs"
                              >
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="h-2.5 w-2.5 rounded-sm"
                                    style={{
                                      backgroundColor: STATE_GROUP_COLORS[group.state_group],
                                    }}
                                  />
                                  <div className="capitalize whitespace-nowrap">
                                    {group.state_group}
                                  </div>
                                </div>
                                <div>{group.state_count}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
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
        <div className="flex-shrink-0 w-80">
          {/* <img
            src={
              project.cover_image ??
              "https://images.unsplash.com/photo-1672243775941-10d763d9adef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
            }
            alt={project.name}
            className="absolute top-0 left-0 h-full w-full object-cover rounded-t-[10px]"
          /> */}
        </div>
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default ProfileOverview;
