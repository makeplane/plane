import { TView, TViewFilters, TViewDisplayFilters, TViewDisplayProperties } from "@plane/types";

export type TViewOperations = {
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setFilters: (filterKey: keyof TViewFilters, filterValue: "clear_all" | string) => void;
  setDisplayFilters: (display_filters: Partial<TViewDisplayFilters>) => void;
  setDisplayProperties: (displayPropertyKey: keyof TViewDisplayProperties) => void;

  localViewCreateEdit: (viewId: string | undefined) => void;
  localViewCreateEditClear: (viewId: string | undefined) => Promise<void>;

  fetch: () => Promise<void>;
  create: (data: Partial<TView>) => Promise<void>;
  update: () => Promise<void>;
  remove: (viewId: string) => Promise<void>;
};
