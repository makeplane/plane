import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { IInboxFiltersStore } from "store/inbox/inbox_filter.store";

export const useInboxFilters = (): IInboxFiltersStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInboxFilters must be used within StoreProvider");
  return context.inboxRoot.inboxFilters;
};
