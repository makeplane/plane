import { TView } from "@plane/types";

export type TViewOperations = {
  localViewCreate: (data: TView) => void;
  clearLocalView: (viewId: string) => void;
  setFilters: (filters: Partial<TViewFilters>) => void;
  setDisplayFilters: (display_filters: Partial<TViewDisplayFilters>) => void;
  setDisplayProperties: (display_properties: Partial<TViewDisplayProperties>) => void;
  fetch: () => Promise<void>;
  create: (data: Partial<TView>) => Promise<void>;
};
