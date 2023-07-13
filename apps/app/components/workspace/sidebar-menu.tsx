import React from "react";

import { useRouter } from "next/router";
import Link from "next/link";

// hooks
import useTheme from "hooks/use-theme";
// components
import { Icon, Tooltip } from "components/ui";

export const WorkspaceSidebarMenu = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  // theme context
  const { collapsed: sidebarCollapse } = useTheme();

  const workspaceLinks = (workspaceSlug: string) => [
    {
      icon: "grid_view",
      name: "Dashboard",
      href: `/${workspaceSlug}`,
    },
    {
      icon: "bar_chart",
      name: "Analytics",
      href: `/${workspaceSlug}/analytics`,
    },
    {
      icon: "work",
      name: "Projects",
      href: `/${workspaceSlug}/projects`,
    },
    {
      icon: "task_alt",
      name: "My Issues",
      href: `/${workspaceSlug}/me/my-issues`,
    },
    {
      icon: "settings",
      name: "Settings",
      href: `/${workspaceSlug}/settings`,
    },
  ];

  return (
    <div className="w-full cursor-pointer space-y-2 px-4 mt-5">
      {workspaceLinks(workspaceSlug as string).map((link, index) => {
        const isActive =
          link.name === "Settings"
            ? router.asPath.includes(link.href)
            : router.asPath === link.href;

        return (
          <Link key={index} href={link.href}>
            <a className="block w-full">
              <Tooltip
                tooltipContent={link.name}
                position="right"
                className="ml-2"
                disabled={!sidebarCollapse}
              >
                <div
                  className={`group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium outline-none ${
                    isActive
                      ? "bg-custom-primary-100/10 text-custom-primary-100"
                      : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80"
                  } ${sidebarCollapse ? "justify-center" : ""}`}
                >
                  <Icon iconName={`${link.icon}`} />
                  {!sidebarCollapse && link.name}
                </div>
              </Tooltip>
            </a>
          </Link>
        );
      })}
    </div>
  );
};
