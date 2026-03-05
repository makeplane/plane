/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { RefObject } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
// components
import type { IBlockUpdateData } from "@plane/types";
import { Row, ERowVariant } from "@plane/ui";
import { cn } from "@plane/utils";
import { MultipleSelectGroupAction } from "@/components/core/multiple-select";
// helpers
// hooks
import type { TSelectionHelper } from "@/hooks/use-multiple-select";
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
  selectionHelpers: TSelectionHelper;
  showAllBlocks?: boolean;
  isEpic?: boolean;
};

export const GanttChartSidebar = observer(function GanttChartSidebar(props: Props) {
  const { t } = useTranslation();
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
    selectionHelpers,
    showAllBlocks = false,
    isEpic = false,
  } = props;

  const isGroupSelectionEmpty = selectionHelpers.isGroupSelected(GANTT_SELECT_GROUP) === "empty";

  return (
    <Row
      // DO NOT REMOVE THE ID
      id="gantt-sidebar"
      className="sticky left-0 z-10 h-max min-h-full flex-shrink-0 border-r-[0.5px] border-subtle-1 bg-surface-1"
      style={{
        width: `${SIDEBAR_WIDTH}px`,
      }}
      variant={ERowVariant.HUGGING}
    >
      <Row
        className="group/list-header sticky top-0 z-10 box-border flex flex-shrink-0 items-end justify-between gap-2 border-b-[0.5px] border-subtle-1 bg-surface-1 pr-4 pb-2 text-13 font-medium text-tertiary"
        style={{
          height: `${HEADER_HEIGHT}px`,
        }}
      >
        <div className={cn("flex items-center gap-2")}>
          {enableSelection && (
            <div className="absolute left-1 flex w-3.5 flex-shrink-0 items-center">
              <MultipleSelectGroupAction
                className={cn(
                  "pointer-events-none size-3.5 opacity-0 !outline-none group-hover/list-header:pointer-events-auto group-hover/list-header:opacity-100",
                  {
                    "pointer-events-auto opacity-100": !isGroupSelectionEmpty,
                  }
                )}
                groupID={GANTT_SELECT_GROUP}
                selectionHelpers={selectionHelpers}
              />
            </div>
          )}
          <h6>{title}</h6>
        </div>
        <h6>{t("common.duration")}</h6>
      </Row>

      <Row variant={ERowVariant.HUGGING} className="h-max min-h-full bg-surface-1">
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
            showAllBlocks,
            isEpic,
          })}
      </Row>
    </Row>
  );
});
