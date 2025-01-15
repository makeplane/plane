"use client";

import { Fragment, Ref, useState, useMemo } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePopper } from "react-popper";
// icons
import { Check, ChevronDown, LogOut, Mails, PlusSquare, Settings } from "lucide-react";
// ui
import { Menu, Transition } from "@headlessui/react";
// types
import { useTranslation } from "@plane/i18n";
import { IWorkspace } from "@plane/types";
// plane ui
import { Avatar, Loader, TOAST_TYPE, setToast } from "@plane/ui";
import { GOD_MODE_URL, cn } from "@/helpers/common.helper";
// helpers
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useAppTheme, useUser, useUserPermissions, useUserProfile, useWorkspace } from "@/hooks/store";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
// plane web helpers
import { getIsWorkspaceCreationDisabled } from "@/plane-web/helpers/instance.helper";
// components
import { WorkspaceLogo } from "../logo";



export const SidebarDropdown = observer(() => {
  const { t } = useTranslation();
  const userLinks = useMemo(
    () => (workspaceSlug: string) => [
      {
        key: "workspace_invites",
        name: t("workspace_invites"),
        href: "/invitations",
        icon: Mails,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
      },
      {
        key: "settings",
        name: t("workspace_settings"),
        href: `/${workspaceSlug}/settings`,
        icon: Settings,
        access: [EUserPermissions.ADMIN],
      },
    ],
    [t]
  );
  // router params
  const { workspaceSlug } = useParams();
  // store hooks
  const { sidebarCollapsed, toggleSidebar } = useAppTheme();
  const { data: currentUser } = useUser();
  const {
    // updateCurrentUser,
    // isUserInstanceAdmin,
    signOut,
  } = useUser();
  const { updateUserProfile } = useUserProfile();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const isWorkspaceCreationEnabled = getIsWorkspaceCreationDisabled() === false;

  const isUserInstanceAdmin = false;
  const { currentWorkspace: activeWorkspace, workspaces } = useWorkspace();
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // popper-js init
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "right",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });

  const handleWorkspaceNavigation = (workspace: IWorkspace) =>
    updateUserProfile({
      last_workspace_id: workspace?.id,
    });

  const handleSignOut = async () => {
    await signOut().catch(() =>
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("failed_to_sign_out_please_try_again"),
      })
    );
  };

  const handleItemClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };
  const workspacesList = Object.values(workspaces ?? {});
  // TODO: fix workspaces list scroll
  return (
    <div className="flex items-center justify-center gap-x-3 gap-y-2">
      <Menu
        as="div"
        className={cn("relative h-full truncate text-left flex-grow flex justify-stretch", {
          "flex-grow-0 justify-center": sidebarCollapsed,
        })}
      >
        {({ open }) => (
          <>
            <Menu.Button
              className={cn(
                "group/menu-button flex items-center justify-between gap-1 p-1 truncate rounded text-sm font-medium text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 focus:outline-none",
                {
                  "flex-grow": !sidebarCollapsed,
                }
              )}
            >
              <div className="flex-grow flex items-center gap-2 truncate">
                <WorkspaceLogo logo={activeWorkspace?.logo_url} name={activeWorkspace?.name} />
                {!sidebarCollapsed && (
                  <h4 className="truncate text-base font-medium text-custom-text-100">
                    {activeWorkspace?.name ?? t("loading")}
                  </h4>
                )}
              </div>
              {!sidebarCollapsed && (
                <ChevronDown
                  className={cn(
                    "flex-shrink-0 mx-1 hidden size-4 group-hover/menu-button:block text-custom-sidebar-text-400 duration-300",
                    {
                      "rotate-180": open,
                    }
                  )}
                />
              )}
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items as={Fragment}>
                <div className="fixed top-12 left-4 z-[21] mt-1 flex w-full max-w-[19rem] origin-top-left flex-col divide-y divide-custom-border-100 rounded-md border-[0.5px] border-custom-sidebar-border-300 bg-custom-sidebar-background-100 shadow-custom-shadow-rg outline-none">
                  <div className="vertical-scrollbar scrollbar-sm mb-2 flex max-h-96 flex-col items-start justify-start gap-2 overflow-y-scroll px-4">
                    <h6 className="sticky top-0 z-[21] h-full w-full bg-custom-sidebar-background-100 pb-1 pt-3 text-sm font-medium text-custom-sidebar-text-400">
                      {currentUser?.email}
                    </h6>
                    {workspacesList ? (
                      <div className="size-full flex flex-col items-start justify-start gap-1.5">
                        {workspacesList.map((workspace) => (
                          <Link
                            key={workspace.id}
                            href={`/${workspace.slug}`}
                            onClick={() => {
                              handleWorkspaceNavigation(workspace);
                              handleItemClick();
                            }}
                            className="w-full"
                          >
                            <Menu.Item
                              as="div"
                              className="flex items-center justify-between gap-1 rounded p-1 text-sm text-custom-sidebar-text-100 hover:bg-custom-sidebar-background-80"
                            >
                              <div className="flex items-center justify-start gap-2.5 truncate">
                                <span
                                  className={`relative flex h-6 w-6 flex-shrink-0 items-center  justify-center p-2 text-xs uppercase ${
                                    !workspace?.logo_url && "rounded bg-custom-primary-500 text-white"
                                  }`}
                                >
                                  {workspace?.logo_url && workspace.logo_url !== "" ? (
                                    <img
                                      src={getFileURL(workspace.logo_url)}
                                      className="absolute left-0 top-0 h-full w-full rounded object-cover"
                                      alt={t("workspace_logo")}
                                    />
                                  ) : (
                                    (workspace?.name?.[0] ?? "...")
                                  )}
                                </span>
                                <h5
                                  className={`truncate text-sm font-medium ${
                                    workspaceSlug === workspace.slug ? "" : "text-custom-text-200"
                                  }`}
                                >
                                  {workspace.name}
                                </h5>
                              </div>
                              {workspace.id === activeWorkspace?.id && (
                                <span className="flex-shrink-0 p-1">
                                  <Check className="h-5 w-5 text-custom-sidebar-text-100" />
                                </span>
                              )}
                            </Menu.Item>
                          </Link>
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
                          <PlusSquare strokeWidth={1.75} className="h-4 w-4 flex-shrink-0" />
                          {t("create_workspace")}
                        </Menu.Item>
                      </Link>
                    )}
                    {userLinks(workspaceSlug?.toString() ?? "").map(
                      (link, index) =>
                        allowPermissions(link.access, EUserPermissionsLevel.WORKSPACE) && (
                          <Link
                            key={link.key}
                            href={link.href}
                            className="w-full"
                            onClick={() => {
                              if (index > 0) handleItemClick();
                            }}
                          >
                            <Menu.Item
                              as="div"
                              className="flex items-center gap-2 rounded px-2 py-1 text-sm font-medium text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80"
                            >
                              <link.icon className="h-4 w-4 flex-shrink-0" />
                              {link.name}
                            </Menu.Item>
                          </Link>
                        )
                    )}
                  </div>
                  <div className="w-full px-4 py-2">
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
              </Menu.Items>
            </Transition>
          </>
        )}
      </Menu>
      {!sidebarCollapsed && (
        <Menu as="div" className="relative flex-shrink-0">
          <Menu.Button className="grid place-items-center outline-none" ref={setReferenceElement}>
            <Avatar
              name={currentUser?.display_name}
              src={getFileURL(currentUser?.avatar_url ?? "")}
              size={24}
              shape="square"
              className="!text-base"
            />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items
              className="absolute left-0 z-[21] mt-1 flex w-52 origin-top-left  flex-col divide-y
            divide-custom-sidebar-border-200 rounded-md border border-custom-sidebar-border-200 bg-custom-sidebar-background-100 px-1 py-2 text-xs shadow-lg outline-none"
              ref={setPopperElement as Ref<HTMLDivElement>}
              style={styles.popper}
              {...attributes.popper}
            >
              <div className="flex flex-col gap-2.5 pb-2">
                <span className="px-2 text-custom-sidebar-text-200">{currentUser?.email}</span>
                <Link href="/profile">
                  <Menu.Item as="div">
                    <span className="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-custom-sidebar-background-80">
                      <Settings className="h-4 w-4 stroke-[1.5]" />
                      <span>{t("settings")}</span>
                    </span>
                  </Menu.Item>
                </Link>
              </div>
              <div className={`pt-2 ${isUserInstanceAdmin || false ? "pb-2" : ""}`}>
                <Menu.Item
                  as="button"
                  type="button"
                  className="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-custom-sidebar-background-80"
                  onClick={handleSignOut}
                >
                  <LogOut className="size-4 stroke-[1.5]" />
                  {t("sign_out")}
                </Menu.Item>
              </div>
              {isUserInstanceAdmin && (
                <div className="p-2 pb-0">
                  <Link href={GOD_MODE_URL}>
                    <Menu.Item as="button" type="button" className="w-full">
                      <span className="flex w-full items-center justify-center rounded bg-custom-primary-100/20 px-2 py-1 text-sm font-medium text-custom-primary-100 hover:bg-custom-primary-100/30 hover:text-custom-primary-200">
                        {t("enter_god_mode")}
                      </span>
                    </Menu.Item>
                  </Link>
                </div>
              )}
            </Menu.Items>
          </Transition>
        </Menu>
      )}
    </div>
  );
});
