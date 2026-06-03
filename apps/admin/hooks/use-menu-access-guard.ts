/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// hooks
import { useUser } from "@/hooks/store";
import { coreSidebarMenuLinks, useSidebarMenu } from "@/hooks/use-sidebar-menu";

/**
 * Defense-in-depth route guard: redirects away from menus the current admin
 * is not granted. Cosmetic only — the backend route-group permission is the
 * security boundary (ungranted APIs return 403 regardless).
 */
export function useMenuAccessGuard() {
  const pathname = usePathname();
  const { replace } = useRouter();
  const { currentUser } = useUser();
  const allowedItems = useSidebarMenu();

  useEffect(() => {
    if (!currentUser || !pathname) return;
    if (currentUser.is_super_admin) return;

    // Resolve the menu item owning the current path. Hrefs carry a trailing
    // slash but usePathname() strips it — normalize so base routes match.
    const normalizedPath = pathname.endsWith("/") ? pathname : `${pathname}/`;
    const matched = Object.values(coreSidebarMenuLinks).find((item) => normalizedPath.startsWith(item.href));
    if (!matched) return; // unknown path — let the router handle it

    const isAllowed = allowedItems.some((item) => item.permission === matched.permission);
    if (isAllowed) return;

    setToast({
      type: TOAST_TYPE.ERROR,
      title: "Access denied",
      message: "You don't have access to that menu.",
    });
    replace(allowedItems[0]?.href ?? "/");
  }, [pathname, currentUser, allowedItems, replace]);
}
