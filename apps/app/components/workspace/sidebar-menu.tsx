import React from "react";

import { useRouter } from "next/router";
import Link from "next/link";

// hooks
import useTheme from "hooks/use-theme";
// icons
import { GridViewIcon, AssignmentClipboardIcon, TickMarkIcon, SettingIcon } from "components/icons";
import { ChartBarIcon } from "@heroicons/react/24/outline";

type Props = {
  isAnalyticsModalOpen: boolean;
  setAnalyticsModal: React.Dispatch<React.SetStateAction<boolean>>;
};

export const WorkspaceSidebarMenu: React.FC<Props> = ({
  isAnalyticsModalOpen,
  setAnalyticsModal,
}) => {
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
      highlight: isAnalyticsModalOpen,
      onClick: () => setAnalyticsModal((prevData) => !prevData),
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
        if (link.href)
          return (
            <Link key={index} href={link.href}>
              <a
                className={`${
                  (
                    link.name === "Settings"
                      ? router.asPath.includes(link.href)
                      : router.asPath === link.href
                  )
                    ? "bg-brand-surface-2 text-brand-base"
                    : "text-brand-secondary hover:bg-brand-surface-2 focus:bg-brand-surface-2"
                } group flex w-full items-center gap-3 rounded-md p-2 text-sm font-medium outline-none ${
                  sidebarCollapse ? "justify-center" : ""
                }`}
              >
                <span className="grid h-5 w-5 flex-shrink-0 place-items-center">
                  <link.icon
                    className="text-brand-secondary"
                    aria-hidden="true"
                    height="20"
                    width="20"
                  />
                </span>
                {!sidebarCollapse && link.name}
              </a>
            </Link>
          );
        else
          return (
            <button
              key={index}
              type="button"
              className={`group flex w-full items-center gap-3 rounded-md p-2 text-sm font-medium text-brand-secondary outline-none hover:bg-brand-surface-2 ${
                sidebarCollapse ? "justify-center" : ""
              } ${link.highlight ? "bg-brand-surface-2 text-brand-base" : ""}`}
              onClick={() => {
                if (link.onClick) link.onClick();
              }}
            >
              <span className="grid h-5 w-5 flex-shrink-0 place-items-center">
                <link.icon
                  className="text-brand-secondary"
                  aria-hidden="true"
                  height="20"
                  width="20"
                />
              </span>
              {!sidebarCollapse && link.name}
            </button>
          );
      })}
    </div>
  );
};
