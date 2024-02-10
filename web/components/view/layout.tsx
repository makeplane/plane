import { FC, Fragment } from "react";
import { observer } from "mobx-react-lite";
import { LucideIcon, List, Kanban, Calendar, Sheet, GanttChartSquare } from "lucide-react";
// hooks
import { useViewDetail } from "hooks/store";
// ui
import { Tooltip } from "@plane/ui";
// types
import { TViewLayouts, TViewTypes } from "@plane/types";
import { TViewOperations } from "./types";

type TViewLayoutRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  viewOperations: TViewOperations;
};

const LAYOUTS_DATA: { key: TViewLayouts; title: string; icon: LucideIcon }[] = [
  { key: "list", title: "List Layout", icon: List },
  { key: "kanban", title: "Kanban Layout", icon: Kanban },
  { key: "calendar", title: "Calendar Layout", icon: Calendar },
  { key: "spreadsheet", title: "Spreadsheet Layout", icon: Sheet },
  { key: "gantt", title: "Gantt Chart layout", icon: GanttChartSquare },
];

export const ViewLayoutRoot: FC<TViewLayoutRoot> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, viewOperations } = props;
  // hooks
  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType);

  return (
    <div className="relative flex gap-0.5 items-center bg-custom-background-80 rounded p-1 h-7 shadow-custom-shadow-2xs">
      {LAYOUTS_DATA.map((layout) => (
        <Fragment key={layout.key}>
          <Tooltip tooltipContent={layout.title} position="bottom">
            <div
              className={`relative h-[24px] w-7 flex justify-center items-center overflow-hidden rounded transition-all cursor-pointer
            ${
              viewDetailStore?.filtersToUpdate?.display_filters?.layout === layout.key
                ? `bg-custom-background-100 shadow-custom-shadow-2xs`
                : `hover:bg-custom-background-100`
            }
          `}
              onClick={() => viewOperations.setDisplayFilters({ layout: layout.key })}
            >
              <layout.icon size={12} />
            </div>
          </Tooltip>
        </Fragment>
      ))}
    </div>
  );
});
