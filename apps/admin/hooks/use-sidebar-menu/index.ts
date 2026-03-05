/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// local imports
import { coreSidebarMenuLinks } from "./core";
import type { TSidebarMenuItem } from "./types";

export function useSidebarMenu(): TSidebarMenuItem[] {
  return [
    coreSidebarMenuLinks.general,
    coreSidebarMenuLinks.email,
    coreSidebarMenuLinks.authentication,
    coreSidebarMenuLinks.workspace,
    coreSidebarMenuLinks.ai,
    coreSidebarMenuLinks.image,
  ];
}
