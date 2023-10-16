import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
// components
import { NotificationPopover } from "components/notifications";
import { Tooltip } from "@plane/ui";
// icons
import { BarChartRounded, GridViewOutlined, TaskAltOutlined, WorkOutlineOutlined } from "@mui/icons-material";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { observer } from "mobx-react-lite";

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
    name: "All Issues",
    href: `/${workspaceSlug}/workspace-views/all-issues`,
  },
];

export const WorkspaceSidebarMenu = observer(() => {
  const { theme: themeStore } = useMobxStore();
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <div className="w-full cursor-pointer space-y-1 p-4">
      {workspaceLinks(workspaceSlug as string).map((link, index) => {
        const isActive = link.name === "Settings" ? router.asPath.includes(link.href) : router.asPath === link.href;

        return (
          <Link key={index} href={link.href}>
            <a className="block w-full">
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
                  {<link.Icon fontSize="small" />}
                  {!themeStore?.sidebarCollapsed && link.name}
                </div>
              </Tooltip>
            </a>
          </Link>
        );
      })}

      <NotificationPopover />
    </div>
  );
});
