import { useRouter } from "next/router";
import { Search, Plus, Briefcase } from "lucide-react";
// ui
import { Breadcrumbs, Button } from "@plane/ui";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
import { observer } from "mobx-react-lite";

import { Menu } from "lucide-react";

export const ProjectsHeader = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  // store
  const { project: projectStore, theme: themStore } = useMobxStore();

  const projectsList = workspaceSlug ? projectStore.projects[workspaceSlug.toString()] : [];

  return (
    <div
      className={`relative flex w-full flex-shrink-0 flex-row z-10 items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4`}
    >
      <div className="flex items-center gap-2 sm:flex-grow sm:w-full whitespace-nowrap overflow-ellipsis">
        <button
          className="grid md:hidden h-7 w-7 place-items-center rounded border border-custom-border-200"
          onClick={() => {
            themStore.setShowSidebarOnMobile(true);
          }}
        >
          <Menu className="h-4 w-4 " fontSize={14} strokeWidth={2} />
        </button>

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
          <div className="flex w-full gap-1 items-center justify-start text-custom-text-400 rounded-md px-2.5 py-1.5 border border-custom-border-200 bg-custom-background-100">
            <Search className="h-3.5 w-3.5" />
            <input
              className="sm:min-w-[150px] lg:min-w-[234px] w-full border-none bg-transparent text-sm focus:outline-none"
              value={projectStore.searchQuery}
              onChange={(e) => projectStore.setSearchQuery(e.target.value)}
              placeholder="Search"
            />
          </div>
        )}

        <Button
          prependIcon={<Plus />}
          size="md"
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "p" });
            document.dispatchEvent(e);
          }}
        >
          <span className="hidden md:block">Add Project</span>
        </Button>
      </div>
    </div>
  );
});
