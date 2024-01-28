import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { IInbox } from "store/inbox/inbox.store";

export const useInbox = (): IInbox => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInbox must be used within StoreProvider");
  return context.inbox.inbox;
};
