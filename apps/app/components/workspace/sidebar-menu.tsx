import React from "react";

import Link from "next/link";
import { useRouter } from "next/router";

// hooks
import useTheme from "hooks/use-theme";
// components
import { NotificationPopover } from "components/notifications";
// ui
import { Tooltip } from "components/ui";
// icons
import {
  BarChartRounded,
  GridViewOutlined,
  TaskAltOutlined,
  WorkOutlineOutlined,
} from "@mui/icons-material";

const workspaceLinks = (workspaceSlug: string) => [
  {
    Icon: GridViewOutlined,
    name: "Dashboard",
    href: `/${workspaceSlug}`,
  },
  {
    Icon: BarChartRounded,
    name: "Analytics",
    href: `/${workspaceSlug}/analytics`,
  },
  {
    Icon: WorkOutlineOutlined,
    name: "Projects",
    href: `/${workspaceSlug}/projects`,
  },
  {
    Icon: TaskAltOutlined,
    name: "My Issues",
    href: `/${workspaceSlug}/me/my-issues`,
  },
];

export const WorkspaceSidebarMenu = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { collapsed: sidebarCollapse } = useTheme();

  return (
    <div className="w-full cursor-pointer space-y-2 px-4 mt-5 pb-5">
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
                  {<link.Icon fontSize="small" />}
                  {!sidebarCollapse && link.name}
                </div>
              </Tooltip>
            </a>
          </Link>
        );
      })}

      <NotificationPopover />
    </div>
  );
};
