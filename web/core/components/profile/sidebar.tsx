"use client";

import { FC, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// icons
import { ChevronDown, Pencil } from "lucide-react";
// headless ui
import { Disclosure, Transition } from "@headlessui/react";
// plane helpers
import { useOutsideClickDetector } from "@plane/helpers";
// types
import { IUserProfileProjectSegregation } from "@plane/types";
// plane ui
import { Loader, Tooltip } from "@plane/ui";
// components
import { Logo } from "@/components/common";
// helpers
import { cn } from "@/helpers/common.helper";
import { renderFormattedDate } from "@/helpers/date-time.helper";
// hooks
import { useAppTheme, useProject, useUser } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// components
import { ProfileSidebarTime } from "./time";

type TProfileSidebar = {
  userProjectsData: IUserProfileProjectSegregation | undefined;
  className?: string;
};

export const ProfileSidebar: FC<TProfileSidebar> = observer((props) => {
  const { userProjectsData, className = "" } = props;
  // refs
  const ref = useRef<HTMLDivElement>(null);
  // router
  const { userId } = useParams();
  // store hooks
  const { data: currentUser } = useUser();
  const { profileSidebarCollapsed, toggleProfileSidebar } = useAppTheme();
  const { getProjectById } = useProject();
  const { isMobile } = usePlatformOS();

  useOutsideClickDetector(ref, () => {
    if (profileSidebarCollapsed === false) {
      if (window.innerWidth < 768) {
        toggleProfileSidebar();
      }
    }
  });

  const userDetails = [
    {
      label: "Joined on",
      value: renderFormattedDate(userProjectsData?.user_data.date_joined ?? ""),
    },
    {
      label: "Timezone",
      value: <ProfileSidebarTime timeZone={userProjectsData?.user_data.user_timezone} />,
    },
  ];

  useEffect(() => {
    const handleToggleProfileSidebar = () => {
      if (window && window.innerWidth < 768) {
        toggleProfileSidebar(true);
      }
      if (window && profileSidebarCollapsed && window.innerWidth >= 768) {
        toggleProfileSidebar(false);
      }
    };

    window.addEventListener("resize", handleToggleProfileSidebar);
    handleToggleProfileSidebar();
    return () => window.removeEventListener("resize", handleToggleProfileSidebar);
  }, []);

  return (
    <div
      className={cn(
        `vertical-scrollbar scrollbar-md fixed z-[5] h-full w-full flex-shrink-0 overflow-hidden overflow-y-auto border-l border-custom-border-100 bg-custom-sidebar-background-100 transition-all md:relative md:w-[300px]`,
        className
      )}
      style={profileSidebarCollapsed ? { marginLeft: `${window?.innerWidth || 0}px` } : {}}
    >
      {userProjectsData ? (
        <>
          <div className="relative h-[110px]">
            {currentUser?.id === userId && (
              <div className="absolute right-3.5 top-3.5 grid h-5 w-5 place-items-center rounded bg-white">
                <Link href="/profile">
                  <span className="grid place-items-center text-black">
                    <Pencil className="h-3 w-3" />
                  </span>
                </Link>
              </div>
            )}
            <img
              src={userProjectsData.user_data?.cover_image ?? "/users/user-profile-cover-default-img.png"}
              alt={userProjectsData.user_data?.display_name}
              className="h-[110px] w-full object-cover"
            />
            <div className="absolute -bottom-[26px] left-5 h-[52px] w-[52px] rounded">
              {userProjectsData.user_data?.avatar && userProjectsData.user_data?.avatar !== "" ? (
                <img
                  src={userProjectsData.user_data?.avatar}
                  alt={userProjectsData.user_data?.display_name}
                  className="h-full w-full rounded object-cover"
                />
              ) : (
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded bg-custom-background-90 capitalize text-custom-text-100">
                  {userProjectsData.user_data?.first_name?.[0]}
                </div>
              )}
            </div>
          </div>
          <div className="px-5">
            <div className="mt-[38px]">
              <h4 className="text-lg font-semibold">
                {userProjectsData.user_data?.first_name} {userProjectsData.user_data?.last_name}
              </h4>
              <h6 className="text-sm text-custom-text-200">({userProjectsData.user_data?.display_name})</h6>
            </div>
            <div className="mt-6 space-y-5">
              {userDetails.map((detail) => (
                <div key={detail.label} className="flex items-center gap-4 text-sm">
                  <div className="w-2/5 flex-shrink-0 text-custom-text-200">{detail.label}</div>
                  <div className="w-3/5 break-words font-medium">{detail.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-9 divide-y divide-custom-border-100">
              {userProjectsData.project_data.map((project, index) => {
                const projectDetails = getProjectById(project.id);

                const totalIssues =
                  project.created_issues + project.assigned_issues + project.pending_issues + project.completed_issues;

                const completedIssuePercentage =
                  project.assigned_issues === 0
                    ? 0
                    : Math.round((project.completed_issues / project.assigned_issues) * 100);

                if (!projectDetails) return null;

                return (
                  <Disclosure key={project.id} as="div" className={`${index === 0 ? "pb-3" : "py-3"}`}>
                    {({ open }) => (
                      <div className="w-full">
                        <Disclosure.Button className="flex w-full items-center justify-between gap-2">
                          <div className="flex w-3/4 items-center gap-2">
                            <span className="grid h-7 w-7 flex-shrink-0 place-items-center">
                              <Logo logo={projectDetails.logo_props} />
                            </span>
                            <div className="truncate break-words text-sm font-medium">{projectDetails.name}</div>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-2">
                            {project.assigned_issues > 0 && (
                              <Tooltip tooltipContent="Completion percentage" position="left" isMobile={isMobile}>
                                <div
                                  className={`rounded px-1 py-0.5 text-xs font-medium ${
                                    completedIssuePercentage <= 35
                                      ? "bg-red-500/10 text-red-500"
                                      : completedIssuePercentage <= 70
                                        ? "bg-yellow-500/10 text-yellow-500"
                                        : "bg-green-500/10 text-green-500"
                                  }`}
                                >
                                  {completedIssuePercentage}%
                                </div>
                              </Tooltip>
                            )}
                            <ChevronDown className="h-4 w-4" />
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
                          <Disclosure.Panel className="mt-5 pl-9">
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
                                  <div className="h-2.5 w-2.5 rounded-sm bg-[#203b80]" />
                                  Created
                                </div>
                                <div className="font-medium">{project.created_issues} Issues</div>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-2.5 w-2.5 rounded-sm bg-[#3f76ff]" />
                                  Assigned
                                </div>
                                <div className="font-medium">{project.assigned_issues} Issues</div>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-2.5 w-2.5 rounded-sm bg-[#f59e0b]" />
                                  Due
                                </div>
                                <div className="font-medium">{project.pending_issues} Issues</div>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-2.5 w-2.5 rounded-sm bg-[#16a34a]" />
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
        <Loader className="space-y-7 px-5">
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
});
