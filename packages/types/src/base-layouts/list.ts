import type {
  IBaseLayoutsBaseItem,
  IBaseLayoutsBaseProps,
  IBaseLayoutsBaseGroupProps,
  IBaseLayoutsBaseItemProps,
} from "./base";

export type IBaseLayoutsListItem = IBaseLayoutsBaseItem;

// Main List Layout Props

export type IBaseLayoutsListProps<T extends IBaseLayoutsListItem> = IBaseLayoutsBaseProps<T>;

// Group component props

export type IBaseLayoutsListGroupProps<T extends IBaseLayoutsListItem> = IBaseLayoutsBaseGroupProps<T>;

// Item component props

export type IBaseLayoutsListItemProps<T extends IBaseLayoutsListItem> = IBaseLayoutsBaseItemProps<T>;
