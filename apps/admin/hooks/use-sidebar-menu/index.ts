/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// hooks
import { useUser } from "@/hooks/store";
// local imports
import { coreSidebarMenuLinks } from "./core";
import type { TSidebarMenuItem } from "./types";

export { PERMISSION_KEYS, PERMISSION_LABELS, coreSidebarMenuLinks } from "./core";
export type { TPermissionKey, TSidebarMenuItem } from "./types";

/**
 * Sidebar items visible to the current admin, filtered by menu grants.
 *
 * Derived from the registry record (single source — no hand-maintained
 * array to drift). UI filtering is cosmetic; the backend route-group
 * permission is the security boundary. While the current user is still
 * loading, returns [] so forbidden items never flash.
 */
export function useSidebarMenu(): TSidebarMenuItem[] {
  const { currentUser } = useUser();

  const allItems = Object.values(coreSidebarMenuLinks);

  if (!currentUser) return [];
  if (currentUser.is_super_admin) return allItems;

  const allowedMenus = new Set(currentUser.allowed_menus ?? []);
  return allItems.filter((item) => allowedMenus.has(item.permission));
}
