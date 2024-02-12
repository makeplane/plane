import { LucideIcon } from "lucide-react";
// types
import { TView, TViewFilters, TViewDisplayFilters, TViewDisplayProperties } from "@plane/types";

export type TViewOperations = {
  localViewCreateEdit: (viewId: string | undefined) => void;
  localViewCreateEditClear: (viewId: string | undefined) => Promise<void>;
  resetChanges: () => void;

  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setFilters: (filterKey: keyof TViewFilters | undefined, filterValue: "clear_all" | string) => void;
  setDisplayFilters: (display_filters: Partial<TViewDisplayFilters>) => void;
  setDisplayProperties: (displayPropertyKey: keyof TViewDisplayProperties) => void;

  fetch: () => Promise<void>;
  create: (data: Partial<TView>) => Promise<void>;
  update: () => Promise<void>;
  remove: (viewId: string) => Promise<void>;
};

// view and view filter edit dropdowns
export type TViewEditDropdownOptions = {
  icon: LucideIcon;
  key: string;
  label: string;
  onClick: () => void;
  children: TViewEditDropdownOptions[] | undefined;
};

export type TViewFilterEditDropdownOptions = {
  icon: LucideIcon | any;
  key: string;
  label: string;
  onClick: () => void;
};
