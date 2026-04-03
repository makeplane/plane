/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components/AppSidebarItemsRoot.tsx

import React from "react";
import type { AppSidebarItemData } from "@/components/sidebar/sidebar-item";
import { AppSidebarItem } from "@/components/sidebar/sidebar-item";
import { withDockItems } from "@/plane-web/components/app-rail/app-rail-hoc";

type Props = {
  dockItems: (AppSidebarItemData & { shouldRender: boolean })[];
  showLabel?: boolean;
};

function Component({ dockItems, showLabel = true }: Props) {
  return (
    <>
      {dockItems
        .filter((item) => item.shouldRender)
        .map((item) => (
          <AppSidebarItem key={item.label} item={{ ...item, showLabel }} variant="link" />
        ))}
    </>
  );
}

export const AppSidebarItemsRoot = withDockItems(Component);
