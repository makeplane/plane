import type { ReactNode } from "react";
import type { IBaseLayoutsBaseItem, IBaseLayoutsBaseProps } from "../base";
import { CORE_GANTT_TIMELINE_TYPE } from "./core";
import { EXTENDED_GANTT_TIMELINE_TYPE } from "./extended";

// Gantt-specific item with date fields
export interface IBaseLayoutsGanttItem extends IBaseLayoutsBaseItem {
  start_date?: string | null;
  target_date?: string | null;
}

// Block update data (for drag/resize operations)
export type TGanttBlockUpdateData = {
  start_date?: string;
  target_date?: string;
  sort_order?: {
    destinationIndex: number;
    newSortOrder: number;
  };
};

// Date update handler for bulk date changes (e.g., dependency updates)
export type TGanttDateUpdate = {
  id: string;
  start_date?: string;
  target_date?: string;
};

// Render props specific to Gantt
export interface IGanttRenderProps<T extends IBaseLayoutsGanttItem> {
  renderBlock: (item: T) => ReactNode;
  renderSidebar?: (item: T) => ReactNode;
}

// Gantt-specific capabilities
export interface IGanttCapabilities {
  enableBlockLeftResize?: boolean | ((itemId: string) => boolean);
  enableBlockRightResize?: boolean | ((itemId: string) => boolean);
  enableBlockMove?: boolean | ((itemId: string) => boolean);
  enableReorder?: boolean | ((itemId: string) => boolean);
  enableAddBlock?: boolean | ((itemId: string) => boolean);
  enableSelection?: boolean | ((itemId: string) => boolean);
  enableDependency?: boolean | ((itemId: string) => boolean);
}

// Gantt display options
export type TGanttDisplayOptions = {
  showAllBlocks?: boolean; // Show blocks even without dates
  showToday?: boolean; // Highlight today on timeline
  border?: boolean;
  title?: string;
  loaderTitle?: string;
  quickAdd?: ReactNode;
  timelineType?: TTimelineType; // Type of timeline to use for store
};

// Main Gantt Layout Props
export interface IBaseLayoutsGanttProps<T extends IBaseLayoutsGanttItem>
  extends
    Omit<IBaseLayoutsBaseProps<T>, "renderItem" | "enableDragDrop" | "onDrop" | "canDrag">,
    IGanttRenderProps<T>,
    IGanttCapabilities,
    TGanttDisplayOptions {
  // Handler for block updates (position, dates, order)
  onBlockUpdate?: (item: T, payload: TGanttBlockUpdateData) => void | Promise<void>;

  // Handler for bulk date updates (dependencies, etc.)
  onDateUpdate?: (updates: TGanttDateUpdate[]) => void | Promise<void>;
}

export const GANTT_TIMELINE_TYPE = {
  ...CORE_GANTT_TIMELINE_TYPE,
  ...EXTENDED_GANTT_TIMELINE_TYPE,
} as const;

export type TTimelineTypeCore = (typeof CORE_GANTT_TIMELINE_TYPE)[keyof typeof CORE_GANTT_TIMELINE_TYPE];
export type TTimelineType =
  | TTimelineTypeCore
  | (typeof EXTENDED_GANTT_TIMELINE_TYPE)[keyof typeof EXTENDED_GANTT_TIMELINE_TYPE];
