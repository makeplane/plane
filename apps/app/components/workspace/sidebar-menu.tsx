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
      icon: "insights",
      name: "Analytics",
      href: `/${workspaceSlug}/analytics`,
    },
    {
      icon: "assignment",
      name: "Projects",
      href: `/${workspaceSlug}/projects`,
    },
    {
      icon: "check_circle",
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
    <div className="flex w-full flex-col items-start justify-start cursor-pointer gap-2 p-3.5">
      {workspaceLinks(workspaceSlug as string).map((link, index) => (
        <Link key={index} href={link.href}>
          <a className="w-full">
            <Tooltip
              tooltipContent={link.name}
              position="right"
              className="ml-2"
              disabled={!sidebarCollapse}
            >
              <div
                className={`${
                  (
                    link.name === "Settings"
                      ? router.asPath.includes(link.href)
                      : router.asPath === link.href
                  )
                    ? "bg-brand-surface-2 text-brand-base font-medium"
                    : "text-brand-secondary hover:text-brand-base hover:bg-brand-surface-2 focus:bg-brand-surface-2"
                } group flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none ${
                  sidebarCollapse ? "justify-center" : ""
                }`}
              >
                <Icon
                  iconName={`${link.icon}`}
                  className={`${
                    (
                      link.name === "Settings"
                        ? router.asPath.includes(link.href)
                        : router.asPath === link.href
                    )
                      ? "text-brand-base"
                      : "text-brand-secondary group-hover:text-brand-base"
                  } `}
                />

                {!sidebarCollapse && link.name}
              </div>
            </Tooltip>
          </a>
        </Link>
      ))}
    </div>
  );
};
