/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";
import type { IWorkspaceSidebarNavigationItem } from "@plane/constants";
import { SidebarItemBase } from "@/components/workspace/sidebar/sidebar-item";

type Props = {
  item: IWorkspaceSidebarNavigationItem;
};

export function SidebarItem({ item }: Props) {
  return <SidebarItemBase item={item} />;
}
