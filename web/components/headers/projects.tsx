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
        <div className="flex w-full gap-1 items-center justify-start text-custom-text-400 rounded-md px-2.5 py-1.5 border border-custom-border-200 bg-custom-background-100">
          <Search className="h-3.5 w-3.5" />
          <input
            className="min-w-[234px] w-full border-none bg-transparent text-sm focus:outline-none"
            value={projectStore.searchQuery}
            onChange={(e) => projectStore.setSearchQuery(e.target.value)}
            placeholder="Search"
          />
        </div>

        <Button
          prependIcon={<Plus />}
          size="md"
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "p" });
            document.dispatchEvent(e);
          }}
        >
          Add Project
        </Button>
      </div>
    </div>
  );
});
