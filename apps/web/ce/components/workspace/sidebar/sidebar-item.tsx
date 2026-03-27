/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { FC } from "react";
import type { IWorkspaceSidebarNavigationItem } from "@plane/constants";
import { SidebarItemBase } from "@/components/workspace/sidebar/sidebar-item";
import { useGlobalView } from "@/hooks/store/use-global-view";
import { useWorkspace } from "@/hooks/store/use-workspace";

type Props = {
  item: IWorkspaceSidebarNavigationItem;
};

export const SidebarItem: FC<Props> = observer(function SidebarItem({ item }) {
  const { currentWorkspace } = useWorkspace();
  const { currentWorkspaceViews, globalViewMap } = useGlobalView();

  // HO and Bank-wide Projects are only visible in Board of Director workspaces
  if (item.key === "ho" && !currentWorkspace?.is_board_of_director_workspace) return null;
  if (item.key === "bank-wide-projects" && !currentWorkspace?.is_board_of_director_workspace) return null;

  // Point "views" sidebar link to the Daily Status default view when loaded,
  // otherwise fall back to the index page which auto-redirects on load.
  // Note: href must NOT include workspaceSlug — SidebarItemBase prepends it via joinUrlPath.
  let resolvedItem = item;
  if (item.key === "views") {
    const defaultViewId = currentWorkspaceViews?.find((id) => globalViewMap[id]?.is_default === true);
    const viewsHighlight = (pathname: string, _url: string) => pathname.includes("/workspace-views");
    if (defaultViewId) {
      resolvedItem = { ...item, href: `/workspace-views/${defaultViewId}/`, highlight: viewsHighlight };
    } else if (currentWorkspaceViews) {
      // Views loaded but no default — keep original all-issues href, fix highlight
      resolvedItem = { ...item, highlight: viewsHighlight };
    } else {
      // Views not loaded yet (F5/initial load) — point to index which auto-redirects
      resolvedItem = { ...item, href: `/workspace-views/`, highlight: viewsHighlight };
    }
  }

  return <SidebarItemBase item={resolvedItem} additionalStaticItems={["ho", "bank-wide-projects"]} />;
});
