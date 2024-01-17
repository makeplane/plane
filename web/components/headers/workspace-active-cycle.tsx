import { observer } from "mobx-react-lite";
import { Search, SendToBack } from "lucide-react";
// hooks
import { useWorkspace } from "hooks/store";
// ui
import { Breadcrumbs } from "@plane/ui";

export const WorkspaceActiveCycleHeader = observer(() => {
  // store hooks
  const { workspaceActiveCyclesSearchQuery, setWorkspaceActiveCyclesSearchQuery } = useWorkspace();
  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              icon={<SendToBack className="h-4 w-4 text-custom-text-300" />}
              label="Active Cycles"
            />
          </Breadcrumbs>
          <span
            className="flex items-center justify-center px-3.5 py-0.5 text-xs leading-5 rounded-xl"
            style={{
              color: "#F59E0B",
              backgroundColor: "#F59E0B20",
            }}
          >
            Beta
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex w-full items-center justify-start gap-1 rounded-md border border-custom-border-200 bg-custom-background-100 px-2.5 py-1.5 text-custom-text-400">
          <Search className="h-3.5 w-3.5" />
          <input
            className="w-full min-w-[234px] border-none bg-transparent text-sm focus:outline-none"
            value={workspaceActiveCyclesSearchQuery}
            onChange={(e) => setWorkspaceActiveCyclesSearchQuery(e.target.value)}
            placeholder="Search"
          />
        </div>
      </div>
    </div>
  );
});
