/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Link } from "react-router";
import { usePathname, useSearchParams } from "next/navigation";
// plane imports
import { API_BASE_URL } from "@plane/constants";
import { AnchorButton } from "@makeplane/propel/components/anchor-button";
import { Avatar } from "@makeplane/propel/components/avatar";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { LogOutOutline } from "@makeplane/propel/icons";
import { AuthService } from "@plane/services";
import { getFileURL } from "@plane/utils";
// helpers
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { useUser } from "@/hooks/store/use-user";

const authService = new AuthService();

export const UserAvatar = observer(function UserAvatar() {
  const pathName = usePathname();
  const searchParams = useSearchParams();
  // query params
  const board = searchParams.get("board") || undefined;
  const labels = searchParams.get("labels") || undefined;
  const state = searchParams.get("state") || undefined;
  const priority = searchParams.get("priority") || undefined;
  const peekId = searchParams.get("peekId") || undefined;
  // hooks
  const { data: currentUser, signOut } = useUser();
  // states
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  // refs
  // The sign-out row used to be a `type="submit"` button inside the panel's own form. A menu closes
  // (and unmounts its rows) on item press, so the form lives outside the menu and the row submits it.
  const signOutFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (csrfToken === undefined)
      authService
        .requestCSRFToken()
        .then((data) => data?.csrf_token && setCsrfToken(data.csrf_token))
        .catch(() => {});
  }, [csrfToken]);

  // derived values
  const { queryParam } = queryParamGenerator({ peekId, board, state, priority, labels });
  const displayName =
    currentUser?.display_name ||
    `${currentUser?.first_name} ${currentUser?.first_name}` ||
    currentUser?.email ||
    "User";

  return (
    <div className="relative mr-2">
      {currentUser?.id ? (
        <div>
          {csrfToken && (
            <form
              className="hidden"
              method="POST"
              action={`${API_BASE_URL}/auth/spaces/sign-out/`}
              onSubmit={signOut}
              ref={signOutFormRef}
            >
              <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
              <input type="hidden" name="next_path" value={`${pathName}?${queryParam}`} />
            </form>
          )}
          <Menu>
            <MenuTrigger
              render={
                <Button
                  variant="secondary"
                  size="md"
                  stretch="auto"
                  icon={
                    <Avatar
                      size="2xs"
                      src={getFileURL(currentUser?.avatar_url)}
                      alt={currentUser?.display_name}
                      fallback={currentUser?.display_name?.[0]?.toUpperCase()}
                    />
                  }
                  label={displayName}
                />
              }
            />
            <MenuContent side="bottom" align="end" sizing="auto">
              {csrfToken && (
                <MenuItem
                  icon={<Icon icon={LogOutOutline} tint="danger" />}
                  label="Sign out"
                  onClick={() => signOutFormRef.current?.requestSubmit()}
                />
              )}
            </MenuContent>
          </Menu>
        </div>
      ) : (
        <div className="flex-shrink-0">
          <AnchorButton
            variant="secondary"
            size="sm"
            label="Sign in"
            render={<Link to={`/?next_path=${pathName}?${queryParam}`} />}
          />
        </div>
      )}
    </div>
  );
});
