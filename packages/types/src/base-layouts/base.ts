import type { ReactNode } from "react";

// Base Types

export interface IBaseLayoutsBaseItem {
  id: string;
  [key: string]: unknown;
}

export interface IBaseLayoutsBaseGroup {
  id: string;
  name: string;
  icon?: ReactNode;
  payload?: Record<string, unknown>;
  count?: number;
}

// Drag & Drop Types

export interface IDragDropHandlers<T extends IBaseLayoutsBaseItem> {
  enableDragDrop?: boolean;
  onDrop?: (
    sourceId: string,
    destinationId: string | null,
    sourceGroupId: string,
    destinationGroupId: string
  ) => Promise<void>;
  canDrag?: (item: T) => boolean;
}

// Render Props

export interface IItemRenderProps<T extends IBaseLayoutsBaseItem> {
  renderItem: (item: T, groupId: string) => ReactNode;
}

export interface IGroupHeaderControls {
  isCollapsed: boolean;
  onToggleGroup: (groupId: string) => void;
}

export interface IGroupHeaderProps extends IGroupHeaderControls {
  group: IBaseLayoutsBaseGroup;
  itemCount: number;
}

export interface IGroupRenderProps {
  renderGroupHeader?: (props: IGroupHeaderProps) => ReactNode;
}

export interface IRenderProps<T extends IBaseLayoutsBaseItem> extends IItemRenderProps<T>, IGroupRenderProps {}

// Layout Configuration

export type TBaseLayoutType = "list" | "kanban" | "gantt";

export interface IBaseLayoutConfig {
  key: TBaseLayoutType;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
}

// Base Layout Props
export interface IBaseLayoutsBaseProps<T extends IBaseLayoutsBaseItem> extends IDragDropHandlers<T>, IRenderProps<T> {
  items: Record<string, T>;
  groupedItemIds: Record<string, string[]>;
  groups: IBaseLayoutsBaseGroup[];

  collapsedGroups?: string[];
  onToggleGroup?: (groupId: string) => void;

  isLoading?: boolean;
  loadMoreItems?: (groupId: string) => void;

  showEmptyGroups?: boolean;
  className?: string;
}

// Group Props

export interface IBaseLayoutsBaseGroupProps<T extends IBaseLayoutsBaseItem>
  extends IDragDropHandlers<T>, IRenderProps<T> {
  group: IBaseLayoutsBaseGroup;
  itemIds: string[];
  items: Record<string, T>;
  isCollapsed: boolean;
  onToggleGroup: (groupId: string) => void;
  loadMoreItems?: (groupId: string) => void;
}

// Item Props

export interface IBaseLayoutsBaseItemProps<T extends IBaseLayoutsBaseItem>
  extends IDragDropHandlers<T>, IItemRenderProps<T> {
  item: T;
  index: number;
  groupId: string;
  isLast: boolean;
}
