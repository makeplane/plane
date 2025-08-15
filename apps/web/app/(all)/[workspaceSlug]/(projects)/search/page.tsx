"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane web components
import { SidebarHamburgerToggle } from "@/components/core/sidebar/sidebar-menu-hamburger-toggle";
import { isSidebarToggleVisible } from "@/plane-web/components/desktop";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { AppSearchRoot } from "@/plane-web/components/workspace/search";

const AppSearchPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();

  return (
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="ADVANCED_SEARCH" fallback={<></>}>
      {isSidebarToggleVisible() && (
        <div className="block bg-custom-sidebar-background-100 p-4 md:hidden">
          <SidebarHamburgerToggle />
        </div>
      )}
      <AppSearchRoot />
    </WithFeatureFlagHOC>
  );
});

export default AppSearchPage;
