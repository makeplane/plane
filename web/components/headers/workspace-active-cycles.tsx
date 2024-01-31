import { observer } from "mobx-react-lite";
// ui
import { Breadcrumbs, ContrastIcon } from "@plane/ui";
// icons
import { Crown } from "lucide-react";
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";

export const WorkspaceActiveCycleHeader = observer(() => (
  <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
    <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
      <SidebarHamburgerToggle />
      <div className="flex items-center gap-2">
        <Breadcrumbs>
          <Breadcrumbs.BreadcrumbItem
            type="text"
            icon={<ContrastIcon className="h-4 w-4 text-custom-text-300 rotate-180" />}
            label="Active Cycles"
          />
        </Breadcrumbs>
        <Crown className="h-3.5 w-3.5 text-amber-400" />
      </div>
    </div>
  </div>
));
