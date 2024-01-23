import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { IInboxStore } from "store/inbox/inbox.store";

export const useInbox = (): IInboxStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInbox must be used within StoreProvider");
  return context.inboxRoot.inbox;
};
