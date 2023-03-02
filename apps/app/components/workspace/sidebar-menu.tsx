import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
// icons
import { GridViewIcon, AssignmentClipboardIcon, TickMarkIcon, SettingIcon } from "components/icons";
// hooks
import useTheme from "hooks/use-theme";

const workspaceLinks = (workspaceSlug: string) => [
  {
    icon: GridViewIcon,
    name: "Dashboard",
    href: `/${workspaceSlug}`,
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

export const WorkspaceSidebarMenu: React.FC = () => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // theme context
  const { collapsed: sidebarCollapse } = useTheme();

  return (
    <div className="px-2">
      <div className="mt-3 flex-1 space-y-1 bg-white">
        {workspaceLinks(workspaceSlug as string).map((link, index) => (
          <Link key={index} href={link.href}>
            <a
              className={`${
                link.href === router.asPath
                  ? "bg-indigo-50 text-gray-900"
                  : "text-gray-500 hover:bg-indigo-50 hover:text-gray-900 focus:bg-indigo-50"
              } group flex items-center gap-3 rounded-md p-2 text-xs font-medium outline-none ${
                sidebarCollapse ? "justify-center" : ""
              }`}
            >
              <link.icon
                className={`${
                  link.href === router.asPath ? "text-gray-900" : "text-gray-600"
                } h-4 w-4 flex-shrink-0 group-hover:text-gray-900`}
                aria-hidden="true"
              />
              {!sidebarCollapse && link.name}
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
};
