import { observer } from "mobx-react-lite";
import { SendToBack } from "lucide-react";
// ui
import { Breadcrumbs } from "@plane/ui";

export const WorkspaceActiveCycleHeader = observer(() => (
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
        <span className="flex items-center justify-center px-3.5 py-0.5 text-xs leading-4 rounded-xl text-orange-500 bg-orange-500/20">
          Beta
        </span>
      </div>
    </div>
  </div>
));
