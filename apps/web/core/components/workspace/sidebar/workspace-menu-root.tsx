/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Fragment, useState, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// icons
import { CirclePlus, LogOut, Mails, Search, X } from "lucide-react";
// ui
import { Menu, Transition } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ChevronDownIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkspace } from "@plane/types";
import { Loader } from "@plane/ui";
import { orderWorkspacesList, cn } from "@plane/utils";
// helpers
import { AppSidebarItem } from "@/components/sidebar/sidebar-item";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser, useUserProfile } from "@/hooks/store/user";
import { useInstance } from "@/hooks/store/use-instance";
// components
import { WorkspaceLogo } from "../logo";
import SidebarDropdownItem from "./dropdown-item";

type WorkspaceMenuRootProps = {
  variant: "sidebar" | "top-navigation";
};

export const WorkspaceMenuRoot = observer(function WorkspaceMenuRoot(props: WorkspaceMenuRootProps) {
  const { variant } = props;
  // store hooks
  const { toggleSidebar, toggleAnySidebarDropdown } = useAppTheme();
  const { config } = useInstance();
  const { data: currentUser } = useUser();
  const { signOut } = useUser();
  const { updateUserProfile } = useUserProfile();
  const { currentWorkspace: activeWorkspace, workspaces } = useWorkspace();
  // derived values
  const isWorkspaceCreationDisabled = config?.is_workspace_creation_disabled ?? false;
  // translation
  const { t } = useTranslation();
  // local state
  // local state
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // refs
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleWorkspaceNavigation = (workspace: IWorkspace): void => {
    void updateUserProfile({ last_workspace_id: workspace?.id });
  };

  const handleSignOut = async () => {
    await signOut().catch(() =>
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("sign_out.toast.error.title"),
        message: t("sign_out.toast.error.message"),
      })
    );
  };

  const handleItemClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };
  const workspacesList = orderWorkspacesList(Object.values(workspaces ?? {}));

  const filteredWorkspaces = searchQuery
    ? workspacesList.filter((w) => w.name.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : activeWorkspace
      ? [activeWorkspace, ...workspacesList.filter((w) => w.id !== activeWorkspace?.id)]
      : workspacesList;

  // TODO: fix workspaces list scroll

  // Toggle sidebar dropdown state when either menu is open
  useEffect(() => {
    toggleAnySidebarDropdown(isWorkspaceMenuOpen);
    if (isWorkspaceMenuOpen) {
      // Focus input when menu opens, handle HeadlessUI timing
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
  }, [isWorkspaceMenuOpen, toggleAnySidebarDropdown]);

  return (
    <Menu
      as="div"
      className={cn("relative h-full flex max-w-48 w-fit whitespace-nowrap truncate", {
        "w-full justify-center text-center": variant === "sidebar",
        "flex-grow justify-stretch text-left truncate": variant === "top-navigation",
      })}
    >
      {({ open, close }: { open: boolean; close: () => void }) => {
        // Update local state directly
        if (isWorkspaceMenuOpen !== open) {
          setIsWorkspaceMenuOpen(open);
          if (!open) {
            setSearchQuery("");
          }
        }

        return (
          <>
            {variant === "sidebar" && (
              <Menu.Button
                className={cn("flex w-full items-center justify-center size-8 rounded-md", {
                  "bg-layer-1": open,
                })}
              >
                <AppSidebarItem
                  variant="button"
                  item={{
                    icon: (
                      <WorkspaceLogo
                        logo={activeWorkspace?.logo_url}
                        name={activeWorkspace?.name}
                        classNames="size-8 rounded-md border border-subtle"
                      />
                    ),
                  }}
                />
              </Menu.Button>
            )}
            {variant === "top-navigation" && (
              <Menu.Button
                className={cn(
                  "group/menu-button flex items-center gap-1 p-1 truncate rounded-sm text-13 font-medium text-secondary hover:bg-layer-1 focus:outline-none justify-between flex-grow",
                  {
                    "bg-layer-1": open,
                  }
                )}
                aria-label={t("aria_labels.projects_sidebar.open_workspace_switcher")}
              >
                <div className="flex-grow flex items-center gap-2 truncate">
                  <WorkspaceLogo
                    logo={activeWorkspace?.logo_url}
                    name={activeWorkspace?.name}
                    classNames="border border-subtle rounded-md size-7"
                  />
                  <h4 className="truncate text-14 font-medium text-primary">{activeWorkspace?.name ?? t("loading")}</h4>
                </div>
                <ChevronDownIcon
                  className={cn("flex-shrink-0 size-4 text-placeholder duration-300", {
                    "rotate-180": open,
                  })}
                />
              </Menu.Button>
            )}
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="trnsform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items as={Fragment}>
                <div
                  className={cn(
                    "fixed z-21 mt-1 flex w-[19rem] origin-top-left flex-col divide-y divide-subtle rounded-md border-[0.5px] border-strong bg-surface-1 shadow-raised-200 outline-none",
                    {
                      "top-11 left-14": variant === "sidebar",
                      "top-10 left-4": variant === "top-navigation",
                    }
                  )}
                >
                  <div className="overflow-x-hidden vertical-scrollbar scrollbar-sm flex max-h-96 flex-col items-start justify-start overflow-y-scroll">
                    <div className="sticky top-0 z-21 flex-shrink-0 bg-surface-1 w-full flex flex-col px-4 pt-3 pb-2 gap-2">
                      <span className="text-13 font-medium text-placeholder truncate w-full">{currentUser?.email}</span>
                      <div className="relative flex items-center w-full">
                        <Search className="absolute left-2.5 size-3.5 text-placeholder" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === " ") {
                              e.stopPropagation();
                            }
                          }}
                          placeholder={t("search_workspace") || "Search workspace..."}
                          className="w-full bg-layer-2 border border-subtle rounded-md pl-8 pr-8 py-1.5 text-13 text-secondary focus:outline-none focus:border-brand-base"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 text-placeholder hover:text-secondary focus:outline-none"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {workspacesList ? (
                      <div className="size-full flex flex-col items-start justify-start">
                        {filteredWorkspaces.length > 0 ? (
                          filteredWorkspaces.map((workspace) => (
                            <SidebarDropdownItem
                              key={workspace.id}
                              workspace={workspace}
                              activeWorkspace={activeWorkspace}
                              handleItemClick={handleItemClick}
                              handleWorkspaceNavigation={handleWorkspaceNavigation}
                              handleClose={close}
                            />
                          ))
                        ) : (
                          <div className="w-full px-4 py-3 text-center text-13 text-placeholder italic">
                            {t("no_workspace_found") || "No workspace found"}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full p-4">
                        <Loader className="space-y-2">
                          <Loader.Item height="30px" />
                          <Loader.Item height="30px" />
                        </Loader>
                      </div>
                    )}
                  </div>
                  <div className="w-full flex flex-col items-start justify-start gap-2 px-4 py-2 text-13">
                    {!isWorkspaceCreationDisabled && (
                      <Link href="/create-workspace" className="w-full">
                        <Menu.Item
                          as="div"
                          className="flex items-center gap-2 rounded-sm px-2 py-1 text-13 font-medium text-secondary hover:bg-layer-transparent-hover"
                        >
                          <CirclePlus className="size-4 flex-shrink-0" />
                          {t("create_workspace")}
                        </Menu.Item>
                      </Link>
                    )}

                    <Link href="/invitations" className="w-full" onClick={handleItemClick}>
                      <Menu.Item
                        as="div"
                        className="flex items-center gap-2 rounded-sm px-2 py-1 text-13 font-medium text-secondary hover:bg-layer-transparent-hover"
                      >
                        <Mails className="h-4 w-4 flex-shrink-0" />
                        {t("workspace_invites")}
                      </Menu.Item>
                    </Link>

                    <div className="w-full">
                      <Menu.Item
                        as="button"
                        type="button"
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-13 font-medium text-danger-primary hover:bg-layer-transparent-hover"
                        onClick={() => {
                          void handleSignOut();
                        }}
                      >
                        <LogOut className="size-4 flex-shrink-0" />
                        {t("sign_out")}
                      </Menu.Item>
                    </div>
                  </div>
                </div>
              </Menu.Items>
            </Transition>
          </>
        );
      }}
    </Menu>
  );
});
