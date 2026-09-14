/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Fragment, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Link } from "react-router";
import { usePathname, useSearchParams } from "next/navigation";
import { LogOutOutline } from "@makeplane/propel/icons";
import { Popover } from "@headlessui/react";
// plane imports
import { API_BASE_URL } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { AuthService } from "@plane/services";
import { Avatar, DropdownPanel } from "@plane/ui";
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
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (csrfToken === undefined)
      authService.requestCSRFToken().then((data) => data?.csrf_token && setCsrfToken(data.csrf_token));
  }, [csrfToken]);

  // derived values
  const { queryParam } = queryParamGenerator({ peekId, board, state, priority, labels });

  return (
    <div className="relative mr-2">
      {currentUser?.id ? (
        <div>
          <Popover as="div">
            {({ open }) => (
              <>
                <Popover.Button as={Fragment}>
                  <button
                    ref={setReferenceElement}
                    className="flex items-center gap-2 rounded-sm border border-subtle p-2"
                  >
                    <Avatar
                      name={currentUser?.display_name}
                      src={getFileURL(currentUser?.avatar_url)}
                      shape="square"
                      size="sm"
                      showTooltip={false}
                    />
                    <h6 className="text-11 font-medium text-secondary">
                      {currentUser?.display_name ||
                        `${currentUser?.first_name} ${currentUser?.first_name}` ||
                        currentUser?.email ||
                        "User"}
                    </h6>
                  </button>
                </Popover.Button>
                <DropdownPanel open={open} reference={referenceElement} placement="bottom-end">
                  <Popover.Panel
                    static
                    className="overflow-hidden rounded-sm border border-subtle bg-surface-1 p-1 shadow-raised-200"
                  >
                    {csrfToken && (
                      <form method="POST" action={`${API_BASE_URL}/auth/spaces/sign-out/`} onSubmit={signOut}>
                        <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
                        <input type="hidden" name="next_path" value={`${pathName}?${queryParam}`} />
                        <button
                          type="submit"
                          className="flex min-w-36 cursor-pointer items-center gap-2 rounded-sm p-2 text-13 whitespace-nowrap hover:bg-layer-transparent-hover"
                        >
                          <LogOutOutline width={12} height={12} className="shrink-0 text-danger-primary" />
                          <div>Sign out</div>
                        </button>
                      </form>
                    )}
                  </Popover.Panel>
                </DropdownPanel>
              </>
            )}
          </Popover>
        </div>
      ) : (
        <div className="flex-shrink-0">
          <Link to={`/?next_path=${pathName}?${queryParam}`}>
            <Button variant="secondary">Sign in</Button>
          </Link>
        </div>
      )}
    </div>
  );
});
