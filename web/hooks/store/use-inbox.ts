import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { IInboxRootStore } from "store/inbox";

export const useInbox = (): IInboxRootStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInbox must be used within StoreProvider");
  return context.inboxRoot;
};
