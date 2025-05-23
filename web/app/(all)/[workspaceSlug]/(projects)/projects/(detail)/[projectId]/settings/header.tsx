"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { Settings } from "lucide-react";
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs, CustomMenu, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// hooks
import { useProject, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web
import { ProjectBreadcrumb } from "@/plane-web/components/breadcrumbs";
import { PROJECT_SETTINGS_LINKS } from "@/plane-web/constants/project";

export const ProjectSettingHeader: FC = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { loader } = useProject();

  const { t } = useTranslation();

  return (
    <Header>
      <Header.LeftItem>
        <div>
          <div className="z-50">
            <Breadcrumbs onBack={router.back} isLoading={loader === "init-loader"}>
              <ProjectBreadcrumb />
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
              allowPermissions(
                item.access,
                EUserPermissionsLevel.PROJECT,
                workspaceSlug.toString(),
                projectId.toString()
              ) && (
                <CustomMenu.MenuItem
                  key={item.key}
                  onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}${item.href}`)}
                >
                  {t(item.i18n_label)}
                </CustomMenu.MenuItem>
              )
          )}
        </CustomMenu>
      </Header.LeftItem>
    </Header>
  );
});
