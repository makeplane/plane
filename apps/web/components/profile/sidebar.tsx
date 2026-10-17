/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/blocks/emoji-icon-picker";
import { Collapsible } from "@makeplane/propel/components/collapsible";
import { Avatar } from "@makeplane/propel/components/avatar";
import { Badge } from "@makeplane/propel/components/badge";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";
import { ScrollArea } from "@makeplane/propel/components/scroll-area";
import { EditOutline } from "@makeplane/propel/icons";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { IUserProfileProjectSegregation } from "@plane/types";
import { Loader } from "@plane/blocks/skeleton";
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
        `fixed z-5 h-full w-full shrink-0 overflow-hidden border-l border-subtle bg-surface-1 shadow-raised-200 transition-all md:relative md:w-[300px]`,
        className
      )}
      style={profileSidebarCollapsed ? { marginLeft: "100vw" } : {}}
    >
      <ScrollArea orientation="vertical" variant="inset" size="md">
        {userProjectsData ? (
          <>
            <div className="relative h-[110px]">
              {currentUser?.id === userId && (
                <div className="absolute top-3.5 right-3.5">
                  <IconButton
                    variant="secondary"
                    size="sm"
                    icon={<Icon icon={EditOutline} />}
                    aria-label={t("common.edit")}
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
              <div className="absolute -bottom-7 left-5 flex">
                <Avatar
                  size="2xl"
                  src={getFileURL(userData?.avatar_url ?? "")}
                  alt={[userData?.first_name, userData?.last_name].filter(Boolean).join(" ") || userData?.display_name}
                />
              </div>
            </div>
            <div className="px-5">
              <div className="mt-10">
                <h4 className="text-h6-semibold">
                  {userData?.first_name} {userData?.last_name}
                </h4>
                <h6 className="text-body-xs-regular text-secondary">({userData?.display_name})</h6>
              </div>
              <div className="mt-6 space-y-5">
                {userDetails.map((detail) => (
                  <div key={detail.i18n_label} className="flex items-center gap-4 text-body-xs-regular">
                    <div className="w-2/5 flex-shrink-0 text-secondary">{t(detail.i18n_label)}</div>
                    <div className="w-3/5 font-medium break-words">{detail.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-9 divide-y divide-subtle">
                {userProjectsData.project_data.map((project, index) => {
                  const projectDetails = getProjectById(project.id);

                  const totalIssues =
                    project.created_issues +
                    project.assigned_issues +
                    project.pending_issues +
                    project.completed_issues;

                  const completedIssuePercentage =
                    project.assigned_issues === 0
                      ? 0
                      : Math.round((project.completed_issues / project.assigned_issues) * 100);

                  if (!projectDetails) return null;

                  return (
                    <div key={project.id} className={index === 0 ? "pb-3" : "py-3"}>
                      <Collapsible
                        placement="sidebar"
                        hug
                        icon={
                          <span aria-hidden className="grid size-4 shrink-0 place-items-center">
                            <Logo logo={projectDetails.logo_props} />
                          </span>
                        }
                        trigger={<span className="truncate text-body-xs-medium">{projectDetails.name}</span>}
                        trailing={
                          project.assigned_issues > 0 ? (
                            <Tooltip label="Completion percentage" side="left" disabled={isMobile}>
                              <Badge
                                size="xs"
                                variant={
                                  completedIssuePercentage <= 35
                                    ? "danger"
                                    : completedIssuePercentage <= 70
                                      ? "warning"
                                      : "success"
                                }
                                label={`${completedIssuePercentage}%`}
                              />
                            </Tooltip>
                          ) : undefined
                        }
                      >
                        <div className="mt-5 px-2">
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
                          <div className="mt-7 space-y-5 text-body-xs-regular text-secondary">
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
                        </div>
                      </Collapsible>
                    </div>
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
      </ScrollArea>
    </div>
  );
});
