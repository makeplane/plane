import { observer } from "mobx-react-lite";
import { Search, Plus, Briefcase } from "lucide-react";
// hooks
import { useApplication, useProject, useUser } from "hooks/store";
// ui
import { Breadcrumbs, Button } from "@plane/ui";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";
// components
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";

export const ProjectsHeader = observer(() => {
  // store hooks
  const {
    commandPalette: commandPaletteStore,
    eventTracker: { setTrackElement },
  } = useApplication();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  const { workspaceProjectIds, searchQuery, setSearchQuery } = useProject();

  const isAuthorizedUser = !!currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <SidebarHamburgerToggle/>
        <div>
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              icon={<Briefcase className="h-4 w-4 text-custom-text-300" />}
              label="Projects"
            />
          </Breadcrumbs>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {workspaceProjectIds && workspaceProjectIds?.length > 0 && (
          <div className="flex w-full items-center justify-start gap-1 rounded-md border border-custom-border-200 bg-custom-background-100 px-2.5 py-1.5 text-custom-text-400">
            <Search className="h-3.5 w-3.5" />
            <input
              className="w-full min-w-[234px] border-none bg-transparent text-sm focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
            />
          </div>
        )}
        {isAuthorizedUser && (
          <Button
            prependIcon={<Plus />}
            size="sm"
            onClick={() => {
              setTrackElement("PROJECTS_PAGE_HEADER");
              commandPaletteStore.toggleCreateProjectModal(true);
            }}
          >
            Add Project
          </Button>
        )}
      </div>
    </div>
  );
});
