import { FC, Fragment } from "react";
import { observer } from "mobx-react-lite";
import { LucideIcon, List, Kanban, Calendar, Sheet, GanttChartSquare } from "lucide-react";
// hooks
import { useViewDetail } from "hooks/store";
// ui
import { Tooltip } from "@plane/ui";
// types
import { TViewTypes } from "@plane/types";
// constants
import { EViewLayouts, EViewPageType, viewPageDefaultLayoutsByPageType } from "constants/view";

type TViewLayoutRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  viewPageType: EViewPageType;
};

const LAYOUTS_DATA: { key: EViewLayouts; title: string; icon: LucideIcon }[] = [
  { key: EViewLayouts.LIST, title: "List Layout", icon: List },
  { key: EViewLayouts.KANBAN, title: "Kanban Layout", icon: Kanban },
  { key: EViewLayouts.CALENDAR, title: "Calendar Layout", icon: Calendar },
  { key: EViewLayouts.SPREADSHEET, title: "Spreadsheet Layout", icon: Sheet },
  { key: EViewLayouts.GANTT, title: "Gantt Chart layout", icon: GanttChartSquare },
];

export const ViewLayoutRoot: FC<TViewLayoutRoot> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, viewPageType } = props;
  // hooks
  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType);

  const validLayouts = viewPageDefaultLayoutsByPageType(viewPageType);

  if (!viewDetailStore || validLayouts.length <= 1) return <></>;
  return (
    <div className="relative flex gap-0.5 items-center bg-custom-background-80 rounded p-1 shadow-custom-shadow-2xs">
      {LAYOUTS_DATA.map((layout) => {
        if (!validLayouts.includes(layout.key)) return <Fragment key={layout.key} />;
        return (
          <Fragment key={layout.key}>
            <Tooltip tooltipContent={layout.title} position="bottom">
              <div
                className={`relative h-6 w-7 flex justify-center items-center overflow-hidden rounded transition-all cursor-pointer
            ${
              viewDetailStore?.filtersToUpdate?.display_filters?.layout === layout.key
                ? `bg-custom-background-100 shadow-custom-shadow-2xs`
                : `hover:bg-custom-background-100`
            }
          `}
                onClick={() => viewDetailStore.setDisplayFilters({ layout: layout.key })}
              >
                <layout.icon size={12} />
              </div>
            </Tooltip>
          </Fragment>
        );
      })}
    </div>
  );
});
