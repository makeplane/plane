"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTheme as useNextTheme } from "next-themes";
import { LogOut, UserCog2, Palette } from "lucide-react";
// plane internal packages
import { API_BASE_URL } from "@plane/constants";
import { AuthService } from "@plane/services";
import { Avatar, CustomMenu } from "@plane/ui";
import { getFileURL, cn } from "@plane/utils";
// hooks
import { useTheme, useUser } from "@/hooks/store";

// service initialization
const authService = new AuthService();

export const AdminSidebarDropdown = observer(() => {
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
    <>
      <div className="flex flex-col gap-2.5 pb-2">
        <span className="px-2 text-custom-sidebar-text-200 truncate">{currentUser?.email}</span>
      </div>
      <div className="py-2">
        <CustomMenu.MenuItem
          className="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-custom-sidebar-background-80"
          onClick={handleThemeSwitch}
        >
          <Palette className="h-4 w-4 stroke-[1.5]" />
          Switch to {resolvedTheme === "dark" ? "light" : "dark"} mode
        </CustomMenu.MenuItem>
      </div>
      <CustomMenu.MenuItem className="w-full">
        <form method="POST" action={`${API_BASE_URL}/api/instances/admins/sign-out/`} onSubmit={handleSignOut}>
          <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded px-2 hover:bg-custom-sidebar-background-80"
          >
            <LogOut className="h-4 w-4 stroke-[1.5]" />
            Sign out
          </button>
        </form>
      </CustomMenu.MenuItem>
    </>
  );

  useEffect(() => {
    if (csrfToken === undefined)
      authService.requestCSRFToken().then((data) => data?.csrf_token && setCsrfToken(data.csrf_token));
  }, [csrfToken]);

  return (
    <div className="flex max-h-header items-center gap-x-5 gap-y-2 border-b border-custom-sidebar-border-200 px-4 py-3.5">
      <div className="h-full w-full truncate">
        <div
          className={`flex flex-grow items-center gap-x-2 truncate rounded py-1 ${
            isSidebarCollapsed ? "justify-center" : ""
          }`}
        >
          <CustomMenu
            optionsClassName="relative flex-shrink-0 overflow-auto"
            customButtonClassName={cn("grid place-items-center outline-none", {
              "cursor-default": !isSidebarCollapsed,
            })}
            disabled={!isSidebarCollapsed}
            customButton={
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-custom-sidebar-background-80">
                <UserCog2 className="h-5 w-5 text-custom-text-200" />
              </div>
            }
          >
            {getSidebarMenuItems()}
          </CustomMenu>

          {!isSidebarCollapsed && (
            <div className="flex w-full gap-2">
              <h4 className="grow truncate text-base font-medium text-custom-text-200">Instance admin</h4>
            </div>
          )}
        </div>
      </div>

      {!isSidebarCollapsed && currentUser && (
        <CustomMenu
          optionsClassName="relative flex-shrink-0 overflow-auto"
          customButton={
            <Avatar
              name={currentUser.display_name}
              src={getFileURL(currentUser.avatar_url)}
              size={24}
              shape="square"
              className="!text-base"
            />
          }
        >
          {getSidebarMenuItems()}
        </CustomMenu>
      )}
    </div>
  );
});
