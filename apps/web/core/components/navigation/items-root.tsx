/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// components/AppSidebarItemsRoot.tsx

import React from "react";
import type { AppSidebarItemData } from "@/components/sidebar/sidebar-item";
import { AppSidebarItem } from "@/components/sidebar/sidebar-item";
import { withDockItems } from "@/components/app-rail/app-rail-hoc";

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
