"use client";

import { Fragment, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTheme as useNextTheme } from "next-themes";
import { LogOut, UserCog2, Palette } from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import { Avatar } from "@plane/ui";
// hooks
import { API_BASE_URL, cn } from "@/helpers/common.helper";
import { useTheme, useUser } from "@/hooks/store";
// helpers
// services
import { AuthService } from "@/services/auth.service";

// service initialization
const authService = new AuthService();

export const SidebarDropdown = observer(() => {
  // store hooks
  const { isSidebarCollapsed } = useTheme();
  const { currentUser, signOut } = useUser();
  // hooks
  const { resolvedTheme, setTheme } = useNextTheme();
  // state
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);

  const handleThemeSwitch = () => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  const handleSignOut = () => signOut();

  const getSidebarMenuItems = () => (
    <Menu.Items
      className={cn(
        "absolute left-0 z-20 mt-1.5 flex w-52 flex-col divide-y divide-custom-sidebar-border-100 rounded-md border border-custom-sidebar-border-200 bg-custom-sidebar-background-100 px-1 py-2 text-xs shadow-lg outline-none",
        {
          "left-4": isSidebarCollapsed,
        }
      )}
    >
      <div className="flex flex-col gap-2.5 pb-2">
        <span className="px-2 text-custom-sidebar-text-200">{currentUser?.email}</span>
      </div>
      <div className="py-2">
        <Menu.Item
          as="button"
          type="button"
          className="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-custom-sidebar-background-80"
          onClick={handleThemeSwitch}
        >
          <Palette className="h-4 w-4 stroke-[1.5]" />
          Switch to {resolvedTheme === "dark" ? "light" : "dark"} mode
        </Menu.Item>
      </div>
      <div className="py-2">
        <form method="POST" action={`${API_BASE_URL}/api/instances/admins/sign-out/`} onSubmit={handleSignOut}>
          <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
          <Menu.Item
            as="button"
            type="submit"
            className="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-custom-sidebar-background-80"
          >
            <LogOut className="h-4 w-4 stroke-[1.5]" />
            Sign out
          </Menu.Item>
        </form>
      </div>
    </Menu.Items>
  );

  useEffect(() => {
    if (csrfToken === undefined)
      authService.requestCSRFToken().then((data) => data?.csrf_token && setCsrfToken(data.csrf_token));
  }, [csrfToken]);

  return (
    <div className="flex max-h-[3.75rem] items-center gap-x-5 gap-y-2 border-b border-custom-sidebar-border-200 px-4 py-3.5">
      <div className="h-full w-full truncate">
        <div
          className={`flex flex-grow items-center gap-x-2 truncate rounded py-1 ${
            isSidebarCollapsed ? "justify-center" : ""
          }`}
        >
          <Menu as="div" className="flex-shrink-0">
            <Menu.Button
              className={cn("grid place-items-center outline-none", {
                "cursor-default": !isSidebarCollapsed,
              })}
            >
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-custom-sidebar-background-80">
                <UserCog2 className="h-5 w-5 text-custom-text-200" />
              </div>
            </Menu.Button>
            {isSidebarCollapsed && (
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                {getSidebarMenuItems()}
              </Transition>
            )}
          </Menu>

          {!isSidebarCollapsed && (
            <div className="flex w-full gap-2">
              <h4 className="grow truncate text-base font-medium text-custom-text-200">Instance admin</h4>
            </div>
          )}
        </div>
      </div>

      {!isSidebarCollapsed && currentUser && (
        <Menu as="div" className="relative flex-shrink-0">
          <Menu.Button className="grid place-items-center outline-none">
            <Avatar
              name={currentUser.display_name}
              src={currentUser.avatar ?? undefined}
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
            {getSidebarMenuItems()}
          </Transition>
        </Menu>
      )}
    </div>
  );
});
