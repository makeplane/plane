"use client";

import { FC, useState, useRef } from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { ExternalLink, FileText, HelpCircle, MoveLeft } from "lucide-react";
import { Transition } from "@headlessui/react";
import { DiscordIcon, GithubIcon, Tooltip } from "@plane/ui";
// hooks
import { WEB_BASE_URL } from "@/helpers/common.helper";
import { useTheme } from "@/hooks/store";
// assets
import packageJson from "package.json";

const helpOptions = [
  {
    name: "Documentation",
    href: "https://docs.plane.so/",
    Icon: FileText,
  },
  {
    name: "Join our Discord",
    href: "https://discord.com/invite/A92xrEGCge",
    Icon: DiscordIcon,
  },
  {
    name: "Report a bug",
    href: "https://github.com/makeplane/plane/issues/new/choose",
    Icon: GithubIcon,
  },
];

export const HelpSection: FC = observer(() => {
  // states
  const [isNeedHelpOpen, setIsNeedHelpOpen] = useState(false);
  // store
  const { isSidebarCollapsed, toggleSidebar } = useTheme();
  // refs
  const helpOptionsRef = useRef<HTMLDivElement | null>(null);

  const redirectionLink = encodeURI(WEB_BASE_URL + "/create-workspace");

  return (
    <div
      className={`flex w-full items-center justify-between gap-1 self-baseline border-t border-custom-sidebar-border-200 bg-custom-sidebar-background-100 px-4 py-2 ${
        isSidebarCollapsed ? "flex-col" : ""
      }`}
    >
      <div className={`flex items-center gap-1 ${isSidebarCollapsed ? "flex-col justify-center" : "w-full"}`}>
        <Tooltip tooltipContent="Redirect to plane" position="right" className="ml-4" disabled={!isSidebarCollapsed}>
          <a
            href={redirectionLink}
            className={`relative px-2 py-1.5 flex items-center gap-2 font-medium rounded border border-custom-primary-100/20 bg-custom-primary-100/10 text-xs text-custom-primary-200 whitespace-nowrap`}
          >
            <ExternalLink size={14} />
            {!isSidebarCollapsed && "Redirect to plane"}
          </a>
        </Tooltip>
        <Tooltip tooltipContent="Help" position={isSidebarCollapsed ? "right" : "top"} className="ml-4">
          <button
            type="button"
            className={`ml-auto grid place-items-center rounded-md p-1.5 text-custom-text-200 outline-none hover:bg-custom-background-90 hover:text-custom-text-100 ${
              isSidebarCollapsed ? "w-full" : ""
            }`}
            onClick={() => setIsNeedHelpOpen((prev) => !prev)}
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
        <Tooltip tooltipContent="Toggle sidebar" position={isSidebarCollapsed ? "right" : "top"} className="ml-4">
          <button
            type="button"
            className={`grid place-items-center rounded-md p-1.5 text-custom-text-200 outline-none hover:bg-custom-background-90 hover:text-custom-text-100 ${
              isSidebarCollapsed ? "w-full" : ""
            }`}
            onClick={() => toggleSidebar(!isSidebarCollapsed)}
          >
            <MoveLeft className={`h-3.5 w-3.5 duration-300 ${isSidebarCollapsed ? "rotate-180" : ""}`} />
          </button>
        </Tooltip>
      </div>

      <div className="relative">
        <Transition
          show={isNeedHelpOpen}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <div
            className={`absolute bottom-2 min-w-[10rem] ${
              isSidebarCollapsed ? "left-full" : "-left-[75px]"
            } divide-y divide-custom-border-200 whitespace-nowrap rounded bg-custom-background-100 p-1 shadow-custom-shadow-xs`}
            ref={helpOptionsRef}
          >
            <div className="space-y-1 pb-2">
              {helpOptions.map(({ name, Icon, href }) => {
                if (href)
                  return (
                    <Link href={href} key={name} target="_blank">
                      <div className="flex items-center gap-x-2 rounded px-2 py-1 text-xs hover:bg-custom-background-80">
                        <div className="grid flex-shrink-0 place-items-center">
                          <Icon className="h-3.5 w-3.5 text-custom-text-200" size={14} />
                        </div>
                        <span className="text-xs">{name}</span>
                      </div>
                    </Link>
                  );
                else
                  return (
                    <button
                      key={name}
                      type="button"
                      className="flex w-full items-center gap-x-2 rounded px-2 py-1 text-xs hover:bg-custom-background-80"
                    >
                      <div className="grid flex-shrink-0 place-items-center">
                        <Icon className="h-3.5 w-3.5 text-custom-text-200" />
                      </div>
                      <span className="text-xs">{name}</span>
                    </button>
                  );
              })}
            </div>
            <div className="px-2 pb-1 pt-2 text-[10px]">Version: v{packageJson.version}</div>
          </div>
        </Transition>
      </div>
    </div>
  );
});
