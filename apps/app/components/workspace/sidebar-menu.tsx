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
    <div className="flex w-full flex-col items-start justify-start gap-2 px-3 py-1">
      {workspaceLinks(workspaceSlug as string).map((link, index) => (
        <Link key={index} href={link.href}>
          <a
            className={`${
              link.href === router.asPath
                ? "bg-brand-base text-brand-base"
                : "text-brand-secondary hover:bg-brand-base hover:text-brand-base focus:bg-brand-base"
            } group flex w-full items-center gap-3 rounded-md p-2 text-sm font-medium outline-none ${
              sidebarCollapse ? "justify-center" : ""
            }`}
          >
            <span className="grid h-5 w-5 flex-shrink-0 place-items-center">
              <link.icon
                className={`${
                  link.href === router.asPath ? "text-brand-base" : "text-brand-secondary"
                } group-hover:text-brand-base`}
                aria-hidden="true"
                height="20"
                width="20"
              />
            </span>
            {!sidebarCollapse && link.name}
          </a>
        </Link>
      ))}
    </div>
  );
};
