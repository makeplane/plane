/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useTheme as useNextTheme } from "next-themes";
import { Icon } from "@makeplane/propel/components/icon";
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@makeplane/propel/components/menu";
import { Avatar } from "@makeplane/propel/components/avatar";
import { IconButton } from "@makeplane/propel/elements/icon-button";
import { LogOutOutline, PaletteOutline, UserCogOutline } from "@makeplane/propel/icons";
// plane internal packages
import { API_BASE_URL } from "@plane/constants";
import { AuthService } from "@plane/services";
import { getFileURL } from "@plane/utils";
// hooks
import { useTheme, useUser } from "@/hooks/store";

// service initialization
const authService = new AuthService();

export const AdminSidebarDropdown = observer(function AdminSidebarDropdown() {
  // store hooks
  const { isSidebarCollapsed } = useTheme();
  const { currentUser, signOut } = useUser();
  // hooks
  const { resolvedTheme, setTheme } = useNextTheme();
  // state
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  // refs
  // A Base UI menu closes (and unmounts its rows) on item press, so a submit button inside the
  // panel would be detached before the browser ran the default action. The sign-out form lives
  // outside the menu and the row submits it explicitly.
  const signOutFormRef = useRef<HTMLFormElement>(null);

  const handleThemeSwitch = () => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  const handleSignOut = () => signOut();

  const getSidebarMenuItems = () => (
    <MenuContent side={isSidebarCollapsed ? "right" : "bottom"} align={isSidebarCollapsed ? "start" : "end"}>
      <MenuGroup>
        <MenuLabel>{currentUser?.email}</MenuLabel>
        <MenuItem
          icon={<Icon icon={PaletteOutline} />}
          label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
          onClick={handleThemeSwitch}
        />
      </MenuGroup>
      <MenuSeparator />
      <MenuItem
        variant="danger"
        icon={<Icon icon={LogOutOutline} />}
        label="Sign out"
        onClick={() => signOutFormRef.current?.requestSubmit()}
      />
    </MenuContent>
  );

  useEffect(() => {
    if (csrfToken === undefined)
      void authService.requestCSRFToken().then((data) => data?.csrf_token && setCsrfToken(data.csrf_token));
  }, [csrfToken]);

  return (
    <div className="flex h-header shrink-0 items-center gap-2 border-b border-subtle px-3">
      <form
        ref={signOutFormRef}
        className="hidden"
        method="POST"
        action={`${API_BASE_URL}/api/instances/admins/sign-out/`}
        onSubmit={handleSignOut}
      >
        <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
      </form>
      {isSidebarCollapsed ? (
        <div className="flex w-full justify-center">
          <Menu>
            <MenuTrigger
              render={
                <IconButton variant="ghost" size="lg" type="button" aria-label="Instance admin menu">
                  <Icon icon={UserCogOutline} />
                </IconButton>
              }
            />
            {getSidebarMenuItems()}
          </Menu>
        </div>
      ) : (
        <>
          <div className="grid size-8 shrink-0 place-items-center rounded-md bg-layer-1" aria-hidden="true">
            <UserCogOutline className="size-5 text-primary" />
          </div>
          <h4 className="min-w-0 flex-1 truncate text-body-md-medium text-primary">Instance admin</h4>
          {currentUser && (
            <Menu>
              <MenuTrigger
                render={
                  <IconButton variant="ghost" size="lg" type="button" aria-label="Account menu">
                    <Avatar
                      alt={currentUser.display_name ?? "Admin user"}
                      fallback={currentUser.display_name?.[0]?.toUpperCase()}
                      src={getFileURL(currentUser.avatar_url)}
                      size="sm"
                    />
                  </IconButton>
                }
              />
              {getSidebarMenuItems()}
            </Menu>
          )}
        </>
      )}
    </div>
  );
});
