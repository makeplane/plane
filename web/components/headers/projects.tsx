import { useRouter } from "next/router";
import { ArrowLeft, Search, Plus } from "lucide-react";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
import { Button } from "@plane/ui";
// helper
import { truncateText } from "helpers/string.helper";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
import { observer } from "mobx-react-lite";

export const ProjectsHeader = observer(() => {
  const router = useRouter();
  // store
  const { project: projectStore, workspace: workspaceStore } = useMobxStore();
  const currentWorkspace = workspaceStore.currentWorkspace;

  return (
    <div
      className={`relative flex w-full flex-shrink-0 flex-row z-10 items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4`}
    >
      <div className="flex items-center gap-2 flex-grow w-full whitespace-nowrap overflow-ellipsis">
        <div className="block md:hidden">
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded border border-custom-border-200"
            onClick={() => router.back()}
          >
            <ArrowLeft fontSize={14} strokeWidth={2} />
          </button>
        </div>
        <div>
          <Breadcrumbs>
            <BreadcrumbItem
              title={`${truncateText(currentWorkspace?.name ?? "Workspace", 32)} Projects`}
              unshrinkTitle={false}
            />
          </Breadcrumbs>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex w-full gap-1 items-center justify-start rounded-md px-2 py-1.5 border border-custom-border-300 bg-custom-background-90">
          <Search size={12} strokeWidth={2} />
          <input
            className="w-full border-none bg-transparent text-xs text-custom-text-200 focus:outline-none"
            value={projectStore.searchQuery}
            onChange={(e) => projectStore.setSearchQuery(e.target.value)}
            placeholder="Search"
          />
        </div>

        <Button
          className="flex items-center gap-1 flex-shrink-0"
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "p" });
            document.dispatchEvent(e);
          }}
        >
          <Plus size={14} strokeWidth={3} />
          Add Project
        </Button>
      </div>
    </div>
  );
});
