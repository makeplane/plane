import { useRouter } from "next/router";

import useSWR from "swr";

// next-themes
import { useTheme } from "next-themes";
// headless ui
import { Disclosure, Transition } from "@headlessui/react";
// services
import userService from "services/user.service";
// ui
import { Icon, Loader } from "components/ui";
// helpers
import { renderLongDetailDateFormat } from "helpers/date-time.helper";
import { renderEmoji } from "helpers/emoji.helper";
// fetch-keys
import { USER_PROFILE_PROJECT_SEGREGATION } from "constants/fetch-keys";

export const ProfileSidebar = () => {
  const router = useRouter();
  const { workspaceSlug, userId } = router.query;

  const { theme } = useTheme();

  const { data: userProjectsData } = useSWR(
    workspaceSlug && userId
      ? USER_PROFILE_PROJECT_SEGREGATION(workspaceSlug.toString(), userId.toString())
      : null,
    workspaceSlug && userId
      ? () =>
          userService.getUserProfileProjectsSegregation(workspaceSlug.toString(), userId.toString())
      : null
  );

  const userDetails = [
    {
      label: "Username",
      value: "",
    },
    {
      label: "Joined on",
      value: renderLongDetailDateFormat(userProjectsData?.user_data.date_joined ?? ""),
    },
    {
      label: "Timezone",
      value: userProjectsData?.user_data.user_timezone,
    },
    {
      label: "Status",
      value: "Online",
    },
  ];

  return (
    <div
      className="flex-shrink-0 h-full w-80 overflow-y-auto"
      style={{
        boxShadow:
          theme === "light"
            ? "0px 1px 4px 0px rgba(0, 0, 0, 0.01), 0px 4px 8px 0px rgba(0, 0, 0, 0.02), 0px 1px 12px 0px rgba(0, 0, 0, 0.12)"
            : "0px 0px 4px 0px rgba(0, 0, 0, 0.20), 0px 2px 6px 0px rgba(0, 0, 0, 0.50)",
      }}
    >
      {userProjectsData ? (
        <>
          <div className="relative h-32">
            <img
              src={
                userProjectsData.user_data.cover_image ??
                "https://images.unsplash.com/photo-1672243775941-10d763d9adef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
              }
              alt={userProjectsData.user_data.first_name}
              className="h-32 w-full object-cover"
            />
            <div className="absolute -bottom-[26px] left-5 h-[52px] w-[52px] rounded">
              {userProjectsData.user_data.avatar && userProjectsData.user_data.avatar !== "" ? (
                <img
                  src={userProjectsData.user_data.avatar}
                  alt={userProjectsData.user_data.first_name}
                  className="rounded"
                />
              ) : (
                <div className="bg-custom-background-90 text-custom-text-100">
                  {userProjectsData.user_data.first_name[0]}
                </div>
              )}
            </div>
          </div>
          <div className="px-5">
            <div className="mt-[38px]">
              <h4 className="text-lg font-semibold">
                {userProjectsData.user_data.first_name} {userProjectsData.user_data.last_name}
              </h4>
              <h6 className="text-custom-text-200 text-sm">{userProjectsData.user_data.email}</h6>
            </div>
            <div className="mt-6 space-y-5">
              {userDetails.map((detail) => (
                <div key={detail.label} className="flex items-center gap-4 text-sm">
                  <div className="text-custom-text-200 w-2/5">{detail.label}</div>
                  <div className="font-medium">{detail.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-9 divide-y divide-custom-border-100">
              {userProjectsData.project_data.map((project, index) => {
                const totalIssues =
                  project.created_issues +
                  project.assigned_issues +
                  project.pending_issues +
                  project.completed_issues;
                const totalAssignedIssues = totalIssues - project.created_issues;

                const completedIssuePercentage =
                  totalAssignedIssues === 0
                    ? 0
                    : Math.round((project.completed_issues / totalAssignedIssues) * 100);

                return (
                  <Disclosure
                    key={project.id}
                    as="div"
                    className={`${index === 0 ? "pb-3" : "py-3"}`}
                  >
                    {({ open }) => (
                      <div className="w-full">
                        <Disclosure.Button className="flex items-center justify-between gap-2 w-full">
                          <div className="flex items-center gap-2 w-3/4">
                            {project.emoji ? (
                              <div className="flex-shrink-0 grid h-7 w-7 place-items-center">
                                {renderEmoji(project.emoji)}
                              </div>
                            ) : project.icon_prop ? (
                              <div className="flex-shrink-0 h-7 w-7 grid place-items-center">
                                {renderEmoji(project.icon_prop)}
                              </div>
                            ) : (
                              <div className="flex-shrink-0 grid place-items-center h-7 w-7 rounded bg-custom-background-90 uppercase text-custom-text-100 text-xs">
                                {project?.name.charAt(0)}
                              </div>
                            )}
                            <div className="text-sm font-medium truncate break-words">
                              {project.name}
                            </div>
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-2">
                            <div
                              className={`px-1 py-0.5 text-xs font-medium rounded ${
                                completedIssuePercentage <= 35
                                  ? "bg-red-500/10 text-red-500"
                                  : completedIssuePercentage <= 70
                                  ? "bg-yellow-500/10 text-yellow-500"
                                  : "bg-green-500/10 text-green-500"
                              }`}
                            >
                              {completedIssuePercentage}%
                            </div>
                            <Icon iconName="arrow_drop_down" className="!text-lg" />
                          </div>
                        </Disclosure.Button>
                        <Transition
                          show={open}
                          enter="transition duration-100 ease-out"
                          enterFrom="transform opacity-0"
                          enterTo="transform opacity-100"
                          leave="transition duration-75 ease-out"
                          leaveFrom="transform opacity-100"
                          leaveTo="transform opacity-0"
                        >
                          <Disclosure.Panel className="pl-9 mt-5">
                            {totalIssues > 0 && (
                              <div className="flex items-center gap-0.5">
                                <div
                                  className="h-1 rounded"
                                  style={{
                                    backgroundColor: "#203b80",
                                    width: `${(project.created_issues / totalIssues) * 100}%`,
                                  }}
                                />
                                <div
                                  className="h-1 rounded"
                                  style={{
                                    backgroundColor: "#3f76ff",
                                    width: `${(project.assigned_issues / totalIssues) * 100}%`,
                                  }}
                                />
                                <div
                                  className="h-1 rounded"
                                  style={{
                                    backgroundColor: "#f59e0b",
                                    width: `${(project.pending_issues / totalIssues) * 100}%`,
                                  }}
                                />
                                <div
                                  className="h-1 rounded"
                                  style={{
                                    backgroundColor: "#16a34a",
                                    width: `${(project.completed_issues / totalIssues) * 100}%`,
                                  }}
                                />
                              </div>
                            )}
                            <div className="mt-7 space-y-5 text-sm text-custom-text-200">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-2.5 w-2.5 bg-[#203b80] rounded-sm" />
                                  Created
                                </div>
                                <div className="font-medium">{project.created_issues} Issues</div>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-2.5 w-2.5 bg-[#3f76ff] rounded-sm" />
                                  Assigned
                                </div>
                                <div className="font-medium">{project.assigned_issues} Issues</div>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-2.5 w-2.5 bg-[#f59e0b] rounded-sm" />
                                  Due
                                </div>
                                <div className="font-medium">{project.pending_issues} Issues</div>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-2.5 w-2.5 bg-[#16a34a] rounded-sm" />
                                  Completed
                                </div>
                                <div className="font-medium">{project.completed_issues} Issues</div>
                              </div>
                            </div>
                          </Disclosure.Panel>
                        </Transition>
                      </div>
                    )}
                  </Disclosure>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <Loader className="px-5 space-y-7">
          <Loader.Item height="130px" />
          <div className="space-y-5">
            <Loader.Item height="20px" />
            <Loader.Item height="20px" />
            <Loader.Item height="20px" />
            <Loader.Item height="20px" />
            <Loader.Item height="20px" />
          </div>
        </Loader>
      )}
    </div>
  );
};
