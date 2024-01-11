import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { BarChart2, Briefcase, CheckCircle, LayoutGrid } from "lucide-react";
// hooks
import { useApplication, useUser } from "hooks/store";
// components
import { NotificationPopover } from "components/notifications";
// ui
import { Tooltip } from "@plane/ui";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";

const workspaceLinks = (workspaceSlug: string) => [
  {
    Icon: LayoutGrid,
    name: "Dashboard",
    href: `/${workspaceSlug}`,
  },
  {
    Icon: BarChart2,
    name: "Analytics",
    href: `/${workspaceSlug}/analytics`,
  },
  {
    Icon: Briefcase,
    name: "Projects",
    href: `/${workspaceSlug}/projects`,
  },
  {
    Icon: CheckCircle,
    name: "All Issues",
    href: `/${workspaceSlug}/workspace-views/all-issues`,
  },
];

export const WorkspaceSidebarMenu = observer(() => {
  // store hooks
  const { theme: themeStore } = useApplication();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // computed
  const isAuthorizedUser = !!currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;

  return (
    <div className="w-full cursor-pointer space-y-1 p-4">
      {workspaceLinks(workspaceSlug as string).map((link, index) => {
        const isActive = link.name === "Settings" ? router.asPath.includes(link.href) : router.asPath === link.href;
        if (!isAuthorizedUser && link.name === "Analytics") return;
        return (
          <Link key={index} href={link.href}>
            <span className="block w-full">
              <Tooltip
                tooltipContent={link.name}
                position="right"
                className="ml-2"
                disabled={!themeStore?.sidebarCollapsed}
              >
                <div
                  className={`group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium outline-none ${
                    isActive
                      ? "bg-custom-primary-100/10 text-custom-primary-100"
                      : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80"
                  } ${themeStore?.sidebarCollapsed ? "justify-center" : ""}`}
                >
                  {<link.Icon className="h-4 w-4" />}
                  {!themeStore?.sidebarCollapsed && link.name}
                </div>
              </Tooltip>
            </span>
          </Link>
        );
      })}
      <NotificationPopover />
    </div>
  );
});
