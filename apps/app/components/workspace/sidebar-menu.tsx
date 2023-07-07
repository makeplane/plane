import React from "react";

import { useRouter } from "next/router";
import Link from "next/link";

// hooks
import useTheme from "hooks/use-theme";
// icons
import { ChartBarIcon } from "@heroicons/react/24/outline";
import { GridViewIcon, AssignmentClipboardIcon, TickMarkIcon, SettingIcon } from "components/icons";

export const WorkspaceSidebarMenu = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  // theme context
  const { collapsed: sidebarCollapse } = useTheme();

  const workspaceLinks = (workspaceSlug: string) => [
    {
      icon: GridViewIcon,
      name: "Dashboard",
      href: `/${workspaceSlug}`,
    },
    {
      icon: ChartBarIcon,
      name: "Analytics",
      href: `/${workspaceSlug}/analytics`,
    },
    {
      icon: AssignmentClipboardIcon,
      name: "Projects",
      href: `/${workspaceSlug}/projects`,
    },
    {
      icon: TickMarkIcon,
      name: "My Issues",
      href: `/${workspaceSlug}/me/my-issues`,
    },
    {
      icon: SettingIcon,
      name: "Settings",
      href: `/${workspaceSlug}/settings`,
    },
  ];

  return (
    <div className="flex w-full flex-col items-start justify-start gap-2 px-3 py-1">
      {workspaceLinks(workspaceSlug as string).map((link, index) => {
        const isActive =
          link.name === "Settings"
            ? router.asPath.includes(link.href)
            : router.asPath === link.href;

        return (
          <Link key={index} href={link.href}>
            <a
              className={`${
                isActive
                  ? "bg-custom-sidebar-background-90 text-custom-sidebar-text-100"
                  : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-90 focus:bg-custom-sidebar-background-90"
              } group flex w-full items-center gap-3 rounded-md p-2 text-sm font-medium outline-none ${
                sidebarCollapse ? "justify-center" : ""
              }`}
            >
              <span className="grid h-5 w-5 flex-shrink-0 place-items-center">
                <link.icon
                  color={
                    isActive
                      ? "rgb(var(--color-sidebar-text-100))"
                      : "rgb(var(--color-sidebar-text-200))"
                  }
                  aria-hidden="true"
                  height="20"
                  width="20"
                />
              </span>
              {!sidebarCollapse && link.name}
            </a>
          </Link>
        );
      })}
    </div>
  );
};
