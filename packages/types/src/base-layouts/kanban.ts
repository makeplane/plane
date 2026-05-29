import type {
  IBaseLayoutsBaseItem,
  IBaseLayoutsBaseProps,
  IBaseLayoutsBaseGroupProps,
  IBaseLayoutsBaseItemProps,
} from "./base";

export type IBaseLayoutsKanbanItem = IBaseLayoutsBaseItem;

// Main Kanban Layout Props

export interface IBaseLayoutsKanbanProps<T extends IBaseLayoutsKanbanItem> extends IBaseLayoutsBaseProps<T> {
  groupClassName?: string;
}

// Kanban Column/Group Props

export interface IBaseLayoutsKanbanGroupProps<T extends IBaseLayoutsKanbanItem> extends IBaseLayoutsBaseGroupProps<T> {
  groupClassName?: string;
}

// Kanban Card/Item Props

export type IBaseLayoutsKanbanItemProps<T extends IBaseLayoutsKanbanItem> = IBaseLayoutsBaseItemProps<T>;
