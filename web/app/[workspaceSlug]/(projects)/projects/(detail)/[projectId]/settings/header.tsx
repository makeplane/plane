"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { Settings } from "lucide-react";
import { Breadcrumbs, CustomMenu, CustomHeader } from "@plane/ui";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
// constants
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useProject, useUser } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web constants
import { PROJECT_SETTINGS_LINKS } from "@/plane-web/constants/project";

export const ProjectSettingHeader: FC = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails, loader } = useProject();

  const projectMemberInfo = currentProjectRole || EUserProjectRoles.GUEST;

  return (
    <CustomHeader>
      <CustomHeader.LeftItem>
        <div>
          <div className="z-50">
            <Breadcrumbs onBack={router.back} isLoading={loader}>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink
                    href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                    label={currentProjectDetails?.name ?? "Project"}
                    icon={
                      currentProjectDetails && (
                        <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                          <Logo logo={currentProjectDetails?.logo_props} size={16} />
                        </span>
                      )
                    }
                  />
                }
              />
              <div className="hidden sm:hidden md:block lg:block">
                <Breadcrumbs.BreadcrumbItem
                  type="text"
                  link={
                    <BreadcrumbLink label="Settings" icon={<Settings className="h-4 w-4 text-custom-text-300" />} />
                  }
                />
              </div>
            </Breadcrumbs>
          </div>
        </div>
        <CustomMenu
          className="flex-shrink-0 block sm:block md:hidden lg:hidden"
          maxHeight="lg"
          customButton={
            <span className="text-xs px-1.5 py-1 border rounded-md text-custom-text-200 border-custom-border-300">
              Settings
            </span>
          }
          placement="bottom-start"
          closeOnSelect
        >
          {PROJECT_SETTINGS_LINKS.map(
            (item) =>
              projectMemberInfo >= item.access && (
                <CustomMenu.MenuItem
                  key={item.key}
                  onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}${item.href}`)}
                >
                  {item.label}
                </CustomMenu.MenuItem>
              )
          )}
        </CustomMenu>
      </CustomHeader.LeftItem>
    </CustomHeader>
  );
});
