"use client";

import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { WORKSPACE_SETTINGS_LINKS, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { SidebarNavItem } from "@/components/sidebar";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane web helpers
import { shouldRenderSettingLink } from "@/plane-web/helpers/workspace.helper";

export const WorkspaceSettingsSidebar = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // mobx store
  const { t } = useTranslation();
  const { allowPermissions } = useUserPermissions();

  return (
    <div className="flex w-[280px] flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-custom-sidebar-text-400 uppercase">{t("settings")}</span>
        <div className="flex w-full flex-col gap-1">
          {WORKSPACE_SETTINGS_LINKS.map(
            (link) =>
              shouldRenderSettingLink(link.key) &&
              allowPermissions(link.access, EUserPermissionsLevel.WORKSPACE, workspaceSlug.toString()) && (
                <Link key={link.key} href={`/${workspaceSlug}${link.href}`}>
                  <SidebarNavItem
                    key={link.key}
                    isActive={link.highlight(pathname, `/${workspaceSlug}`)}
                    className="text-sm font-medium px-4 py-2"
                  >
                    {t(link.i18n_label)}
                  </SidebarNavItem>
                </Link>
              )
          )}
        </div>
      </div>
    </div>
  );
});
