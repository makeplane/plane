import { RefObject } from "react";
import { observer } from "mobx-react";
// components
import { Row, ERowVariant } from "@plane/ui";
import { MultipleSelectGroupAction } from "@/components/core";
import { ChartDataType, IBlockUpdateData, IGanttBlock } from "@/components/gantt-chart";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { TSelectionHelper } from "@/hooks/use-multiple-select";
// constants
import { GANTT_SELECT_GROUP, HEADER_HEIGHT, SIDEBAR_WIDTH } from "../constants";

type Props = {
  blockIds: string[];
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  canLoadMoreBlocks?: boolean;
  loadMoreBlocks?: () => void;
  ganttContainerRef: RefObject<HTMLDivElement>;
  enableReorder: boolean | ((blockId: string) => boolean);
  enableSelection: boolean | ((blockId: string) => boolean);
  sidebarToRender: (props: any) => React.ReactNode;
  title: string;
  quickAdd?: React.JSX.Element | undefined;
  selectionHelpers: TSelectionHelper;
};

export const GanttChartSidebar: React.FC<Props> = observer((props) => {
  const {
    blockIds,
    blockUpdateHandler,
    enableReorder,
    enableSelection,
    sidebarToRender,
    loadMoreBlocks,
    canLoadMoreBlocks,
    ganttContainerRef,
    title,
    quickAdd,
    selectionHelpers,
  } = props;

  const isGroupSelectionEmpty = selectionHelpers.isGroupSelected(GANTT_SELECT_GROUP) === "empty";

  return (
    <Row
      // DO NOT REMOVE THE ID
      id="gantt-sidebar"
      className="sticky left-0 z-10 min-h-full h-max flex-shrink-0 border-r-[0.5px] border-custom-border-200 bg-custom-background-100"
      style={{
        width: `${SIDEBAR_WIDTH}px`,
      }}
      variant={ERowVariant.HUGGING}
    >
      <Row
        className="group/list-header box-border flex-shrink-0 flex items-end justify-between gap-2 border-b-[0.5px] border-custom-border-200 pb-2 pr-4 text-sm font-medium text-custom-text-300 sticky top-0 z-10 bg-custom-background-100"
        style={{
          height: `${HEADER_HEIGHT}px`,
        }}
      >
        <div className={cn("flex items-center gap-2")}>
          {enableSelection && (
            <div className="flex-shrink-0 flex items-center w-3.5 absolute left-1">
              <MultipleSelectGroupAction
                className={cn(
                  "size-3.5 opacity-0 pointer-events-none group-hover/list-header:opacity-100 group-hover/list-header:pointer-events-auto !outline-none",
                  {
                    "opacity-100 pointer-events-auto": !isGroupSelectionEmpty,
                  }
                )}
                groupID={GANTT_SELECT_GROUP}
                selectionHelpers={selectionHelpers}
              />
            </div>
          )}
          <h6>{title}</h6>
        </div>
        <h6>Duration</h6>
      </Row>

      <Row variant={ERowVariant.HUGGING} className="min-h-full h-max bg-custom-background-100 overflow-hidden">
        {sidebarToRender &&
          sidebarToRender({
            title,
            blockUpdateHandler,
            blockIds,
            enableReorder,
            enableSelection,
            canLoadMoreBlocks,
            ganttContainerRef,
            loadMoreBlocks,
            selectionHelpers,
          })}
      </Row>
      {quickAdd ? quickAdd : null}
    </Row>
  );
});
