import { TView } from "@plane/types";

export type TViewOperations = {
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setFilters: (filters: Partial<TViewFilters>) => void;
  setDisplayFilters: (display_filters: Partial<TViewDisplayFilters>) => void;
  setDisplayProperties: (display_properties: Partial<TViewDisplayProperties>) => void;

  localViewCreateEdit: (viewId: string | undefined) => void;
  localViewCreateEditClear: (viewId: string | undefined) => Promise<void>;

  fetch: () => Promise<void>;
  create: (data: Partial<TView>) => Promise<void>;
  update: () => Promise<void>;
  remove: (viewId: string) => Promise<void>;
};
