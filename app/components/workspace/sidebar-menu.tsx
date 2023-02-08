import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
// icons
import {
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  HomeIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
// hooks
import useTheme from "hooks/use-theme";

const workspaceLinks = (workspaceSlug: string) => [
  {
    icon: HomeIcon,
    name: "Home",
    href: `/${workspaceSlug}`,
  },
  {
    icon: ClipboardDocumentListIcon,
    name: "Projects",
    href: `/${workspaceSlug}/projects`,
  },
  {
    icon: RectangleStackIcon,
    name: "My Issues",
    href: `/${workspaceSlug}/me/my-issues`,
  },
  {
    icon: Cog6ToothIcon,
    name: "Settings",
    href: `/${workspaceSlug}/settings`,
  },
];

export const WorkspaceSidebarMenu = () => {
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
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100"
              } group flex items-center gap-3 rounded-md p-2 text-xs font-medium outline-none ${
                sidebarCollapse ? "justify-center" : ""
              }`}
            >
              <link.icon
                className={`${
                  link.href === router.asPath ? "text-gray-900" : "text-gray-500"
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
