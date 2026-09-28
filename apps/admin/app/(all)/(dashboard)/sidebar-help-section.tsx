/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { WEB_BASE_URL } from "@plane/constants";
// plane internal packages
import { Tooltip } from "@makeplane/propel/components/tooltip";
import {
  ArrowNarrowLeftOutline,
  ChatOutline,
  Github,
  HelpOutline,
  NewTabOutline,
  PagesOutline,
} from "@makeplane/propel/icons";
import { cn } from "@plane/utils";
// hooks
import { useInstance, useTheme } from "@/hooks/store";
// assets

const helpOptions = [
  {
    name: "Documentation",
    href: "https://docs.plane.so/",
    Icon: PagesOutline,
  },
  {
    name: "Join our Forum",
    href: "https://forum.plane.so",
    Icon: ChatOutline,
  },
  {
    name: "Report a bug",
    href: "https://github.com/makeplane/plane/issues/new/choose",
    Icon: Github,
  },
];

export const AdminSidebarHelpSection = observer(function AdminSidebarHelpSection() {
  // states
  const [isNeedHelpOpen, setIsNeedHelpOpen] = useState(false);
  // store
  const { instance } = useInstance();
  const { isSidebarCollapsed, toggleSidebar } = useTheme();
  // refs
  const helpOptionsRef = useRef<HTMLDivElement | null>(null);

  const redirectionLink = encodeURI(WEB_BASE_URL + "/");

  return (
    <div
      className={cn(
        "flex h-14 w-full flex-shrink-0 items-center justify-between gap-1 self-baseline border-t border-subtle bg-surface-1 px-4",
        {
          "h-auto flex-col py-1.5": isSidebarCollapsed,
        }
      )}
    >
      <div className={`flex items-center gap-1 ${isSidebarCollapsed ? "flex-col justify-center" : "w-full"}`}>
        {!isSidebarCollapsed ? (
          <>
            <a
              href={redirectionLink}
              className={`relative flex items-center gap-1 rounded-sm bg-layer-1 px-2 py-1 text-body-xs-medium whitespace-nowrap text-secondary`}
            >
              <NewTabOutline width={14} height={14} />
              {!isSidebarCollapsed && "Redirect to Plane"}
            </a>
          </>
        ) : (
          <Tooltip label="Redirect to Plane" side="right">
            <a
              href={redirectionLink}
              className={`relative flex items-center gap-1 rounded-sm bg-layer-1 px-2 py-1 text-body-xs-medium whitespace-nowrap text-secondary`}
            >
              <NewTabOutline width={14} height={14} />
              {!isSidebarCollapsed && "Redirect to Plane"}
            </a>
          </Tooltip>
        )}
        <Tooltip label="Help" side={isSidebarCollapsed ? "right" : "top"}>
          <button
            type="button"
            aria-label="Help"
            className={`ml-auto grid place-items-center rounded-md p-1.5 text-secondary outline-none hover:bg-layer-1-hover hover:text-primary ${
              isSidebarCollapsed ? "w-full" : ""
            }`}
            onClick={() => setIsNeedHelpOpen((prev) => !prev)}
          >
            <HelpOutline className="size-4" />
          </button>
        </Tooltip>
        <Tooltip label="Toggle sidebar" side={isSidebarCollapsed ? "right" : "top"}>
          <button
            type="button"
            aria-label="Toggle sidebar"
            className={`grid place-items-center rounded-md p-1.5 text-secondary outline-none hover:bg-layer-1-hover hover:text-primary ${
              isSidebarCollapsed ? "w-full" : ""
            }`}
            onClick={() => toggleSidebar(!isSidebarCollapsed)}
          >
            <ArrowNarrowLeftOutline className={`size-4 duration-300 ${isSidebarCollapsed ? "rotate-180" : ""}`} />
          </button>
        </Tooltip>
      </div>
      <div className="relative">
        {/* The standalone Headless UI enter/leave transition is now a mount-time fade (leave animation
            dropped), the same shape Propel's own panels animate with. */}
        {isNeedHelpOpen && (
          <div
            className={`absolute bottom-2 z-[15] min-w-[10rem] ${
              isSidebarCollapsed ? "left-full" : "-left-[75px]"
            } animate-fade-in divide-y divide-subtle-1 rounded-sm bg-surface-1 p-1 whitespace-nowrap shadow-raised-100 motion-reduce:animate-none`}
            ref={helpOptionsRef}
          >
            <div className="space-y-1 pb-2">
              {helpOptions.map(({ name, Icon, href }) => {
                if (href)
                  return (
                    <Link href={href} key={name} target="_blank">
                      <div className="flex items-center gap-x-2 rounded-sm px-2 py-1 text-11 hover:bg-layer-1-hover">
                        <div className="grid flex-shrink-0 place-items-center">
                          <Icon className="h-3.5 w-3.5 text-secondary" />
                        </div>
                        <span className="text-11">{name}</span>
                      </div>
                    </Link>
                  );
                else
                  return (
                    <button
                      key={name}
                      type="button"
                      className="flex w-full items-center gap-x-2 rounded-sm px-2 py-1 text-11 hover:bg-layer-1"
                    >
                      <div className="grid flex-shrink-0 place-items-center">
                        <Icon className="h-3.5 w-3.5 text-secondary" />
                      </div>
                      <span className="text-11">{name}</span>
                    </button>
                  );
              })}
            </div>
            <div className="px-2 pt-2 pb-1 text-10">Version: v{instance?.current_version}</div>
          </div>
        )}
      </div>
    </div>
  );
});
