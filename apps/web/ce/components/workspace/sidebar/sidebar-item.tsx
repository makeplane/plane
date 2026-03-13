/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { FC } from "react";
import type { IWorkspaceSidebarNavigationItem } from "@plane/constants";
import { SidebarItemBase } from "@/components/workspace/sidebar/sidebar-item";
import { useWorkspace } from "@/hooks/store/use-workspace";

type Props = {
  item: IWorkspaceSidebarNavigationItem;
};

export const SidebarItem: FC<Props> = observer(function SidebarItem({ item }) {
  const { currentWorkspace } = useWorkspace();

  // HO is only visible in Board of Director workspaces
  if (item.key === "ho" && !currentWorkspace?.is_board_of_director_workspace) return null;

  return <SidebarItemBase item={item} additionalStaticItems={["ho"]} />;
});
