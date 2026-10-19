/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { WEB_BASE_URL } from "@plane/constants";
// plane internal packages
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuFooter, MenuLinkItem, MenuTrigger } from "@makeplane/propel/components/menu";
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
import { ensureTrailingSlash } from "@/app/compat/next/helper";
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
  // store
  const { instance } = useInstance();
  const { isSidebarCollapsed, toggleSidebar } = useTheme();

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
        <div className={isSidebarCollapsed ? "flex w-full justify-center" : "ml-auto"}>
          <Menu modal={false}>
            <Tooltip label="Help" side={isSidebarCollapsed ? "right" : "top"}>
              <MenuTrigger
                render={
                  <IconButton
                    type="button"
                    variant="ghost"
                    size="md"
                    aria-label="Help"
                    showTooltip={false}
                    icon={<Icon icon={HelpOutline} />}
                  />
                }
              />
            </Tooltip>
            <MenuContent
              side={isSidebarCollapsed ? "right" : "top"}
              align="end"
              footer={<MenuFooter>Version: v{instance?.current_version}</MenuFooter>}
            >
              {helpOptions.map(({ name, Icon: HelpIcon, href }) => (
                <MenuLinkItem
                  key={name}
                  href={ensureTrailingSlash(href)}
                  external
                  target="_blank"
                  label={name}
                  icon={<Icon icon={HelpIcon} />}
                />
              ))}
            </MenuContent>
          </Menu>
        </div>
        <div className={isSidebarCollapsed ? "flex w-full justify-center" : ""}>
          <Tooltip label="Toggle sidebar" side={isSidebarCollapsed ? "right" : "top"}>
            <IconButton
              type="button"
              variant="ghost"
              size="md"
              aria-label="Toggle sidebar"
              aria-expanded={!isSidebarCollapsed}
              showTooltip={false}
              icon={
                <Icon
                  icon={
                    <ArrowNarrowLeftOutline
                      className={`size-4 duration-300 ${isSidebarCollapsed ? "rotate-180" : ""}`}
                    />
                  }
                />
              }
              onClick={() => toggleSidebar(!isSidebarCollapsed)}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
});
