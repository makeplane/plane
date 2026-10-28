/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// icons
import { ChevronDownOutline, LogOutOutline, MailsOutline, PlusCircleOutline } from "@makeplane/propel/icons";
// plane imports
import { Icon } from "@makeplane/propel/components/icon";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@makeplane/propel/components/menu";
import { ScrollArea } from "@makeplane/propel/components/scroll-area";
import { WorkspaceAvatar } from "@makeplane/propel/components/workspace-avatar";
import { useTranslation } from "@plane/i18n";
import { setToast } from "@plane/blocks/toast";
import type { IWorkspace } from "@plane/types";
import { Loader } from "@plane/blocks/skeleton";
import { orderWorkspacesList, cn, getFileURL } from "@plane/utils";
// helpers
import { AppSidebarItem } from "@/components/sidebar/sidebar-item";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser, useUserProfile } from "@/hooks/store/user";
import { useInstance } from "@/hooks/store/use-instance";
// components
import SidebarDropdownItem from "./dropdown-item";

type WorkspaceMenuRootProps = {
  variant: "sidebar" | "top-navigation";
};

export const WorkspaceMenuRoot = observer(function WorkspaceMenuRoot(props: WorkspaceMenuRootProps) {
  const { variant } = props;
  // store hooks
  const { toggleSidebar, toggleAnySidebarDropdown } = useAppTheme();
  const { config } = useInstance();
  const { signOut } = useUser();
  const { updateUserProfile } = useUserProfile();
  const { currentWorkspace: activeWorkspace, workspaces } = useWorkspace();
  // derived values
  const isWorkspaceCreationDisabled = config?.is_workspace_creation_disabled ?? false;
  // translation
  const { t } = useTranslation();
  // local state
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);

  const handleWorkspaceNavigation = (workspace: IWorkspace) => updateUserProfile({ last_workspace_id: workspace?.id });

  const handleSignOut = async () => {
    await signOut().catch(() =>
      setToast({
        type: "error",
        title: t("auth.sign_out.toast.error.title"),
        message: t("auth.sign_out.toast.error.message"),
      })
    );
  };

  const handleClose = () => setIsWorkspaceMenuOpen(false);

  const handleItemClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };
  const workspacesList = orderWorkspacesList(Object.values(workspaces ?? {}));

  // Toggle sidebar dropdown state when either menu is open
  useEffect(() => {
    toggleAnySidebarDropdown(isWorkspaceMenuOpen);
  }, [isWorkspaceMenuOpen, toggleAnySidebarDropdown]);

  return (
    <div
      className={cn("relative flex h-full w-fit max-w-48 truncate whitespace-nowrap", {
        "w-full justify-center text-center": variant === "sidebar",
        "flex-grow justify-stretch truncate text-left": variant === "top-navigation",
      })}
    >
      <Menu open={isWorkspaceMenuOpen} onOpenChange={setIsWorkspaceMenuOpen}>
        {/* propel: `AppSidebarItem` takes no arbitrary props, so it cannot be the Base UI trigger
            — the popup would have no element to anchor to. The trigger is a plain button wearing
            the same chrome, with the item's own icon part inside it. */}
        {variant === "sidebar" && (
          <MenuTrigger
            render={
              <button
                type="button"
                className={cn(
                  "flex size-8 w-full items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-inset",
                  {
                    "bg-layer-1": isWorkspaceMenuOpen,
                  }
                )}
                aria-label={t("aria_labels.projects_sidebar.open_workspace_switcher")}
              >
                <AppSidebarItem.Icon
                  icon={
                    <WorkspaceAvatar
                      size="md"
                      src={getFileURL(activeWorkspace?.logo_url ?? "")}
                      alt={activeWorkspace?.name}
                      aria-hidden
                    />
                  }
                />
              </button>
            }
          />
        )}
        {variant === "top-navigation" && (
          <MenuTrigger
            render={
              <button
                type="button"
                className={cn(
                  "group/menu-button flex flex-grow items-center justify-between gap-1 truncate rounded-sm p-1 text-body-xs-medium text-secondary outline-none hover:bg-layer-1 focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-inset",
                  {
                    "bg-layer-1": isWorkspaceMenuOpen,
                  }
                )}
                aria-label={t("aria_labels.projects_sidebar.open_workspace_switcher")}
              >
                <div className="flex flex-grow items-center gap-2 truncate">
                  <WorkspaceAvatar
                    size="sm"
                    src={getFileURL(activeWorkspace?.logo_url ?? "")}
                    alt={activeWorkspace?.name}
                    aria-hidden
                  />
                  <h4 className="truncate text-body-sm-medium text-primary">{activeWorkspace?.name ?? t("loading")}</h4>
                </div>
                <ChevronDownOutline
                  className={cn("size-4 flex-shrink-0 text-placeholder duration-300", {
                    "rotate-180": isWorkspaceMenuOpen,
                  })}
                />
              </button>
            }
          />
        )}
        <MenuContent side="bottom" align="start">
          {workspacesList ? (
            <ScrollArea orientation="vertical" size="sm" visibility="always">
              <div className="flex w-[312px] max-w-full flex-col items-start justify-start">
                {(activeWorkspace
                  ? [activeWorkspace, ...workspacesList.filter((workspace) => workspace.id !== activeWorkspace?.id)]
                  : workspacesList
                ).map((workspace) => (
                  <SidebarDropdownItem
                    key={workspace.id}
                    workspace={workspace}
                    activeWorkspace={activeWorkspace}
                    handleItemClick={handleItemClick}
                    handleWorkspaceNavigation={handleWorkspaceNavigation}
                    handleClose={handleClose}
                  />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="w-full">
              <Loader className="space-y-2">
                <Loader.Item height="30px" />
                <Loader.Item height="30px" />
              </Loader>
            </div>
          )}
          <div className="shrink-0">
            <MenuSeparator />
            {!isWorkspaceCreationDisabled && (
              <MenuItem
                icon={<Icon icon={PlusCircleOutline} />}
                label={t("create_workspace")}
                render={<Link href="/create-workspace" className="min-h-8" />}
              />
            )}
            <MenuItem
              icon={<Icon icon={MailsOutline} />}
              label={t("workspace_invites")}
              render={<Link href="/invitations" className="min-h-8" />}
              onClick={handleItemClick}
            />
            <MenuSeparator />
            <MenuItem
              variant="danger"
              render={<div className="min-h-8" />}
              icon={<Icon icon={LogOutOutline} />}
              label={t("sign_out")}
              onClick={() => void handleSignOut()}
            />
          </div>
        </MenuContent>
      </Menu>
    </div>
  );
});
