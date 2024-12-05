"use client";

import React from "react";
import range from "lodash/range";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
// ui
import { Loader } from "@plane/ui";
// components
import { SidebarNavItem } from "@/components/sidebar";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane web constants
import { PROJECT_SETTINGS_LINKS } from "@/plane-web/constants/project";
import { EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

export const ProjectSettingsSidebar = observer(() => {
  const { workspaceSlug, projectId } = useParams();
  const pathname = usePathname();
  // mobx store
  const { allowPermissions, projectUserInfo } = useUserPermissions();

  // derived values
  const currentProjectRole = projectUserInfo?.[workspaceSlug?.toString()]?.[projectId?.toString()]?.role;

  if (!currentProjectRole) {
    return (
      <div className="flex w-[280px] flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-custom-sidebar-text-400">SETTINGS</span>
          <Loader className="flex w-full flex-col gap-2">
            {range(8).map((index) => (
              <Loader.Item key={index} height="34px" />
            ))}
          </Loader>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-[280px] flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-custom-sidebar-text-400">SETTINGS</span>
        <div className="flex w-full flex-col gap-1">
          {PROJECT_SETTINGS_LINKS.map(
            (link) =>
              allowPermissions(
                link.access,
                EUserPermissionsLevel.PROJECT,
                workspaceSlug.toString(),
                projectId.toString()
              ) && (
                <Link key={link.key} href={`/${workspaceSlug}/projects/${projectId}${link.href}`}>
                  <SidebarNavItem
                    key={link.key}
                    isActive={link.highlight(pathname, `/${workspaceSlug}/projects/${projectId}`)}
                    className="text-sm font-medium px-4 py-2"
                  >
                    {link.label}
                  </SidebarNavItem>
                </Link>
              )
          )}
        </div>
      </div>
    </div>
  );
});
