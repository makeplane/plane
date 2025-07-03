"use client";

import React, { Fragment, useState, useEffect } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// icons
import { ChevronDown, CirclePlus, LogOut, Mails } from "lucide-react";
// ui
import { Menu, Transition } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { IWorkspace } from "@plane/types";
import { Loader, TOAST_TYPE, setToast } from "@plane/ui";
import { orderWorkspacesList, cn } from "@plane/utils";
// helpers
import { AppSidebarItem } from "@/components/sidebar";
// hooks
import { useAppTheme, useUser, useUserProfile, useWorkspace } from "@/hooks/store";
// plane web helpers
import { getIsWorkspaceCreationDisabled } from "@/plane-web/helpers/instance.helper";
// components
import { WorkspaceLogo } from "../logo";
import SidebarDropdownItem from "./dropdown-item";

type WorkspaceMenuRootProps = {
  renderLogoOnly?: boolean;
};

export const WorkspaceMenuRoot = observer((props: WorkspaceMenuRootProps) => {
  const { renderLogoOnly } = props;
  // store hooks
  const { toggleSidebar, toggleAnySidebarDropdown } = useAppTheme();
  const { data: currentUser } = useUser();
  const { signOut } = useUser();
  const { updateUserProfile } = useUserProfile();
  const { currentWorkspace: activeWorkspace, workspaces } = useWorkspace();
  // derived values
  const isWorkspaceCreationEnabled = getIsWorkspaceCreationDisabled() === false;
  // translation
  const { t } = useTranslation();
  // local state
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);

  const handleWorkspaceNavigation = (workspace: IWorkspace) => updateUserProfile({ last_workspace_id: workspace?.id });

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
  // TODO: fix workspaces list scroll

  // Toggle sidebar dropdown state when either menu is open
  useEffect(() => {
    if (isWorkspaceMenuOpen) toggleAnySidebarDropdown(true);
    else toggleAnySidebarDropdown(false);
  }, [isWorkspaceMenuOpen]);

  const logo = activeWorkspace?.logo_url;
  const name = activeWorkspace?.name;

  return (
    <Menu
      as="div"
      className={cn("relative h-full flex ", {
        "justify-center text-center": renderLogoOnly,
        "flex-grow justify-stretch text-left truncate": !renderLogoOnly,
      })}
    >
      {({ open, close }: { open: boolean; close: () => void }) => {
        // Update local state directly
        if (isWorkspaceMenuOpen !== open) {
          setIsWorkspaceMenuOpen(open);
        }

        return (
          <>
            {renderLogoOnly ? (
              <Menu.Button className="flex items-center justify-center size-8">
                <AppSidebarItem
                  variant="button"
                  item={{
                    icon: (
                      <WorkspaceLogo
                        logo={activeWorkspace?.logo_url}
                        name={activeWorkspace?.name}
                        classNames="size-8 rounded-md"
                      />
                    ),
                  }}
                />
              </Menu.Button>
            ) : (
              <Menu.Button
                className={cn(
                  "group/menu-button flex items-center  gap-1 p-1 truncate rounded text-sm font-medium text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 focus:outline-none ",
                  {
                    "justify-center text-center": renderLogoOnly,
                    "justify-between flex-grow": !renderLogoOnly,
                  }
                )}
                aria-label={t("aria_labels.projects_sidebar.open_workspace_switcher")}
              >
                <div className="flex-grow flex items-center gap-2 truncate">
                  <WorkspaceLogo logo={activeWorkspace?.logo_url} name={activeWorkspace?.name} />
                  <h4 className="truncate text-base font-medium text-custom-text-100">
                    {activeWorkspace?.name ?? t("loading")}
                  </h4>
                </div>
                <ChevronDown
                  className={cn(
                    "flex-shrink-0 mx-1 hidden size-4 group-hover/menu-button:block text-custom-sidebar-text-400 duration-300",
                    { "rotate-180": open }
                  )}
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
                <div className="fixed top-12 left-4 z-[21] mt-1 flex w-[19rem] origin-top-left flex-col divide-y divide-custom-border-100 rounded-md border-[0.5px] border-custom-sidebar-border-300 bg-custom-sidebar-background-100 shadow-custom-shadow-rg outline-none">
                  <div className="overflow-x-hidden vertical-scrollbar scrollbar-sm flex max-h-96 flex-col items-start justify-start overflow-y-scroll">
                    <span className="rounded-md text-left px-4 sticky top-0 z-[21] h-full w-full bg-custom-sidebar-background-100 pb-1 pt-3 text-sm font-medium text-custom-text-400 truncate flex-shrink-0">
                      {currentUser?.email}
                    </span>
                    {workspacesList ? (
                      <div className="size-full flex flex-col items-start justify-start">
                        {(activeWorkspace
                          ? [
                              activeWorkspace,
                              ...workspacesList.filter((workspace) => workspace.id !== activeWorkspace?.id),
                            ]
                          : workspacesList
                        ).map((workspace) => (
                          <SidebarDropdownItem
                            key={workspace.id}
                            workspace={workspace}
                            activeWorkspace={activeWorkspace}
                            handleItemClick={handleItemClick}
                            handleWorkspaceNavigation={handleWorkspaceNavigation}
                            handleClose={close}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="w-full">
                        <Loader className="space-y-2">
                          <Loader.Item height="30px" />
                          <Loader.Item height="30px" />
                        </Loader>
                      </div>
                    )}
                  </div>
                  <div className="w-full flex flex-col items-start justify-start gap-2 px-4 py-2 text-sm">
                    {isWorkspaceCreationEnabled && (
                      <Link href="/create-workspace" className="w-full">
                        <Menu.Item
                          as="div"
                          className="flex items-center gap-2 rounded px-2 py-1 text-sm font-medium text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80"
                        >
                          <CirclePlus className="size-4 flex-shrink-0" />
                          {t("create_workspace")}
                        </Menu.Item>
                      </Link>
                    )}

                    <Link href="/invitations" className="w-full" onClick={handleItemClick}>
                      <Menu.Item
                        as="div"
                        className="flex items-center gap-2 rounded px-2 py-1 text-sm font-medium text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80"
                      >
                        <Mails className="h-4 w-4 flex-shrink-0" />
                        {t("workspace_invites")}
                      </Menu.Item>
                    </Link>

                    <div className="w-full">
                      <Menu.Item
                        as="button"
                        type="button"
                        className="flex w-full items-center gap-2 rounded px-2 py-1 text-sm font-medium text-red-600 hover:bg-custom-sidebar-background-80"
                        onClick={handleSignOut}
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
