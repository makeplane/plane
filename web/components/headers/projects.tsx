import { useRouter } from "next/router";
import { Search, Plus, Briefcase } from "lucide-react";
// ui
import { Breadcrumbs, Button } from "@plane/ui";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
import { observer } from "mobx-react-lite";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";

export const ProjectsHeader = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  // store
  const {
    project: projectStore,
    commandPalette: commandPaletteStore,
    trackEvent: { setTrackElement },
    user: { currentWorkspaceRole },
  } = useMobxStore();

  const projectsList = workspaceSlug ? projectStore.projects[workspaceSlug.toString()] : [];

  const isAuthorizedUser = !!currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
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
        {projectsList?.length > 0 && (
          <div className="flex w-full items-center justify-start gap-1 rounded-md border border-custom-border-200 bg-custom-background-100 px-2.5 py-1.5 text-custom-text-400">
            <Search className="h-3.5 w-3.5" />
            <input
              className="w-full min-w-[234px] border-none bg-transparent text-sm focus:outline-none"
              value={projectStore.searchQuery}
              onChange={(e) => projectStore.setSearchQuery(e.target.value)}
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
