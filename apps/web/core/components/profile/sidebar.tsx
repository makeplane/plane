import { useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Disclosure, Transition } from "@headlessui/react";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { IconButton } from "@plane/propel/icon-button";
import { EditIcon, ChevronDownIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { IUserProfileProjectSegregation } from "@plane/types";
import { Loader } from "@plane/ui";
import { cn, renderFormattedDate, getFileURL } from "@plane/utils";
// components
import { CoverImage } from "@/components/common/cover-image";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";
import { usePlatformOS } from "@/hooks/use-platform-os";
// components
import { ProfileSidebarTime } from "./time";

type TProfileSidebar = {
  userProjectsData: IUserProfileProjectSegregation | undefined;
  className?: string;
};

export const ProfileSidebar = observer(function ProfileSidebar(props: TProfileSidebar) {
  const { userProjectsData, className = "" } = props;
  // refs
  const ref = useRef<HTMLDivElement>(null);
  // router
  const { userId } = useParams();
  // store hooks
  const { data: currentUser } = useUser();
  const { profileSidebarCollapsed, toggleProfileSidebar } = useAppTheme();
  const { getProjectById } = useProject();
  const { toggleProfileSettingsModal } = useCommandPalette();
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();
  // derived values
  const userData = userProjectsData?.user_data;

  useOutsideClickDetector(ref, () => {
    if (profileSidebarCollapsed === false) {
      if (window.innerWidth < 768) {
        toggleProfileSidebar();
      }
    }
  });

  const userDetails = [
    {
      i18n_label: "profile.details.joined_on",
      value: renderFormattedDate(userData?.date_joined ?? ""),
    },
    {
      i18n_label: "profile.details.time_zone",
      value: <ProfileSidebarTime timeZone={userData?.user_timezone} />,
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
        `vertical-scrollbar scrollbar-md fixed z-5 h-full w-full shrink-0 overflow-hidden overflow-y-auto border-l border-subtle bg-surface-1 transition-all md:relative md:w-[300px] shadow-raised-200`,
        className
      )}
      style={profileSidebarCollapsed ? { marginLeft: `${window?.innerWidth || 0}px` } : {}}
    >
      {userProjectsData ? (
        <>
          <div className="relative h-[110px]">
            {currentUser?.id === userId && (
              <div className="absolute right-3.5 top-3.5">
                <IconButton
                  variant="secondary"
                  icon={EditIcon}
                  onClick={() =>
                    toggleProfileSettingsModal({
                      activeTab: "general",
                      isOpen: true,
                    })
                  }
                />
              </div>
            )}
            <CoverImage
              src={userData?.cover_image_url ?? undefined}
              alt={userData?.display_name}
              className="h-[110px] w-full"
              showDefaultWhenEmpty
            />
            <div className="absolute -bottom-[26px] left-5 h-[52px] w-[52px] rounded-sm">
              {userData?.avatar_url && userData?.avatar_url !== "" ? (
                <img
                  src={getFileURL(userData?.avatar_url)}
                  alt={userData?.display_name}
                  className="h-full w-full rounded-sm object-cover"
                />
              ) : (
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-sm bg-accent-primary capitalize text-on-color">
                  {userData?.first_name?.[0]}
                </div>
              )}
            </div>
          </div>
          <div className="px-5">
            <div className="mt-[38px]">
              <h4 className="text-16 font-semibold">
                {userData?.first_name} {userData?.last_name}
              </h4>
              <h6 className="text-13 text-secondary">({userData?.display_name})</h6>
            </div>
            <div className="mt-6 space-y-5">
              {userDetails.map((detail) => (
                <div key={detail.i18n_label} className="flex items-center gap-4 text-13">
                  <div className="w-2/5 flex-shrink-0 text-secondary">{t(detail.i18n_label)}</div>
                  <div className="w-3/5 break-words font-medium">{detail.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-9 divide-y divide-subtle">
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
                            <div className="truncate break-words text-13 font-medium">{projectDetails.name}</div>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-2">
                            {project.assigned_issues > 0 && (
                              <Tooltip tooltipContent="Completion percentage" position="left" isMobile={isMobile}>
                                <div
                                  className={`rounded-sm px-1 py-0.5 text-11 font-medium ${
                                    completedIssuePercentage <= 35
                                      ? "bg-danger-subtle text-danger-primary"
                                      : completedIssuePercentage <= 70
                                        ? "bg-yellow-500/10 text-yellow-500"
                                        : "bg-success-subtle text-success-primary"
                                  }`}
                                >
                                  {completedIssuePercentage}%
                                </div>
                              </Tooltip>
                            )}
                            <ChevronDownIcon className="h-4 w-4" />
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
                                  className="h-1 rounded-sm"
                                  style={{
                                    backgroundColor: "#203b80",
                                    width: `${(project.created_issues / totalIssues) * 100}%`,
                                  }}
                                />
                                <div
                                  className="h-1 rounded-sm"
                                  style={{
                                    backgroundColor: "#3f76ff",
                                    width: `${(project.assigned_issues / totalIssues) * 100}%`,
                                  }}
                                />
                                <div
                                  className="h-1 rounded-sm"
                                  style={{
                                    backgroundColor: "#f59e0b",
                                    width: `${(project.pending_issues / totalIssues) * 100}%`,
                                  }}
                                />
                                <div
                                  className="h-1 rounded-sm"
                                  style={{
                                    backgroundColor: "#16a34a",
                                    width: `${(project.completed_issues / totalIssues) * 100}%`,
                                  }}
                                />
                              </div>
                            )}
                            <div className="mt-7 space-y-5 text-13 text-secondary">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-2.5 w-2.5 rounded-xs bg-[#203b80]" />
                                  Created
                                </div>
                                <div className="font-medium">
                                  {project.created_issues} {t("issues")}
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-2.5 w-2.5 rounded-xs bg-[#3f76ff]" />
                                  Assigned
                                </div>
                                <div className="font-medium">
                                  {project.assigned_issues} {t("issues")}
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-2.5 w-2.5 rounded-xs bg-[#f59e0b]" />
                                  Due
                                </div>
                                <div className="font-medium">
                                  {project.pending_issues} {t("issues")}
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-2.5 w-2.5 rounded-xs bg-[#16a34a]" />
                                  Completed
                                </div>
                                <div className="font-medium">
                                  {project.completed_issues} {t("issues")}
                                </div>
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
