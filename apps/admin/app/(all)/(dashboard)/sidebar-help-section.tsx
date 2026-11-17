/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { WEB_BASE_URL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// plane internal packages
import { Button } from "@makeplane/propel/components/button";
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
  // plane hooks
  const { t } = useTranslation();
  // store
  const { instance } = useInstance();
  const { isSidebarCollapsed, toggleSidebar } = useTheme();

  const redirectionLink = encodeURI(WEB_BASE_URL + "/");
  const toggleSidebarLabel = isSidebarCollapsed
    ? t("aria_labels.projects_sidebar.expand_sidebar")
    : t("aria_labels.projects_sidebar.collapse_sidebar");

  return (
    <div
      className={cn("flex w-full shrink-0 items-center gap-1 border-t border-subtle px-3 py-3", {
        "flex-col": isSidebarCollapsed,
      })}
    >
      {isSidebarCollapsed ? (
        <Tooltip label="Redirect to Plane" side="right">
          <IconButton
            variant="secondary"
            size="md"
            aria-label="Redirect to Plane"
            showTooltip={false}
            nativeButton={false}
            render={<a href={redirectionLink} aria-label="Redirect to Plane" />}
            icon={<Icon icon={NewTabOutline} />}
          />
        </Tooltip>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          stretch="auto"
          nativeButton={false}
          render={<a href={redirectionLink} aria-label="Redirect to Plane" />}
          icon={<Icon icon={NewTabOutline} />}
          label="Redirect to Plane"
        />
      )}
      <div className={cn("flex items-center gap-1", isSidebarCollapsed ? "flex-col" : "ml-auto")}>
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
            footer={
              instance?.current_version ? <MenuFooter>Version: v{instance.current_version}</MenuFooter> : undefined
            }
          >
            {helpOptions.map(({ name, Icon: HelpIcon, href }) => (
              <MenuLinkItem
                key={name}
                href={ensureTrailingSlash(href)}
                external
                target="_blank"
                label={name}
                icon={<Icon icon={HelpIcon} tint="secondary" />}
              />
            ))}
          </MenuContent>
        </Menu>
        <Tooltip label={toggleSidebarLabel} side={isSidebarCollapsed ? "right" : "top"}>
          <IconButton
            type="button"
            variant="ghost"
            size="md"
            aria-label={toggleSidebarLabel}
            aria-expanded={!isSidebarCollapsed}
            aria-controls="admin-sidebar"
            showTooltip={false}
            icon={
              <Icon
                icon={
                  <ArrowNarrowLeftOutline
                    className={cn("size-4 duration-300 motion-reduce:transition-none", {
                      "rotate-180": isSidebarCollapsed,
                    })}
                  />
                }
              />
            }
            onClick={() => toggleSidebar(!isSidebarCollapsed)}
          />
        </Tooltip>
      </div>
    </div>
  );
});
